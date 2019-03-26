const shuffle = require('./shuffle')
const config = require('./config');
const net = require('net')
const JsonSocket = require('json-socket')
const os = require('os');
const isPortReachable = require('./isPortReachable')
const EventEmitter = require('events');
const _ = require('lodash')
const fs = require('fs')
const ph = require('path')
const directoryFilesRecursive = require('./directoryFilesRecursive')
const {promisify} = require('util');
const mkdirp = promisify(require('mkdirp'))
const deleteFolderRecursive = require('./deleteFolderRecursive')
const compareVersions = require('compare-versions');
const portCheck = require('./portCheck')

const findGoodPort = async (port, host) => {
	while (!(await portCheck(port, host))) {
		port++
	}
	return port
}

class p2p {
	constructor(send = () => {})
	{
		this.minClientVersion = '1.1.0'
		this.minServerVersion = '1.1.0'

		this.events = new EventEmitter
		this.peers = []
		this.clients = []
		this.ignoreAddresses = ['127.0.0.1']
		this.messageHandlers = {}
		this.externalPeers = []
		this.size = 0
		this.p2pStatus = 0
		this.version = '0'
		this.info = {}
		this.filesRequests = {}
		this.filesBlacklist = []
		if(!config.peerId)
		{
			logT('p2p', 'generate peerId')
			config.peerId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
		}
		this.peerId = config.peerId;

		this.send = send
		this.tcpServer = net.createServer();
		this.tcpServer.maxConnections = config.p2pConnections * 2;

		this.relay = {server: false, client: false}
		this.selfAddress = null;
		this.relayServers = {};
		this.relayServersLimit = 8;
		// <-> server commination for relays
		this.relaySocket = null;

		// define some help info
		Object.defineProperty(this.info, 'maxPeersConnections', { 
			enumerable: true,
			get: () => this.tcpServer.maxConnections
		});
		Object.defineProperty(this.info, 'peersConnections', { 
			enumerable: true,
			get: () => this.clients.length
		});

		this.tcpServer.on('connection', (socket) => {
			if(!config.p2p)
			{
				logT('p2p', 'ignore incoming p2p connection because of p2p disabled')
				socket.destroy()
				return
			}

			this.tcpServer.getConnections((err,con) => {
				logT('p2p', 'server connected', con, 'max', this.tcpServer.maxConnections)
			})
			socket = new JsonSocket(socket);
			this.clients.push(socket)
			socket.on('close', () => {
				this.clients.splice(this.clients.indexOf(socket), 1);
			});
			socket.on('error', (err) => {})
			socket.on('message', (message) => {    
				if(message.type && this.messageHandlers[message.type])
				{
					// responce only to rats messages
					if(message.type != 'protocol' && !socket.rats)
						return

					this.messageHandlers[message.type](message.data, (data) => {
						socket.sendMessage({
							id: message.id,
							data
						});
					}, socket, {
						version: message.version,
						info: message.info
					})
				}
			});
			socket.protocolTimeout = setTimeout(() => socket._socket.destroy(), 7000)
		})
		// check protocol
		this.on('protocol', (data, callback, socketObject) => {
			if(!data || data.protocol != 'rats')
				return

			if(compareVersions(data.version, this.minServerVersion) < 0) {
				logTE('p2p', `ignore peer because of version ${data.version} < ${this.minServerVersion}`);
				return;
			}

			for(const peer of this.clients) {
				if(peer.peerId === data.peerId) {
					// already connected from different interface
					logT('p2p', 'server peer', data.peerId, 'already connected from different address', '( check:', peer.files === data.files && peer.torrents === data.torrents, ')');
					return;
				}
			}

			// protocol ok
			clearTimeout(socketObject.protocolTimeout)
			const { _socket: socket } = socketObject
			socketObject.rats = true
			socketObject.peerId = data.peerId
			socketObject.relay = data.relay

			callback({
				protocol: 'rats',
				version: this.version,
				peerId: this.peerId,
				relay: this.relay,
				info: this.info,
				peers: this.addresses(this.recommendedPeersList())
			})

			// try to connect back
			if(socket.remoteFamily == 'IPv4')
			{
				this.add({
					address: socket.remoteAddress,
					port: data.port ? data.port : socket.remotePort
				})
			}

			// add some other peers
			if(data.peers && data.peers.length > 0)
			{
				data.peers.forEach(peer => this.add(peer))
			}
		})

		// new peer with peer exchange
		this.on('peer', (peer) => {
			logT('p2p', 'got peer exchange', peer)
			this.add(peer)
		})

		// ignore local addresses
		const ifaces = os.networkInterfaces();
		Object.keys(ifaces).forEach((ifname) => {
			let alias = 0;
			ifaces[ifname].forEach((iface) => {
				if ('IPv4' !== iface.family || iface.internal !== false) {
					return;
				}

				if (alias >= 1) {
					// nothing
				} else {
					logT('p2p', 'ignore local address', iface.address);
					this.ignore(iface.address)
				}
				++alias;
			});
		});

		this.on('file', ({path}, callback) => {
			if(!this.dataDirectory)
			{
				logTE('transfer', 'no data directory')
				return
			}

			const filePath = ph.resolve(this.dataDirectory + '/' + path)
			if(!filePath.includes(this.dataDirectory) || filePath == this.dataDirectory)
			{
				logTE('transfer', 'file get must be from data dir')
				return
			}

			if(!fs.existsSync(filePath))
			{
				logT('transfer', 'no such file or directory', filePath)
				return
			}

			for(const blackWord of this.filesBlacklist)
			{
				if(filePath.includes(blackWord))
				{
					logTE('transfer', 'file in blackwords', filePath, blackWord)
					return
				}
			}

			if(fs.lstatSync(filePath).isDirectory())
			{
				const filesList = directoryFilesRecursive(filePath).map(file => ph.relative(this.dataDirectory, file).replace(/\\/g, '/'))
				callback({filesList})
				return
			}

			let readable = new fs.ReadStream(filePath)
			logT('transfer', 'server transfer file', path)
			readable.on('data', (chunk) => {
				callback({data: chunk})
			});
			readable.on('end', () => {
				logT('transfer', 'server finish transfer file', path)
				callback(undefined)
				readable = null
			});
		})

		this.on('relay', async (nil, callback, remote) => {
			if(this.relay.server && remote.relay && remote.relay.client) {
				if(!this.relayServers[remote.peerId] && Object.keys(this.relayServers).length < this.relayServersLimit) {
					let relayPort;
					const server = net.createServer();
					this.relayServers[remote.peerId] = server;
					let relay;
					const peers = {}
					server.on('connection', (peer) => {
						logTE('relay', `new relay connection`);
						peer = new JsonSocket(peer);
						peer._id = Math.random().toString(36).substring(2, 15)
						peers[peer._id] = peer
						peer.on('message', (data) => {
							if (!relay && data && remote.peerId == data.peerId) {
								relay = peer
								logTE('relay', `reply root pear fouded`);
								if (this.selfAddress) {
									logTE('relay', `exchange relay to other peers`);
									this.emit('peer', {port: relayPort, address: this.selfAddress})
								}
								return;
							}
							if (relay) {
								if(peer === relay && data.id && peers[data.id]) {
									logTE('relay', `server message to pear ${data.id}`);
									peers[data.id].sendMessage(data.data)
								} else {
									logTE('relay', `server message to relay ${peer._id}`);
									relay.sendMessage({id: peer._id, data});
								}
							}
						});
						peer.on('close', () => {
							if(peer == relay) {
								logTE('relay', `relay client discronnected`);
								relay = null
								server.close();
								delete this.relayServers[remote.peerId]
							} else {
								logTE('relay', `relay peer discronnected`);
								relay.sendMessage({id: peer._id, close: true});
							}
							if(peer._id && peers[peer._id])
								delete peers[peer._id]
						});
					});
					relayPort = await findGoodPort(Math.floor(Math.random() * 50000) + 10000, '0.0.0.0')
					server.listen(relayPort, '0.0.0.0');
					logTE('relay', `establish new relay server on port`, relayPort);
					callback({port: relayPort})
				}
			}
		})
	}

	listen() {
		logT('p2p', 'listen p2p on', config.spiderPort, 'port')
		this.tcpServer.listen(config.spiderPort, '0.0.0.0');
	}

	checkPortAndRedirect(address, port) {
		this.selfAddress = address;
		isPortReachable(port, {host: address}).then((isAvailable) => {
			if(this.closing)
				return // responce can be very late, and can start after closing of program, this will break on linux

			if(isAvailable)
			{   
				logT('relay', 'tcp p2p port is reachable - all ok, can use as server')
				this.relay.server = true;
			}
			else
			{
				logT('relay', 'tcp p2p port is unreachable, using relay client')
				this.relay.client = true;
			}
		})
	}

	close()
	{
		this.closing = true
		// close server
		const promise = new Promise(resolve => this.tcpServer.close(resolve))
		for (const client in this.clients) {
			this.clients[client]._socket.destroy();
		}
		this.peers = []
		return promise
	}

	on(type, callback) {
		this.messageHandlers[type] = callback
	}

	add(address) {
		const { peers } = this

		if(!config.p2p)
			return

		if(this.size > config.p2pConnections)
			return;

		if(address.port <= 1 || address.port > 65535)
			return;

		// check ignore
		for(const ignoreAddress of this.ignoreAddresses)
		{
			if(typeof ignoreAddress === 'object')
			{
				if(ignoreAddress.address === address.address && ignoreAddress.port === address.port)
					return
			}
			else
			{
				if(ignoreAddress === address.address)
					return
			}
		}

		for(let peer of peers)
		{
			if(peer.address === address.address && peer.port === address.port) {
				return;
			}
		}
		this.connect(address)
	}

	recommendedPeersList()
	{
		const fullList = this.peersList()
		if(fullList.length === 0)
			return [] // no list

		let peers = shuffle(fullList).slice(0, 4) // get 4 random peers from full peers list
		// add 2 bigest peers
		peers = peers.concat( _.orderBy(fullList, peer => peer.info && peer.info.torrents, 'desc').slice(0, 2) )
		// add 2 small load peers
		peers = peers.concat( _.orderBy(fullList, 
			peer => peer.info && peer.info.maxPeersConnections && peer.info.peersConnections && (peer.info.maxPeersConnections - peer.info.peersConnections), 'desc').slice(0, 2) )

		return _.uniq(peers)
	}

	connectToRelay(relayPeer, tryes = 3)
	{
		if(this.relay.client && relayPeer.relay.server && !this.relaySocket) {
			relayPeer.emit('relay', {}, ({port}) => {
				if(!port)
					return;
				
				logT('relay', 'try connecting to new relay', relayPeer.peerId)
				let peers = {}
				this.relaySocket = new JsonSocket(new net.Socket());
				this.relaySocket.connect(port, relayPeer.address, () => {
					logT('relay', 'connected to relay', relayPeer.peerId);
					this.relaySocket.sendMessage({peerId: this.peerId})
				});
	
				this.relaySocket.on('message', (data) => {
					if(!data.id)
						return
					
					if(!peers[data.id]) {
						if(data.close)
							return
	
						peers[data.id] = new JsonSocket(new net.Socket());
						peers[data.id].on('message', (toPeer) => {
							logT('relay', 'client message to relay', data.id);
							this.relaySocket.sendMessage({id: data.id, data: toPeer})
						})
						peers[data.id].connect(config.spiderPort, '0.0.0.0', () => {
							logT('relay', 'client message to my server', data.id);
							peers[data.id].sendMessage(data.data)
						});
					} else {
						if(data.close) {
							peers[data.id].destroy();
							delete peers[data.id];
							logT('relay', 'peer disconnected');
							return
						}
	
						logT('relay', 'client message to my server', data.id);
						peers[data.id].sendMessage(data.data)
					}
				});
	
				this.relaySocket.on('close', () => {
					logT('relay', 'relay client closed because server exit');
					for(const id in peers) {
						peers[id].destroy();
					}
					peers = null
					this.relaySocket = null
					// try reconnect to new relay server
					let candidatePeer = this.peersList().filter(peer => peer.relay && peer.relay.server && peer != relayPeer)
					if(candidatePeer && candidatePeer.length > 0 && tryes > 0) {
						logT('relay', 'reconnect to new relay, because old closed');
						this.connectToRelay(candidatePeer[0], --tryes)
					}
				});	
			})
		}
	}

	connect(address)
	{
		this.peers.push(address)
		const rawSocket = new net.Socket();
		const socket = new JsonSocket(rawSocket); //Decorate a standard net.Socket with JsonSocket
		socket.on('connect', () => { //Don't send until we're connected
			const callbacks = {}
			const callbacksPermanent = {}
			socket.on('message', (message) => {
				if(message.id && callbacks[message.id])
				{
					callbacks[message.id](message.data, socket, address);
					if(!callbacksPermanent[message.id])
						delete callbacks[message.id];
				}
			});
            
			const emit = (type, data, callback, callbackPermanent) => {
				const id = Math.random().toString(36).substring(5)
				if(callback)
					callbacks[id] = callback;
				if(callback && callbackPermanent)
					callbacksPermanent[id] = true // dont delete callback on message
				socket.sendMessage({
					id,
					type,
					data
				});

				return () => delete callbacks[id];
			}

			// check protocol
			const protocolTimeout = setTimeout(() => rawSocket.destroy(), 7000)
			emit('protocol', {
				protocol: 'rats',
				port: config.spiderPort,
				version: this.version,
				peerId: this.peerId,
				relay: Object.assign(this.relay, {request: this.relay.client && !this.relaySocket}), // ask relay only when no relay usage for now
				info: this.info,
				peers: this.addresses(this.recommendedPeersList()).concat(this.externalPeers) // also add external peers
			}, (data) => {
				if(!data || data.protocol != 'rats')
					return

				// can be added to ignore list while connecting
				if(this.ignoreAddresses.includes(address.address))
					return;

				if(compareVersions(data.version, this.minClientVersion) < 0) {
					logTE('p2p', `ignore client peer because of version ${data.version} < ${this.minClientVersion}`)
					rawSocket.destroy()
					return;
				}

				for(let peer of this.peers) {
					if(peer.peerId === data.peerId) {
						// already connected from different interface
						logT('p2p', 'peer', data.peerId, 'already connected from different address', '( check:', peer.files === data.files && peer.torrents === data.torrents, ')');
						rawSocket.destroy()
						return;
					}
				}

				// success
				clearTimeout(protocolTimeout)

				// send some peers with pears exchange
				this.emit('peer', address)

				// add to peers
				address.emit = emit
				address.disconnect = () => rawSocket.destroy()
				this.size++;
				//extra info
				address.version = data.version
				address.peerId = data.peerId
				address.relay = data.relay
				address.info = data.info
				this.send('peer', {
					size: this.size,
					torrents: data.info ? data.info.torrents || 0 : 0
				})
				this.events.emit('peer', address)
				logT('p2p', 'new peer', address) 

				// add some other peers
				if(data.peers && data.peers.length > 0)
				{
					data.peers.forEach(peer => this.add(peer))
				}

				// try connect to relay if needed
				this.connectToRelay(address)
			})
		});

		socket.on('close', () => {
			const index = this.peers.indexOf(address);
			if(index >= 0)
			{
				if(this.peers[index].emit) // only autorized peers
				{
					this.size--;
					this.send('peer', {
						size: this.size,
						torrents: this.peers[index].info ? this.peers[index].info.torrents || 0 : 0
					})
					// trying reconnect once
					setTimeout(() => this.add(this.addr(address)), 5000)
				}
				this.peers.splice(index, 1);

				logT('p2p', 'close peer connection', address)
			}
		})
        
		socket.on('error', (err) => {})

		socket.connect(address.port, address.address);
	}

	emit(type, data, callback, callbackPermanent)
	{
		const callbacks = []
		for(const peer of this.peers)
		{
			if(peer.emit)
				callbacks.push(peer.emit(type, data, callback, callbackPermanent))
		}
		return () => callbacks.forEach(callback => callback())
	}

	file(path, targetPath, remotePeer, parent)
	{
		if(!this.dataDirectory)
		{
			logTE('transfer', 'no data directory')
			return
		}

		if(this.filesRequests[path])
		{
			logT('transfer', 'already downloading', path, 'return downloading request')
			return this.filesRequests[path]
		}

		logT('transfer', 'get file request', path)
		const promise = new Promise(async (resolve) =>
		{
			const realPath = (targetPath || path).replace(/\\/g, '/')
			const filePath = this.dataDirectory + '/' + realPath
			const tmpPath = this.dataDirectory + '/' + realPath.split('/').map(p => p + '.tmp').join('/')

			// create temporary directory and file for downloading
			await mkdirp(ph.dirname(tmpPath))
			let fileStream
			if(!fs.existsSync(tmpPath) || !fs.lstatSync(tmpPath).isDirectory())
				fileStream = fs.createWriteStream(tmpPath)
            
			let peer = null
			let firstTransfer = false
			let deleteCallback = (remotePeer || this).emit('file', {path}, async (chunk, nil, addr) => {
				if(peer && addr !== peer)
				{
					logT('transfer', 'ignore other peers responce', addr.peerId)
					return
				}

				if(!chunk)
				{
					logT('transfer', 'closing transfering file stream', path)
					deleteCallback()
					if(fileStream)
						fileStream.end()
					if(firstTransfer) // данные передало до этого, значит файл целый
					{
						const renameCallback = async () => {
							await mkdirp(ph.dirname(filePath))
							fs.renameSync(tmpPath, filePath)
						}
						if(parent)
						{
							resolve(renameCallback)
						}
						else
						{
							await renameCallback()
							resolve(true)
						}
					}
					return
				}

				const {data, filesList} = chunk

				if(filesList)
				{
					logT('transfer', 'get folder content', filesList)
					deleteCallback()
					const transferFiles = () => {
						Promise.all(filesList.map(file => this.file(file, null, addr, true))).then(async (files) => {
							// files transfers, now move it from tmp dir
							Promise.all(files.map((renameCallback) => renameCallback())).then(() => {
								deleteFolderRecursive(tmpPath)
								logT('transfer', 'finish transfer all files from folder')
								resolve()
							})
						})
					}
					if(fileStream)
						fileStream.end(null, null, () => {
							fs.unlinkSync(tmpPath)
							transferFiles() 
						})
					else
						transferFiles()
                    
					return
				}

				if(!fileStream)
				{
					logTE('transfer', 'error on file transfer', path, 'cant create description')
					deleteCallback()
					resolve(false)
					return
				}

				if(!data || data.type !== 'Buffer')
				{
					logTE('transfer', 'error on file transfer', path)
					deleteCallback()
					fileStream.end()
					resolve(false)
					return
				}

				// make sure no othe peer will recive data
				peer = addr
				if(!firstTransfer)
				{
					firstTransfer = true
					logT('transfer', 'got peer for tranfer, start transfering file', path, 'from peer', addr.peerId)
				}
                
				const buffer = Buffer.from(data.data)
				fileStream.write(buffer)
			}, true) // dont clear callback
		})

		this.filesRequests[path] = promise
		promise.then(() => {
			delete this.filesRequests[path]
		})

		return promise
	}

	peersList()
	{
		return this.peers.filter(peer => !!peer.emit)
	}

	addresses(peers)
	{
		if(!peers || !Array.isArray(peers))
			return
		return peers.map(peer => ({address: peer.address, port: peer.port}))
	}

	addr(peer)
	{
		return {address: peer.address, port: peer.port}
	}

	find(peer)
	{
		return this.peersList().find((localPeer) => {
			return localPeer.address === peer.address
		})
	}

	ignore(address)
	{
		this.ignoreAddresses.push(address)
		// close all connected peers (if they connected already)
		this.peers.forEach(peer => {
			if(peer.address !== address)
				return

			if(peer.disconnect)
				peer.disconnect()
		})
	}
}

module.exports = p2p