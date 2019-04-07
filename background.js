chrome.runtime.onInstalled.addListener(function() {
  // chrome.storage.local.set({urls: []}, function() {});
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
            chrome.runtime.sendMessage({
              url: details.url
            });
          
          // chrome.storage.local.get('urls', function(data) {
            // var urlList = data.urls;
            // urlList.push(details.url);
            // chrome.runtime.sendMessage({
            //   url: details.url
            // });
            // console.log(urlList);
            // chrome.storage.local.set({urls: urlList}, function() {
            //   chrome.runtime.sendMessage({
            //     url: details.url
            //   });
            // });
          // });
        }
    }
  },
  // filters
  {urls: ['<all_urls>']},
  // extraInfoSpec
  ['responseHeaders']
);