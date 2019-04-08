chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.set({ts_urls: []}, function() {});
  chrome.storage.local.set({m3u_queue: []}, function() {});
  chrome.storage.local.set({popup_state: "closed"}, function() {});
});


function isM3u(url){
  // TODO: more concrete check
  var pat = new RegExp(/.*\.m3u/i);

  var result = pat.test(url);
  return result;
}

function filer(request){
  if (request.method != 'GET') return false;
  if (request.type != 'media' && request.type != 'xmlhttprequest') return false;
  if (!isM3u(request.url)) return false;
  if (request.tabId == -1) return false;
  return true;  
}

chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    if (filer(details)){
      chrome.storage.local.get('popup_state', function(data) {
        if (data.popup_state == "closed"){
          chrome.storage.local.get('m3u_queue', function(data) {
            let queue = data.m3u_queue;
            console.log({
              url: details.url,
              tabId: details.tabId
            }, "received from server,");
            queue.unshift({
              url: details.url,
              tabId: details.tabId,
              cached: true
            });
            console.log("enqueue.");
            chrome.storage.local.set({m3u_queue: queue}, function() {});
          });
        }
        else if (data.popup_state == "ready"){
          chrome.runtime.sendMessage({
            url: details.url,
            tabId: details.tabId,
            cached: false
          });
        }
      });
    }
  },
  // filters
  {urls: ['<all_urls>']},
  // extraInfoSpec
  ['responseHeaders']
);

chrome.runtime.onConnect.addListener(function(port) {
  if (port.name == "popup"){
    chrome.storage.local.set({popup_state: "ready"}, function() {});
    console.log("connected.");
    chrome.storage.local.get('m3u_queue', function(data) {
      let queue = data.m3u_queue;
      while (queue.length > 0){
        let m3u_data = queue.pop();
        port.postMessage(m3u_data);
        console.log(m3u_data, "sent,");
        console.log("dequeue.");
      }
      chrome.storage.local.set({m3u_queue: queue}, function(){});
      port.disconnect();
      console.log("disconnected by myself.");
    });
    port.onDisconnect.addListener(function(event){
      chrome.storage.local.set({popup_state: "closed"}, function() {});
      console.log("Disconnected by popup.");
    });
  }
});