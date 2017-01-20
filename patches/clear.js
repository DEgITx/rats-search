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
        socketMysql.query('SELECT * FROM `torrents` WHERE `seeders` IS NULL AND files > 1000', function (error, torrents, fields) {
                torrents.forEach(({hash, name}) => {
                        console.log(name + 'deleted');
                        socketMysql.query('DELETE FROM `files` WHERE hash = ?', hash, function (error, files, fields) {
                                if(!files)
                                    console.log(error);

                                console.log(name + ' files deleted')
                        });
                        socketMysql.query('DELETE FROM `torrents` WHERE hash = ?', hash, function (error, files, fields) {
                                if(!files)
                                    console.log(error);

                                console.log(name + ' torrent deleted')
                        });
                });
                console.log('affected torrents: ' + torrents.length);
        });
});
