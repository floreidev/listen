var themes = {
    dark: {
        "main": "#121212",
        "secondary": "#181818",
        "dark": "#000000",
        "light": "#242424",
        "highlight": "#595A5A",
        "color": "#fff"
    },
  light: {
    "main": "#ededed",
    "secondary": "#e8e8e8",
    "dark": "#fff",
    "light": "#dbdbdb",
    "highlight": "#a6a7a7"
  }
}

var settings = JSON.parse(window.localStorage.getItem("settings") || "{}");

document.addEventListener("DOMContentLoaded", () => {
    const frameButtons = [document.getElementById("min"), document.getElementById("max"), document.getElementById("close")];
    const playlistArea = document.getElementById("playlistArea")
    const main = document.getElementById("main");

    frameButtons[0].addEventListener("click", () => window.listenAPI.min())
    frameButtons[1].addEventListener("click", () => window.listenAPI.max())
    frameButtons[2].addEventListener("click", () => window.listenAPI.close())

    loadTheme(settings.theme || "dark");

    function loadContentPage(page, values) { // SPA  Fetching
      var realPage = page.indexOf("/") != -1 ? page.split("/")[page.split("/").length - 1] : page;
      console.log(realPage, values)
      var raw = window.listenAPI.getPage(page);
      for(var from in values) {
        raw = raw.replace(new RegExp(from, "g"), values[from]);
      }
      main.innerHTML = raw;
    }

    document.querySelectorAll("a").forEach((v) => { // SPA Init
        v.addEventListener("click", (ev) => {
            ev.preventDefault()
            const qparams = new URLSearchParams(v.href.split("?")[1]);
            const page = v.href.split("?")[0]
            loadContentPage(page, qparams);
        })
    });
    document.querySelectorAll("form").forEach((v) => { // SPA init
      v.addEventListener("submit", (ev) => {
          ev.preventDefault()
          const dat = Object.fromEntries(new FormData(v).entries())
          const page = v.action;
          loadContentPage(page, dat);
      })
  });
    
    window.listenAPI.onPlaylistUpdated((playlists) => {
        playlistArea.innerHTML = "";
        for (var playlistId in playlists) {
            var playlist = playlists[playlistId];
            const playlistElement = `<div class="playlist-item" tabindex="0"><img src="${playlist.cover}"><div class="playlist-item-details"><h1>${playlist.title}</h1> <h2>${playlist.author}</h2></div></div>`
            playlistArea.innerHTML += playlistElement;
        }
    })
})

function loadTheme(theme) {
    for (var set in themes[theme]) {
        var v = themes[theme][set];
        document.documentElement.style.setProperty(`--${set}`, v);
    }
}
