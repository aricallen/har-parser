/**
 * Output: {
 *   url: entry.request.url,
 *   queryString: entry.request.queryString,
 *   method: entry.request.method,
 *   status: entry.response.status,
 *   statusText: entry.response.statusText,
 *   requestData: normalizeRequest(entry.request),
 *   responseData: normalizeResponse(entry.response),
 * }
 *
 * @param outputs {Output[]}
 * @return mapped { [url]: Output[] }
 */
const mapByUrl = (outputs) => {
  return outputs.reduce((acc, curr) => {
    if (acc[curr.url] === undefined) {
      acc[curr.url] = [];
    }
    acc[curr.url].push(curr);
    return acc;
  }, {});
};

module.exports = { mapByUrl };
