import { app, BrowserWindow } from "electron";

export const settingsMenuTemplate = {
  label: "Settings",
  submenu: [
    {
      label: "Main settings",
      accelerator: "CmdOrCtrl+O",
      click: () => {
        BrowserWindow.getFocusedWindow().webContents.send('url', '/config')
      }
    },
    {
      label: "Torrents filters",
      accelerator: "CmdOrCtrl+\\",
      click: () => {
        BrowserWindow.getFocusedWindow().webContents.send('url', '/filters')
      }
    }
  ]
};
