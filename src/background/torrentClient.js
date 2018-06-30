const WebTorrent = require('webtorrent')
const fs = require('fs')

const torrentClient = new WebTorrent({webSeeds: false})
torrentClient.saveSession = (sessionFile) => {
	fs.writeFileSync(sessionFile, JSON.stringify({
		torrents: torrentClient.torrents.map(torrent => ({
			infoHash: torrent.infoHash,
			path: torrent.path,
			torrent: torrent.torrentObject,

			removeOnDone: torrent.removeOnDone,
			paused: torrent.paused || torrent._paused
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
	torrents.forEach(({torrent, infoHash, path, removeOnDone, paused}) => {
		if(!torrent || !infoHash || !path)
		{
			console.log('no info for starting download this torrent')
			return
		}
		console.log('restore download session:', torrent.name)
		const download = torrentClient._add(torrent, path)
		if(download)
		{
			console.log('restore options')
			// restore options
			download.removeOnDone = removeOnDone
			if(paused)
			{
				download._paused = true
			}
		}
	})
}
module.exports = torrentClient