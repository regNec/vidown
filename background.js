chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({urls: []}, function() {});
  chrome.storage.local.set({ts_urls: []}, function() {});
});


function checkURL(url){
  // TODO: more concrete check
  var pat = new RegExp(/.*\.m3u/i);

  var result = pat.test(url);
  return result;
}

chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    if (details.method == 'GET'){
        if (details.type == 'media' || details.type == 'xmlhttprequest') {
          if (!checkURL(details.url)){
            return;
          }
          chrome.storage.local.get('urls', function(data) {
            var urlList = data.urls;
            urlList.push(details.url);
            // console.log(urlList);
            chrome.storage.local.set({urls: urlList}, function() {});
          });
        }
    }
  },
  // filters
  {urls: ['<all_urls>']},
  // extraInfoSpec
  ['responseHeaders']
);