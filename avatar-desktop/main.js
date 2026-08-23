// Electron main process: wraps the avatar frontend (frontend-avatar/) in a
// small, movable, resizable, always-on-top window. Independently launchable
// from the backend — this process has no knowledge of the ISL pipeline at
// all, it only points a BrowserWindow at the frontend's URL.
//
// Native Windows always-on-top via BrowserWindow's `alwaysOnTop` option —
// NOT faked with CSS (the master prompt is explicit about this).
//
// Default target is the Vite dev server (`npm run dev` in frontend-avatar/
// must be running first) — set ISL_AVATAR_URL to point at a production
// build instead, e.g. a `file://.../frontend-avatar/dist/index.html` URL.
const { app, BrowserWindow } = require("electron");

const TARGET_URL = process.env.ISL_AVATAR_URL || "http://localhost:5174/";

function createWindow() {
  const win = new BrowserWindow({
    width: 340,
    height: 520,
    minWidth: 240,
    minHeight: 340,
    alwaysOnTop: true,
    resizable: true,
    movable: true,
    frame: true, // reliable native move/resize/close over a fragile custom-drag transparent frame
    title: "ISL Avatar",
    backgroundColor: "#0f1115",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, "screen-saver"); // stays above fullscreen video players too
  win.loadURL(TARGET_URL).catch((err) => {
    console.error(`Failed to load ${TARGET_URL} — is the avatar frontend dev server running?`, err);
  });

  return win;
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
