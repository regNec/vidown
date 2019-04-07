chrome.runtime.onInstalled.addListener(function() {
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
          if(details.tabId != -1)
            // console.log(details.tabId);
            chrome.runtime.sendMessage({
              url: details.url,
              tabId: details.tabId
            });
        }
    }
  },
  // filters
  {urls: ['<all_urls>']},
  // extraInfoSpec
  ['responseHeaders']
);