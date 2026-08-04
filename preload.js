const { contextBridge, ipcRenderer } = require("electron");

const ALLOWED_CHANNELS = new Set([
  "save-ip",
  "music-last-get",
  "music-last-save",
  "volume-get",
  "volume-set",
  "wifi-scan",
  "wifi-connections",
  "wifi-connect",
  "restart-ros",
  "launch-chrome",
  "kill-chrome",
]);

contextBridge.exposeInMainWorld("raisaPlatform", {
  isElectron: true,
  invoke: (channel, value) => {
    if (!ALLOWED_CHANNELS.has(channel)) return Promise.reject(new Error("IPC channel not allowed"));
    return ipcRenderer.invoke(channel, value);
  },
});
