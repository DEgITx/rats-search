const ssh = require('./ssh')
const shuffle = require('./shuffle')
const config = require('./config');
const net = require('net')
const JsonSocket = require('json-socket')
const os = require('os');
const isPortReachable = require('./isPortReachable')
const EventEmitter = require('events');
const _ = require('lodash')

class p2p {
	constructor(send = () => {})
	{
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
		if(!config.peerId)
		{
			logT('p2p', 'generate peerId')
			config.peerId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
		}
		this.peerId = config.peerId;

		this.send = send
		this.tcpServer = net.createServer();
		this.tcpServer.maxConnections = config.p2pConnections * 2;

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

			// protocol ok
			clearTimeout(socketObject.protocolTimeout)
			const { _socket: socket } = socketObject
			socketObject.rats = true

			callback({
				protocol: 'rats',
				version: this.version,
				peerId: this.peerId,
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
	}

	listen() {
		logT('p2p', 'listen p2p on', config.spiderPort, 'port')
		this.tcpServer.listen(config.spiderPort, '0.0.0.0');
	}

	checkPortAndRedirect(address, port) {
		isPortReachable(port, {host: address}).then((isAvailable) => {
			if(this.closing)
				return // responce can be very late, and ssh can start after closing of program, this will break on linux

			this.p2pStatus = isAvailable ? 2 : 0
			this.send('p2pStatus', this.p2pStatus)

			// all ok don't need to start any ssh tunnels
			if(isAvailable)
			{   
				logT('ssh', 'tcp p2p port is reachable - all ok')
				return;
			}
			else
			{
				logT('ssh', 'tcp p2p port is unreachable - try ssh tunnel')
			}

			if(!this.encryptor)
			{
				logT('ssh', 'something wrong with encryptor')
				return
			}

			let remoteHost = '03de848286b8fbe6e775e6601c3bcfb9b71dfddcacb861b061458ce5e4020a15a649aabef88234d2af01ead4276a6de1YlqiJBlXCmoA7TpnbRuSRHNDsIBLlZ9McbovKJXHtAA='

			this.ssh = ssh(config.spiderPort, this.encryptor.decrypt(remoteHost), 'relay', 'relaymytrf', (selfPeer) => {
				if(!selfPeer)
				{
					this.p2pStatus = 0
					this.send('p2pStatus', this.p2pStatus)
					this.externalPeers = []
					return
				}
                
				logT('ssh', 'ssh tunnel success, redirect peers to ssh')

				this.p2pStatus = 1
				this.send('p2pStatus', this.p2pStatus)
				this.ignore(selfPeer)
				this.emit('peer', selfPeer)
				this.externalPeers = [selfPeer] // add external peers and tell this on every connection
			})
		})
	}

	close()
	{
		this.closing = true
		if(this.ssh)
		{
			logT('ssh', 'closing ssh...')
			this.ssh.kill()
		}
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

	connect(address)
	{
		this.peers.push(address)
		const rawSocket = new net.Socket();
		const socket = new JsonSocket(rawSocket); //Decorate a standard net.Socket with JsonSocket
		socket.on('connect', () => { //Don't send until we're connected
			const callbacks = {}
			socket.on('message', (message) => {
				if(message.id && callbacks[message.id])
				{
					callbacks[message.id](message.data, socket, address);
					delete callbacks[message.id];
				}
			});
            
			const emit = (type, data, callback) => {
				const id = Math.random().toString(36).substring(5)
				if(callback)
					callbacks[id] = callback;
				socket.sendMessage({
					id,
					type,
					data
				});
			}

			// check protocol
			const protocolTimeout = setTimeout(() => rawSocket.destroy(), 7000)
			emit('protocol', {
				protocol: 'rats',
				port: config.spiderPort,
				version: this.version,
				peerId: this.peerId,
				info: this.info,
				peers: this.addresses(this.recommendedPeersList()).concat(this.externalPeers) // also add external peers
			}, (data) => {
				if(!data || data.protocol != 'rats')
					return

				// can be added to ignore list while connecting
				if(this.ignoreAddresses.includes(address.address))
					return;

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

	emit(type, data, callback)
	{
		for(const peer of this.peers)
		{
			if(peer.emit)
				peer.emit(type, data, callback)
		}
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