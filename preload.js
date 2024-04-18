const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('listenAPI', {
  close: () => ipcRenderer.send('window-controls', 0),
  min: () => ipcRenderer.send('window-controls', 1),
  max: () => ipcRenderer.send('window-controls', 2),
  onPlaylistUpdated: (cb) => ipcRenderer.on('playlists-updated', (_event, playlists) => cb(playlists)),
  getPage: (pageName, cb) => {
    ipcRenderer.on("page-found", (_event, page) => {
      cb(page)
      ipcRenderer.removeAllListeners("page-found");
    });
    ipcRenderer.send('get-page', pageName);
  },
  search: (searchValue, cb) => {
    ipcRenderer.on("search-found", (_event, results) => {
      cb(results)
      ipcRenderer.removeAllListeners("search-found");
    });
    ipcRenderer.send("search", searchValue);
  }
  
})