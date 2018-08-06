const config = require('./config');
const client = new (require('./bt/client'))
const spider = new (require('./bt/spider'))(client)
const fs = require('fs');
const parseTorrent = require('parse-torrent')
const {single, pool} = require('./mysql')
const getPeersStatisticUDP = require('./bt/udp-tracker-request')
const crypto = require('crypto')
const EventEmitter = require('events');
const P2PServer = require('./p2p')
const P2PStore = require('./store')
const stun = require('stun')
const natUpnp = require('nat-upnp');
const http = require('https')
const API = require('./api')
const Feed = require('./feed')
//var sm = require('sitemap');
//var phantomjs = require('phantomjs-prebuilt')
//const disk = require('diskusage');
const encryptor = require('simple-encryptor')('rats-on-the-boat-enc-v0');
const os = require('os');
let rootPath = os.platform() === 'win32' ? 'c:' : '/';

const _debug = require('debug')
const cleanupDebug = _debug('main:cleanup');
const balanceDebug = _debug('main:balance');
const quotaDebug = _debug('main:quota');

const checkInternet = require('./checkInternet')

const {torrentTypeDetect} = require('../app/content');

const torrentClient = require('./torrentClient')

// Start server
//server.listen(config.httpPort);
//console.log('Listening web server on', config.httpPort, 'port')

module.exports = function (send, recive, dataDirectory, version, env)
{
	this.initialized = (async () =>
	{

		let torrentsId = 1;
		let filesId = 1;

		const events = new EventEmitter
		let sphinx = pool();

		// initialize p2p
		const p2p = new P2PServer(send)
		p2p.version = version
		p2p.encryptor = encryptor
		p2p.listen()
		const p2pStore = new P2PStore(p2p, sphinx)

		const udpTrackers = [
			{
				host: 'tracker.coppersurfer.tk',
				port: 6969
			},
			{
				host: 'tracker.leechers-paradise.org',
				port: 6969
			},
			{
				host: 'tracker.opentrackr.org',
				port: 1337
			},
			{
				host: '9.rarbg.me',
				port: 2710
			}
		]

		const sphinxSingle = await single().waitConnection()
		torrentsId = (await sphinxSingle.query("SELECT MAX(`id`) as mx from torrents"))[0]
		torrentsId = ((torrentsId && torrentsId.mx) || 0) + 1
		filesId = (await sphinxSingle.query("SELECT MAX(`id`) as mx from files"))[0]
		filesId = ((filesId && filesId.mx) || 0) + 1
		p2p.info.torrents = (await sphinxSingle.query("SELECT COUNT(*) as cnt from torrents"))[0].cnt
		p2p.info.files = (await sphinxSingle.query("SELECT COUNT(*) as cnt from files"))[0].cnt
		const sphinxSingleAlternative = await single().waitConnection()
		

		// start
		function baseRowData(row)
		{
			return {
				hash: row.hash,
				name: row.name,
				size: row.size,
				files: row.files,
				filesList: row.filesList,
				piecelength: row.piecelength,
				added: row.added ? (typeof row.added === 'object' ? row.added.getTime() : row.added) : (new Date()).getTime(),
				contentType: row.contentType || row.contenttype,
				contentCategory: row.contentCategory || row.contentcategory,
				seeders: row.seeders,
				completed: row.completed,
				leechers: row.leechers,
				trackersChecked: row.trackersChecked ? row.trackersChecked.getTime() : undefined,
				good: row.good,
				bad: row.bad,
			}
		}

		// load initial peers
		if(dataDirectory && fs.existsSync(dataDirectory + '/peers.p2p'))
		{
			const peersEncrypted = fs.readFileSync(dataDirectory + '/peers.p2p', 'utf8')
			const peers = encryptor.decrypt(peersEncrypted)
			if(peers && peers.length > 0)
			{
				peers.forEach(peer => p2p.add(peer))
				console.log('loaded', peers.length, 'peers')
			}
		}

		const getServiceJson = (url) => new Promise((resolve) => {
			http.get(url, (resp) => {
				let data = '';

				resp.on('data', (chunk) => {
					data += chunk;
				});

				resp.on('end', () => {
					resolve(data.length > 0 && JSON.parse(data))
				});
			}).on("error", (err) => {
				console.log(`${url} error: ` + err.message)
				resolve(false)
			});
		})

		let p2pBootstrapLoop = null
		if(config.p2pBootstrap)
		{
			const loadBootstrapPeers = async (url) => {
				const json = await getServiceJson(url)
				if(json.bootstrap)
				{
					const peers = encryptor.decrypt(json.bootstrap)
					if(peers && peers.length > 0)
					{
						peers.forEach(peer => p2p.add(peer))
						console.log('loaded', peers.length, 'peers from bootstrap')
					}
				}
				if(json.bootstrapMap)
				{
					const peersMap = encryptor.decrypt(json.bootstrapMap)
					if(typeof peersMap === 'object')
					{
						for(const map in peersMap)
						{
							if(parseInt(map) <= 0)
								continue // break if this is not number

							const peers = peersMap[map]
							if(peers.length > 0)
							{
								peers.forEach(peer => p2p.add(peer))
							}
						}
					}
					console.log('loaded peers map from bootstrap')
				}
			}

			const loadBootstrap = () => {
				checkInternet((connected) => {
					if(!connected)
						return

					loadBootstrapPeers('https://api.myjson.com/bins/1e5rmh')
					loadBootstrapPeers('https://jsonblob.com/api/jsonBlob/013a4415-3533-11e8-8290-a901f3cf34aa')    
				})
			}

			// first bootstrap load
			loadBootstrap()
			p2pBootstrapLoop = setInterval(() => {
				if(p2p.size === 0)
				{
					console.log('load peers from bootstap again because no peers at this moment')
					loadBootstrap()
				}
			}, 90000) // try to load new peers if there is no one found
		}

		const updateTorrentTrackers = (hash) => {
			let maxSeeders = 0, maxLeechers = 0, maxCompleted = 0;
			sphinxSingle.query('UPDATE torrents SET trackersChecked = ? WHERE hash = ?', [Math.floor(Date.now() / 1000), hash], (err, result) => {
				if(!result) {
					console.error(err);
					return
				}

				udpTrackers.forEach((tracker) => {
					getPeersStatisticUDP(tracker.host, tracker.port, hash, ({seeders, completed, leechers}) => {
						if(this.closing) // ignore trackers response if app is closing
							return

						if(seeders == 0 && completed == 0 && leechers == 0)
							return;

						if(seeders < maxSeeders)
						{
							return;
						}
						if(seeders == maxSeeders && leechers < maxLeechers)
						{
							return;
						}
						if(seeders == maxSeeders && leechers == maxLeechers && completed <= maxCompleted)
						{
							return;
						}
						maxSeeders = seeders;
						maxLeechers = leechers;
						maxCompleted = completed;
						let checkTime = new Date();

						sphinxSingle.query('UPDATE torrents SET seeders = ?, completed = ?, leechers = ?, trackersChecked = ? WHERE hash = ?', [seeders, completed, leechers, Math.floor(checkTime.getTime() / 1000), hash], function(err, result) {
							if(!result) {
								console.error(err);
								return
							}

							send('trackerTorrentUpdate', {
								hash,
								seeders,
								completed,
								leechers,
								trackersChecked: checkTime.getTime()
							});
						});
					});
				});
			});
		}

		const cleanupTorrents = (cleanTorrents = 1) => {
			if(!config.cleanup)
				return;

			/*
    disk.check(rootPath, function(err, info) {
        if (err) {
            console.log(err);
        } else {
            const {available, free, total} = info;
            
            if(free < config.cleanupDiscLimit)
            {
                sphinxSingle.query(`SELECT * FROM torrents WHERE added < DATE_SUB(NOW(), INTERVAL 6 hour) ORDER BY seeders ASC, files DESC, leechers ASC, completed ASC LIMIT ${cleanTorrents}`, function(err, torrents) {
                    if(!torrents)
                        return;

                    torrents.forEach((torrent) => {
                        if(torrent.seeders > 0){
                            cleanupDebug('this torrent is ok', torrent.name);
                            return
                        }

                        cleanupDebug('cleanup torrent', torrent.name, '[seeders', torrent.seeders, ', files', torrent.files, ']', 'free', (free / (1024 * 1024)) + "mb");
                        
                        sphinxSingle.query('DELETE FROM files WHERE hash = ?', torrent.hash);
                        sphinxSingle.query('DELETE FROM torrents WHERE hash = ?', torrent.hash);
                    })
                });
            }
            else
                cleanupDebug('enough free space', (free / (1024 * 1024)) + "mb");
        }
    });
    */
		}

		const checkTorrent = (torrent) => {
			if(config.filters.maxFiles > 0 && torrent.files > config.filters.maxFiles)
			{
				console.log('ignore', torrent.name, 'because files', torrent.files, '>', config.filters.maxFiles)
				return false
			}

			const nameRX = config.filters.namingRegExp && config.filters.namingRegExp.trim()
			if(nameRX && nameRX.length > 0)
			{
				const rx = new RegExp(nameRX)
				if(!config.filters.namingRegExpNegative && !rx.test(torrent.name))
				{
					console.log('ignore', torrent.name, 'by naming rx')
					return false
				}
				else if(config.filters.namingRegExpNegative && rx.test(torrent.name))
				{
					console.log('ignore', torrent.name, 'by naming rx negative')
					return false
				}
			}

			if(torrent.contentType === 'bad')
			{
				console.log('ignore torrent', torrent.name, 'because this is a bad thing')
				return false
			}

			if(config.filters.adultFilter && torrent.contentCategory === 'xxx')
			{
				console.log('ignore torrent', torrent.name, 'because adult filter')
				return false
			}

			if(config.filters.sizeEnabled && (torrent.size < config.filters.size.min || torrent.size > config.filters.size.max))
			{
				console.log('ignore torrent', torrent.name, 'because size bounds of', torrent.size, ':', config.filters.size)
				return false
			}

			if(config.filters.contentType && Array.isArray(config.filters.contentType) && !config.filters.contentType.includes(torrent.contentType))
			{
				console.log('ignore torrent', torrent.name, 'because type', torrent.contentType, 'not in:', config.filters.contentType)
				return false
			}

			return true
		}

		const setupTorrentRecord = (torrent) => {
			// fix cases for low cases letters
			if(torrent.contentcategory)
			{
				torrent.contentCategory = torrent.contentcategory;
				delete torrent.contentcategory;
			}
			if(torrent.contenttype)
			{
				torrent.contentType = torrent.contenttype;
				delete torrent.contenttype;
			}

			// clean download info if added
			if(torrent.download)
				delete torrent.download

			// feed date clean
			if(typeof torrent.feedDate !== 'undefined')
				delete torrent.feedDate

			return torrent
		}

		const insertTorrentToDB = (torrent, silent) => new Promise(async (resolve) => {
			if(!torrent)
			{
				resolve()
				return
			}

			// duplicate object because we will do object modification
			torrent = Object.assign({}, torrent)

			// setup torrent record if it from db
			setupTorrentRecord(torrent)

			if(!checkTorrent(torrent))
			{
				resolve()
				return
			}

			const { filesList } = torrent
			delete torrent.filesList;

			if(!filesList || filesList.length == 0)
			{
				console.log('skip torrent', torrent.name, '- no filesList')
				resolve()
				return
			}

			torrent.id = torrentsId++;

			const recheckFiles = (callback) => {
				sphinxSingle.query('SELECT count(*) as files_count FROM files WHERE hash = ?', [torrent.hash], function(err, rows) {
					if(!rows)
						return
	
					const db_files = rows[0]['files_count'];
					if(db_files !== torrent.files)
					{
						callback()
					}
				})
			}

			const addFilesToDatabase = () => {
				sphinxSingle.query('DELETE FROM files WHERE hash = ?', torrent.hash, function (err, result) {
					if(err)
					{
						return;
					}

					filesList.forEach((file) => {
						file.id = filesId++;
						file.pathIndex = file.path;
					});

					sphinxSingle.insertValues('files', filesList, function(err, result) {
						if(!result) {
							console.error(err);
							return
						}
						if(!silent)
							send('filesReady', torrent.hash);
					});
				})
			}

			const singleCheck = (!!(await sphinxSingle.query("SELECT id FROM torrents WHERE hash = ?", torrent.hash))[0])

			// torrent already probably in db
			if(singleCheck)
			{
				if(config.recheckFilesOnAdding)
				{
					// recheck files and if they not ok add their to database
					recheckFiles(addFilesToDatabase)
				}
				resolve()
				return
			}
			else
			{
				addFilesToDatabase()
			}

			torrent.nameIndex = torrent.name

			sphinxSingle.insertValues('torrents', torrent, function(err, result) {
				if(result) {
					if(!silent)
						send('newTorrent', {
							hash: torrent.hash,
							name: torrent.name,
							size: torrent.size,
							files: torrent.files,
							piecelength: torrent.piecelength,
							contentType: torrent.contentType,
							contentCategory: torrent.contentCategory,
						});
					updateTorrentTrackers(torrent.hash);
				}
				else
				{
					console.log(torrent);
					console.error(err);
				}
				resolve()
				events.emit('insert', torrent)
			});
		})

		const removeTorrentFromDB = async (torrent) => {
			const {hash} = torrent
			await sphinxSingle.query('DELETE FROM torrents WHERE hash = ?', hash)
			await sphinxSingle.query('DELETE FROM files WHERE hash = ?', hash)
		}

		const updateTorrentToDB = async (torrent) => {
			if(typeof torrent !== 'object')
				return

			// duplicate object because we will do object modification
			torrent = Object.assign({}, torrent)

			// setup torrent record if it from db
			setupTorrentRecord(torrent)

			delete torrent.id
			delete torrent.filesList

			await sphinxSingle.updateValues('torrents', torrent, {hash: torrent.hash})
		}

		const insertMetadata = (metadata, infohash, rinfo) => {
			console.log('finded torrent', metadata.info.name, ' and add to database');

			const bufferToString = (buffer) => Buffer.isBuffer(buffer) ? buffer.toString() : buffer

			const hash = infohash.toString('hex');
			let size = metadata.info.length ? metadata.info.length : 0;
			let filesCount = 1;
			let filesArray = [];

			const filesAdd = (path, size) => filesArray.push({
				hash,
				path,
				size,
			})

			if(metadata.info.files && metadata.info.files.length > 0)
			{
				filesCount = metadata.info.files.length;
				size = 0;

				for(let i = 0; i < metadata.info.files.length; i++)
				{
					let file = metadata.info.files[i];
					let filePath = bufferToString(file['path.utf-8'] || file.path).join('/');
					filesAdd(filePath, file.length);
					size += file.length;
				}
			}
			else
			{
				filesAdd(bufferToString(metadata.info['name.utf-8'] || metadata.info.name), size)
			}

			const torrentQ = {
				hash: hash,
				name: bufferToString(metadata.info['name.utf-8'] || metadata.info.name),
				size: size,
				files: filesCount,
				piecelength: metadata.info['piece length'],
				ipv4: rinfo.address,
				port: rinfo.port,
				added: Math.floor(Date.now() / 1000)
			};

			torrentTypeDetect(torrentQ, filesArray);
			torrentQ.filesList = filesArray;
			insertTorrentToDB(torrentQ)
		}

		client.on('complete', function (metadata, infohash, rinfo) {

			cleanupTorrents(1); // clean old torrents before writing new

			if(config.spaceQuota && config.spaceDiskLimit > 0)
			{
				disk.check(rootPath, function(err, info) {
					if (err) {
						console.log(err);
					} else {
						const {available, free, total} = info;

						if(free >= config.spaceDiskLimit)
						{
							hideFakeTorrents(); // also enable fake torrents;
							insertMetadata(metadata, infohash, rinfo);
						}
						else
						{
							quotaDebug('ignore torrent', metadata.info.name, 'free space', (free / (1024 * 1024)) + "mb");
							showFakeTorrents(); // also enable fake torrents;
						}
					}
				});
			}
			else
			{
				insertMetadata(metadata, infohash, rinfo);
			}
		});

		
		let downloadersCallbacks = {}
		events.on('insert', (torrent) => {
			const { hash } = torrent
			const callback = downloadersCallbacks[hash]
			if(!callback)
				return

			delete downloadersCallbacks[hash]
			callback(torrent)
		})

		torrentClient._downloader = (peer, infoHash, callback) => {
			const hash = infoHash.toString('hex')
			downloadersCallbacks[hash] = callback
			setTimeout(() => delete downloadersCallbacks[hash], 8000)
			client._download(peer, infoHash)
		}

		recive('dropTorrents', (pathTorrents) => {
			console.log('drop torrents and replicate from original')
			const torrents = pathTorrents.map(path => parseTorrent(fs.readFileSync(path)))
			torrents.forEach(torrent => insertMetadata(torrent, torrent.infoHashBuffer, {address: '127.0.0.1', port: 666}))
		})

		checkInternet((connected) => {
			if(!connected)
				return

			const { STUN_BINDING_REQUEST, STUN_ATTR_XOR_MAPPED_ADDRESS } = stun.constants
			const stunServer = stun.createServer()
			const stunRequest = stun.createMessage(STUN_BINDING_REQUEST)
			stunServer.once('bindingResponse', stunMsg => {
				const {address, port} = stunMsg.getAttribute(STUN_ATTR_XOR_MAPPED_ADDRESS).value
				stunServer.close()
    
				console.log('p2p stun ignore my address', address)
				p2p.ignore(address)

				// check port avalibility
				p2p.checkPortAndRedirect(address, config.spiderPort)
			})
			stunServer.send(stunRequest, 19302, 'stun.l.google.com')    
		})

		let upnp
		if(config.upnp)
		{
			upnp = natUpnp.createClient();
			upnp.ratsMap = () => {
				upnp.portMapping({
					public: config.spiderPort,
					private: config.spiderPort,
					protocol: 'UDP',
					description: 'Rats',
					ttl: 0
				}, function(err) {
					if(err)
						console.log('upnp server dont respond')
				});
				upnp.portMapping({
					public: config.spiderPort,
					private: config.spiderPort,
					protocol: 'TCP',
					description: 'Rats',
					ttl: 0
				}, function(err) {
					if(err)
						console.log('upnp server dont respond')
				});
				upnp.portMapping({
					public: config.udpTrackersPort,
					private: config.udpTrackersPort,
					protocol: 'UDP',
					description: 'Rats',
					ttl: 0
				}, function(err) {
					if(err)
						console.log('upnp server dont respond')
				});
			}

			upnp.ratsUnmap = () => {
				upnp.portUnmapping({
					public: config.spiderPort,
					protocol: 'UDP'
				});
				upnp.portUnmapping({
					public: config.spiderPort,
					protocol: 'TCP'
				});
				upnp.portUnmapping({
					public: config.udpTrackersPort,
					protocol: 'UDP'
				});
			}

			upnp.ratsMap();

			upnp.externalIp(function(err, ip) {
				if(err)
					return

				console.log('p2p upnp ignore my address', ip)
				p2p.ignore(ip)
			});
		}

		spider.on('peer', (IPs) => {
			IPs.forEach(ip => p2p.add(ip))
		})

		// feed
		const feed = new Feed({sphinx})
		// load inside api

		// setup api
		await API({
			sphinx,
			sphinxSingle: sphinxSingleAlternative,
			recive,
			send,
			p2p,
			config,
			baseRowData,
			torrentClient,
			spider,
			upnp,
			crypto,
			insertTorrentToDB,
			removeTorrentFromDB,
			updateTorrentToDB,
			checkTorrent,
			setupTorrentRecord,
			p2pStore,
			feed
		})

		if(config.indexer) {
			spider.listen(config.spiderPort)
			if(config.p2p)
			{
				spider.announceHashes = [crypto.createHash('sha1').update('degrats-v1').digest()]
			}
		}

		if(config.cleanup && config.indexer)
		{
			cleanupDebug('cleanup enabled');
			cleanupDebug('cleanup disc limit', (config.cleanupDiscLimit / (1024 * 1024)) + 'mb');
		}

		if(config.spaceQuota)
		{
			quotaDebug('disk quota enabled');
		}

		// load torrents sessions
		console.log('restore downloading sessions')
		torrentClient.loadSession(dataDirectory + '/downloads.json')

		this.stop = async (callback) => {
			this.closing = true
			console.log('spider closing...')
			if(upnp)
				upnp.ratsUnmap()

			console.log('closing alternative db interface')
			await new Promise(resolve => sphinxSingleAlternative.end(resolve))

			// save torrents sessions
			console.log('save torrents downloads sessions')
			torrentClient.saveSession(dataDirectory + '/downloads.json')

			// save feed
			await feed.save()
    
			// stop bootstrap interval
			if(config.p2pBootstrap && p2pBootstrapLoop)
			{
				clearInterval(p2pBootstrapLoop)
				console.log('bootstrap loop stoped')
			}

			// safe future peers
			if(dataDirectory)
			{
				const addresses = p2p.addresses(p2p.peersList())
				const peersEncripted = encryptor.encrypt(addresses)
				if(addresses.length > 0)
				{
					fs.writeFileSync(dataDirectory + '/peers.p2p', peersEncripted, 'utf8');
					console.log('local peers saved')
				}

				if(config.p2pBootstrap)
				{
					const saveBootstrapPeers = (host, path) => new Promise(async (resolve) => {
						if(env === 'test')
						{
							resolve()
							return
						}

						if(addresses.length <= 0)
						{
							resolve()
							return
						}

						// check bootstrap map
						const json = await getServiceJson(`https://${host}${path}`)
						let bootstrapMap = {}
						if(json.bootstrapMap)
						{
							const bootstrapMapCandidate = encryptor.decrypt(json.bootstrapMap)
							if(typeof bootstrapMapCandidate === 'object')
								bootstrapMap = bootstrapMapCandidate
						}
						bootstrapMap[addresses.length] = addresses
            
						const options = {
							port: 443,
							host,
							method: 'PUT',
							path,
							headers: { 
								'Content-Type' : "application/json",
							}
						};
						console.log('bootstrap peers saved to', host)
						const req = http.request(options, resolve);
						req.on('error', resolve)
						req.end(JSON.stringify({
							bootstrap: peersEncripted,
							bootstrapMap: encryptor.encrypt(bootstrapMap)
						}))
					})

					await Promise.all([
						saveBootstrapPeers('api.myjson.com', '/bins/1e5rmh'),
						saveBootstrapPeers('jsonblob.com', '/api/jsonBlob/013a4415-3533-11e8-8290-a901f3cf34aa')
					])
				}
			}

			console.log('closing p2p...')
			// don't listen spider peer appears
			spider.removeAllListeners('peer')
			await p2p.close()

			// don't listen complete torrent responses
			client.removeAllListeners('complete')

			console.log('closing torrent client')
			torrentClient.destroy(() => {
				sphinx.end(() => spider.close(() => {
					sphinxSingle.destroy()
					console.log('spider closed')
					callback()
				}))
			})
		}
    
	})()
}