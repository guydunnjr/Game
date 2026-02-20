const { app, BrowserWindow } = require('electron');
const path = require('path');

async function ensureCorpusManifestOnOpen() {
  try {
    const { ensureManifestFresh } = await import(path.join(__dirname, 'scripts/corpus-manifest.mjs'));
    const result = await ensureManifestFresh();
    console.log(`[Plain Terms] ${result.reason}`);
  } catch (error) {
    console.warn('[Plain Terms] Could not refresh corpus manifest on startup:', error.message);
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(async () => {
  await ensureCorpusManifestOnOpen();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
