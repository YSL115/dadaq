`user script`;

function buildMediaData(
  id,
  coverURLString,
  title,
  descriptionText,
  detailURLString
) {
  var obj = {
    id: id,
    coverURLString: coverURLString,
    title: title,
    descriptionText: descriptionText,
    detailURLString: detailURLString,
  };
  return obj;
}

function buildEpisodeData(id, title, episodeDetailURL) {
  return {
    id: id,
    title: title,
    episodeDetailURL: episodeDetailURL,
  };
}

function buildDetailsURL(href) {
  if (!href.startsWith("http")) {
    href = "https://www.dadaqu.cc" + href;
  }
  return href;
}

function buildImageURL(params) {
  if (!params) return '';
  if (!params.startsWith("http")) {
    if (params.startsWith("//")) {
      return "https:" + params;
    } else {
      return "https://www.dadaqu.cc" + params;
    }
  }
  return params;
}

// Main
function buildMedias(inputURL) {
  // 处理分类页第一页的URL，将/1.html修正为.html以匹配站点伪静态规则
  let url = inputURL;
  if (url.includes("/type/") && url.endsWith("/1.html")) {
    url = url.replace("/1.html", ".html");
  }
  
  var req = {
    url: url,
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://www.dadaqu.cc/"
    }
  };
  let returnDatas = [];
  
  $http.fetch(req).then(function (res) {
    let doc = new DOMParser().parseFromString(res.body, 'text/html');
    // 优先匹配分类页标准的视频项
    let items = doc.querySelectorAll('.module-item');
    // 兼容首页的轮播/列表项
    if (items.length === 0) {
      items = doc.querySelectorAll('.swiper-slide');
    }
    
    for (var index = 0; index < items.length; index++) {
      let item = items[index];
      let a = item.querySelector('a[href*="/detail/"]');
      if (!a) continue;
      
      let href = a.getAttribute('href');
      let detailURL = buildDetailsURL(href);
      // 从链接提取视频ID
      let idMatch = href.match(/detail\/(\d+)\.html/);
      if (!idMatch) continue;
      let id = idMatch[1];
      
      let img = item.querySelector('img');
      let coverURL = '';
      if (img) {
        coverURL = buildImageURL(img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-original'));
      }
      
      let titleEl = item.querySelector('.title, .title a, .pic-info h4 a');
      let title = titleEl ? titleEl.textContent.trim() : '';
      
      let noteEl = item.querySelector('.note, .ins p:first-child, .pic-info .note');
      let note = noteEl ? noteEl.textContent.trim() : '';
      
      returnDatas.push(
        buildMediaData(
          id,
          coverURL,
          title,
          note,
          detailURL
        )
      );
    }
    
    $next.toMedias(JSON.stringify(returnDatas));
  });
}

function getEpisodes(inputURL) {
  var req = {
    url: inputURL,
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://www.dadaqu.cc/"
    }
  };
  let returnDatas = [];
  
  $http.fetch(req).then(function (res) {
    let doc = new DOMParser().parseFromString(res.body, 'text/html');
    // 匹配剧集列表的链接
    let items = doc.querySelectorAll('.playlist a, .episode-list a, .drama-item a');
    
    for (var index = 0; index < items.length; index++) {
      let item = items[index];
      let href = item.getAttribute('href');
      let playerURL = buildDetailsURL(href);
      let title = item.textContent.trim();
      
      returnDatas.push(buildEpisodeData(playerURL, title, playerURL));
    }
    
    $next.toEpisodes(JSON.stringify(returnDatas));
  });
}

function Player(inputURL) {
  var req = {
    url: inputURL,
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://www.dadaqu.cc/"
    }
  };
  
  $http.fetch(req).then(function (res) {
    let html = res.body;
    // 匹配播放器配置中的播放地址，兼容不同的播放器变量名
    let match = html.match(/player_aaaa\s*=\s*\{.*?url\s*:\s*"([^"]+)"/s) 
      || html.match(/mac_player\s*=\s*\{.*?url\s*:\s*"([^"]+)"/s)
      || html.match(/player_data\s*=\s*\{.*?url\s*:\s*"([^"]+)"/s);
    
    if (match) {
      let playUrl = match[1];
      // 处理相对路径的播放地址
      if (!playUrl.startsWith("http")) {
        if (playUrl.startsWith("//")) {
          playUrl = "https:" + playUrl;
        }
      }
      $next.toPlayer(playUrl);
    } else {
      // 未匹配到则尝试直接使用输入地址
      $next.toPlayer(inputURL);
    }
  });
}

function Search(inputURL, key) {
  var req = {
    url: inputURL,
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      "Referer": "https://www.dadaqu.cc/"
    }
  };
  let returnDatas = [];
  
  $http.fetch(req).then(function (res) {
    let doc = new DOMParser().parseFromString(res.body, 'text/html');
    let items = doc.querySelectorAll('.module-item');
    
    for (var index = 0; index < items.length; index++) {
      let item = items[index];
      let a = item.querySelector('a[href*="/detail/"]');
      if (!a) continue;
      
      let href = a.getAttribute('href');
      let detailURL = buildDetailsURL(href);
      let idMatch = href.match(/detail\/(\d+)\.html/);
      if (!idMatch) continue;
      let id = idMatch[1];
      
      let img = item.querySelector('img');
      let coverURL = '';
      if (img) {
        coverURL = buildImageURL(img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-original'));
      }
      
      let titleEl = item.querySelector('.title, .title a, .pic-info h4 a');
      let title = titleEl ? titleEl.textContent.trim() : '';
      
      let noteEl = item.querySelector('.note, .ins p:first-child, .pic-info .note');
      let note = noteEl ? noteEl.textContent.trim() : '';
      
      returnDatas.push(
        buildMediaData(
          id,
          coverURL,
          title,
          note,
          detailURL
        )
      );
    }
    
    $next.toSearchMedias(JSON.stringify(returnDatas), key);
  });
}
