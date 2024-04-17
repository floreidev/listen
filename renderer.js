var themes = {
    dark: {
        "main": "#121212",
        "secondary": "#181818",
        "dark": "#000000",
        "light": "#242424",
        "highlight": "#595A5A",
        "color": "#fff"
    }
}

var settings = JSON.parse(window.localStorage.getItem("settings") || "{}");



document.addEventListener("DOMContentLoaded", () => {
    const frameButtons = [document.getElementById("min"), document.getElementById("max"), document.getElementById("close")];
    const playlistArea = document.getElementById("playlistArea")
    frameButtons[0].addEventListener("click", () => window.listenAPI.min())
    frameButtons[1].addEventListener("click", () => window.listenAPI.max())
    frameButtons[2].addEventListener("click", () => window.listenAPI.close())

    loadTheme(settings.theme || "dark");

    window.listenAPI.onPlaylistUpdated((playlists) => {
        playlistArea.innerHTML = "";
        for (var playlistId in playlists) {
            var playlist = playlists[playlistId];
            const playlistElement = `<div class="playlist-item"><img src="${playlist.cover}"><div class="playlist-item-details"><h1>${playlist.title}</h1> <h2>${playlist.author}</h2></div></div>`
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