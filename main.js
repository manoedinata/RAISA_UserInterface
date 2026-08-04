const { app, session } = require("electron");

const { registerIpcHandlers } = require("./electron/ipc");
const { createMainWindow } = require("./electron/window");

app.commandLine.appendSwitch("autoplay-policy", "no-user-gesture-required");
app.commandLine.appendSwitch("ignore-certificate-errors");
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");
app.commandLine.appendSwitch("disable-site-isolation-trials");
app.commandLine.appendSwitch("enable-gpu-rasterization");
app.commandLine.appendSwitch("enable-zero-copy");
app.commandLine.appendSwitch("force-device-scale-factor", "1");

registerIpcHandlers();

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === "media");
  });
  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission) => permission === "media",
  );

  await session.defaultSession.clearCache();
  createMainWindow();
});

app.on("window-all-closed", () => app.quit());
