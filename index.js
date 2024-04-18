import { ipcMain } from 'electron'
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import fs from 'fs'
const pages = ["search"];
import cache from "./data/music/cache.json" with {"type": "json"}
import YTDLPWrapper from './apis/ytdlp.js';
import { MusicBrainzApi } from 'musicbrainz-api';
const mbApi = new MusicBrainzApi({
    appName: 'listen.',
    appVersion: '0.1.0',
    appContactInfo: 'electronicankle@protonmail.com'
});

const YTDLP = new YTDLPWrapper();
import FuzzySearch from 'fuzzy-search';

function createWindow() {
    const win = new BrowserWindow({
        width: 1920/1.5,
        height: 1080/1.5,
        minWidth: 600,
        minHeight: 400,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        frame: false,
    })

    ipcMain.on("window-controls", (ev, control) => {
        switch (control) {
            case 0:
                win.close();
                break;
            case 1:
                if (win.isMinimized()) win.maximize()
                else win.minimize();
                break;
            case 2:
                if (win.isMaximized()) win.restore();
                else win.maximize();
                break;
        }
    })

    ipcMain.on("get-page", (ev, page) => {
        if(pages.indexOf(page) == -1) return;
        fs.readFile(path.join(__dirname, `${page}.html`), (err, dat) => {
            win.webContents.send("page-found", dat.toString())
        })
    })

    var knownArtists = [];

    function findPureInfo(infoT, chnl) {
        var isSpedUp = infoT.search(/[[(]?[ ]?sped up( version)?[ ]?[\])]?/gmi) != -1;
        var title = infoT.replace(/[[(]?[ ]?sped up( version)?[ ]?[\])]?/gmi, "").trim();
        var artist = chnl.replace(" - Topic", "").trim();
        title = title.split(/([{\[\(][omvlefs]\|?)|(([\(]?ft)|([\(]?featuring))/gmi)[0].trim();
        if(title.search(/[ ]?- /) != -1) {
            var artistIndex = knownArtists.indexOf(title.split(/[ ]?- /)[1].trim().toLowerCase()) != -1 ? 1 : 0;
            artist = title.split(/[ ]?- /)[artistIndex].trim()
            title = title.split(/[ ]?- /)[1 - artistIndex].trim();
        };
        if(isSpedUp) title = title + " (Sped Up)";
        knownArtists.push(artist.toLowerCase());
        if(artist) return {artist, title}
        else return {title}
    }

    ipcMain.on("search", async (ev, searchValue) => {
        const localSearcher = new FuzzySearch(Object.values(cache), ['title','artist','album'], {caseSensitive: false})
        const localResults = localSearcher.search(searchValue);
        const webResults = (await YTDLP.searchVideo(searchValue)).map((v) => ({...v, ...findPureInfo(v.title, v.channel)}));
        win.webContents.send("search-found", {local: localResults, web: webResults});
    })

    win.loadFile('index.html')

    win.webContents.on("did-finish-load", () => {
        fs.readdir(path.join(__dirname, "data", "playlists"), (err, dirDat) => {
            var playlists = {}
            for (var f of dirDat) {
                playlists[f] = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "playlists", f)));
            }
            win.webContents.send("playlists-updated", playlists)
        })
    })


    return win;
}

app.whenReady().then(async () => {
    const SUCCESS = await YTDLP.initialize();
    if(!SUCCESS) return app.quit();
    var window = createWindow()
    console.log("Running YTDLP version", await YTDLP.getVersion())
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            window = createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})