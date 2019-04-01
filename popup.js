var urlList;
chrome.storage.sync.get('urls', function(data) {
    urlList = data.urls;
    var downList = document.getElementById('downList');
    for (var i = 0; i < urlList.length; i++){
        var urlItem = document.createElement('p')
        urlItem.innerHTML = urlList[i]
        downList.appendChild(urlItem)
    }
});