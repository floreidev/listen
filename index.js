const { ipcMain } = require('electron')
const { app, BrowserWindow } = require('electron/main')
const path = require('node:path')
const fs = require('fs')

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
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

    win.loadFile('index.html')

    win.webContents.on("did-finish-load", () => {
        fs.readdir(path.join(__dirname, "data", "playlists"), (err, dirDat) => {
            var playlists = {}
            for (var f of dirDat) {
                playlists[f] = require(`./data/playlists/${f}`)
            }
            win.webContents.send("playlists-updated", playlists)
        })
    })


    return win;
}

app.whenReady().then(() => {
    var window = createWindow()

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