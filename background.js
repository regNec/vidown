chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.sync.set({urls: []}, function() {});
});


function checkURL(url){
  // TODO: more concrete check
  var pat = new RegExp(/.*\.ts/i);

  var result = pat.test(url);
  return result;
}
chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    // console.log(details.type)
    if (details.method == 'GET'){
        if (details.type == 'media' || details.type == 'xmlhttprequest') {
          var urlList;
          chrome.storage.sync.get('urls', function(data) {
            urlList = data.urls;
            urlList.push(details.url);
            // console.log(urlList);
            chrome.storage.sync.set({urls: urlList}, function() {});
          });
        }
    }
  },
  // filters
  {urls: ['<all_urls>']},
  // extraInfoSpec
  ['responseHeaders']
);