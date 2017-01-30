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

        let current = 0;
        function func(index) {
            socketMysql.query("SELECT * FROM `torrents` WHERE (`contentType` = 'video' or contentType = 'pictures') and contentCategory IS NULL LIMIT ?, 30000", [index], function (error, torrents, fields) {
                    let records = torrents.length;
                    let next = index + records;
                    if(records == 0)
                        return;

                    torrents.forEach((torrent) => {
                            socketMysql.query('SELECT * FROM `files` WHERE hash = ?', torrent.hash, function (error, files, fields) {
                                    torrentTypeDetect(torrent, files);
                                    if(torrent.contentType && torrent.contentCategory == 'xxx') {
                                            socketMysql.query('UPDATE `torrents` SET `contentType` = ?, contentCategory = ? WHERE `hash` = ?', [torrent.contentType, torrent.contentCategory, torrent.hash], function (error, files, fields) {
                                                    console.log('xxx ' + torrent.name + ': ' + (++current) + '/' + torrents.length);
                                                    if(--records == 0)
                                                        func(next)
                                            });
                                    } else {
                                            console.log((++current) + '/' + torrents.length);
                                            if(--records == 0)
                                                func(next)
                                    }
                            });
                    });
            });
        }
        func(0);
});