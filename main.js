const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

function createWindow(page) {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: true, // Set this to true for the license to render correctly
    },
  });

  mainWindow.loadFile(page);

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

function registerIpcHandlers() {
  ipcMain.handle('load-license-text', async () => {
    const licensePath = path.join(__dirname, 'assets/txt/ServiceAgreement(Software_IT).txt');
    const data = await fs.promises.readFile(licensePath, 'utf-8');
    return data;
  });

  ipcMain.handle('get-path', (event, type) => {
    return app.getPath(type);
  });

  ipcMain.handle('get-credentials', async (event, filename) => {
    const configPath = path.join(app.getPath('userData'), filename);
    if (fs.existsSync(configPath)) {
      const data = await fs.promises.readFile(configPath, 'utf-8');
      return JSON.parse(data);
    } else {
      return null;
    }
  });

  ipcMain.handle('save-credentials', async (event, filename, credentials) => {
    const configDir = app.getPath('userData');
    const configPath = path.join(configDir, filename);
    await fs.promises.writeFile(configPath, JSON.stringify(credentials, null, 2), 'utf-8');
    console.log(`Saved credentials to ${configPath}`);
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

  ipcMain.handle('finish-setup', async () => {
    console.log('Handling finish-setup');
    const setupCompletePath = path.join(app.getPath('userData'), 'setup-complete.txt');
    await fs.promises.writeFile(setupCompletePath, 'complete', 'utf-8');
    mainWindow.loadFile('login-localserver.html');
  });
}

function deleteSetupFile() {
  const setupCompletePath = path.join(app.getPath('userData'), 'setup-complete.txt');
  if (fs.existsSync(setupCompletePath)) {
    fs.unlinkSync(setupCompletePath);
  }
}

app.on('ready', () => {
  app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
  app.commandLine.appendSwitch('allow-insecure-localhost', 'true');

  session.defaultSession.setCertificateVerifyProc((request, callback) => {
    callback(0);
  });

  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = 'Mozilla/5.0';
    callback({ requestHeaders: details.requestHeaders });
  });

  registerIpcHandlers();

  const setupCompletePath = path.join(app.getPath('userData'), 'setup-complete.txt');
  console.log(`Checking if setup complete file exists at: ${setupCompletePath}`);
  if (fs.existsSync(setupCompletePath)) {
    console.log('Setup complete file found. Loading dashboard.html');
    createWindow('dashboard.html');
  } else {
    console.log('Setup complete file not found. Loading index.html');
    createWindow('index.html');
  }

  startBackendServer();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow('index.html');
  });
});

function startBackendServer() {
  const isDev = !app.isPackaged;
  const backendServerPath = isDev
    ? path.join(__dirname, 'backend', 'server.js')
    : path.join(process.resourcesPath, 'backend', 'server.js');

  console.log(`Backend server path: ${backendServerPath}`);

  backendProcess = spawn('node', [backendServerPath], {
    detached: true,
    stdio: 'ignore',
  });

  backendProcess.unref();

  backendProcess.on('error', (error) => {
    console.error(`Error starting backend server: ${error}`);
  });

  console.log(`Backend server started with PID: ${backendProcess.pid}`);
}

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    stopBackendServer();
    app.quit();
  }
});

app.on('before-quit', () => {
  stopBackendServer();
});

process.on('SIGINT', () => {
  deleteSetupFile();
  stopBackendServer();
  process.exit();
});

function stopBackendServer() {
  if (backendProcess) {
    try {
      process.kill(-backendProcess.pid);
      console.log('Backend server stopped');
    } catch (err) {
      if (err.code === 'ESRCH') {
        console.error('Backend process not found');
      } else {
        throw err;
      }
    }
    backendProcess = null;
  }
}
