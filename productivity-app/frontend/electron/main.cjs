const { app, BrowserWindow, ipcMain, powerMonitor, Notification } = require("electron");
const path = require("path");

let mainWindow;
let warningWindow;
const DEV_SERVER_URL = process.env.ELECTRON_RENDERER_URL || "http://localhost:5173";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function createWarningWindow() {
  if (warningWindow && !warningWindow.isDestroyed()) return warningWindow;

  warningWindow = new BrowserWindow({
    width: 460,
    height: 180,
    show: false,
    frame: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    transparent: true,
    alwaysOnTop: true,
    movable: false,
    focusable: true,
    hasShadow: true,
    webPreferences: {
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  warningWindow.setAlwaysOnTop(true, "screen-saver");
  warningWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  warningWindow.on("closed", () => {
    warningWindow = null;
  });

  return warningWindow;
}

function showWarningWindow(currentApp, allowedApps = []) {
  const win = createWarningWindow();
  const safeApp = escapeHtml(currentApp || "another app");
  const safeAllowedApps = allowedApps.map((appName) => escapeHtml(appName)).join(", ");
  const html = `<!doctype html>
  <html>
    <body style="margin:0;background:transparent;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="margin:12px;padding:18px 20px;border-radius:20px;background:rgba(25,16,16,0.96);border:1px solid rgba(239,68,68,0.45);color:#f3f4f6;box-shadow:0 24px 60px rgba(0,0,0,0.45);">
        <div style="font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;color:#f87171;">Distraction detected</div>
        <div style="margin-top:12px;font-size:18px;font-weight:600;line-height:1.35;">You switched to ${safeApp}</div>
        <div style="margin-top:8px;font-size:14px;color:#cbd5e1;line-height:1.4;">Return to one of your selected work apps.</div>
        <div style="margin-top:12px;font-size:12px;color:#94a3b8;">Allowed: ${safeAllowedApps || "None selected"}</div>
      </div>
    </body>
  </html>`;

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  win.center();
  win.show();
  win.moveTop();
  win.focus();
}

function hideWarningWindow() {
  if (warningWindow && !warningWindow.isDestroyed()) {
    warningWindow.hide();
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 780,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  // In dev, load Vite dev server; in prod, load built files
  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL(DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(async () => {
  createWindow();

  // Active window tracking — active-win v7 is ESM-only, use dynamic import
  let activeWinFn;
  try {
    const mod = await import("active-win");
    activeWinFn = mod.default ?? mod.activeWindow;
  } catch {
    console.warn("active-win not available, skipping window tracking");
  }

  if (activeWinFn) {
    setInterval(async () => {
      try {
        const win = await activeWinFn();
        if (!win || !mainWindow) return;
        mainWindow.webContents.send("activity-update", {
          app: win.owner.name,
          title: win.title,
          timestamp: Date.now(),
        });
      } catch (error) {
        if (!mainWindow) return;
        mainWindow.webContents.send("activity-error", {
          message: error?.message ?? "Unable to read active window information.",
          timestamp: Date.now(),
        });
      }
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

ipcMain.on("notify-distraction", (_, currentApp) => {
  if (!Notification.isSupported()) return;

  const appName = typeof currentApp === "string" && currentApp.trim() ? currentApp : "another app";
  new Notification({
    title: "FocusGuard",
    body: `You switched to ${appName}, which is outside your selected work apps.`,
    silent: false,
  }).show();
});

ipcMain.on("show-distraction-overlay", (_, payload) => {
  showWarningWindow(payload?.currentApp, payload?.allowedApps);
});

ipcMain.on("hide-distraction-overlay", () => {
  hideWarningWindow();
});

app.on("window-all-closed", () => {
  hideWarningWindow();
  if (process.platform !== "darwin") app.quit();
});
