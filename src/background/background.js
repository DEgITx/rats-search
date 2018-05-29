// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from "path";
import url from "url";
import os from 'os';
import { app, Menu, ipcMain, Tray, dialog } from "electron";
import createWindow from "./helpers/window";
import { autoUpdater } from 'electron-updater'

import { devMenuTemplate } from "./menu/dev_menu_template";
import { editMenuTemplateFunc } from "./menu/edit_menu_template";
import { settingsMenuTemplateFunc } from "./menu/config_menu_template";
import { aboutMenuTemplateFunc } from "./menu/about_menu_template";
import { manageMenuTemplateFunc } from "./menu/manage_menu_template";

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";
import fs from 'fs';

// plugins and dev tool
require('electron-context-menu')({})

// Save userData in separate folders for each environment.
// Thanks to this you can use production and development versions of the app
// on same machine like those are two separate apps.
if (env.name !== "production") {
  const userDataPath = app.getPath("userData");
  app.setPath("userData", `${userDataPath} (${env.name})`);
}
// portative version
let portative = false
if(env.name === "production") {
  if(fs.existsSync(path.dirname(process.execPath) + `/data`))
  {
    portative = true;
    app.setPath("userData", path.dirname(process.execPath) + `/data`);
  }
}

const resourcesPath = env.name === "production" ? process.resourcesPath : 'resources'

const appConfig = require('./config')
const spiderCall = require('./spider')
const dbPatcher = require('./dbPatcher')
const startSphinx = require('./sphinx')
const { changeLanguage } = require('../app/translation')

let mainWindow = undefined
let sphinx = undefined
let spider = undefined

const setApplicationMenu = () => {
  const settingsMenuTemplate = settingsMenuTemplateFunc(appConfig, (lang) => {
    // update menu translation
    changeLanguage(lang, () => setApplicationMenu())
  })
  const menus = [editMenuTemplateFunc(), manageMenuTemplateFunc(), settingsMenuTemplate, aboutMenuTemplateFunc()];

  if (env.name !== "production") {
    menus.push(devMenuTemplate);
  }
  // append version as disabled menu item
  menus.push({
    label: app.getVersion()
  })
  Menu.setApplicationMenu(Menu.buildFromTemplate(menus));
};

const util = require('util');
if (!fs.existsSync(app.getPath("userData"))){
  fs.mkdirSync(app.getPath("userData"));
}
const logFile = fs.createWriteStream(app.getPath("userData") + '/rats.log', {flags : 'w'});
const logStdout = process.stdout;

console.log = (...d) => {
  const date = (new Date).toLocaleTimeString()
  logFile.write(`[${date}] ` + util.format(...d) + '\n');
  logStdout.write(util.format(...d) + '\n');
};

// print os info
console.log('Rats', app.getVersion())
console.log('Platform:', os.platform())
console.log('Arch:', os.arch())
console.log('OS Release:', os.release())
console.log('CPU:', os.cpus()[0].model)
console.log('CPU Logic cores:', os.cpus().length)
console.log('Total memory:', (os.totalmem() / (1024 * 1024)).toFixed(2), 'MB')
console.log('Free memory:', (os.freemem() / (1024 * 1024)).toFixed(2), 'MB')

if(portative)
console.log('portative compability')

const shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  // Someone tried to run a second instance, we should focus our window.
  console.log('openned second application, just focus this one')
  if (mainWindow) {
    if (mainWindow.isMinimized()) 
      mainWindow.restore();
    mainWindow.focus();
  }
});

if (shouldQuit) {
  console.log('closed because of second application')
  app.exit(0);
}

// log autoupdate
const log = require('electron-log')
log.transports.file.level = false;
log.transports.console.level = false;
log.transports.console = function(msg) {
  const text = util.format.apply(util, msg.data);
  console.log(text);
};
autoUpdater.logger = log;

autoUpdater.on('update-downloaded', () => {
  console.log('update-downloaded lats quitAndInstall');
  if (env.name === "production") { 
    dialog.showMessageBox({
      type: 'info',
      title: 'Found Updates',
      message: 'Found updates, do you want update now?',
      buttons: ['Sure', 'No']
    }, (buttonIndex) => {
      if (buttonIndex === 0) {
        const isSilent = true;
        const isForceRunAfter = true; 
        autoUpdater.quitAndInstall(isSilent, isForceRunAfter); 
      }
    })
  }
})

let tray = undefined

app.on("ready", () => {
  sphinx = startSphinx(() => {
  
  mainWindow = createWindow("main", {
    width: 1000,
    height: 600
  });

  dbPatcher(() => {
    changeLanguage(appConfig.language, () => setApplicationMenu())

    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, "app.html"),
        protocol: "file:",
        slashes: true
      })
    );

    if (env.name === "development") {
      mainWindow.openDevTools();
    }

    if(process.platform === 'darwin')
      tray = new Tray(`${resourcesPath}/icons/19x19.png`)
    else
      tray = new Tray(`${resourcesPath}/icons/512x512.png`)

    tray.on('click', () => {
	  mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
	})
	mainWindow.on('show', () => {
	  tray.setHighlightMode('always')
	})
	mainWindow.on('hide', () => {
	  tray.setHighlightMode('never')
  })

  mainWindow.on('close', (event) => {
    if (!app.isQuiting && appConfig.trayOnClose && process.platform !== 'linux') {
      event.preventDefault()
      mainWindow.hide()
      return
    }
  })
  mainWindow.on('closed', () => {
    mainWindow = undefined
  })

	mainWindow.on('minimize', (event) => {
      if(appConfig.trayOnMinimize)
      {
        event.preventDefault();
        mainWindow.hide();
      }
	});

	var contextMenu = Menu.buildFromTemplate([
	    { label: 'Show', click:  function(){
	        mainWindow.show();
	    } },
	    { label: 'Quit', click:  function(){
	        app.isQuiting = true;
	        if (sphinx)
			    stop()
			else 
			    app.quit()
	    } }
	]);

	tray.setContextMenu(contextMenu)
	tray.setToolTip('Rats on The Boat search')

  mainWindow.webContents.on('will-navigate', e => { e.preventDefault() })
  mainWindow.webContents.on('new-window', (event, url, frameName) => {
    if(frameName == '_self')
    {
          event.preventDefault()
          mainWindow.loadURL(url)
    }
  })

  if (env.name === "production" && !portative) { autoUpdater.checkForUpdates() }

    spider = new spiderCall((...data) => { 
      if(mainWindow)
        mainWindow.webContents.send(...data) 
    }, (message, callback) => {
      ipcMain.on(message, (event, arg) => {
         if(Array.isArray(arg) && typeof arg[arg.length - 1] === 'object' && arg[arg.length - 1].callback)
         {
            const id = arg[arg.length - 1].callback
            arg[arg.length - 1] = (responce) => {
                mainWindow.webContents.send('callback', id, responce)
            }
         }
         callback.apply(null, arg)
      })
    }, app.getPath("userData"), app.getVersion(), env.name)
  }, mainWindow, sphinx)
  }, app.getPath("userData"), () => app.quit())
});

let stopProtect = false
const stop = () => {
  if(stopProtect)
    return
  stopProtect = true

  if(tray)
  	tray.destroy()

  if(spider)
  {
      spider.stop(() => sphinx.stop())
  }
  else
  {
      sphinx.stop()
  }
}

app.on("window-all-closed", () => {
  if (sphinx)
    stop()
  else 
    app.quit()
});

app.on('before-quit', () => {
  app.isQuiting = true
  if (sphinx)
    stop()
})