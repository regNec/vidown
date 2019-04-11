/*
    union two sets, however return an array, for simplicity 
*/
function union(setA, setB) {
    var _union = new Set(setA);
    for (var elem of setB) {
        _union.add(elem);
    }
    return Array.from(_union);
}

/*
    difference two sets (setA - setB), however return an array, for simplicity 
*/
function difference(setA, setB) {
    var _difference = new Set(setA);
    for (var elem of setB) {
        _difference.delete(elem);
    }
    return Array.from(_difference);
}

/*
    parse m3u data to get 'ts' files URL list
    m3u URL's host URL is shared with ts,
    so pad the host URL before the ts URL
*/
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

/*
    get host URL from a given URL
*/
function getHost(url){
    let host_list = url.split("/");
    host_list.pop();
    host = host_list.join('/') + '/';
    // alert(host)
    return host;
}

/*
    append item in the download list, sorted by tab
*/
function appendDownList(url, tabid){
    let downList = $("#tab_" + tabid);
    let tab_url = "";
    chrome.tabs.get(tabid, function(tab){
        tab_url = tab.url;
        // console.log(tab_url);
    });
    /* 
        check whether the tab has been recorded before
        if not, create one
    */
    if(downList.length <= 0){
        $("#tabDown_list").append($("<ul></ul>").attr("id", "tab_" + tabid));
        downList = $("#tab_" + tabid);
    }
    // reduce URL for simplicity and avoid too long URL
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
        // hide the download lists that are not belonged to current active tab
        $("[id^='tab_']").hide();
        $("#tab_" + tabs[0].id).show();
    });
}

/*
    extend download list, sorted by tab
*/
function extendDownList(urlList, tabid){
    for (let i = 0; i < urlList.length; i++){
        appendDownList(urlList[i], tabid);
    }
}

/*
    clear the downlist and ts_urls storage in the chrome
    only items related to current active tab
*/
function clear(){
    chrome.tabs.query({active: true, currentWindow: true} ,function (tabs){
        let tabId = tabs[0].id;
        chrome.storage.local.get('ts_urls', function(data) {
            let urlList = data.ts_urls;
            // console.log(typeof tabId);
            for(let i = 0; i < urlList.length; i++){
                if (urlList[i].tabid == tabId){
                    urlList.splice(i, 1);
                }
            }
            chrome.storage.local.set({ts_urls: urlList}, function() {});
        });
        $("#tab_" +  tabId).remove();
    });
}

/*
    update the download list by received m3u data
*/
function update(URL, tab_id, host){
    let ts_url_set = new Array();
    let ts_url_set_ = new Array();
    // replay m3u request, get the content ('ts' URL list)
    $.get(URL, function(m3u_raw_data){
        ts_url_set = m3uParser(m3u_raw_data, host);
        // console.log(ts_url_set);
        chrome.storage.local.get('ts_urls', function(data){
            // console.log(data);
            let url_list = data.ts_urls;
            // if the download list is empty, show the ts list directly
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
            /* 
                the download list is not empty, merge ts list
                duplicated ones should be removed
            */
            else{
                for (let i = 0; i < url_list.length; i++) {
                    if (url_list[i].tabid == tab_id) {
                        ts_url_set_ = union(url_list[i].urls, ts_url_set);
                        /* 
                            difference and extend the new ones only
                            considering effciency and consumption 
                        */ 
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

// start a connection request as soon as the page is opened
var port = chrome.runtime.connect({name: "popup"});

/*
    register an event, fired when message (m3u URL) received by port
    message is transmitted by port only when the m3u cache is not empty
*/
port.onMessage.addListener(function(message){
    console.log(message, "received by port.");
    let host = getHost(message.url);
    let tab_id = message.tabId;
    let URL = message.url;
    update(URL, tab_id, host);
});

/*
    register an event, fired when message (m3u URL) received NOT by port
    message is transmitted directly
*/
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    console.log(message, "received in runtime.");
    if (!message.cached){
        let host = getHost(message.url);
        let tab_id = message.tabId;
        let URL = message.url;
        update(URL, tab_id, host);
    }
});

/*
    when popup page is opened, load the 'ts' items
*/
chrome.storage.local.get('ts_urls', function(data) {
    var urlList = data.ts_urls;
    for(let i = 0; i < urlList.length; i++){
        extendDownList(urlList[i].urls, urlList[i].tabid);
    }
    // console.log(urlList);
    // extendDownList(urlList);
});

/*
    register an event when clear button is clicked
    clear all current active tab related items
*/
$("#clear_btn").click(function(){
    clear();
});

/*
    register an event when download_all button is clicked
    download all items related to current active tab (visible item)
*/
$("#download_all").click(function(){
    for (const link of $("[href]:visible")) {
        link.click();
    }
    clear();
});

/*
    show globle infomation about the current active tab,
    hide inactive ones
*/
chrome.tabs.query({active: true, currentWindow: true} ,function (tabs){
    let tab_info = $("#current_tab");
    let tab_url = $("<p></p>").attr("id", "tabUrl");
    tab_url.text("Current Tab URL: " + tabs[0].url);
    let tab_id = $("<p></p>").attr("id", "tabId");
    tab_id.text("Tab id: " + tabs[0].id);
    tab_info.append(tab_url);
    tab_info.append(tab_id);
    // console.log(tabs[0]);
    $("[id^='tab_']").hide();
    // $("#tab_" + tabs[0].id).show();
});
