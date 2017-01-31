const config = require('./config');
const client = new (require('./lib/client'))
const spider = new (require('./lib/spider'))(client)
const mysql = require('mysql');
const getPeersStatisticUDP = require('./lib/udp-tracker-request')

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var sm = require('sitemap');
var phantomjs = require('phantomjs-prebuilt')
var ipaddr = require('ipaddr.js');

const torrentTypeDetect =  require('./lib/content');

// Start server
server.listen(config.httpPort);

let socketMysql = mysql.createPool({
  connectionLimit: config.mysql.connectionLimit,
  host     : config.mysql.host,
  user     : config.mysql.user,
  password : config.mysql.password,
  database : config.mysql.database
});

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

let listenerMysql;
function handleListenerDisconnect() {
	listenerMysql = mysql.createConnection({
	  host     : config.mysql.host,
	  user     : config.mysql.user,
	  password : config.mysql.password,
	  database : config.mysql.database
	});

	listenerMysql.connect(function(mysqlError) {
		if (mysqlError) {
			console.error('error connecting: ' + mysqlError.stack);
			return;
		}
	});

	listenerMysql.on('error', function(err) {
	    console.log('db error', err);
	    if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
	      handleListenerDisconnect();                         // lost due to either server restart, or a
	    } else {                                      // connnection idle timeout (the wait_timeout
	      throw err;                                  // server variable configures this)
	    }
	});
}
handleListenerDisconnect();


app.use(express.static('build', {index: false}));

app.get('/sitemap.xml', function(req, res) {
  socketMysql.query('SELECT count(*) as cnt FROM `torrents` WHERE contentCategory != \'xxx\' OR contentCategory IS NULL', function (error, rows, fields) {
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

  socketMysql.query('SELECT hash FROM `torrents` WHERE contentCategory != \'xxx\' OR contentCategory IS NULL LIMIT ?, ?', [page, config.sitemapMaxSize], function (error, rows, fields) {
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
		program.stderr.pipe(process.stderr)
		program.stdout.on('data', (chunk) => {
		    body += chunk;
		});
		program.on('exit', code => {
		  res.header('Content-Type', 'text/html');
		  res.send( body );
		})

		return;
	}

	res.sendfile(__dirname + '/build/index.html');
});

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
		added: row.added ? row.added.getTime() : (new Date()).getTime(),
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

io.on('connection', function(socket)
{
	socket.on('recentTorrents', function(callback)
	{
		if(typeof callback != 'function')
			return;

		socketMysql.query('SELECT * FROM `torrents` ORDER BY added DESC LIMIT 0,10', function (error, rows, fields) {
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

	socket.on('statistic', function(callback)
	{
		if(typeof callback != 'function')
			return;

		socketMysql.query('SELECT * FROM `statistic`', function (error, rows, fields) {
		  if(!rows) {
		  	callback(undefined)
		  	return;
		  }

		  callback(rows[0])
		});
	});

	socket.on('torrent', function(hash, options, callback)
	{
		if(hash.length != 40)
			return;

		if(typeof callback != 'function')
			return;

		socketMysql.query('SELECT * FROM `torrents` WHERE `hash` = ?', hash, function (error, rows, fields) {
		  if(!rows || rows.length == 0) {
		  	callback(undefined)
		  	return;
		  }
		  let torrent = rows[0];

		  if(options.files)
		  {
			  socketMysql.query('SELECT * FROM `files` WHERE `hash` = ?', hash, function (error, rows, fields) {
				  torrent.filesList = rows;
				  callback(baseRowData(torrent))
			  });
		  }
		  else
		  {
		  	  callback(baseRowData(torrent))
		  }
		});
	});

	socket.on('searchTorrent', function(text, navigation, callback)
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
		let search = {};
		//socketMysql.query('SELECT * FROM `torrents` WHERE `name` like \'%' + text + '%\' LIMIT ?,?', [index, limit], function (error, rows, fields) {
		sphinx.query('SELECT * FROM `torrents_index`,`torrents_index_delta` WHERE MATCH(?) ' + (safeSearch ? "and contentcategory != 'xxx'" : '') + ' LIMIT ?,?', [text, index, limit], function (error, rows, fields) {
			if(!rows) {
			  	callback(undefined)
			  	return;
			}
			rows.forEach((row) => {
		  		search[row.hash] = baseRowData(row);
		  	});
		  	callback(Object.keys(search).map(function(key) {
			    return search[key];
			}));
		});
	});

	socket.on('searchFiles', function(text, navigation, callback)
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
		let search = {};
		//socketMysql.query('SELECT * FROM `files` inner join torrents on(torrents.hash = files.hash) WHERE files.path like \'%' + text + '%\' LIMIT ?,?', [index, limit], function (error, rows, fields) {
		sphinx.query('SELECT * FROM `files_index`,`files_index_delta` WHERE MATCH(?) ' + (safeSearch ? "and contentcategory != 'xxx'" : '') + ' LIMIT ?,?', [text, index, limit], function (error, rows, fields) {
			if(!rows) {
			  	callback(undefined)
			  	return;
			}
			rows.forEach((row) => {
				if(!(row.hash in search))
		  			search[row.hash] = baseRowData(row);
		  		if(!search[row.hash].path)
		  			search[row.hash].path = []
		  		search[row.hash].path.push(row.path);
		  	});
		  	callback(Object.keys(search).map(function(key) {
			    return search[key];
			}));
		});
	});

	socket.on('checkTrackers', function(hash)
	{
		if(hash.length != 40)
			return;

		updateTorrentTrackers(hash);
	});

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

	socket.on('vote', function(hash, isGood, callback)
	{
		if(hash.length != 40)
			return;

		if(typeof callback != 'function')
			return;

		const ip = socketIPV4();
		isGood = !!isGood;

		socketMysql.query('SELECT * FROM `torrents_actions` WHERE `hash` = ? AND (`action` = \'good\' OR `action` = \'bad\') AND ipv4 = ?', [hash, ip], function (error, rows, fields) {
		  if(!rows) {
		  	console.error(error);
		  }
		  if(rows.length > 0) {
		  	callback(false)
		  	return
		  }

		  socketMysql.query('SELECT good, bad FROM `torrents` WHERE `hash` = ?', hash, function (error, rows, fields) {
		  	if(!rows || rows.length == 0)
		  		return;

		  	let {good, bad} = rows[0];
		  	const action = isGood ? 'good' : 'bad';
			socketMysql.query('INSERT INTO `torrents_actions` SET ?', {hash, action, ipv4: ip}, function(err, result) {
				  if(!result) {
				  	console.error(err);
				  }
				  socketMysql.query('UPDATE torrents SET ' + action + ' = ' + action + ' + 1 WHERE hash = ?', hash, function(err, result) {
				  	if(!result) {
					  console.error(err);
					}
					if(isGood) {
						good++;
					} else {
						bad++;
					}
					io.sockets.emit('vote', {
				  		hash, good, bad
				  	});
				  	callback(true)
				  });
			});
		  });
		});
	});
});

let undoneQueries = 0;
let pushDatabaseBalance = () => {
	undoneQueries++;
	if(undoneQueries >= 5000)
	{
		console.log('too much freeze mysql connection. doing balance');
		spider.ignore = true;
	}
};
let popDatabaseBalance = () => {
	undoneQueries--;
	if(undoneQueries == 0)
	{
		spider.ignore = false;
	}
};

// обновление статистики
setInterval(() => {
	let stats = {};
	pushDatabaseBalance();
	listenerMysql.query('SELECT COUNT(*) as tornum FROM `torrents`', function (error, rows, fields) {
	  popDatabaseBalance();
	  stats.torrents = rows[0].tornum;
	  pushDatabaseBalance();
	  listenerMysql.query('SELECT COUNT(*) as filesnum, SUM(`size`) as filesizes FROM `files`', function (error, rows, fields) {
	  	popDatabaseBalance();
	  	stats.files = rows[0].filesnum;
	  	stats.size = rows[0].filesizes;
	  	io.sockets.emit('newStatistic', stats);
	  	pushDatabaseBalance();
	  	listenerMysql.query('DELETE FROM `statistic`', function (err, result) {
	  		popDatabaseBalance();
	  		if(!result) {
		  	  console.error(err);
		    }
		    pushDatabaseBalance();
			listenerMysql.query('INSERT INTO `statistic` SET ?', stats, function(err, result) {
			  popDatabaseBalance();
			  if(!result) {
			  	console.error(err);
			  }
			});
		})
	  });
	});
}, 10 * 60 * 1000)

const updateTorrentTrackers = (hash) => {
	let maxSeeders = 0, maxLeechers = 0, maxCompleted = 0;
	pushDatabaseBalance();
	listenerMysql.query('UPDATE torrents SET trackersChecked = ? WHERE hash = ?', [new Date(), hash], function(err, result) {
	  popDatabaseBalance();
	  if(!result) {
  	  	console.error(err);
      }

	  udpTrackers.forEach((tracker) => {
	  		getPeersStatisticUDP(tracker.host, tracker.port, hash, ({seeders, completed, leechers}) => {
		  		if(seeders == 0 && completed == 0 && leechers == 0)
		  			return;

		  		/*
		  		pushDatabaseBalance();
		  		listenerMysql.query('INSERT INTO trackers SET ?', statistic, function(err, result) {
		  			popDatabaseBalance();
		  		});
		  		*/

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

		  		pushDatabaseBalance();
		  		listenerMysql.query('UPDATE torrents SET seeders = ?, completed = ?, leechers = ?, trackersChecked = ? WHERE hash = ?', [seeders, completed, leechers, checkTime, hash], function(err, result) {
		  			popDatabaseBalance();
		  			if(!result) {
		  				return
		  			}

		  			io.sockets.emit('trackerTorrentUpdate', {
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

client.on('complete', function (metadata, infohash, rinfo) {
	console.log('writing torrent to db');
	const hash = infohash.toString('hex');
	let size = metadata.info.length ? metadata.info.length : 0;
	let filesCount = 1;
	let filesArray = [];
	if(metadata.info.files && metadata.info.files.length > 0)
	{
		filesCount = metadata.info.files.length;
		size = 0;

		for(let i = 0; i < metadata.info.files.length; i++)
		{
			let file = metadata.info.files[i];
			let filePath = file.path.join('/');
			let fileQ = {
				hash: hash,
				path: filePath,
				size: file.length,
			};
			filesArray.push(fileQ);
			size += file.length;
		}
	}
	else
	{
		let fileQ = {
			hash: hash,
			path: metadata.info.name,
			size: size,
		};
		filesArray.push(fileQ);
	}

	let filesToAdd = filesArray.length;
	listenerMysql.query('SELECT count(*) as files_count FROM files WHERE hash = ?', [hash], function(err, rows) {
		const db_files = rows[0]['files_count'];
		if(db_files !== filesCount)
		{
			pushDatabaseBalance();
			listenerMysql.query('DELETE FROM files WHERE hash = ?', hash, function (err, result) {
				popDatabaseBalance();

				filesArray.forEach((file) => {
					pushDatabaseBalance();
					listenerMysql.query('INSERT INTO files SET ?', file, function(err, result) {
					  popDatabaseBalance();
					  if(!result) {
					  	console.log(file);
					  	console.error(err);
					  }
					  if(--filesToAdd === 0) {
					  	io.sockets.emit('filesReady', hash);
					  }
					});
				});
			})
		}
	})

	var torrentQ = {
		hash: hash,
		name: metadata.info.name,
		size: size,
		files: filesCount,
		piecelength: metadata.info['piece length'],
		ipv4: rinfo.address,
		port: rinfo.port
	};

	torrentTypeDetect(torrentQ, filesArray);

	pushDatabaseBalance();
	var query = listenerMysql.query('INSERT INTO torrents SET ? ON DUPLICATE KEY UPDATE hash=hash', torrentQ, function(err, result) {
	  popDatabaseBalance();
	  if(result) {
	  	io.sockets.emit('newTorrent', {
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
});

// spider.on('nodes', (nodes)=>console.log('foundNodes'))

if(config.indexer) {
	spider.listen(config.spiderPort)
} else {
	function showFakeTorrents(page)
	{
		listenerMysql.query('SELECT * FROM torrents LIMIT ?, 100', [page], function(err, torrents) {
			console.log(page)
			if(!torrents)
				return;

			torrents.forEach((torrent, index) => {
				setTimeout(() => {
					io.sockets.emit('newTorrent', baseRowData(torrent));
					updateTorrentTrackers(torrent.hash);
				}, 700 * index)
			})

			setTimeout(()=>showFakeTorrents(torrents.length > 0 ? page + torrents.length : 0), 700 * torrents.length);
		});
	}
	showFakeTorrents(0);
}