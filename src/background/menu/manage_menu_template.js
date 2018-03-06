import { app, BrowserWindow, shell } from "electron";
import path from "path";
import url from "url";

export const manageMenuTemplate = {
  label: "Manage",
  submenu: [
    {
      label: "Downloads",
      accelerator: "CmdOrCtrl+d",
      click: () => {
        BrowserWindow.getFocusedWindow().webContents.send('url', '/downloads')
      },
    },
    {
      label: "Search",
      accelerator: "CmdOrCtrl+n",
      click: () => {
        BrowserWindow.getFocusedWindow().webContents.send('url', '/')
      },
    }
  ]
};
