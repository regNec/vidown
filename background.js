/*
  initialize all variables when installed.
*/
chrome.runtime.onInstalled.addListener(function() {
  // store ts urls parsed from m3u data
  chrome.storage.local.set({ts_urls: []}, function() {});
  // m3u cache, when popup page is not opend
  chrome.storage.local.set({m3u_queue: []}, function() {});
  // a flag, to show whether the popup page is opend
  chrome.storage.local.set({popup_state: "closed"}, function() {});
});

/*
  filter url, if it is a m3u URL, return true
*/
function isM3u(url){
  // TODO: more concrete check
  var pat = new RegExp(/.*\.m3u/i);

  var result = pat.test(url);
  return result;
}

/*
  filter url, drop all except the stream media url
*/
function filer(request){
  if (request.method != 'GET') return false;
  if (request.type != 'media' && request.type != 'xmlhttprequest') return false;
  if (!isM3u(request.url)) return false;
  if (request.tabId == -1) return false;
  return true;  
}
/*
  when http headers received, fire the event to store m3u data
  if possible, transfer m3u data to popup page directly
*/
chrome.webRequest.onHeadersReceived.addListener(
  function(details) {
    if (filer(details)){
      chrome.storage.local.get('popup_state', function(data) {
        // if popup page is closed, store the m3u data to cache
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
        // popup page is open, transfer the m3u data directly
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
  // filters url, not filter in this case
  {urls: ['<all_urls>']},
  // extraInfoSpec
  ['responseHeaders']
);

/*
  when popup page is opened, it will send a connection request
  this function is fired when the request received, and connection
  will be established.
*/
chrome.runtime.onConnect.addListener(function(port) {
  // make sure that it is popup page sends the connection request
  if (port.name == "popup"){
    // update popup state
    chrome.storage.local.set({popup_state: "ready"}, function() {});
    console.log("connected.");
    /* if m3u cache is not empty, flush it by sending all
       data to popup page. The cache is used only when popup
       page is closed.
    */
    chrome.storage.local.get('m3u_queue', function(data) {
      let queue = data.m3u_queue;
      while (queue.length > 0){
        let m3u_data = queue.pop();
        port.postMessage(m3u_data);
        console.log(m3u_data, "sent,");
        console.log("dequeue.");
      }
      chrome.storage.local.set({m3u_queue: queue}, function(){});
      // port.disconnect();
      // console.log("disconnected by myself.");
    });
    // update the state when popup page is closed
    port.onDisconnect.addListener(function(event){
      chrome.storage.local.set({popup_state: "closed"}, function() {});
      console.log("Disconnected by popup.");
    });
  }
});