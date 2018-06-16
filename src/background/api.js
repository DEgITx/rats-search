const ipaddr = require('ipaddr.js');
const forBigTable = require('./forBigTable')
const compareVersions = require('compare-versions');
const getTorrent = require('./gettorrent')
const _ = require('lodash')

module.exports = async ({
	sphinx,
	send,
	recive,
	p2p,
	config,
	baseRowData,
	torrentClient,
	spider,
	upnp,
	crypto,
	insertTorrentToDB,
	removeTorrentFromDB,
	checkTorrent,
	p2pStore,
	feed
}) => {
	let torrentClientHashMap = {}

	let topCache = {};
	setInterval(() => {
		topCache = {};
	}, 24 * 60 * 60 * 1000);

	recive('recentTorrents', function(callback)
	{
		if(typeof callback != 'function')
			return;

		sphinx.query('SELECT * FROM `torrents` ORDER BY added DESC LIMIT 0,10', function (error, rows, fields) {
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

	recive('statistic', function(callback)
	{
		if(typeof callback != 'function')
			return;

		sphinx.query('SELECT count(*) AS torrents, sum(size) AS sz FROM `torrents`', function (error, rows, fields) {
		  if(!rows) {
		  	console.error(error)
		  	callback(undefined)
		  	return;
		  }

		  let result = {torrents: rows[0].torrents || 0, size: rows[0].sz || 0}

		  sphinx.query('SELECT count(*) AS files FROM `files`', function (error, rows, fields) {
		  	if(!rows) {
		  		console.error(error)
			  	callback(undefined)
			  	return;
			}

			result.files = rows[0].files || 0

			callback(result)
		  })
		});
	});

	const onTorrent = (hash, options, callback) => {
		if(hash.length != 40)
			return;

		if(typeof callback != 'function')
			return;

		// remote request
		if(options.peer)
		{
			console.log('remote torrent request to peer')
			const peer = p2p.find(options.peer)
			if(!peer)
			{
				callback(undefined)
				return;
			}
			delete options.peer;
			peer.emit('torrent', {hash, options}, (data, nil, address) => {
				console.log('remote torrent result', hash)
				callback(data)

				if(compareVersions(address.version, '0.19.0') < 0)
				{
					console.log('replication selected torrent now works only with 0.19.0 version, ignore this torrent')
					return
				}

				if(data)
					insertTorrentToDB(data, true) // copy torrent to our db
			})
			return;
		}

		sphinx.query('SELECT * FROM `torrents` WHERE `hash` = ?', hash, async function (error, rows, fields) {
		  if(!rows || rows.length == 0) {
		  	callback(undefined)
		  	return;
		  }
		  let torrent = rows[0];

		  if(options.files)
		  {
			torrent.filesList = await sphinx.query('SELECT * FROM `files` WHERE `hash` = ? LIMIT 50000', hash);
			callback(baseRowData(torrent))
		  }
		  else
		  {
		  	callback(baseRowData(torrent))
		  }

		  if(torrentClientHashMap[hash])
		  {
			const torrent = torrentClient.get(torrentClientHashMap[hash])
			if(torrent)
			{
				send('downloading', torrent.infoHash)
			}
		  }

		  // get votes
		  const {good, bad, selfVote} = await getVotes(hash)
		  send('votes', {
			hash, good, bad, selfVote
		  });
		});
	}

	recive('torrent', onTorrent);
	p2p.on('torrent', ({hash, options} = {}, callback) => {
		if(!hash)
			return;

		onTorrent(hash, options, (data) => callback(data))
	})

	if(config.p2pReplication)
	{
		console.log('p2p replication enabled')

		p2p.on('randomTorrents', (nil, callback) => {
			if(typeof callback != 'function')
				return;
	
			sphinx.query('SELECT * FROM `torrents` ORDER BY rand() limit 5', (error, torrents) => {
				if(!torrents || torrents.length == 0) {
					callback(undefined)
					return;
				}
	
				let hashes = {}
				for(const torrent of torrents)
				{
					delete torrent.id
					hashes[torrent.hash] = torrent
				}
	
				const inSql = Object.keys(hashes).map(hash => sphinx.escape(hash)).join(',');
				sphinx.query(`SELECT * FROM files WHERE hash IN(${inSql}) limit 50000`, (error, files) => {
					if(!files)
					{
						files = []
					}
	
					files.forEach((file) => {
						if(!hashes[file.hash].filesList)
							hashes[file.hash].filesList = []
						hashes[file.hash].filesList.push(file)
					})
					callback(Object.values(hashes))
				})
			})
		});

		const getReplicationTorrents = (nextTimeout = 5000) => {
			let gotTorrents = 0
			p2p.emit('randomTorrents', null, (torrents, nil, address) => {
				if(!torrents || torrents.length == 0)
					return

				if(compareVersions(address.version, '0.19.0') < 0)
				{
					console.log('replication now works only with 0.19.0 version, ignore this torrent')
					return
				}

				gotTorrents += torrents.length

				torrents.forEach((torrent) => {
					console.log('replicate remote torrent', torrent && torrent.name)
					insertTorrentToDB(torrent)
				})
			})

			setTimeout(() => getReplicationTorrents(gotTorrents > 8 ? gotTorrents * 600 : 10000), nextTimeout)
		}
		// start
		getReplicationTorrents()
	}

	const searchTorrentCall = function(text, navigation, callback)
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
		let args = [text, index, limit];
		const orderBy = navigation.orderBy;
		let order = '';
		let where = '';
		if(orderBy && orderBy.length > 0)
		{
			const orderDesc = navigation.orderDesc ? 'DESC' : 'ASC';
			args.splice(1, 0, orderBy);
			order = 'ORDER BY ?? ' + orderDesc;
		}
		if(safeSearch)
		{
			where += " and contentCategory != 'xxx' ";
		}
		if(navigation.type && navigation.type.length > 0)
		{
			where += ' and contentType = ' + sphinx.escape(navigation.type) + ' ';
		}
		if(navigation.size)
		{
			if(navigation.size.max > 0)
				where += ' and size < ' + sphinx.escape(navigation.size.max) + ' ';
			if(navigation.size.min > 0)
				where += ' and size > ' + sphinx.escape(navigation.size.min) + ' ';
		}
		if(navigation.files)
		{
			if(navigation.files.max > 0)
				where += ' and files < ' + sphinx.escape(navigation.files.max) + ' ';
			if(navigation.files.min > 0)
				where += ' and files > ' + sphinx.escape(navigation.files.min) + ' ';
		}

		let searchList = [];
		//args.splice(orderBy && orderBy.length > 0 ? 1 : 0, 1);
		//sphinx.query('SELECT * FROM `torrents` WHERE `name` like \'%' + text + '%\' ' + where + ' ' + order + ' LIMIT ?,?', args, function (error, rows, fields) {
		sphinx.query('SELECT * FROM `torrents` WHERE MATCH(?) ' + where + ' ' + order + ' LIMIT ?,?', args, function (error, rows, fields) {
			if(!rows) {
				console.log(error)
			  	callback(undefined)
			  	return;
			}
			rows.forEach((row) => {
				searchList.push(baseRowData(row));
		  	});
		  	callback(searchList);
		});
	}

	recive('searchTorrent', (text, navigation, callback) => {
		searchTorrentCall(text, navigation, callback)
		p2p.emit('searchTorrent', {text, navigation}, (remote, socketObject) => {
			console.log('remote search results', remote && remote.length)
			if(remote && remote.length > 0)
			{
				const { _socket: socket } = socketObject
				const peer = { address: socket.remoteAddress, port: socket.remotePort }
				remote = remote.map(torrent => Object.assign(torrent, {peer}))
			}
			send('remoteSearchTorrent', remote)
		})
	});

	p2p.on('searchTorrent', ({text, navigation} = {}, callback) => {
		if(!text)
			return;

		searchTorrentCall(text, navigation, (data) => callback(data))
	})

	const searchFilesCall = function(text, navigation, callback)
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
		let args = [text, index, limit];
		const orderBy = navigation.orderBy;
		let order = '';
		let where = '';

		/*
		if(orderBy && orderBy.length > 0)
		{
			const orderDesc = navigation.orderDesc ? 'DESC' : 'ASC';
			args.splice(1, 0, orderBy);
			order = 'ORDER BY ?? ' + orderDesc;
		}
		*/
		/*
		if(safeSearch)
		{
			where += " and contentCategory != 'xxx' ";
		}
		if(navigation.type && navigation.type.length > 0)
		{
			where += ' and contentType = ' + sphinx.escape(navigation.type) + ' ';
		}
		if(navigation.size)
		{
			if(navigation.size.max > 0)
				where += ' and torrentSize < ' + sphinx.escape(navigation.size.max) + ' ';
			if(navigation.size.min > 0)
				where += ' and torrentSize > ' + sphinx.escape(navigation.size.min) + ' ';
		}
		if(navigation.files)
		{
			if(navigation.files.max > 0)
				where += ' and files < ' + sphinx.escape(navigation.files.max) + ' ';
			if(navigation.files.min > 0)
				where += ' and files > ' + sphinx.escape(navigation.files.min) + ' ';
		}
		*/

		let search = {};
		//args.splice(orderBy && orderBy.length > 0 ? 1 : 0, 1);
		//sphinx.query('SELECT * FROM `files` inner join torrents on(torrents.hash = files.hash) WHERE files.path like \'%' + text + '%\' ' + where + ' ' + order + ' LIMIT ?,?', args, function (error, rows, fields) {
		sphinx.query('SELECT * FROM `files` WHERE MATCH(?) ' + where + ' ' + order + ' LIMIT ?,?', args, function (error, files, fields) {
			if(!files) {
				console.log(error)
			  	callback(undefined)
			  	return;
			}
			if(files.length === 0)
			{
				callback(undefined)
				return;
			}
			for(const file of files)
			{
				if(!search[file.hash])
				{
					search[file.hash] = { path: [] }
				}
				search[file.hash].path.push(file.path)
			}
			const inSql = Object.keys(search).map(hash => sphinx.escape(hash)).join(',');
			sphinx.query(`SELECT * FROM torrents WHERE hash IN(${inSql})`, (err, torrents) => {
				if(!torrents) {
					console.log(err)
					return;
				}

				for(const torrent of torrents)
				{
					search[torrent.hash] = Object.assign(baseRowData(torrent), search[torrent.hash])
					
					// temporary ignore adult content in search (workaroud)
					if(safeSearch && search[torrent.hash].contentCategory == 'xxx')
						delete search[torrent.hash]
				}

				let searchResult = Object.values(search)

				if(orderBy && orderBy.length > 0 && searchResult.length > 0)
				{
					searchResult = _.orderBy(searchResult, [orderBy], [navigation.orderDesc ? 'desc' : 'asc'])
				}

				callback(searchResult);
			})
		});
	}

	recive('searchFiles', (text, navigation, callback) => {
		searchFilesCall(text, navigation, callback)
		p2p.emit('searchFiles', {text, navigation}, (remote, socketObject) => {
			console.log('remote search files results', remote && remote.length)
			if(remote && remote.length > 0)
			{
				const { _socket: socket } = socketObject
				const peer = { address: socket.remoteAddress, port: socket.remotePort }
				remote = remote.map(torrent => Object.assign(torrent, {peer}))
			}
			send('remoteSearchFiles', remote)
		})
	});

	p2p.on('searchFiles', ({text, navigation} = {}, callback) => {
		if(!text)
			return;

		searchFilesCall(text, navigation, (data) => callback(data))
	})

	recive('checkTrackers', function(hash)
	{
		if(hash.length != 40)
			return;

		updateTorrentTrackers(hash);
	});

	const topTorrentsCall = (type, navigation = {}, callback) => {
		let where = '';

		const index = parseInt(navigation.index) || 0;
		const limit = parseInt(navigation.limit) || 20;
		const time = navigation.time

		if(type && type.length > 0)
		{
			where += ' and contentType = ' + sphinx.escape(type) + ' ';
		}

		if(time)
		{
			if(time == 'hours')
			{
				where += ' and `added` > ' + (Math.floor(Date.now() / 1000) - (60 * 60 * 24))
			}
			else if(time == 'week')
			{
				where += ' and `added` > ' + (Math.floor(Date.now() / 1000) - (60 * 60 * 24 * 7))
			}
			else if(time == 'month')
			{
				where += ' and `added` > ' + (Math.floor(Date.now() / 1000) - (60 * 60 * 24 * 30))
			}
		}
		
		const query = `SELECT * FROM torrents WHERE seeders > 0 and contentCategory != 'xxx' ${where} ORDER BY seeders DESC LIMIT ${index},${limit}`;
		if(topCache[query])
		{
			callback(topCache[query]);
			return;
		}
		sphinx.query(query, function (error, rows) {
			if(!rows || rows.length == 0) {
				callback(undefined)
				return;
			}
			
			rows = rows.map((row) => baseRowData(row));
			topCache[query] = rows;
		  	callback(rows);
		});
	}

	recive('topTorrents', (type, navigation, callback) =>
	{
		topTorrentsCall(type, navigation, callback)
		p2p.emit('topTorrents', {type, navigation}, (remote, socketObject) => {
			console.log('remote top results', remote && remote.length)
			if(remote && remote.length > 0)
			{
				const { _socket: socket } = socketObject
				const peer = { address: socket.remoteAddress, port: socket.remotePort }
				remote = remote.map(torrent => Object.assign(torrent, {peer}))
			}
			send('remoteTopTorrents', {torrents: remote, type, time: navigation && navigation.time})
		})
	});

	p2p.on('topTorrents', ({type, navigation} = {}, callback) => {
		topTorrentsCall(type, navigation, (data) => callback(data))
	})

	recive('peers', (callback) =>
	{
		if(typeof callback != 'function')
			return;

		callback({
			size: p2p.size,
			torrents: p2p.peersList().reduce((prev, peer) => prev + (peer.info ? peer.info.torrents || 0 : 0), 0)
		})
	});

	recive('p2pStatus', (callback) =>
	{
		if(typeof callback != 'function')
			return;

		callback(p2p.p2pStatus)
	});

	recive('config', (callback) =>
	{
		if(typeof callback != 'function')
			return;

		callback(config)
	});

	recive('setConfig', (options, callback) =>
	{
		if(typeof options !== 'object')
			return;

		if(typeof options.indexer !== 'undefined')
		{
			const upSpider = () => {
				if(options.indexer)
					spider.listen(config.spiderPort)
				else
					spider.close()
			}

			if(options.spiderPort !== config.spiderPort)
				spider.close(upSpider)
			else
				upSpider()
		}

		if(upnp)
			upnp.ratsUnmap()

		for(const option in options)
		{
			if(option in config)
				config[option] = options[option]
		}

		if(upnp)
			upnp.ratsMap()

		if(config.p2p)
		{
			spider.announceHashes = [crypto.createHash('sha1').update('degrats-v1').digest()]
		}
		else
		{
			spider.announceHashes = []
		}
		
		if(typeof callback === 'function')
			callback(true)
	});

	recive('download', (torrentObject) =>
	{
		const magnet = `magnet:?xt=urn:btih:${torrentObject.hash}`
		console.log('download', magnet)
		if(torrentClient.get(magnet)) {
			console.log('aready added')
			return
		}

		torrentClient.add(magnet, {path: config.client.downloadPath}, (torrent) =>{
			torrentClientHashMap[torrent.infoHash] = magnet
			torrent.torrentObject = torrentObject
			console.log('start downloading', torrent.infoHash)
			send('downloading', torrent.infoHash)

			torrent.on('done', () => { 
				console.log('download done', torrent.infoHash)
				delete torrentClientHashMap[torrent.infoHash]
				send('downloadDone', torrent.infoHash)
			})

			let now = Date.now()
			torrent.on('download', (bytes) => {
				if(Date.now() - now < 100)
					return
				now = Date.now()

				send('downloadProgress', torrent.infoHash, {
					received: bytes,
					downloaded: torrent.downloaded,
					speed: torrent.downloadSpeed,
					progress: torrent.progress
				})
			})
		})
	});

	recive('downloadCancel', (hash, callback) =>
	{
		const id = torrentClientHashMap[hash]
		if(!id)
		{
			if(callback)
				callback(false)
			return
		}

		torrentClient.remove(id, (err) => {
			if(err)
			{
				if(callback)
					callback(false)
				return
			}

			delete torrentClientHashMap[hash]
			send('downloadDone', hash, true)

			if(callback)
				callback(true)
		})
	})

	recive('downloads', (callback) =>
	{
		callback(torrentClient.torrents.map(torrent => ({
			torrentObject: torrent.torrentObject,
			received: torrent.received,
			downloaded: torrent.downloaded,
			progress: torrent.progress,
			speed: torrent.downloadSpeed
		})))
	})

	recive('removeTorrents', (checkOnly = true, callback) =>
	{
		console.log('checktorrents call')

		const toRemove = []

		const done = () => {
			console.log('torrents to remove founded', toRemove.length)
			if(checkOnly)
			{
				callback(toRemove.length)
				return
			}

			toRemove.forEach(torrent => removeTorrentFromDB(torrent))
			callback(toRemove.length)
			console.log('removed torrents by filter:', toRemove.length)
		}

		forBigTable(sphinx, 'torrents', (torrent) => {
			if(!checkTorrent(torrent))
				toRemove.push(torrent)
		}, done)
	})

	const getVotes = async (hash) => {
		const votes = await p2pStore.find(`vote:${hash}`)
		let good = 0
		let bad = 0
		let selfVote = false
		if(votes)
		{
			votes.forEach(({vote, _peerId}) => {
				if(_peerId === p2p.peerId)
					selfVote = true

				if(vote == 'bad')
					bad++
				else
					good++
			})
		}

		return {good, bad, selfVote}
	}

	p2pStore.on('store', (value) => {
		if(!value.temp)
			return

		if(!value.temp.torrent)
			return

		if(value.myself)
			return

		console.log('replicate torrent from store record', value.temp.torrent.hash)
		insertTorrentToDB(value.temp.torrent)
	})

	recive('vote', async (hash, isGood, callback) =>
	{
		if(hash.length != 40)
			return;

		if(typeof callback != 'function')
			return;

		isGood = !!isGood;

		const action = isGood ? 'good' : 'bad';
		let {good, bad, selfVote} = await getVotes(hash)

		if(!selfVote)
		{
			setTimeout(async () => p2pStore.store({
				type: 'vote',
				torrentHash: hash,
				vote: action,
				_index: `vote:${hash}`,
				_temp: {
					torrent: await getTorrent(sphinx, hash)
				}
			}), 0)
			good += isGood ? 1 : 0
			bad += !isGood ? 1 : 0
		}

		send('votes', {
			hash, good, bad
		});
		callback(true)

	});

	// store torrent to feed
	await feed.load()
	p2pStore.on('store', async ({data: record, temp}) => {
		if(!temp || !temp.torrent)
			return
	
		const { torrent } = temp

		if(record.type !== 'vote')
			return

		if(record.vote !== 'good')
			return
		
		if(!torrent)
			return

		if(torrent.hash !== record.torrentHash)
			return

		let {good, bad} = await getVotes(torrent.hash)
		torrent.good = good
		torrent.bad = bad

		feed.add(torrent)

		send('feedUpdate', {
			feed: feed.feed
		});
	})

	recive('feed', (callback) =>
	{
		callback(feed.feed)
	});
}