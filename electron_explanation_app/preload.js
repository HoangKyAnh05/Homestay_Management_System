const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  readProjectFile: (relPath) => ipcRenderer.invoke('read-project-file', relPath),
  openExternalUrl: (url) => ipcRenderer.invoke('open-external-url', url),
  getProjectDirectory: () => ipcRenderer.invoke('get-project-directory'),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  setProjectDirectory: (customPath) => ipcRenderer.invoke('set-project-directory', customPath),
  getProjectFiles: () => ipcRenderer.invoke('get-project-files')
});

