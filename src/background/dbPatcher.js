import config from './config'
import mysql from 'mysql'
import forBigTable from './forBigTable'
import { BrowserWindow } from "electron";
import url from 'url'
import path from 'path'

module.exports = (callback, mainWindow) => {
    const sphinx = mysql.createConnection({
        host     : config.sphinx.host,
        port     : config.sphinx.port
    });

    const query = (sql) => new Promise((resolve, reject) => {
        sphinx.query(sql, (err, res) => {
            if(err)
                reject(err)
            else
                resolve(res)
        })
    })

    const insertValues = (table, values, callback) => new Promise((resolve) => {
		let names = '';
		let data = '';
		for(const val in values)
		{
			if(values[val] === null)
				continue;
			
			names += '`' + val + '`,';
			data += sphinx.escape(values[val]) + ',';
		}
		names = names.slice(0, -1)
		data = data.slice(0, -1)
		let query = `INSERT INTO ${table}(${names}) VALUES(${data})`;
		sphinx.query(query, (...responce) => {
            if(callback)
                callback(...responce)
            resolve(...responce)
        })
    })
    
    let patchWindow;
    const openPatchWindow = () => {
        if(patchWindow)
            return

        if(mainWindow)
            mainWindow.hide()

        patchWindow = new BrowserWindow({width: 600, height: 200, closable: false})

        patchWindow.setMenu(null)
    }

    const patch = async (version) => {
        console.log('db version', version)
        switch(version)
        {
            case 1:
            {
                console.log('patch db to version 2')
                openPatchWindow()
                let i = 1

                if(patchWindow)
                {
                    patchWindow.loadURL("data:text/html;charset=utf-8," + encodeURI(`
                    <head><title>Database patching...</title></head>
                    <script>
                        const {ipcRenderer} = require('electron')
                        ipcRenderer.on('reindex', (e, data) =>{
                            document.body.innerHTML = \`Updating \${data.torrent ? 'torrent': 'file'} \${data.index} of \${data.all} [\${data.field} index]\`
                        })
                    </script>
                    <body></body>
                    `))
                }

                const torrents = (await query("SELECT COUNT(*) AS c FROM torrents"))[0].c
                const files = (await query("SELECT COUNT(*) AS c FROM files"))[0].c

                await forBigTable(sphinx, 'torrents', async (torrent) => {
                    console.log('update index', torrent.id, torrent.name)
                    if(patchWindow)
                        patchWindow.webContents.send('reindex', {field: torrent.name, index: i++, all: torrents, torrent: true})

                    torrent.nameIndex = torrent.name
                    await query(`DELETE FROM torrents WHERE id = ${torrent.id}`)
                    await insertValues('torrents', torrent)
                })
                i = 0
                await forBigTable(sphinx, 'files', async (file) => {
                    console.log('update index', file.id, file.path)
                    if(patchWindow)
                        patchWindow.webContents.send('reindex', {field: file.path, index: i++, all: files})

                    file.pathIndex = file.path
                    await query(`DELETE FROM files WHERE id = ${file.id}`)
                    await insertValues('files', file)
                })
                await query(`UPDATE version SET version = 2 WHERE id = 1`)
            }
        }
        console.log('db patch done')
        sphinx.destroy()
        if(patchWindow)
        {
            patchWindow.destroy()
            if(mainWindow)
                mainWindow.show()
        }
        callback()
    }

    sphinx.connect((mysqlError) => {
        if(mysqlError)
        {
            console.log('error on sphinx connecting on db patching', mysqlError)
            return
        }

        sphinx.query('select * from version', (err, version) => {
            if(err)
            {
                console.log('error on version get on db patch')
                return
            }

            if(!version || !version[0] || !version[0].version)
            {
                sphinx.query('insert into version(id, version) values(1, 1)', (err) => {
                    if(err)
                    {
                        console.log('cant set first version')
                        return
                    }
                    patch(1)
                })
            }
            else
            {
                patch(version[0].version)
            }
        })
    })
}