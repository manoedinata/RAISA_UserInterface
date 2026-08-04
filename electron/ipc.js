const { ipcMain } = require("electron");

const { asResult, operations } = require("./systemOperations");

const handlers = {
    "save-ip": (value) => operations.saveIp(value),
    "music-last-get": () => operations.getLastMusic(),
    "music-last-save": (value) => operations.saveLastMusic(value),
    "volume-get": () => operations.getVolume(),
    "volume-set": (value) => operations.setVolume(value),
    "wifi-scan": () => operations.scanWifi(),
    "wifi-connections": () => operations.getWifiConnections(),
    "wifi-connect": (value) => operations.connectWifi(value),
    "restart-ros": () => operations.restartRos(),
    "launch-chrome": (value) => operations.launchChrome(value),
    "kill-chrome": () => operations.killChrome(),
};

function registerIpcHandlers() {
    for (const [channel, handler] of Object.entries(handlers)) {
        ipcMain.handle(channel, (_event, value) => asResult(() => handler(value)));
    }
}

module.exports = { registerIpcHandlers };
