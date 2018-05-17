import { app, BrowserWindow } from "electron";
import fs from 'fs'
import path from 'path'
import __ from '../../app/translation'

export const settingsMenuTemplateFunc = (config, onLanguageChange) => ({
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
    },
    {
      label: __("Language"),
      submenu: (() => {
        const translations = []
        fs.readdirSync('translations').forEach(translation => {
          const translationJson = JSON.parse(fs.readFileSync(`translations/${translation}`, 'utf8'))
          const lang = path.basename(translation, '.json')
          translations.push({
            label: translationJson.nameOriginal,
            type: 'checkbox',
            checked: config.language === lang,
            click: () => {
              BrowserWindow.getFocusedWindow().webContents.send('changeLanguage', lang)
              config.language = lang
              if(onLanguageChange)
                onLanguageChange(lang)
              console.log('changed translation to:', lang)
            }
          })
        })
        return translations
      })()
    }
  ]
});
