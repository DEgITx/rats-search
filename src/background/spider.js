const config = require('./config');
const client = new (require('./bt/client'))
const spider = new (require('./bt/spider'))(client)
const mysql = require('mysql');
const getPeersStatisticUDP = require('./bt/udp-tracker-request')

//var express = require('express');
//var app = express();
//var server = require('http').Server(app);
//var io = require('socket.io')(server);
//var sm = require('sitemap');
//var phantomjs = require('phantomjs-prebuilt')
var ipaddr = require('ipaddr.js');
//const disk = require('diskusage');
const os = require('os');
let rootPath = os.platform() === 'win32' ? 'c:' : '/';

const _debug = require('debug')
const cleanupDebug = _debug('main:cleanup');
const balanceDebug = _debug('main:balance');
const fakeTorrentsDebug = _debug('main:fakeTorrents');
const quotaDebug = _debug('main:quota');

const {torrentTypeDetect} = require('../app/content');

const torrentClient = require('./torrentClient')
let torrentClientHashMap = {}

// Start server
//server.listen(config.httpPort);
//console.log('Listening web server on', config.httpPort, 'port')

module.exports = function (send, recive)
{

let torrentsId = 1;
let filesId = 1;

let sphinx = mysql.createPool({
  connectionLimit: config.sphinx.connectionLimit,
  host     : config.sphinx.host,
  port     : config.sphinx.port
});

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

		mysqlSingle.query("SELECT MAX(`id`) as mx from files", (err, rows) => {
			if(err)
				return

			if(rows[0] &&rows[0].mx >= 1)
				filesId = rows[0].mx + 1;
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

let topCache = {};
setInterval(() => {
	topCache = {};
}, 24 * 60 * 60 * 1000);


//io.on('connection', function(socket)
//{
	recive('recentTorrents', function(callback)
	{
		if(typeof callback != 'function')
			return;

		sphinx.query('SELECT * FROM `torrents` ORDER BY added DESC LIMIT 0,10', function (error, rows, fields) {
		  if(!rows) {
		  	callback(undefined)
		  	return;
		  }

		  let torrents = [];
		  rows.forEach((row) => {
		  	torrents.push(baseRowData(row));
		  });

		  callback(torrents)
		});
	});

	recive('statistic', function(callback)
	{
		if(typeof callback != 'function')
			return;

		sphinx.query('SELECT count(*) AS torrents, sum(size) AS sz FROM `torrents`', function (error, rows, fields) {
		  if(!rows) {
		  	console.error(error)
		  	callback(undefined)
		  	return;
		  }

		  let result = {torrents: rows[0].torrents || 0, size: rows[0].sz || 0}

		  sphinx.query('SELECT count(*) AS files FROM `files`', function (error, rows, fields) {
		  	if(!rows) {
		  		console.error(error)
			  	callback(undefined)
			  	return;
			}

			result.files = rows[0].files || 0

			callback(result)
		  })
		});
	});

	recive('torrent', function(hash, options, callback)
	{
		if(hash.length != 40)
			return;

		if(typeof callback != 'function')
			return;

		sphinx.query('SELECT * FROM `torrents` WHERE `hash` = ?', hash, function (error, rows, fields) {
		  if(!rows || rows.length == 0) {
		  	callback(undefined)
		  	return;
		  }
		  let torrent = rows[0];

		  if(options.files)
		  {
			  sphinx.query('SELECT * FROM `files` WHERE `hash` = ?', hash, function (error, rows, fields) {
				  torrent.filesList = rows;
				  callback(baseRowData(torrent))
			  });
		  }
		  else
		  {
		  	  callback(baseRowData(torrent))
		  }

		  if(torrentClientHashMap[hash])
		  {
			const torrent = torrentClient.get(torrentClientHashMap[hash])
			if(!torrent)
				return

			send('downloading', torrent.infoHash)
		  }
		});
	});

	recive('searchTorrent', function(text, navigation, callback)
	{
		if(typeof callback != 'function')
			return;

		if(!text || text.length <= 2) {
			callback(undefined);
			return;
		}

		const safeSearch = !!navigation.safeSearch;

		const index = navigation.index || 0;
		const limit = navigation.limit || 10;
		let args = [text, index, limit];
		const orderBy = navigation.orderBy;
		let order = '';
		let where = '';
		if(orderBy && orderBy.length > 0)
		{
			const orderDesc = navigation.orderDesc ? 'DESC' : 'ASC';
			args.splice(1, 0, orderBy);
			order = 'ORDER BY ?? ' + orderDesc;
		}
		if(safeSearch)
		{
			where += " and contentCategory != 'xxx' ";
		}
		if(navigation.type && navigation.type.length > 0)
		{
			where += ' and contentType = ' + sphinx.escape(navigation.type) + ' ';
		}
		if(navigation.size)
		{
			if(navigation.size.max > 0)
				where += ' and size < ' + sphinx.escape(navigation.size.max) + ' ';
			if(navigation.size.min > 0)
				where += ' and size > ' + sphinx.escape(navigation.size.min) + ' ';
		}
		if(navigation.files)
		{
			if(navigation.files.max > 0)
				where += ' and files < ' + sphinx.escape(navigation.files.max) + ' ';
			if(navigation.files.min > 0)
				where += ' and files > ' + sphinx.escape(navigation.files.min) + ' ';
		}
		console.log(navigation, where)

		let searchList = [];
		//args.splice(orderBy && orderBy.length > 0 ? 1 : 0, 1);
		//sphinx.query('SELECT * FROM `torrents` WHERE `name` like \'%' + text + '%\' ' + where + ' ' + order + ' LIMIT ?,?', args, function (error, rows, fields) {
		sphinx.query('SELECT * FROM `torrents` WHERE MATCH(?) ' + where + ' ' + order + ' LIMIT ?,?', args, function (error, rows, fields) {
			if(!rows) {
				console.log(error)
			  	callback(undefined)
			  	return;
			}
			rows.forEach((row) => {
				searchList.push(baseRowData(row));
		  	});
		  	callback(searchList);
		});
	});

	recive('searchFiles', function(text, navigation, callback)
	{
		if(typeof callback != 'function')
			return;

		if(!text || text.length <= 2) {
			callback(undefined);
			return;
		}

		const safeSearch = !!navigation.safeSearch;

		const index = navigation.index || 0;
		const limit = navigation.limit || 10;
		let args = [text, index, limit];
		const orderBy = navigation.orderBy;
		let order = '';
		let where = '';

		if(orderBy && orderBy.length > 0)
		{
			const orderDesc = navigation.orderDesc ? 'DESC' : 'ASC';
			args.splice(1, 0, orderBy);
			order = 'ORDER BY ?? ' + orderDesc;
		}
		/*
		if(safeSearch)
		{
			where += " and contentCategory != 'xxx' ";
		}
		if(navigation.type && navigation.type.length > 0)
		{
			where += ' and contentType = ' + sphinx.escape(navigation.type) + ' ';
		}
		if(navigation.size)
		{
			if(navigation.size.max > 0)
				where += ' and torrentSize < ' + sphinx.escape(navigation.size.max) + ' ';
			if(navigation.size.min > 0)
				where += ' and torrentSize > ' + sphinx.escape(navigation.size.min) + ' ';
		}
		if(navigation.files)
		{
			if(navigation.files.max > 0)
				where += ' and files < ' + sphinx.escape(navigation.files.max) + ' ';
			if(navigation.files.min > 0)
				where += ' and files > ' + sphinx.escape(navigation.files.min) + ' ';
		}
		*/

		let search = {};
		//args.splice(orderBy && orderBy.length > 0 ? 1 : 0, 1);
		//sphinx.query('SELECT * FROM `files` inner join torrents on(torrents.hash = files.hash) WHERE files.path like \'%' + text + '%\' ' + where + ' ' + order + ' LIMIT ?,?', args, function (error, rows, fields) {
		sphinx.query('SELECT * FROM `files` WHERE MATCH(?) ' + where + ' ' + order + ' LIMIT ?,?', args, function (error, files, fields) {
			if(!files) {
				console.log(error)
			  	callback(undefined)
			  	return;
			}
			if(files.length === 0)
			{
				callback(undefined)
				return;
			}
			for(const file of files)
			{
				if(!search[file.hash])
				{
					search[file.hash] = { path: [] }
				}
				search[file.hash].path.push(file.path)
			}
			const inSql = Object.keys(search).map(hash => sphinx.escape(hash)).join(',');
			sphinx.query(`SELECT * FROM torrents WHERE hash IN(${inSql})`, (err, torrents) => {
				if(!torrents) {
					console.log(err)
					return;
				}

				for(const torrent of torrents)
				{
					search[torrent.hash] = Object.assign(torrent, search[torrent.hash])
				}

				callback(Object.values(search));
			})
		});
	});

	recive('checkTrackers', function(hash)
	{
		if(hash.length != 40)
			return;

		updateTorrentTrackers(hash);
	});

	recive('topTorrents', function(type, callback)
	{
		let where = '';
		let max = 20;
		if(type && type.length > 0)
		{
			where += ' and contentType = ' + sphinx.escape(type) + ' ';
			max = 15;

			if(type == 'hours')
			{
				where = ' and `added` > ' + Math.floor(Date.now() / 1000) - (60 * 60 * 24)
			}
			if(type == 'week')
			{
				where = ' and `added` > ' + Math.floor(Date.now() / 1000) - (60 * 60 * 24 * 7)
			}
			if(type == 'month')
			{
				where = ' and `added` > ' + Math.floor(Date.now() / 1000) - (60 * 60 * 24 * 30)
			}
		}

		const query = `SELECT * FROM torrents WHERE seeders > 0 and contentCategory != 'xxx' ${where} ORDER BY seeders DESC LIMIT ${max}`;
		if(topCache[query])
		{
			callback(topCache[query]);
			return;
		}
		sphinx.query(query, function (error, rows) {
			if(!rows || rows.length == 0) {
				callback(undefined)
				return;
			}
			
			rows = rows.map((row) => {
				return baseRowData(row);
			});
			topCache[query] = rows;
		  	callback(rows);
		});
	});

	recive('config', (callback) =>
	{
		if(typeof callback != 'function')
			return;

		callback(config)
	});

	recive('setConfig', (options, callback) =>
	{
		if(typeof options !== 'object')
			return;

		if(typeof options.indexer !== 'undefined')
		{
			const upSpider = () => {
				if(options.indexer)
					spider.listen(config.spiderPort)
				else
					spider.close()
			}

			if(options.spiderPort !== config.spiderPort)
				spider.close(upSpider)
			else
				upSpider()
		}

		for(const option in options)
		{
			if(option in config)
				config[option] = options[option]
		}
		
		if(typeof callback === 'function')
			callback(true)
	});

	recive('download', (magnet) =>
	{
		console.log('download', magnet)
		if(torrentClient.get(magnet))
			return

		torrentClient.add(magnet, {path: config.client.downloadPath}, (torrent) =>{
			torrentClientHashMap[torrent.infoHash] = magnet
			send('downloading', torrent.infoHash)

			torrent.on('done', () => { 
				console.log('download done', torrent.infoHash)
				delete torrentClientHashMap[torrent.infoHash]
				send('downloadDone', torrent.infoHash)
			})

			let now = Date.now()
			torrent.on('download', (bytes) => {
				if(Date.now() - now < 100)
					return
				now = Date.now()

				send('downloadProgress', torrent.infoHash, {
					bytes,
					downloaded: torrent.downloaded,
					speed: torrent.downloadSpeed,
					progress: torrent.progress
				})
			})
		})
	});

	recive('downloadCancel', (hash, callback) =>
	{
		const id = torrentClientHashMap[hash]
		if(!id)
		{
			callback(false)
			return
		}

		client.remove(id, (err) => {
			if(err)
			{
				callback(false)
				return
			}

			delete torrentClientHashMap[hash]
			if(callback)
				callback(true)
		})
	})

	let socketIPV4 = () => {
		let ip = socket.request.connection.remoteAddress;
		if (ipaddr.IPv4.isValid(ip)) {
		  // all ok
		} else if (ipaddr.IPv6.isValid(ip)) {
		  let ipv6 = ipaddr.IPv6.parse(ip);
		  if (ipv6.isIPv4MappedAddress()) {
		    ip = ipv6.toIPv4Address().toString();
		  }
		}
		return ip
	};

	recive('vote', function(hash, isGood, callback)
	{
		if(hash.length != 40)
			return;

		if(typeof callback != 'function')
			return;

		const ip = socketIPV4();
		isGood = !!isGood;

		sphinx.query('SELECT * FROM `torrents_actions` WHERE `hash` = ? AND (`action` = \'good\' OR `action` = \'bad\') AND ipv4 = ?', [hash, ip], function (error, rows, fields) {
		  if(!rows) {
		  	console.error(error);
		  }
		  if(rows.length > 0) {
		  	callback(false)
		  	return
		  }

		  sphinx.query('SELECT good, bad FROM `torrents` WHERE `hash` = ?', hash, function (error, rows, fields) {
		  	if(!rows || rows.length == 0)
		  		return;

		  	let {good, bad} = rows[0];
		  	const action = isGood ? 'good' : 'bad';
			sphinx.query('INSERT INTO `torrents_actions` SET ?', {hash, action, ipv4: ip}, function(err, result) {
				  if(!result) {
				  	console.error(err);
				  }
				  sphinx.query('UPDATE torrents SET ' + action + ' = ' + action + ' + 1 WHERE hash = ?', hash, function(err, result) {
				  	if(!result) {
					  console.error(err);
					}
					if(isGood) {
						good++;
					} else {
						bad++;
					}
					send('vote', {
				  		hash, good, bad
				  	});
				  	callback(true)
				  });
			});
		  });
		});
	});
//});


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

const updateTorrent = (metadata, infohash, rinfo) => {
	console.log('writing torrent', metadata.info.name, 'to database');

	const hash = infohash.toString('hex');
	let size = metadata.info.length ? metadata.info.length : 0;
	let filesCount = 1;
	let filesArray = [];

	const filesAdd = (path, size) => filesArray.push({
		id: filesId++,
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

	let filesToAdd = filesArray.length;
	mysqlSingle.query('SELECT count(*) as files_count FROM files WHERE hash = ?', [hash], function(err, rows) {
		if(!rows)
			return

		const db_files = rows[0]['files_count'];
		if(db_files !== filesCount)
		{
			mysqlSingle.query('DELETE FROM files WHERE hash = ?', hash, function (err, result) {
				if(err)
				{
					return;
				}

				filesArray.forEach((file) => {
					mysqlSingle.insertValues('files', file, function(err, result) {
					  if(!result) {
					  	console.log(file);
					  	console.error(err);
					  	return
					  }
					  if(--filesToAdd === 0) {
					  	send('filesReady', hash);
					  }
					});
				});
			})
		}
	})

	var torrentQ = {
		id: torrentsId++,
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

	mysqlSingle.query("SELECT id FROM torrents WHERE hash = ?", hash, (err, single) => {
		if(!single)
		{
			console.log(err)
			return
		}

		if(single.length > 0)
		{
			return
		}

		mysqlSingle.insertValues('torrents', torrentQ, function(err, result) {
			if(result) {
				send('newTorrent', {
					hash: hash,
				name: metadata.info.name,
				size: size,
				files: filesCount,
				piecelength: metadata.info['piece length'],
				contentType: torrentQ.contentType,
				contentCategory: torrentQ.contentCategory,
				});
				updateTorrentTrackers(hash);
			}
			else
			{
				console.log(torrentQ);
				console.error(err);
			}
		});
	})
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

// spider.on('nodes', (nodes)=>console.log('foundNodes'))

let fakeTorrents = [];
function showFakeTorrentsPage(page)
{
	mysqlSingle.query('SELECT * FROM torrents LIMIT ?, 100', [page], function(err, torrents) {
		if(!torrents)
			return;

		torrents.forEach((torrent, index) => {
			const fk = fakeTorrents.push(setTimeout(() => {
				delete fakeTorrents[fk-1];
				send('newTorrent', baseRowData(torrent));
				updateTorrentTrackers(torrent.hash);
				fakeTorrentsDebug('fake torrent', torrents.name, 'index, page:', index, page);
			}, 700 * index))
		})

		const fk = fakeTorrents.push(setTimeout(()=>{ 
			delete fakeTorrents[fk-1];
			showFakeTorrentsPage(torrents.length > 0 ? page + torrents.length : 0)
		}, 700 * torrents.length))
	});
}

function showFakeTorrents()
{
	fakeTorrentsDebug('showing fake torrents');
	hideFakeTorrents()
	showFakeTorrentsPage(0);
}

function hideFakeTorrents()
{
	fakeTorrents.forEach((fk) => {
		clearTimeout(fk)
	})
	fakeTorrents = []
	fakeTorrentsDebug('hidding fake torrents');
}

if(config.indexer) {
	spider.listen(config.spiderPort)
} else {
//	showFakeTorrents();
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
	console.log('closing spider')
	torrentClient.destroy(() => {
		sphinx.end(() => spider.close(() => {
			mysqlSingle.destroy()
			callback()
		}))
	})
}
return this

}