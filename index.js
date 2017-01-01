const client = new (require('./lib/client'))
const spider = new (require('./lib/spider'))(client)
const mysql = require('mysql');

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

// Start server
server.listen(8099);
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '',
  database : 'btsearch'
});


app.get('/', function(req, res)
{
	res.sendfile(__dirname + '/build/index.html');
});

app.use(express.static('build'));

io.on('connection', function(socket)
{
	socket.on('recentTorrents', function(callback)
	{
		connection.query('SELECT * FROM `torrents` ORDER BY added DESC LIMIT 0,10', function (error, rows, fields) {
		  let torrents = [];
		  rows.forEach((row) => {
		  	torrents.push({
		  		hash: row.hash,
		  		name: row.name,
				size: row.size,
				files: row.files,
				piecelength: row.piecelength,
		  	});
		  });

		  callback(torrents)
		});
	});

	socket.on('torrent', function(hash, callback)
	{
		connection.query('SELECT * FROM `torrents` WHERE `hash` = ?', hash, function (error, rows, fields) {
		  if(rows.length == 0) {
		  	callback(undefined);
		  	return;
		  }

		  callback({
		  		hash: rows[0].hash,
		  		name: rows[0].name,
				size: rows[0].size,
				files: rows[0].files,
				piecelength: rows[0].piecelength,
		  	})
		});
	});
});

connection.connect(function(err) {
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

			connection.query('DELETE FROM files WHERE hash = :hash', {hash: hash}, function (err, result) {

			})
			for(let i = 0; i < metadata.info.files.length; i++)
			{
				let file = metadata.info.files[i];
				let fileQ = {
					hash: hash,
					path: file.path,
					size: file.length,
				};
				let query = connection.query('INSERT INTO files SET ?', fileQ, function(err, result) {
				  // Neat! 
				});

				size += file.length;
			}
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
		var query = connection.query('INSERT INTO torrents SET ?', torrentQ, function(err, result) {
		  if(result) {
		  	io.sockets.emit('newTorrent', {
		  		hash: hash,
				name: metadata.info.name,
				size: size,
				files: filesCount,
				piecelength: metadata.info['piece length']
		  	});
		  }
		});
	});

	// spider.on('nodes', (nodes)=>console.log('foundNodes'))

	spider.listen(4445)
});