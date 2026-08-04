const { app, BrowserWindow, screen, ipcMain, session } = require("electron");
const path = require("path");
const fs = require("fs");

const http = require('http');
const { exec } = require("child_process");

const IP_FILE = "/home/raisa/ip_controller.txt";

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
      // preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
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

// Create a tiny local server inside Electron
const killServer = http.createServer((req, res) => {
  // Set CORS headers so Chrome is allowed to talk to it
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.url === '/kill-chrome' && req.method === 'POST') {
    console.log("🛑 Received command to close Chrome. Terminating...");
    
    // Command to forcefully kill Google Chrome
    exec('pkill chrome || killall google-chrome', (err) => {
      res.writeHead(200);
      res.end('Chrome terminated');
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Start listening on port 9999
killServer.listen(9999, 'localhost', () => {
  console.log("🎧 Chrome Kill Server listening on port 9999");
});

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
