const client = new (require('./lib/client'))
const spider = new (require('./lib/spider'))(client)
const mysql = require('mysql');

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const mysqlSettings = {
  host     : 'localhost',
  user     : 'root',
  password : 'degitisi',
  database : 'btsearch'
};

// Start server
server.listen(8095);
let listenerMysql = mysql.createConnection(mysqlSettings);
let socketMysql = mysql.createConnection(mysqlSettings);


app.get('/', function(req, res)
{
	res.sendfile(__dirname + '/build/index.html');
});

app.use(express.static('build'));

socketMysql.connect(function(mysqlError) {
	if (mysqlError) {
		console.error('error connecting: ' + mysqlError.stack);
		return;
	}

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
			}
		}

		socket.on('recentTorrents', function(callback)
		{
			socketMysql.query('SELECT * FROM `torrents` ORDER BY added DESC LIMIT 0,10', function (error, rows, fields) {
			  let torrents = [];
			  rows.forEach((row) => {
			  	torrents.push(baseRowData(row));
			  });

			  callback(torrents)
			});
		});

		socket.on('torrent', function(hash, options, callback)
		{
			socketMysql.query('SELECT * FROM `torrents` WHERE `hash` = ?', hash, function (error, rows, fields) {
			  if(rows.length == 0) {
			  	callback(undefined);
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

		socket.on('search', function(text, callback)
		{
			let search = {};

			console.log(text);
			let q = 2;
			socketMysql.query('SELECT * FROM `torrents` WHERE MATCH(`name`) AGAINST(?)', text, function (error, rows, fields) {
				rows.forEach((row) => {
			  		search[row.hash] = baseRowData(row);
			  	});
			  	if(--q == 0)
			  		callback(Object.keys(search).map(function(key) {
					    return search[key];
					}));
			});
			socketMysql.query('SELECT * FROM `files` INNER JOIN torrents ON(torrents.hash = files.hash) WHERE MATCH(`path`) AGAINST(?)', text, function (error, rows, fields) {
				rows.forEach((row) => {
			  		search[row.hash] = baseRowData(row);
			  		search[row.hash].path = row.path;
			  	});
			  	if(--q == 0)
			  		callback(Object.keys(search).map(function(key) {
					    return search[key];
					}));
			});
		});
	});

});

listenerMysql.connect(function(err) {
	if (err) {
		console.error('error connecting: ' + err.stack);
		return;
	}
 
	//spider.on('ensureHash', (hash, addr)=> {
	//	console.log('new hash');
	//})

	client.on('complete', function (metadata, infohash, rinfo) {
		console.log('writing torrent to db');
		const hash = infohash.toString('hex');
		let size = metadata.info.length ? metadata.info.length : 0;
		let filesCount = 1;
		if(metadata.info.files && metadata.info.files.length > 0)
		{
			filesCount = metadata.info.files.length;
			size = 0;

			listenerMysql.query('DELETE FROM files WHERE hash = ?', hash, function (err, result) {

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
				let query = listenerMysql.query('INSERT INTO files SET ?', fileQ, function(err, result) {
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
			let query = listenerMysql.query('INSERT INTO files SET ?', fileQ, function(err, result) {
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
		var query = listenerMysql.query('INSERT INTO torrents SET ? ON DUPLICATE KEY UPDATE hash=hash', torrentQ, function(err, result) {
		  if(result) {
		  	io.sockets.emit('newTorrent', {
		  		hash: hash,
				name: metadata.info.name,
				size: size,
				files: filesCount,
				piecelength: metadata.info['piece length']
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
});