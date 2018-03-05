const config = require('./config');
const net = require('net')
const JsonSocket = require('json-socket')
const os = require('os');

class p2p {
	peers = []
	ignoreAddresses = []
	messageHandlers = {}
	size = 0

	constructor(send = () => {})
	{
		this.send = send
		this.tcpServer = net.createServer();
		this.tcpServer.on('connection', (socket) => {
			socket = new JsonSocket(socket);
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
					}, socket)
				}
			});
		})
		// check protocol
		this.on('protocol', (data, callback, socketObject) => {
			if(!data || data.protocol != 'rats')
				return

			const { _socket: socket } = socketObject
			socketObject.rats = true

			callback({
				protocol: 'rats',
				peers: this.peersList().slice(0, 4).map(peer => ({address: peer.address, port: peer.port}))
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
					console.log('ignore local address', iface.address);
					this.ignore(iface.address)
				}
				++alias;
			});
		});
	}

	listen() {
		console.log('listen p2p on', config.spiderPort, 'port')
		this.tcpServer.listen(config.spiderPort, '0.0.0.0');
	}

	on(type, callback) {
		this.messageHandlers[type] = callback
	}

	add(address) {
		const { peers } = this

		if(this.size > 10)
			return;

		if(address.port <= 1 || address.port > 65535)
			return;

		if(this.ignoreAddresses.includes(address.address))
			return;

		for(let peer of peers)
		{
			if(peer.address === address.address) {
				peer.port = address.port;
				return;
			}
		}
		this.connect(address)
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
					callbacks[message.id](message.data, socket);
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
				peers: this.peersList().slice(0, 4).map(peer => ({address: peer.address, port: peer.port}))
			}, (data) => {
				if(!data || data.protocol != 'rats')
					return

				// success
				clearTimeout(protocolTimeout)
				// add to peers
				address.emit = emit
				address.disconnect = () => rawSocket.destroy()
				this.size++;
				this.send('peer', this.size)
				console.log('new peer', address)

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
					this.send('peer', this.size)
				}
				this.peers.splice(index, 1);

				console.log('close peer connection', address)
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