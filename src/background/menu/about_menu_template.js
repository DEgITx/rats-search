import { app, BrowserWindow, shell } from "electron";
import path from "path";
import url from "url";

export const aboutMenuTemplate = {
  label: "About",
  submenu: [
    {
      label: "Changelog",
      accelerator: "CmdOrCtrl+]",
      click: () => {
        const win = new BrowserWindow({
          parent: BrowserWindow.getFocusedWindow(),
          modal: true
        })
        win.setMenu(null)
        win.loadURL(url.format({
          pathname: path.join(__dirname, "app.html"),
          protocol: "file:",
          slashes: true
        }))
        win.webContents.on('did-finish-load', () => {
          win.send('url', '/changelog')
        });

        const handleRedirect = (e, url) => {
          if(url != win.webContents.getURL()) {
            e.preventDefault()
            shell.openExternal(url)
          }
        }
        
        win.webContents.on('will-navigate', handleRedirect)
        win.webContents.on('new-window', handleRedirect)
      }
    }
  ]
};
