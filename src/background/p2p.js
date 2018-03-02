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
			// try to setup back connection
			const address = socket.address()
			if(address.family == 'IPv4')
			{
				this.add(address)
			}

			socket = new JsonSocket(socket);
			socket.on('error', (err) => {})
			socket.on('message', (message) => {    
				if(message.type && this.messageHandlers[message.type])
				{
					this.messageHandlers[message.type](message.data, (data) => {
						socket.sendMessage({
							id: message.id,
							data
						});
					})
				}
			});
		})
		// check protocol
		this.on('protocol', (data, callback) => {
			if(!data || data.protocol != 'rats')
				return

			callback({
				protocol: 'rats'
			})
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
					this.ignoreAddresses.push(iface.address)
				}
				++alias;
			});
		});
	}

	listen() {
		console.log('listen p2p on', config.spiderPort, 'port')
		this.tcpServer.listen(config.spiderPort);
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
					callbacks[message.id](message.data);
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
			emit('protocol', {protocol: 'rats'}, (data) => {
				if(!data || data.protocol != 'rats')
					return

				// success
				clearTimeout(protocolTimeout)
				// add to peers
				address.emit = emit
				this.size++;
				this.send('peer', this.size)
				console.log('new peer', address)
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
}

module.exports = p2p