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
          setTimeout(() => win.send('url', '/changelog'), 0)
        });

        const handleRedirect = (e, url) => {
          if(url != win.webContents.getURL()) {
            e.preventDefault()
            shell.openExternal(url)
          }
        }
        
        win.webContents.on('will-navigate', handleRedirect)
        win.webContents.on('new-window', handleRedirect)
      },
    },
    {
      label: "Bug Report",
      accelerator: "CmdOrCtrl+[",
      click: () => {
        shell.openExternal('https://github.com/DEgITx/rats-search/issues')
      },
    },
    {
      label: "Donate",
      accelerator: "CmdOrCtrl+*",
      click: () => {
        const win = new BrowserWindow({
          parent: BrowserWindow.getFocusedWindow(),
          modal: true,
          width: 1000
        })
        win.setMenu(null)
        win.loadURL(url.format({
          pathname: path.join(__dirname, "donate.html"),
          protocol: "file:",
          slashes: true
        }))

        const handleRedirect = (e, url) => {
          if(url != win.webContents.getURL()) {
            if(!url.includes('patreon'))
              return

            e.preventDefault()
            shell.openExternal(url)
          }
        }
        
        win.webContents.on('will-navigate', handleRedirect)
        win.webContents.on('new-window', handleRedirect)
      },
    },
    {
      label: "Help (Documentation)",
      accelerator: "CmdOrCtrl+?",
      click: () => {
        shell.openExternal('https://github.com/DEgITx/rats-search/blob/master/docs/MANUAL.md')
      },
    },
    {
      label: "Support (Discussion)",
      accelerator: "CmdOrCtrl+>",
      click: () => {
        shell.openExternal('https://discord.gg/t9GQtxA')
      },
    },
    {
      label: "About (GitHub)",
      accelerator: "CmdOrCtrl+<",
      click: () => {
        shell.openExternal('https://github.com/DEgITx/rats-search')
      },
    }
  ]
};
