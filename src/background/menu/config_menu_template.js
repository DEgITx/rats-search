import { app, BrowserWindow } from "electron";

export const settingsMenuTemplate = {
  label: "Settings",
  submenu: [
    {
      label: "Main settings",
      accelerator: "CmdOrCtrl+O",
      click: () => {
        console.log(BrowserWindow.getFocusedWindow().webContents.send('url', '/config'))
      }
    }
  ]
};
