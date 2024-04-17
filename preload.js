const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('listenAPI', {
  close: () => ipcRenderer.send('window-controls', 0),
  min: () => ipcRenderer.send('window-controls', 1),
  max: () => ipcRenderer.send('window-controls', 2),
  onPlaylistUpdated: (cb) => ipcRenderer.on('playlists-updated', (_event, playlists) => cb(playlists))
})