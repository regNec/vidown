function showDownList(urlList){
    for (var i = 0; i < urlList.length; i++){
        appendDownList(urlList[i]);
    }
}

function m3uParser(m3u_raw_data){
    let ts_url_set = new Set();
    // TODO: parse m3u data to get ts url set
    alert(m3u_raw_data);
    return ts_url_set;
}

function appendDownList(url){
    var downList = $("#downList");
    var urlItem = $("<li></li>").append($("<a></a>").attr("href",url).text(url));
    urlItem.click(function(){
        let m3u_raw_data;
        let ts_url_set = new Set();
        $.get(url, function(result){
            m3u_raw_data = result;
            ts_url_set = m3uParser(m3u_raw_data);
            for (const ts_url of ts_url_set) {
                chrome.downloads.download({
                    url:url
                });
            }
        });
    });
    // urlItem.append(downBtn);
    downList.append(urlItem);
}

function clear(){
    chrome.storage.local.set({urls: []}, function() {});
    $("#downList").empty();
}

chrome.storage.local.get('urls', function(data) {
    var urlList = data.urls;
    showDownList(urlList);
});

$("#clear_btn").click(function(){
    clear();
});

// TODO: change this by using chrome.runtime.sendMessage & onMessage.addListener
chrome.storage.onChanged.addListener(function(changes, namespace){
    var urlList = changes['urls'];
    if (urlList.newValue.length > urlList.oldValue.length){
        appendDownList(urlList.newValue[urlList.newValue.length - 1]);
    }
    else{
        $("#downList").empty();
        showDownList(urlList.newValue);
    }
});

chrome.tabs.query({active: true} ,function (tabs){
    var tab_url = $("#current_tab_url");
    tab_url.html("Current Tab URL: <br>"+ tabs[0].url);
});