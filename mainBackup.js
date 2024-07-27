const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile('index.html');

    ipcMain.handle('load-license-text', async () => {
        const licensePath = path.join(__dirname, 'assets/txt/ServiceAgreement(Software_IT).txt');
        const data = await fs.promises.readFile(licensePath, 'utf-8');
        return data;
    });

    ipcMain.handle('save-credentials', async (event, filename, credentials) => {
        const configPath = path.join(__dirname, 'backend/config', filename);
        await fs.promises.writeFile(configPath, JSON.stringify(credentials, null, 2), 'utf-8');
    });

    ipcMain.handle('fetch-jwt', async (event, url, body) => {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        const data = await response.json();
        return data;
    });
}

app.on('ready', () => {
    // Ignore certificate errors
    app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
    app.commandLine.appendSwitch('allow-insecure-localhost', 'true');

    // Set certificate verification procedure
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
        callback(0); // Trust all certificates
    });

    // Set user agent
    session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        details.requestHeaders['User-Agent'] = 'Mozilla/5.0';
        callback({ requestHeaders: details.requestHeaders });
    });

    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});
