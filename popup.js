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

function appendDownList(url, tabid){
    let downList = $("#tab_" + tabid);
    let tab_url = "";
    chrome.tabs.get(tabid, function(tab){
        tab_url = tab.url;
        // console.log(tab_url);
    });
    if(downList.length <= 0){
        $("#tabDown_list").append($("<ul></ul>").attr("id", "tab_" + tabid));
        downList = $("#tab_" + tabid);
    }
    let reduced_url = url.split('?')[0];
    reduced_url = reduced_url.split('/').pop();
    let urlItem = $("<li></li>").append($("<a></a>").attr("href",url).text(reduced_url));
    urlItem.click(function(){
        chrome.downloads.download({
            url:url
        });
    });
    downList.append(urlItem);
    // console.log(downList, "added.");
    chrome.tabs.query({active: true, currentWindow: true} ,function (tabs){
        // console.log(tabs[0]);
        $("[id^='tab_']").hide();
        $("#tab_" + tabs[0].id).show();
    });
}

function extendDownList(urlList, tabid){
    for (let i = 0; i < urlList.length; i++){
        appendDownList(urlList[i], tabid);
    }
}

function clear(){
    chrome.storage.local.set({urls: []}, function() {});
    chrome.storage.local.set({ts_urls: []}, function() {});
    $("#tabDown_list").empty();
}

function update(URL, tab_id, host){
    let ts_url_set = new Array();
    let ts_url_set_ = new Array();
    $.get(URL, function(m3u_raw_data){
        ts_url_set = m3uParser(m3u_raw_data, host);
        console.log(ts_url_set);
        chrome.storage.local.get('ts_urls', function(data){
            // console.log(data);
            let url_list = data.ts_urls;
            if (url_list.length == 0){
                url_list.push({
                    tabid: tab_id,
                    urls: ts_url_set
                });
                chrome.storage.local.set({ts_urls: url_list}, function(){});
                extendDownList(ts_url_set, tab_id);
                // console.log(url_list);
                // console.log("not In else");
            }
            else{
                for (let i = 0; i < url_list.length; i++) {
                    if (url_list[i].tabid == tab_id) {
                        ts_url_set_ = union(url_list[i].urls, ts_url_set);
                        extendDownList(difference(ts_url_set_, url_list[i].urls), tab_id);
                        url_list[i] = {
                            tabid: tab_id,
                            urls: ts_url_set_
                        };
                        chrome.storage.local.set({ts_urls: url_list}, function(){});
                        break;       
                    }
                    if (i == url_list.length - 1){
                        url_list.push({
                            tabid: tab_id,
                            urls: ts_url_set
                        });
                        extendDownList(ts_url_set, tab_id);
                    }
                }
                // console.log(url_list);
                // console.log("In else");
            }
        });
    });
}

var port = chrome.runtime.connect({name: "popup"});

port.onMessage.addListener(function(message){
    console.log(message, "received by port.");
    let host = getHost(message.url);
    let tab_id = message.tabId;
    let URL = message.url;
    update(URL, tab_id, host);
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    console.log(message, "received in runtime.");
    if (!message.cached){
        let host = getHost(message.url);
        let tab_id = message.tabId;
        let URL = message.url;
        update(URL, tab_id, host);
    }
});

chrome.storage.local.get('ts_urls', function(data) {
    var urlList = data.ts_urls;
    for(let i = 0; i < urlList.length; i++){
        extendDownList(urlList[i].urls, urlList[i].tabid);
    }
    // console.log(urlList);
    // extendDownList(urlList);
});

$("#clear_btn").click(function(){
    clear();
});

$("#download_all").click(function(){
    for (const link of $("[href]:visible")) {
        link.click();
    }
    clear();
});

chrome.tabs.query({active: true, currentWindow: true} ,function (tabs){
    var tab_url = $("#current_tab_url");
    tab_url.html("Current Tab URL: "+ tabs[0].url + "<br> Tab id: " + tabs[0].id);
    // console.log(tabs[0]);
    $("[id^='tab_']").hide();
    // $("#tab_" + tabs[0].id).show();
});
