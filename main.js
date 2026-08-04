const { app, BrowserWindow, screen, ipcMain, session } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");

const { exec } = require("child_process");
let wifi;
try {
  wifi = require("node-wifi");
  wifi.init({ iface: null });
} catch { }

const IP_FILE = "/home/raisa/ip_controller.txt";
const MUSIC_FILE = path.join(__dirname, "music_last.txt");

function result(success, value, error) {
  return success ? { success: true, value } : { success: false, error };
}

function readMusic() {
  try {
    return result(true, fs.existsSync(MUSIC_FILE) ? fs.readFileSync(MUSIC_FILE, "utf8").trim() || null : null);
  } catch (error) {
    return result(false, null, error.message);
  }
}

function writeMusic(value) {
  try {
    fs.writeFileSync(MUSIC_FILE, String(value || "").trim(), "utf8");
    return result(true, true);
  } catch (error) {
    return result(false, null, error.message);
  }
}

ipcMain.handle("save-ip", async (_, ip) => {
  try {
    fs.writeFileSync(IP_FILE, ip.trim(), "utf8");

    console.log("Controller IP disimpan:", ip);

    return {
      success: true,
    };
  } catch (err) {
    console.error(err);

    return {
      success: false,
      error: err.message,
    };
  }
});

ipcMain.handle("music-last-get", () => readMusic());
ipcMain.handle("music-last-save", (_, value) => writeMusic(value));

ipcMain.handle("volume-get", () => new Promise((resolve) => {
  exec("pactl get-sink-volume @DEFAULT_SINK@", (error, stdout) => {
    if (error) return resolve(result(false, null, error.message));
    const match = stdout.match(/(\d+)%/);
    resolve(match ? result(true, Number(match[1])) : result(false, null, "Volume not found"));
  });
}));

ipcMain.handle("volume-set", (_, percent) => new Promise((resolve) => {
  const value = Math.max(0, Math.min(100, Number(percent)));
  exec(`pactl set-sink-volume @DEFAULT_SINK@ ${value}%`, (error) => {
    resolve(error ? result(false, null, error.message) : result(true, value));
  });
}));

function wifiRequest(operation) {
  return new Promise((resolve) => {
    if (!wifi) return resolve(result(false, null, "node-wifi unavailable"));
    operation((error, value) => resolve(error ? result(false, null, error.message || String(error)) : result(true, value)));
  });
}

ipcMain.handle("wifi-scan", () => wifiRequest((callback) => wifi.scan(callback)));
ipcMain.handle("wifi-connections", async () => {
  const response = await wifiRequest((callback) => wifi.getCurrentConnections(callback));
  if (!response.success) return response;
  const ip = Object.values(os.networkInterfaces()).flat().find((entry) => entry.family === "IPv4" && !entry.internal)?.address || null;
  return result(true, { connections: response.value || [], ip });
});
ipcMain.handle("wifi-connect", (_, value) => wifiRequest((callback) => wifi.connect(value, callback)));
ipcMain.handle("restart-ros", () => new Promise((resolve) => {
  exec("systemctl --user restart run_ros_riman.service", (error) => resolve(error ? result(false, null, error.message) : result(true, true)));
}));
ipcMain.handle("launch-chrome", (_, url) => {
  if (!/^https?:\/\//i.test(String(url))) return result(false, null, "Only HTTP(S) URLs are allowed");
  const child = require("child_process").spawn("google-chrome", ["--kiosk", "--password-store=basic", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required", "--disable-pinch", "--overscroll-history-navigation=0", "--disk-cache-dir=/dev/null", String(url)], { detached: true, stdio: "ignore" });
  child.unref();
  return result(true, true);
});
ipcMain.handle("kill-chrome", () => new Promise((resolve) => {
  exec("pkill chrome", () => resolve(result(true, true)));
}));
// try {
//   require('electron-reloader')(module);
// } catch (_) {}

function createWindow() {
  const displays = screen.getAllDisplays();
  const targetDisplay = displays.length > 1 ? displays[1] : displays[0];
  const { x, y, width, height } = targetDisplay.bounds;

  const win = new BrowserWindow({
    x,
    y, // slight offset to avoid taskbar overlap
    width: 1200,
    height: 1920,
    frame: false, // ✅ no OS border/titlebar
    fullscreen: true, // ✅ force fullscreen
    resizable: false, // ✅ lock size

    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      allowRunningInsecureContent: true,
      sandbox: false,
      webviewTag: true,
      autoplayPolicy: "no-user-gesture-required",
    },
  });

  win.loadFile("index.html");

  win.webContents.setWindowOpenHandler(() => ({ action: "allow" }));
}

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("ignore-certificate-errors");
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
app.commandLine.appendSwitch("disable-site-isolation-trials");
// app.disableHardwareAcceleration();
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch('force-device-scale-factor', '1');

app.whenReady().then(() => {
  // 1. Handle Permission Requests
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    // 'media' covers both microphone and camera
    if (permission === 'media') {
      callback(true) // Grant permission
    } else {
      callback(false) // Deny everything else, or handle accordingly
    }
  })

  // 2. Handle Permission Checks (optional but recommended for completeness)
  session.defaultSession.setPermissionCheckHandler((webContents, permission, requestingOrigin, details) => {
    if (permission === 'media') {
      return true
    }
    return false
  })

  // clear cache before creating the window to ensure a fresh start
  session.defaultSession.clearCache().then(() => {
    createWindow();
  });
});
