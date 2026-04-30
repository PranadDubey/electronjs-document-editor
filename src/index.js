const {app, BrowserWindow, ipcMain, Menu, globalShortcut, webContents, dialog} = require('electron')
const  windowStateKeeper = require('electron-window-state')
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth")
const HTMLToDOCX = require('html-to-docx');
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

ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(main_win, {
        title: 'Open Document',
        properties: ['openFile'],
        filters: [
            { name: 'Word Documents', extensions: ['docx', 'txt'] }
        ]
    });

    if (canceled || filePaths.length === 0) {
        return null;
    }

    const filePath = filePaths[0];
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();

    try {
        let content = "";
        let isHtml = false;

        if (ext === '.docx') {
            // Use mammoth to extract HTML from the .docx file
            const result = await mammoth.convertToHtml({ path: filePath });
            content = result.value; 
            isHtml = true; // Flag to tell the frontend how to load it
        } else {
            // Handle plain .txt files
            content = fs.readFileSync(filePath, 'utf-8');
            isHtml = false;
        }

        return {
            filePath: filePath,
            fileName: fileName,
            content: content,
            isHtml: isHtml
        };
    } catch (error) {
        console.error("Error reading file:", error);
        throw error;
    }
});

ipcMain.handle('dialog:saveFile', async (event, data) => {
    let targetPath = data.filePath;

    // If no path is provided, show the Save dialog
    if (!targetPath) {
        const { canceled, filePath } = await dialog.showSaveDialog(main_win, {
            title: 'Save Document As',
            defaultPath: 'document.docx', // Default to docx now
            filters: [
                { name: 'Word Document', extensions: ['docx'] },
                { name: 'Text Document', extensions: ['txt'] },
                { name: 'HTML Document', extensions: ['html'] }
            ]
        });

        if (canceled || !filePath) {
            return null; // User cancelled the save dialog
        }
        targetPath = filePath;
    }

    // Save the file
   try {
        const ext = path.extname(targetPath).toLowerCase();

        if (ext === '.docx') {
            const htmlString = `<!DOCTYPE html><html lang="en"><body>${data.html}</body></html>`;
            const fileBuffer = await HTMLToDOCX(htmlString, null, {
                title: "Word Clone Document",
                orientation: "portrait"
            });
            fs.writeFileSync(targetPath, fileBuffer);

        } else if (ext === '.html') {
            // For HTML, save the full HTML
            const fullHtml = `<!DOCTYPE html>\n<html>\n<body>\n${data.html}\n</body>\n</html>`;
            fs.writeFileSync(targetPath, fullHtml, 'utf-8');

        } else {
            // For .txt or any other format, save the plain text!
            // This strips out all the <p style="..."> tags
            fs.writeFileSync(targetPath, data.text, 'utf-8');
        }
        
        return targetPath; 
    } catch (error) {
        console.error("Error saving file:", error);
        throw error;
    }
});
// launching the application
app.whenReady().then(()=>{
    createMainWindow()
    
    Menu.setApplicationMenu(null)
});