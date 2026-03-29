const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onActivity: (cb) => ipcRenderer.on("activity-update", (_, data) => cb(data)),
  onActivityError: (cb) => ipcRenderer.on("activity-error", (_, data) => cb(data)),
  onIdle: (cb) => ipcRenderer.on("idle-update", (_, data) => cb(data)),
  notifyDistraction: (currentApp) => ipcRenderer.send("notify-distraction", currentApp),
  showDistractionOverlay: (payload) => ipcRenderer.send("show-distraction-overlay", payload),
  hideDistractionOverlay: () => ipcRenderer.send("hide-distraction-overlay"),
});
