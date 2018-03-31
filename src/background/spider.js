const config = require('./config');
const client = new (require('./bt/client'))
const spider = new (require('./bt/spider'))(client)
const fs = require('fs');
const mysql = require('mysql');
const getPeersStatisticUDP = require('./bt/udp-tracker-request')
const crypto = require('crypto')
const P2PServer = require('./p2p')
const stun = require('stun')
const natUpnp = require('nat-upnp');
const http = require('https')
const API = require('./api')
//var express = require('express');
//var app = express();
//var server = http.Server(app);
//var io = require('socket.io')(server);
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

module.exports = function (send, recive, dataDirectory, version)
{

let torrentsId = 1;
let filesId = 1;

let sphinx = mysql.createPool({
  connectionLimit: config.sphinx.connectionLimit,
  host     : config.sphinx.host,
  port     : config.sphinx.port
});

// initialize p2p
const p2p = new P2PServer(send)
p2p.version = version
p2p.encryptor = encryptor
p2p.listen()

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

let mysqlSingle;
function handleListenerDisconnect() {
	mysqlSingle = mysql.createConnection({
	  host     : config.sphinx.host,
	  port     : config.sphinx.port
	});

	mysqlSingle.connect(function(mysqlError) {
		if (mysqlError) {
			console.error('error connecting: ' + mysqlError.stack);
			return;
		}

		mysqlSingle.query("SELECT MAX(`id`) as mx from torrents", (err, rows) => {
			if(err)
				return

			if(rows[0] && rows[0].mx >= 1)
				torrentsId = rows[0].mx + 1;
		})

		mysqlSingle.query("SELECT COUNT(*) as cnt from torrents", (err, rows) => {
			if(err)
				return

			p2p.info.torrents = rows[0].cnt
		})

		mysqlSingle.query("SELECT MAX(`id`) as mx from files", (err, rows) => {
			if(err)
				return

			if(rows[0] &&rows[0].mx >= 1)
				filesId = rows[0].mx + 1;
		})

		mysqlSingle.query("SELECT COUNT(*) as cnt from files", (err, rows) => {
			if(err)
				return

			p2p.info.files = rows[0].cnt
		})
	});

	mysqlSingle.on('error', function(err) {
	    console.log('db error', err);
	    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
	      handleListenerDisconnect();                         // lost due to either server restart, or a
	    } else {                                      // connnection idle timeout (the wait_timeout
	      throw err;                                  // server variable configures this)
	    }
	});

	const query = mysqlSingle.query;
	mysqlSingle.query = (...args) => {
		let callback, i;
		for(i = 1; i < args.length; i++)
		{
			if(typeof args[i] == 'function')
			{
				callback = args[i];
				break;
			}
		}
		if(callback)
		{
			pushDatabaseBalance();
			args[i] = (...a) => {
				popDatabaseBalance();
				callback(...a)
			}
		}
		else if(args.length <= 2)
		{
			pushDatabaseBalance();
			args.push(() => {
				popDatabaseBalance();
			});
		}
		query.apply(mysqlSingle, args)
	}

	mysqlSingle.insertValues = (table, values, callback) => {
		let names = '';
		let data = '';
		for(const val in values)
		{
			if(values[val] === null)
				continue;
			
			names += '`' + val + '`,';
			data += mysqlSingle.escape(values[val]) + ',';
		}
		names = names.slice(0, -1)
		data = data.slice(0, -1)
		let query = `INSERT INTO ${table}(${names}) VALUES(${data})`;
		if(callback)
			return mysqlSingle.query(query, (...responce) => callback(...responce))
		else
			return mysqlSingle.query(query)
	}
}
handleListenerDisconnect();

/*
app.use(express.static('build', {index: false}));

app.get('/sitemap.xml', function(req, res) {
  sphinx.query('SELECT count(*) as cnt FROM `torrents` WHERE contentCategory != \'xxx\' OR contentCategory IS NULL', function (error, rows, fields) {
	  if(!rows) {
	  	return;
	  }
	  let urls = []
	  for(let i = 0; i < Math.ceil(rows[0].cnt / config.sitemapMaxSize); i++)
	  	urls.push(`http://${config.domain}/sitemap${i+1}.xml`);

      res.header('Content-Type', 'application/xml');
      res.send( sm.buildSitemapIndex({
	      urls
	  }));
  });
});

app.get('/sitemap:id.xml', function(req, res) {
  if(req.params.id < 1)
  	return;

  let page = (req.params.id - 1) * config.sitemapMaxSize

  sphinx.query('SELECT hash FROM `torrents` WHERE contentCategory != \'xxx\' OR contentCategory IS NULL LIMIT ?, ?', [page, config.sitemapMaxSize], function (error, rows, fields) {
	  if(!rows) {
	  	return;
	  }
	  let sitemap = sm.createSitemap ({
		  hostname: 'http://' + config.domain,
		  cacheTime: 600000
	  });
	  sitemap.add({url: '/'});
	  for(let i = 0; i < rows.length; i++)
	  	sitemap.add({url: '/torrent/' + rows[i].hash});

	  sitemap.toXML( function (err, xml) {
	      if (err) {
	        return res.status(500).end();
	      }
	      res.header('Content-Type', 'application/xml');
	      res.send( xml );
	  });
  });
});


app.get('*', function(req, res)
{
	if(typeof req.query['_escaped_fragment_'] != 'undefined')
	{
		let program = phantomjs.exec('phantom.js', 'http://' + config.domain + req.path)
		let body = '';
		let timeout = setTimeout(() => {
			program.kill();
		}, 45000)
		program.stderr.pipe(process.stderr)
		program.stdout.on('data', (chunk) => {
		    body += chunk;
		});
		program.on('exit', code => {
		  clearTimeout(timeout);
		  res.header('Content-Type', 'text/html');
		  res.send( body );
		})

		return;
	}

	res.sendfile(__dirname + '/build/index.html');
});
*/

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

if(config.p2pBootstrap)
{
	http.get('https://api.myjson.com/bins/1e5rmh', (resp) => {
	let data = '';

	resp.on('data', (chunk) => {
		data += chunk;
	});

	resp.on('end', () => {
		const json = JSON.parse(data)
		if(json.bootstrap)
		{
			const peers = encryptor.decrypt(json.bootstrap)
			if(peers && peers.length > 0)
			{
				peers.forEach(peer => p2p.add(peer))
				console.log('loaded', peers.length, 'peers from bootstrap')
			}
		}
	});
	
	}).on("error", (err) => {
		console.log("Error: " + err.message);
	});
}

let undoneQueries = 0;
let pushDatabaseBalance = () => {
	undoneQueries++;
	if(undoneQueries >= 5000)
	{
		balanceDebug('start balance mysql, queries:', undoneQueries);
		spider.ignore = true;
	}
};
let popDatabaseBalance = () => {
	undoneQueries--;
	balanceDebug('balanced, queries left:', undoneQueries);
	if(undoneQueries == 0)
	{
		balanceDebug('balance done');
		spider.ignore = false;
	}
};

// обновление статистики
/*
setInterval(() => {
	let stats = {};
	sphinx.query('SELECT COUNT(*) as tornum FROM `torrents`', function (error, rows, fields) {
	  stats.torrents = rows[0].tornum;
	  sphinx.query('SELECT COUNT(*) as filesnum, SUM(`size`) as filesizes FROM `files`', function (error, rows, fields) {
	  	stats.files = rows[0].filesnum;
	  	stats.size = rows[0].filesizes;
	  	send('newStatistic', stats);
	  	sphinx.query('DELETE FROM `statistic`', function (err, result) {
	  		if(!result) {
		  	  console.error(err);
		    }
			sphinx.query('INSERT INTO `statistic` SET ?', stats, function(err, result) {
			  if(!result) {
			  	console.error(err);
			  }
			});
		})
	  });
	});
}, 10 * 60 * 1000)
*/

const updateTorrentTrackers = (hash) => {
	let maxSeeders = 0, maxLeechers = 0, maxCompleted = 0;
	mysqlSingle.query('UPDATE torrents SET trackersChecked = ? WHERE hash = ?', [Math.floor(Date.now() / 1000), hash], function(err, result) {
	  if(!result) {
  	  	console.error(err);
  	  	return
      }

	  udpTrackers.forEach((tracker) => {
	  		getPeersStatisticUDP(tracker.host, tracker.port, hash, ({seeders, completed, leechers}) => {
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

		  		mysqlSingle.query('UPDATE torrents SET seeders = ?, completed = ?, leechers = ?, trackersChecked = ? WHERE hash = ?', [seeders, completed, leechers, Math.floor(checkTime.getTime() / 1000), hash], function(err, result) {
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
				mysqlSingle.query(`SELECT * FROM torrents WHERE added < DATE_SUB(NOW(), INTERVAL 6 hour) ORDER BY seeders ASC, files DESC, leechers ASC, completed ASC LIMIT ${cleanTorrents}`, function(err, torrents) {
				  	if(!torrents)
				  		return;

				  	torrents.forEach((torrent) => {
				  		if(torrent.seeders > 0){
				  			cleanupDebug('this torrent is ok', torrent.name);
				  			return
				  		}

				  		cleanupDebug('cleanup torrent', torrent.name, '[seeders', torrent.seeders, ', files', torrent.files, ']', 'free', (free / (1024 * 1024)) + "mb");
				  		
				  		mysqlSingle.query('DELETE FROM files WHERE hash = ?', torrent.hash);
				  		mysqlSingle.query('DELETE FROM torrents WHERE hash = ?', torrent.hash);
				  	})
				});
			}
			else
				cleanupDebug('enough free space', (free / (1024 * 1024)) + "mb");
		}
	});
	*/
}

const insertTorrentToDB = (torrent) => {
	if(!torrent)
		return

	const { filesList } = torrent
	delete torrent.filesList;

	torrent.id = torrentsId++;

	mysqlSingle.query("SELECT id FROM torrents WHERE hash = ?", torrent.hash, (err, single) => {
		if(!single)
		{
			console.log(err)
			return
		}

		if(single.length > 0)
		{
			return
		}

		mysqlSingle.insertValues('torrents', torrent, function(err, result) {
			if(result) {
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
		});
	})

	let filesToAdd = filesList.length;
	mysqlSingle.query('SELECT count(*) as files_count FROM files WHERE hash = ?', [torrent.hash], function(err, rows) {
		if(!rows)
			return

		const db_files = rows[0]['files_count'];
		if(db_files !== torrent.files)
		{
			mysqlSingle.query('DELETE FROM files WHERE hash = ?', torrent.hash, function (err, result) {
				if(err)
				{
					return;
				}

				filesList.forEach((file) => {
					file.id = filesId++;
					mysqlSingle.insertValues('files', file, function(err, result) {
					  if(!result) {
					  	console.log(file);
					  	console.error(err);
					  	return
					  }
					  if(--filesToAdd === 0) {
					  	send('filesReady', torrent.hash);
					  }
					});
				});
			})
		}
	})
}

const updateTorrent = (metadata, infohash, rinfo) => {
	console.log('finded torrent', metadata.info.name, ' and add to database');

	const hash = infohash.toString('hex');
	let size = metadata.info.length ? metadata.info.length : 0;
	let filesCount = 1;
	let filesArray = [];

	const filesAdd = (path, size) => filesArray.push({
		hash,
		path,
		pathIndex: path,
		size,
	})

	if(metadata.info.files && metadata.info.files.length > 0)
	{
		filesCount = metadata.info.files.length;
		size = 0;

		for(let i = 0; i < metadata.info.files.length; i++)
		{
			let file = metadata.info.files[i];
			let filePath = file.path.join('/');
			filesAdd(filePath, file.length);
			size += file.length;
		}
	}
	else
	{
		filesAdd(metadata.info.name, size)
	}

	const torrentQ = {
		hash: hash,
		name: metadata.info.name,
		nameIndex: metadata.info.name,
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
					updateTorrent(metadata, infohash, rinfo);
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
		updateTorrent(metadata, infohash, rinfo);
	}
});

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

// setup api
API({
	sphinx,
	recive,
	send,
	p2p,
	config,
	baseRowData,
	torrentClient,
	spider,
	upnp,
	crypto,
	insertTorrentToDB
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

this.stop = (callback) => {
	console.log('spider closing...')
	if(upnp)
		upnp.ratsUnmap()

	console.log('closing p2p...')
	p2p.close()

	const close = () => {
		torrentClient.destroy(() => {
			sphinx.end(() => spider.close(() => {
				mysqlSingle.destroy()
				console.log('spider closed')
				callback()
			}))
		})
	}
	
	// safe future peers
	if(dataDirectory)
	{
		const addresses = p2p.addresses(p2p.peersList())
		const peersEncripted = encryptor.encrypt(addresses)
		fs.writeFileSync(dataDirectory + '/peers.p2p', peersEncripted, 'utf8');
		console.log('peers saved')

		if(config.p2pBootstrap && addresses.length > 5)
		{
			const options = {
				port: 443,
				host: 'api.myjson.com',
				method: 'PUT',
				path: '/bins/1e5rmh',
				headers: { 
				  'Content-Type' : "application/json",
				}
			};
			console.log('save bootstrap peers')
			const req = http.request(options, close);
			req.on('error', close)
			req.end(JSON.stringify({bootstrap: peersEncripted}))
		}
		else
		{
			close()
		}
	}
	else
	{
		close()
	}
}
return this

}