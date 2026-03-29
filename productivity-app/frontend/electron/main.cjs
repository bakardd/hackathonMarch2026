const { app, BrowserWindow, ipcMain, powerMonitor } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 780,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
    },
  });

  // In dev, load Vite dev server; in prod, load built files
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  // Active window tracking (requires active-win)
  let activeWin;
  try {
    activeWin = require("active-win");
  } catch {
    console.warn("active-win not available, skipping window tracking");
  }

  if (activeWin) {
    setInterval(async () => {
      try {
        const win = await activeWin();
        if (!win || !mainWindow) return;
        mainWindow.webContents.send("activity-update", {
          app: win.owner.name,
          title: win.title,
          timestamp: Date.now(),
        });
      } catch {}
    }, 2000);
  }

  // Idle detection via powerMonitor
  setInterval(() => {
    if (!mainWindow) return;
    const idleTime = powerMonitor.getSystemIdleTime();
    mainWindow.webContents.send("idle-update", {
      idle: idleTime > 60,
      idleTime,
    });
  }, 5000);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
