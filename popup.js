function showDownList(urlList){
    var downList = $("downList");
    for (var i = 0; i < urlList.length; i++){
        appendDownList(urlList[i])
    }
}

function appendDownList(url){
    var downList = $("#downList");
    var urlItem = $("<li></li>").append($("<a></a>").attr("href",url).text(url))
    downList.append(urlItem);
}

chrome.storage.local.get('urls', function(data) {
    var urlList = data.urls;
    showDownList(urlList);
});

$("#clear_btn").click(function(){
    chrome.storage.local.set({urls: []}, function() {});
    $("#downList").empty()
});

chrome.storage.onChanged.addListener(function(changes, namespace){
    var urlList = changes['urls'];
    if (urlList.newValue.length > urlList.oldValue.length){
        appendDownList(urlList.newValue[urlList.newValue.length - 1]);
    }
    else{
        // $("#downList").empty();
        showDownList(urlList.newValue);
    }
});

chrome.tabs.query({active: true} ,function (tabs){
    var tab_url = $("#current_tab_url");
    tab_url.html("Current Tab URL: <br>"+ tabs[0].url);
});