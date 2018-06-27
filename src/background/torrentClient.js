const WebTorrent = require('webtorrent')
const fs = require('fs')

const torrentClient = new WebTorrent({webSeeds: false})
torrentClient.saveSession = (sessionFile) => {
	fs.writeFileSync(sessionFile, JSON.stringify({
        torrents: torrentClient.torrents.map(torrent => ({
            infoHash: torrent.infoHash,
            path: torrent.path,
            torrent: torrent.torrentObject
        }))
    }, null, 4), 'utf8');
}
torrentClient.loadSession = (sessionFile) => {
    if(!fs.existsSync(sessionFile))
	{
        console.log('no download sessions - ignore')
        return
    }

	const data = fs.readFileSync(sessionFile, 'utf8')
    const obj = JSON.parse(data);
    if(!obj.torrents)
    {
        console.log('no torrents list for loading session')
        return
    }
    if(!torrentClient._add)
    {
        console.log('no overriden _add() method')
        return
    }
    const {torrents} = obj
    torrents.forEach(({torrent, infoHash, path}) => {
        if(!torrent || !infoHash || !path)
        {
            console.log('no info for starting download this torrent')
            return
        }
        console.log('restore download session:', torrent.name)
        torrentClient._add(torrent, path)
    })
}
module.exports = torrentClient