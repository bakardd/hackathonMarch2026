const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  onActivity: (cb) => ipcRenderer.on("activity-update", (_, data) => cb(data)),
  onIdle: (cb) => ipcRenderer.on("idle-update", (_, data) => cb(data)),
});
