const { contextBridge, ipcRenderer } = require("electron")
const fs = require("fs")
const path = require("path")
const fontList = require('font-list');

contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close")
})

contextBridge.exposeInMainWorld("uiComponents", {
  loadHTML: (componentPath) => {
    const fullPath = path.join(__dirname, "renderer", componentPath)
    try {
      return fs.readFileSync(fullPath, "utf-8")
    } catch (error) {
      console.error(`Failed to load component: ${fullPath}`, error)
      return ""
    }
  }
})

contextBridge.exposeInMainWorld('fontAPI', {
  getSystemFonts: () => fontList.getFonts()
});

contextBridge.exposeInMainWorld("insertAPI", {
  pickImage: () => ipcRenderer.invoke("dialog:openImage")
});

contextBridge.exposeInMainWorld('fileSystem',{
  openDocument:()=>{
   return ipcRenderer.invoke('dialog:openFile')
  },
  saveDocument: (data) => {
    return ipcRenderer.invoke('dialog:saveFile', data)
  }
})
