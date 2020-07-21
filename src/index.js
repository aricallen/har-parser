const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const { mapByUrl } = require('./util/map-by-url');

const inFilepath = argv.in;
const outFilepath = argv.out || 'parsed-har.json';

if (!inFilepath) {
  console.log(`
    usage: har-parser --in=path/to/file [--out=parsed-har.json] [--include-host=somehost.com] [--include=/api/some-endpoint] [--exclude=/api/bad-endpoint] [--exclude-host=badhost.com]
  `);
  process.exit(0);
}

const contents = fs.readFileSync(inFilepath, 'utf8');
const harData = JSON.parse(contents);

const normalizeJson = (str) => str.replace(/\/n/g, '').replace(/\\/g, '');

const normalizeRequest = (request) => {
  if (!request.postData) {
    return null;
  }

  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH') {
    try {
      return JSON.parse(normalizeJson(request.postData.text));
    } catch (err) {
      return request.postData.text;
    }
  }
  return null;
};

const normalizeResponse = (response) => {
  try {
    return JSON.parse(normalizeJson(response.content.text));
  } catch (err) {
    return response.content.text;
  }
};

const output = harData.log.entries.reduce((acc, entry) => {
  acc.push({
    url: entry.request.url,
    queryString: entry.request.queryString,
    method: entry.request.method,
    status: entry.response.status,
    statusText: entry.response.statusText,
    requestData: normalizeRequest(entry.request),
    responseData: normalizeResponse(entry.response),
  });
  return acc;
}, []);

console.log(`parsed ${output.length} entries`);

const includeFilters = [argv.include, argv.includeHost].filter(Boolean);
const excludeFilters = [argv.exclude, argv.excludeHost].filter(Boolean);

const filteredOutput = output
  .filter((entry) => {
    if (includeFilters.length > 0) {
      return includeFilters.some((filterStr) => {
        try {
          const re = new RegExp(filterStr);
          return re.test(entry.url);
        } catch (err) {
          // not regexp
          return entry.url.includes(filterStr);
        }
      });
    }
    return true;
  })
  .filter((entry) => {
    if (excludeFilters.length > 0) {
      return excludeFilters.every((filterStr) => {
        try {
          const re = new RegExp(filterStr);
          return !re.test(entry.url);
        } catch (err) {
          // not regexp
          return !entry.url.includes(filterStr);
        }
      });
    }
    return true;
  });

console.log(`filtered ${output.length - filteredOutput.length} entries`);

const mappedByUrl = mapByUrl(filteredOutput);
fs.writeFileSync(outFilepath, JSON.stringify(mappedByUrl, null, 2), 'utf8');
console.log(`outputed to ${filteredOutput.length} entries to ${outFilepath} successfully`);
process.exit(1);
