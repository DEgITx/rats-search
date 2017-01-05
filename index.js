const client = new (require('./lib/client'))
const spider = new (require('./lib/spider'))(client)
const mysql = require('mysql');

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const torrentTypeDetect =  require('./lib/content');

const mysqlSettings = {
  host     : 'localhost',
  user     : 'btsearch',
  password : 'pirateal100x',
  database : 'btsearch'
};

// Start server
server.listen(8095);

let socketMysql = mysql.createPool({
  connectionLimit: 40,
  host     : mysqlSettings.host,
  user     : mysqlSettings.user,
  password : mysqlSettings.password,
  database : mysqlSettings.database
});

let listenerMysql;
function handleListenerDisconnect() {
	listenerMysql = mysql.createConnection(mysqlSettings);

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


app.get('/', function(req, res)
{
	res.sendfile(__dirname + '/build/index.html');
});

app.use(express.static('build'));

app.get('*', function(req, res)
{
	res.sendfile(__dirname + '/build/index.html');
});


// start

io.on('connection', function(socket)
{
	function baseRowData(row)
	{
		return {
			hash: row.hash,
	  		name: row.name,
			size: row.size,
			files: row.files,
			filesList: row.filesList,
			piecelength: row.piecelength,
			added: row.added.getTime(),
			contentType: row.contentType,
		}
	}

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

		const index = navigation.index || 0;
		const limit = navigation.limit || 10;
		let search = {};
		socketMysql.query('SELECT * FROM `torrents` WHERE MATCH(`name`) AGAINST(?) LIMIT ?,?', [text, index, limit], function (error, rows, fields) {
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

		const index = navigation.index || 0;
		const limit = navigation.limit || 10;
		let search = {};
		socketMysql.query('SELECT * FROM `files` INNER JOIN torrents ON(torrents.hash = files.hash) WHERE MATCH(`path`) AGAINST(?) LIMIT ?,?', [text, index, limit], function (error, rows, fields) {
			if(!rows) {
			  	callback(undefined)
			  	return;
			}
			rows.forEach((row) => {
		  		search[row.hash] = baseRowData(row);
		  		search[row.hash].path = row.path;
		  	});
		  	callback(Object.keys(search).map(function(key) {
			    return search[key];
			}));
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

		pushDatabaseBalance();
		listenerMysql.query('DELETE FROM files WHERE hash = ?', hash, function (err, result) {
			popDatabaseBalance();
		})
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
			pushDatabaseBalance();
			let query = listenerMysql.query('INSERT INTO files SET ?', fileQ, function(err, result) {
			  popDatabaseBalance();
			  if(!result) {
			  	console.log(fileQ);
			  	console.error(err);
			  }
			});

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
		pushDatabaseBalance();
		let query = listenerMysql.query('INSERT INTO files SET ?', fileQ, function(err, result) {
		  popDatabaseBalance();
		  if(!result) {
		  	console.log(fileQ);
		  	console.error(err);
		  }
		});
	}

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
	  	});
	  }
	  else
	  {
	  	console.log(torrentQ);
	  	console.error(err);
	  }
	});
});

// spider.on('nodes', (nodes)=>console.log('foundNodes'))

//spider.listen(4445)