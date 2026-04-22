const {app, BrowserWindow, ipcMain, Menu, globalShortcut, webContents, dialog} = require('electron')
const  windowStateKeeper = require('electron-window-state')
const fs = require("fs");
const path = require("path");
let main_win

// creating Main Window
function createMainWindow () {
    let mainWindowState = windowStateKeeper({
        defaultHeight:800,
        defaultWidth:1000
    })

    main_win = new BrowserWindow({
         x:mainWindowState.x,
        y:mainWindowState.y,
        width:mainWindowState.width,
        height:mainWindowState.height,
        frame:false,
        resizable:true,
        webPreferences:{
            preload: require('path').join(__dirname, 'preload.js'), // bridge between renderer and main process
            nodeIntegration:false,
            contextIsolation:true,
            sandbox: false
        }
    })

    main_win.loadFile(require('path').join(__dirname, "renderer", "main.html"));
    // main_win.webContents.openDevTools({ mode: "detach" })
    mainWindowState.manage(main_win)
}

ipcMain.on("window:minimize", () => {
  if (main_win) main_win.minimize()
})

ipcMain.on("window:maximize", () => {
  if (!main_win) return

  if (main_win.isMaximized()) {
    main_win.unmaximize()
  } 
  else {
    main_win.maximize()
  }
})

ipcMain.on("window:close", () => {
  if (main_win) main_win.close()
})

ipcMain.handle("dialog:openImage", async () => {
  if (!main_win) return null;

  const { canceled, filePaths } = await dialog.showOpenDialog(main_win, {
    properties: ["openFile"],
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"]
      }
    ]
  });

  if (canceled || !filePaths || filePaths.length === 0) return null;

  const filePath = filePaths[0];
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".bmp": "image/bmp",
    ".svg": "image/svg+xml"
  };

  const mime = mimeMap[ext] || "application/octet-stream";
  const bytes = fs.readFileSync(filePath);
  return `data:${mime};base64,${bytes.toString("base64")}`;
});

// launching the application
app.whenReady().then(()=>{
    createMainWindow()
    
    Menu.setApplicationMenu(null)
});