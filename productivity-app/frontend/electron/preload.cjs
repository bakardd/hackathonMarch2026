const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onActivity: (cb) => {
    const listener = (_, data) => cb(data);
    ipcRenderer.on("activity-update", listener);
    return () => ipcRenderer.removeListener("activity-update", listener);
  },
  onActivityError: (cb) => {
    const listener = (_, data) => cb(data);
    ipcRenderer.on("activity-error", listener);
    return () => ipcRenderer.removeListener("activity-error", listener);
  },
  onIdle: (cb) => {
    const listener = (_, data) => cb(data);
    ipcRenderer.on("idle-update", listener);
    return () => ipcRenderer.removeListener("idle-update", listener);
  },
  notifyDistraction: (currentApp) => ipcRenderer.send("notify-distraction", currentApp),
  showDistractionOverlay: (payload) => ipcRenderer.send("show-distraction-overlay", payload),
  hideDistractionOverlay: () => ipcRenderer.send("hide-distraction-overlay"),
});
