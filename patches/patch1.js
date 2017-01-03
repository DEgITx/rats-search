const mysql = require('mysql');
const torrentTypeDetect =  require('../lib/content');

const mysqlSettings = {
  host     : 'localhost',
  user     : 'btsearch',
  password : 'pirateal100x',
  database : 'btsearch'
};

socketMysql = mysql.createConnection(mysqlSettings);

socketMysql.connect(function(mysqlError) {
	if (mysqlError) {
		console.error('error connecting: ' + mysqlError.stack);
		return;
	}

	let inc = 0;
	socketMysql.query('SELECT * FROM `torrents` WHERE `contentType` IS NULL', function (error, torrents, fields) {
		torrents.forEach((torrent) => {
	  		socketMysql.query('SELECT * FROM `files` WHERE hash = ?', torrent.hash, function (error, files, fields) {
	  			torrentTypeDetect(torrent, files);
	  			if(torrent.contentType) {
	  				socketMysql.query('UPDATE `torrents` SET `contentType` = ? WHERE `hash` = ?', [torrent.contentType, torrent.hash], function (error, files, fields) {
	  					console.log((++inc) + '/' + torrents.length);
	  				});
	  			} else {
	  				console.log((++inc) + '/' + torrents.length);
	  			}
	  		});
	  	});
	});
});
