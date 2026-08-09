const { app, BrowserWindow, screen, ipcMain, session } = require("electron");
const path = require("path");
const fs = require("fs");

const http = require('http');
const { exec, spawn } = require("child_process");
const { MUSIC_LIST, findMusicByName, getMusicName } = require("./music");

const IP_FILE = "/home/raisa/ip_controller.txt";
const LOCAL_API_PORT = 9999;
let mainWindow = null;
let rendererReady = false;
const isDevelopment =
  process.env.NODE_ENV === "development" || process.argv.includes("--dev");

const WINDOW_CONFIG = isDevelopment
  ? { width: 640, height: 960, fullscreen: false }
  : { width: 1200, height: 1920, fullscreen: true };

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
  const { x, y } = targetDisplay.bounds;

  const win = new BrowserWindow({
    x,
    y, // slight offset to avoid taskbar overlap
    width: WINDOW_CONFIG.width,
    height: WINDOW_CONFIG.height,
    frame: false, // ✅ no OS border/titlebar
    fullscreen: WINDOW_CONFIG.fullscreen,
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

  console.log(
    `🖥️ Window mode: ${isDevelopment ? "development" : "production"} ` +
    `(${WINDOW_CONFIG.width}x${WINDOW_CONFIG.height}, fullscreen: ${WINDOW_CONFIG.fullscreen})`
  );

  win.loadFile("index.html");

  win.webContents.setWindowOpenHandler(() => ({ action: "allow" }));
  mainWindow = win;
  rendererReady = false;
  win.webContents.on("did-finish-load", () => {
    rendererReady = true;
  });
  win.on("closed", () => {
    if (mainWindow === win) mainWindow = null;
    rendererReady = false;
  });
}

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("ignore-certificate-errors");
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
app.commandLine.appendSwitch("disable-site-isolation-trials");
// app.disableHardwareAcceleration();
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch('force-device-scale-factor', '1');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 16 * 1024) {
        reject(new Error("Request body terlalu besar"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_) {
        reject(new Error("Body harus berupa JSON yang valid"));
      }
    });
    req.on("error", reject);
  });
}

function launchModePameranKiosk() {
  const chromeBinary = process.env.CHROME_BIN || "google-chrome";
  const chromeArgs = [
    "--kiosk",
    "--password-store=basic",
    "--use-fake-ui-for-media-stream",
    "--autoplay-policy=no-user-gesture-required",
    "--disable-pinch",
    "--overscroll-history-navigation=0",
    "--disk-cache-dir=/dev/null",
    "--disable-translate",
    "--disable-features=Translate",
    "--window-position=1920,1200",
    "http://localhost:8090",
  ];

  const child = spawn(chromeBinary, chromeArgs, {
    detached: true,
    stdio: "ignore",
    env: {
      ...process.env,
      DISPLAY: process.env.DISPLAY || ":0",
    },
  });

  child.once("error", (error) => {
    console.error(`❌ Failed to launch Chrome kiosk: ${error.message}`);
  });

  child.unref();
  return child;
}

// Local HTTP API inside Electron
const localApiServer = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (requestUrl.pathname === '/api/music' && req.method === 'GET') {
    sendJson(res, 200, { music: MUSIC_LIST.map(getMusicName) });
    return;
  }

  if (requestUrl.pathname === '/api/music/play' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const musicName = typeof body.name === "string" ? body.name.trim() : "";
      if (!musicName || !findMusicByName(musicName)) {
        sendJson(res, 400, {
          success: false,
          error: "Nama musik tidak valid",
          music: MUSIC_LIST.map(getMusicName),
        });
        return;
      }

      if (!mainWindow || mainWindow.isDestroyed() || !rendererReady) {
        sendJson(res, 503, { success: false, error: "Renderer belum siap" });
        return;
      }

      mainWindow.webContents.send("music-api-play", musicName);
      sendJson(res, 202, { success: true, name: musicName });
    } catch (error) {
      sendJson(res, 400, { success: false, error: error.message });
    }
    return;
  }

  if (requestUrl.pathname === '/api/pameran/spawn' && req.method === 'POST') {
    try {
      launchModePameranKiosk();
      sendJson(res, 202, {
        success: true,
        message: "Mode Pameran kiosk launched",
        url: "http://localhost:8090",
      });
    } catch (error) {
      sendJson(res, 500, { success: false, error: error.message });
    }
    return;
  }

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

localApiServer.listen(LOCAL_API_PORT, '0.0.0.0', () => {
  console.log(`🎧 Local API listening on http://0.0.0.0:${LOCAL_API_PORT}`);
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
