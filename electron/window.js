const path = require("path");
const { BrowserWindow, screen } = require("electron");

function createMainWindow() {
    const displays = screen.getAllDisplays();
    const targetDisplay = displays.length > 1 ? displays[1] : displays[0];
    const { x, y } = targetDisplay.bounds;

    const window = new BrowserWindow({
        x,
        y,
        // width: 1200,
        // height: 1920,
        frame: false,
        // fullscreen: true,
        resizable: false,
        webPreferences: {
            preload: path.resolve(__dirname, "..", "preload.js"),
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: false,
            allowRunningInsecureContent: true,
            sandbox: false,
            autoplayPolicy: "no-user-gesture-required",
        },
    });

    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) window.loadURL(devServerUrl);
    else window.loadFile(path.resolve(__dirname, "..", "dist", "index.html"));

    window.webContents.setWindowOpenHandler(({ url }) => {
        if (/^https?:\/\//i.test(url)) return { action: "allow" };
        return { action: "deny" };
    });

    return window;
}

module.exports = { createMainWindow };
