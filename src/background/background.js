// This is main process of Electron, started as first thing when your
// app starts. It runs through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import path from "path";
import url from "url";
import os from 'os';
import { app, Menu, ipcMain, Tray, dialog, shell } from "electron";
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
const checkInternet = require('./checkInternet')
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

const colors = require('ansi-256-colors');
const stringHashCode = (str) => {
	let hash = 0, i, chr;
	if (str.length === 0) 
		return hash;
	for (i = 0; i < str.length; i++) {
		chr   = str.charCodeAt(i);
		hash  = ((hash << 5) - hash) + chr;
		hash |= 0; // Convert to 32bit integer
	}
	return hash;
};

console.log = (...d) => {
	const date = (new Date).toLocaleTimeString()
	logFile.write(`[${date}] ` + util.format(...d) + '\n');
	logStdout.write(util.format(...d) + '\n');
};

global.logT = (type, ...d) => {
	const date = (new Date).toLocaleTimeString()
	logFile.write(`[${date}] [${type}] ` + util.format(...d) + '\n');
	logStdout.write(colors.fg.codes[Math.abs(stringHashCode(type)) % 256] + `[${type}]` + colors.reset + ' ' + util.format(...d) + '\n');
}

global.logTE = (type, ...d) => {
	const date = (new Date).toLocaleTimeString()
	logFile.write(`\n[${date}] [ERROR] [${type}] ` + util.format(...d) + '\n\n');
	logStdout.write(colors.fg.codes[Math.abs(stringHashCode(type)) % 256] + `[${type}]` + colors.reset + ' ' + colors.fg.codes[9] + util.format(...d) + colors.reset + '\n');
}

// print os info
logT('system', 'Rats', app.getVersion())
logT('system', 'Platform:', os.platform())
logT('system', 'Arch:', os.arch())
logT('system', 'OS Release:', os.release())
logT('system', 'CPU:', os.cpus()[0].model)
logT('system', 'CPU Logic cores:', os.cpus().length)
logT('system', 'Total memory:', (os.totalmem() / (1024 * 1024)).toFixed(2), 'MB')
logT('system', 'Free memory:', (os.freemem() / (1024 * 1024)).toFixed(2), 'MB')
logT('system', 'NodeJS:', process.version)

if(portative)
	logT('system', 'portative compability')

// handle promise rejections
process.on('unhandledRejection', r => logTE('system', 'Rejection:', r));

const shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
	// Someone tried to run a second instance, we should focus our window.
	logT('app', 'openned second application, just focus this one')
	if (mainWindow) {
		if (mainWindow.isMinimized()) 
			mainWindow.restore();
		mainWindow.focus();
	}
});

if (shouldQuit) {
	logT('app', 'closed because of second application')
	app.exit(0);
}

// log autoupdate
const log = require('electron-log')
log.transports.file.level = false;
log.transports.console.level = false;
log.transports.console = function(msg) {
	const text = util.format.apply(util, msg.data);
	logT('updater', text);
};
autoUpdater.logger = log;

autoUpdater.on('update-downloaded', () => {
	logT('updater', 'update-downloaded lats quitAndInstall');
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

app.on("ready", async () => {
	sphinx = await startSphinx(() => {
  
		mainWindow = createWindow("main", {
			width: 1000,
			height: 600
		});

		// Need for db patcher, to close application
		if(stop)
			mainWindow.appClose = stop;

		dbPatcher(() => {
			changeLanguage(appConfig.language, () => setApplicationMenu())

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
					stop()
				} }
			]);

			tray.setContextMenu(contextMenu)
			tray.setToolTip('Rats on The Boat search')

			mainWindow.webContents.on('will-navigate', (e, url) => { 
				e.preventDefault() 
				shell.openExternal(url)
			})
			mainWindow.webContents.on('new-window', (event, url, frameName) => {
				event.preventDefault()
				if(frameName == '_self')
				{
					mainWindow.loadURL(url)
				}
			})

			if (env.name === "production") { 
				checkInternet(enabled => {
					if(!enabled)
					{
						logT('updater', 'no internet connection were founded, updater not started')
						return
					}

					if(portative)
					{
						autoUpdater.getUpdateInfo().then(info => {
							if(info.version == app.getVersion())
							{
								logT('updater', 'update not founded for version', app.getVersion())
								return
							}

							dialog.showMessageBox({
								type: 'info',
								title: 'Found Updates',
								message: 'Found updates to version ' + info.version + '. Open page to download manually?',
								buttons: ['Open', 'Dont update']
							}, (buttonIndex) => {
								if (buttonIndex === 0) {
									shell.openExternal('https://github.com/DEgITx/rats-search/releases')
								}
							})
						})
					}
					else
					{
						// full version, just download update
						autoUpdater.checkForUpdates() 
					}
				})
			}

			spider = new spiderCall((...data) => { 
				if(mainWindow)
					mainWindow.webContents.send(...data) 
			}, (message, callback) => {
				ipcMain.on(message, (event, arg) => {
					if(Array.isArray(arg) && typeof arg[arg.length - 1] === 'object' && arg[arg.length - 1].callback)
					{
						const id = arg[arg.length - 1].callback
						arg[arg.length - 1] = (responce) => {
							if(mainWindow)
								mainWindow.webContents.send('callback', id, responce)
						}
					}
					callback.apply(null, arg)
				})
			}, app.getPath("userData"), app.getVersion(), env.name)

			// load page only after init app
			spider.initialized.then(() => {
				mainWindow.loadURL(
					url.format({
						pathname: path.join(__dirname, "app.html"),
						protocol: "file:",
						slashes: true
					})
				);
			})
		}, mainWindow, sphinx)
	}, app.getPath("userData"), () => { 
		stopped = true
		app.quit() 
	})
});

let stopProtect = false
let stopped = false
const stop = () => {
	if(stopProtect)
		return
	stopProtect = true

	// hide on case of long exit, to prevent user clicks
	if(mainWindow)
		mainWindow.hide()

	// bug with mac os tray closing 
	// https://github.com/electron/electron/issues/9982
	// https://github.com/electron/electron/issues/13556
	if(process.platform !== 'darwin')
	{
		if(tray)
			tray.destroy()
	}

	if(spider)
	{
		spider.stop(() => sphinx.stop())
	}
	else if(sphinx)
	{
		sphinx.stop()
	}
	else
	{
		app.quit()
	}
}

app.on("window-all-closed", () => {
	stop()
});

app.on('before-quit', () => {
	if(rl)
		rl.close()

	app.isQuiting = true
	stop()
})

// prevent closing app on kill
app.on('will-quit', (event) => {
	if(!stopped)
		event.preventDefault()
})

var rl = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.on("SIGINT", function () {
	process.emit("SIGINT");
});

process.on("SIGINT", () => {
	stop()
});
