const WebTorrent = require('webtorrent')
let torrentClient = new WebTorrent({webSeeds: false})
module.exports = torrentClient