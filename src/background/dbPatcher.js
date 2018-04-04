import config from './config'
import mysql from 'mysql'
import forBigTable from './forBigTable'
import { BrowserWindow } from "electron";
import url from 'url'
import path from 'path'

module.exports = (callback, mainWindow, sphinxApp) => {
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

        patchWindow = new BrowserWindow({width: 800, height: 400, closable: false})

        patchWindow.setMenu(null)

        patchWindow.loadURL("data:text/html;charset=utf-8," + encodeURI(`
            <html>
                <head><title>Database patching...</title></head>
                <style>
                html, body {
                    height: 100%;
                }

                html {
                    display: table;
                    margin: auto;
                }

                body {
                    background: -webkit-gradient(linear, left top, left bottom, from(#fff), to(#cbccc8)) fixed;
                    display: table-cell;
                    vertical-align: middle;
                    color: #939393;
                    font-size: 1.5em; 
                    text-shadow: 1px 1px 2px #c6c6c6, 0 0 0.2em #e2e2e2;
                    overflow: hidden;
                }
                svg {
                    position: absolute;
                    width: 100%;
                    top: 0;
                    left: 0;
                    z-index: -1;
                    opacity: 0.5;
                    max-height: 120%;
                }
                #one {
                    padding: 20px;
                }
                </style>
                <script>
                    const {ipcRenderer} = require('electron')
                    ipcRenderer.on('reindex', (e, data) =>{
                        document.getElementById('one').innerHTML = \`Updating \${data.torrent ? 'torrent': 'file'} \${data.index} of \${data.all} [\${data.field} index]\`
                    })
                    ipcRenderer.on('optimize', (e, data) =>{
                        document.getElementById('one').innerHTML = \`Optimization for \${data.field}...\`
                    })
                </script>
                <body>
                    <svg fill='white' viewBox='0 0 264.725 264.725'><path d="M220.195,71.427c-0.589-7.654-9.135-15.619-17.979-16.209c-8.844-0.584-17.398,0.301-12.087,6.483
                    c5.308,6.188,7.074,12.091,4.423,11.212c-2.66-0.896-13.267-7.08-45.104-2.066c-4.126,1.17-21.221-12.682-44.513-12.977
                    c-23.283-0.295-40.381,6.346-64.85,72.296c-2.356,5.828-18.866,19.386-27.71,25.865C3.536,162.529,0.007,169.787,0,182.763
                    c-0.018,18.158,25.934,27.187,81.648,26.889c55.715-0.292,85.195-9.388,85.195-9.388c-62.789,6.773-158.907,10.52-158.907-18.687
                    c0-20.641,28.321-28.47,36.281-28.184c7.958,0.3,13.562,12.673,33.307,5.603c3.247-0.295,1.48,4.423-1.18,7.369
                    c-2.651,2.942-0.586,6.487,9.73,6.487c10.315,0,41.183,0.295,47.707,0c6.531-0.299,11.839-11.792-9.384-12.68
                    c-18.548,0.311,12.023-5.773,15.915-21.813c0.709-3.927,8.84-4.139,15.918-4.119c20.777,0.029,34.485,38.193,38.912,38.338
                    c4.416,0.15,17.979,1.621,17.683-4.273c-0.292-5.897-11.491-3.241-13.854-6.487c-2.359-3.234-10.023-15.504-7.366-21.104
                    c2.65-5.59,12.674-21.229,24.463-22.988c11.789-1.777,42.451,7.361,47.459,0c5.012-7.372-6.783-11.512-15.918-28.611
                    C243.779,80.572,238.768,71.728,220.195,71.427z"/>
                    <div id="one"></div>
                </svg>
                </body>
            </html>
        `))
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

                const torrents = (await query("SELECT COUNT(*) AS c FROM torrents"))[0].c
                const files = (await query("SELECT COUNT(*) AS c FROM files"))[0].c

                await forBigTable(sphinx, 'torrents', async (torrent) => {
                    console.log('update index', torrent.id, torrent.name, '[', i, 'of', torrents, ']')
                    if(patchWindow)
                        patchWindow.webContents.send('reindex', {field: torrent.name, index: i++, all: torrents, torrent: true})

                    torrent.nameIndex = torrent.name
                    await query(`DELETE FROM torrents WHERE id = ${torrent.id}`)
                    await insertValues('torrents', torrent)
                })
                i = 1
                await forBigTable(sphinx, 'files', async (file) => {
                    console.log('update index', file.id, file.path, '[', i, 'of', files, ']')
                    if(patchWindow)
                        patchWindow.webContents.send('reindex', {field: file.path, index: i++, all: files})

                    file.pathIndex = file.path
                    await query(`DELETE FROM files WHERE id = ${file.id}`)
                    await insertValues('files', file)
                })
                await query(`UPDATE version SET version = 2 WHERE id = 1`)
            }
            case 2:
            {
                openPatchWindow()

                console.log('optimizing torrents')
                if(patchWindow)
                    patchWindow.webContents.send('optimize', {field: 'torrents'})
                query(`OPTIMIZE INDEX torrents`)
                await sphinxApp.waitOptimized('torrents')

                console.log('optimizing files')
                if(patchWindow)
                    patchWindow.webContents.send('optimize', {field: 'files'})
                query(`OPTIMIZE INDEX files`)
                await sphinxApp.waitOptimized('files')

                await query(`UPDATE version SET version = 3 WHERE id = 1`)
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