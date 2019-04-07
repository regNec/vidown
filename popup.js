function union(setA, setB) {
    var _union = new Set(setA);
    for (var elem of setB) {
        _union.add(elem);
    }
    return Array.from(_union);
}

function difference(setA, setB) {
    var _difference = new Set(setA);
    for (var elem of setB) {
        _difference.delete(elem);
    }
    return Array.from(_difference);
}

function m3uParser(m3u_raw_data, host){
    let ts_url_set = new Array();
    let index1= m3u_raw_data.split(",");
	
	for(let i = 1; i < index1.length; i++){
		let num = index1[i].indexOf("#");
        if(num!=-1){
            index1[i]=index1[i].substr(0,num-1);
        }
		else{
		    index1[i]=index1[i].substr(0,index1[i].length-1);
        }
    }	
    index1.splice(0,1);
    for (let i = 0; i < index1.length; i++) {
        index1[i] = host + index1[i];
    }	
    ts_url_set=index1;
    return ts_url_set;
}

function getHost(url){
    let host_list = url.split("/");
    host_list.pop();
    host = host_list.join('/') + '/';
    // alert(host)
    return host;
}

function appendDownList(url){
    let downList = $("#downList");
    let reduced_url = url.split('?')[0];
    let urlItem = $("<li></li>").append($("<a></a>").attr("href",url).text(reduced_url));
    urlItem.click(function(){
        chrome.downloads.download({
            url:url
        });
    });
    downList.append(urlItem);
}

function extendDownList(urlList){
    for (let i = 0; i < urlList.length; i++){
        appendDownList(urlList[i]);
    }
}

function clear(){
    chrome.storage.local.set({urls: []}, function() {});
    chrome.storage.local.set({ts_urls: []}, function() {});
    $("#downList").empty();
}

chrome.storage.local.get('ts_urls', function(data) {
    var urlList = data.ts_urls;
    // $("#downList").empty();
    extendDownList(urlList);
});

$("#clear_btn").click(function(){
    clear();
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    // alert(message.url);
    let host = getHost(message.url);
    let ts_url_set = new Array();
    let ts_url_set_ = new Array();
    $.get(message.url, function(m3u_raw_data){
        ts_url_set = m3uParser(m3u_raw_data, host);
        // console.log(ts_url_set);
        chrome.storage.local.get('ts_urls', function(data){
            // alert(data.ts_urls);
            ts_url_set_ = union(data.ts_urls, ts_url_set);
            // $("#downList").empty();
            extendDownList(difference(ts_url_set_, data.ts_urls));
            chrome.storage.local.set({ts_urls: ts_url_set_}, function(){});
        });
    });
    
});

chrome.tabs.query({active: true} ,function (tabs){
    var tab_url = $("#current_tab_url");
    tab_url.html("Current Tab URL: <br>"+ tabs[0].url);
});