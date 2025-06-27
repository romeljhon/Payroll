const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const isDev = !app.isPackaged;

let djangoProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
    }
  });

  if (isDev) {
    win.loadURL('http://localhost:9002');
  } else {
    win.loadFile(path.join(__dirname, '..', 'frontend', 'out', 'index.html'));
  }
}

function startDjango() {
  const managePy = path.join(__dirname, '..', 'backend', 'manage.py');
  djangoProcess = spawn('python', [managePy, 'runserver', '8000'], {
    cwd: path.join(__dirname, '..', 'backend'),
    shell: true
  });

  djangoProcess.stdout.on('data', data => console.log(`Django: ${data}`));
  djangoProcess.stderr.on('data', data => console.error(`Django error: ${data}`));
}

app.whenReady().then(() => {
  startDjango();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (djangoProcess) djangoProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});
