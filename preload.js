const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('electron', {
    loadLicenseText: () => ipcRenderer.invoke('load-license-text'),
    getPath: (type) => ipcRenderer.invoke('get-path', type),
    getCredentials: (filename) => ipcRenderer.invoke('get-credentials', filename),
    saveCredentials: (filename, credentials) => ipcRenderer.invoke('save-credentials', filename, credentials),
    finishSetup: () => ipcRenderer.invoke('finish-setup'),
    fs: fs,
    path: path,
    dirname: __dirname
});
