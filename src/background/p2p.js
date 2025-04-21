const config = require('./config');
const shuffle = require('./shuffle');
const os = require('os');
const fs = require('fs');
const ph = require('path');
const EventEmitter = require('events');
const _ = require('lodash');
const mkdirp = require('mkdirp');
const compareVersions = require('compare-versions');

const directoryFilesRecursive = require('./directoryFilesRecursive');
const deleteFolderRecursive = require('./deleteFolderRecursive');

class P2P {
	/**
	 * Create a P2P network instance
	 * @param {Function} send - Function to send messages to UI
	 */
	constructor(send = () => {}) {
		this.minClientVersion = '1.1.0';
		this.version = '2';

		this.events = new EventEmitter();
		this.peers = new Map();
		this.ignoreAddresses = ['127.0.0.1'];
		this.externalPeers = [];
		this.size = 0;
		this.p2pStatus = 0;
		this.info = {};
		this.filesRequests = {};
		this.filesBlacklist = [];
		
		// Generate peer ID if not already in config
		if(!config.peerId) {
			logT('p2p', 'generate peerId');
			config.peerId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
		}
		this.peerId = config.peerId;

		this.send = send;
		this.selfAddress = null;
		this.closing = false;

		// Define help info with getters to ensure values are always current
		Object.defineProperty(this.info, 'maxPeersConnections', { 
			enumerable: true,
			get: () => config.p2pConnections * 2
		});
		
		Object.defineProperty(this.info, 'peersConnections', { 
			enumerable: true,
			get: () => this.size
		});

		this.topicHandlers = new Map();
		this.responseHandlers = new Map();
		this.initPromise = this.init();
	}

	/**
	 * Initialize the P2P node
	 * @returns {Promise<P2P>} This instance
	 */
	async init() {
		try {
			// Dynamically import libp2p modules
			const [
				{ createLibp2p }, 
				{ tcp }, 
				{ mplex }, 
				{ noise }, 
				{ mdns }, 
				{ bootstrap }, 
				{ gossipsub }, 
				{ ping }, 
				{ webSockets }, 
				{ multiaddr }
			] = await Promise.all([
				import('libp2p'),
				import('@libp2p/tcp'),
				import('@libp2p/mplex'),
				import('@chainsafe/libp2p-noise'),
				import('@libp2p/mdns'),
				import('@libp2p/bootstrap'),
				import('@chainsafe/libp2p-gossipsub'),
				import('@libp2p/ping'),
				import('@libp2p/websockets'),
				import('@multiformats/multiaddr')
			]);
			
			// Store multiaddr for later use
			this.multiaddr = multiaddr;
			
			// Create and configure libp2p node
			this.node = await createLibp2p({
				addresses: {
					listen: [
						`/ip4/0.0.0.0/tcp/${5000}`,
						`/ip4/0.0.0.0/tcp/${5001}/ws`
					]
				},
				transports: [
					tcp(),
					webSockets()
				],
				streamMuxers: [mplex()],
				connectionEncryption: [noise()],
				peerDiscovery: [
					mdns({
						interval: 20000
					}),
					bootstrap({
						list: [
							// Default bootstrap nodes
							'/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
							'/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
						],
						interval: 60000
					})
				],
				pubsub: gossipsub({
					allowPublishToZeroPeers: true,
					emitSelf: false
				}),
				services: {
					ping: ping({
						protocolPrefix: 'rats'
					})
				}
			});

			// Set up event listeners
			this.setupEventListeners();
			
			// Subscribe to topics
			this.setupTopicHandlers();
			
			// Ignore local addresses
			this.ignoreLocalAddresses();
			
			// Start the node
			await this.node.start();
			logT('p2p', 'libp2p node started successfully');
			
			return this;
		} catch (err) {
			logTE('p2p', 'Failed to initialize libp2p node:', err);
			throw err;
		}
	}

	/**
	 * Set up event listeners for the libp2p node
	 */
	setupEventListeners() {
		// Peer discovery event
		this.node.addEventListener('peer:discovery', (evt) => {
			const peer = evt.detail;
			logT('p2p', 'Discovered peer:', peer.id.toString());
			this.attemptConnection(peer);
		});

		// Peer connection event
		this.node.addEventListener('peer:connect', (evt) => {
			const peerId = evt.detail.toString();
			logT('p2p', 'Connected to peer:', peerId);
			
			if (!this.peers.has(peerId)) {
				const multiaddrs = this.node.getMultiaddrs(peerId).map(addr => addr.toString());
				
				this.peers.set(peerId, {
					id: peerId,
					connected: true,
					version: null,
					info: null,
					addresses: multiaddrs,
					connectedAt: Date.now()
				});
				
				this.size++;
				
				// Check protocol compatibility
				this.sendProtocolCheck(peerId);
				
				// Update status
				if (this.p2pStatus === 0) {
					this.p2pStatus = 2;
					this.send('p2pStatus', this.p2pStatus);
				}
				
				this.events.emit('peer', { id: peerId });
			}
		});

		// Peer disconnection event
		this.node.addEventListener('peer:disconnect', (evt) => {
			const peerId = evt.detail.toString();
			if (this.peers.has(peerId)) {
				logT('p2p', 'Disconnected from peer:', peerId);
				const peer = this.peers.get(peerId);
				this.peers.delete(peerId);
				this.size--;
				
				this.send('peer', {
					size: this.size,
					torrents: peer.info ? peer.info.torrents || 0 : 0
				});
				
				// Try to reconnect after delay if not closing
				if (!this.closing) {
					setTimeout(() => {
						this.attemptConnection({ id: peerId });
					}, 5000);
				}
			}
		});

		// PubSub message event
		this.node.pubsub.addEventListener('message', this.handlePubSubMessage.bind(this));
	}

	/**
	 * Handle incoming pubsub messages
	 * @param {Event} evt - Message event
	 */
	handlePubSubMessage(evt) {
		try {
			const { data, topic, from } = evt.detail;
			const message = JSON.parse(Buffer.from(data).toString());
			
			// Check if this is a response to a request
			if (message.id && message.isResponse && this.responseHandlers.has(message.id)) {
				const handler = this.responseHandlers.get(message.id);
				handler(message, from);
				
				// Remove one-time handlers
				if (!handler.permanent) {
					this.responseHandlers.delete(message.id);
				}
				return;
			}
			
			// Handle topic-specific messages
			if (this.topicHandlers.has(topic)) {
				const handler = this.topicHandlers.get(topic);
				
				// For request-response pattern, include the ability to reply
				const respond = (responseData) => {
					this.sendToPeer(from, topic, {
						...responseData,
						id: message.id,
						isResponse: true
					});
				};
				
				handler(message, from, respond);
			}
		} catch (err) {
			logTE('p2p', 'Error handling pubsub message:', err);
		}
	}

	/**
	 * Set up handlers for specific topics
	 */
	setupTopicHandlers() {
		// Protocol message handler
		this.registerTopicHandler('rats:protocol', async (data, from, respond) => {
			if (!data || data.protocol !== 'rats') return;
			
			if (compareVersions(data.version, this.minClientVersion) < 0) {
				logTE('p2p', `Ignore peer because of version ${data.version} < ${this.minClientVersion}`);
				return;
			}
			
			if (data.peerId === this.peerId) {
				logT('p2p', 'Try connection to myself, ignore', this.peerId);
				return;
			}
			
			// Update peer information
			if (this.peers.has(from)) {
				const peer = this.peers.get(from);
				peer.version = data.version;
				peer.peerId = data.peerId;
				peer.info = data.info;
				peer.port = data.port;
				
				// Send response
				respond({
					protocol: 'rats',
					version: this.version,
					peerId: this.peerId,
					info: this.info,
					peers: this.addresses(this.recommendedPeersList())
				});
				
				// Add other peers
				if (data.peers && Array.isArray(data.peers) && data.peers.length > 0) {
					data.peers.forEach(peer => this.add(peer));
				}
			}
		});

		// Peer exchange handler
		this.registerTopicHandler('rats:peer', (peer) => {
			logT('p2p', 'Got peer exchange', peer);
			this.add(peer);
		});

		// File transfer handler
		this.registerTopicHandler('rats:file', async ({ path, id, chunk, done }, from, respond) => {
			try {
				if (!this.dataDirectory) {
					logTE('transfer', 'No data directory');
					respond({ id, error: 'no_data_directory' });
					return;
				}
				
				const filePath = ph.resolve(this.dataDirectory + '/' + path);
				if (!filePath.includes(this.dataDirectory) || filePath === this.dataDirectory) {
					logTE('transfer', 'File get must be from data dir');
					respond({ id, error: 'security_violation' });
					return;
				}
				
				if (!fs.existsSync(filePath)) {
					logT('transfer', 'No such file or directory', filePath);
					respond({ id, error: 'not_found' });
					return;
				}
				
				// Check blacklist
				for (const blackWord of this.filesBlacklist) {
					if (filePath.includes(blackWord)) {
						logTE('transfer', 'File in blackwords', filePath, blackWord);
						respond({ id, error: 'blacklisted' });
						return;
					}
				}
				
				// Handle directory listing
				if (fs.lstatSync(filePath).isDirectory()) {
					const filesList = directoryFilesRecursive(filePath)
						.map(file => ph.relative(this.dataDirectory, file).replace(/\\/g, '/'));
					respond({ id, filesList });
					return;
				}
				
				// If this is a request for file content
				if (chunk) {
					this.streamFileToRequester(filePath, path, id, respond);
				}
			} catch (err) {
				logTE('transfer', 'Error processing file request:', err);
				respond({ id, error: err.message });
			}
		});
	}

	/**
	 * Stream a file to the requester
	 * @param {string} filePath - Path to the file
	 * @param {string} path - Relative path for logging
	 * @param {string} id - Request ID
	 * @param {Function} respond - Response function
	 */
	streamFileToRequester(filePath, path, id, respond) {
		logT('transfer', 'Server transfer file', path);
		let readable = new fs.ReadStream(filePath);
		
		readable.on('data', (chunk) => {
			respond({ id, data: chunk });
		});
		
		readable.on('end', () => {
			logT('transfer', 'Server finish transfer file', path);
			respond({ id, done: true });
			readable = null;
		});
		
		readable.on('error', (err) => {
			logTE('transfer', 'Error reading file', err);
			respond({ id, error: err.message });
			readable = null;
		});
	}

	/**
	 * Ignore local network interfaces
	 */
	ignoreLocalAddresses() {
		const ifaces = os.networkInterfaces();
		Object.keys(ifaces).forEach((ifname) => {
			ifaces[ifname].forEach((iface) => {
				if ('IPv4' !== iface.family || iface.internal !== false) {
					return;
				}
				
				logT('p2p', 'Ignore local address', iface.address);
				this.ignore(iface.address);
			});
		});
	}

	/**
	 * Start listening on configured ports
	 * @returns {Promise<void>}
	 */
	async listen() {
		await this.initPromise;
		logT('p2p', 'P2P listening on ports', config.spiderPort, 'and', config.spiderPort + 1);
	}

	/**
	 * Close the P2P connection
	 * @returns {Promise<boolean>} True when closed
	 */
	async close() {
		this.closing = true;
		// Stop libp2p node
		if (this.node) {
			await this.node.stop();
			logT('p2p', 'libp2p node stopped');
		}
		this.peers.clear();
		this.size = 0;
		this.responseHandlers.clear();
		return true;
	}

	/**
	 * Register a topic handler
	 * @param {string} topic - Topic to subscribe to
	 * @param {Function} handler - Message handler function
	 */
	registerTopicHandler(topic, handler) {
		if (!this.topicHandlers.has(topic)) {
			this.node.pubsub.subscribe(topic);
			logT('p2p', 'Subscribed to topic', topic);
		}
		this.topicHandlers.set(topic, handler);
	}

	/**
	 * Add a peer by address
	 * @param {Object} address - Peer address info
	 * @param {boolean} force - Force connection even if max peers reached
	 * @returns {Promise<void>}
	 */
	async add(address, force = false) {
		if (!config.p2p) {
			return;
		}

		if (this.size > config.p2pConnections && !force) {
			return;
		}

		if (address.port <= 1 || address.port > 65535) {
			return;
		}

		// Check ignore list
		if (this.isAddressIgnored(address)) {
			return;
		}
		
		// Check if we're already connected to this address
		if (this.isAlreadyConnected(address)) {
			return;
		}

		try {
			// Build multiaddress
			const ma = this.multiaddr(`/ip4/${address.address}/tcp/${address.port}`);
			await this.node.dial(ma);
			logT('p2p', 'Successfully dialed peer at', address.address + ':' + address.port);
		} catch (err) {
			logTE('p2p', 'Failed to connect to peer at', address.address + ':' + address.port, err.message);
		}
	}

	/**
	 * Check if an address is in the ignore list
	 * @param {Object} address - Address to check 
	 * @returns {boolean} Whether address is ignored
	 */
	isAddressIgnored(address) {
		for (const ignoreAddress of this.ignoreAddresses) {
			if (typeof ignoreAddress === 'object') {
				if (ignoreAddress.address === address.address && ignoreAddress.port === address.port) {
					return true;
				}
			} else {
				if (ignoreAddress === address.address) {
					return true;
				}
			}
		}
		return false;
	}

	/**
	 * Check if we're already connected to this address
	 * @param {Object} address - Address to check
	 * @returns {boolean} Whether already connected
	 */
	isAlreadyConnected(address) {
		for (const [, peer] of this.peers.entries()) {
			if (peer.addresses && peer.addresses.some(addr => {
				return addr.includes(address.address) && addr.includes(address.port.toString());
			})) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Attempt connection to a discovered peer
	 * @param {Object} peer - Peer to connect to
	 * @returns {Promise<void>}
	 */
	async attemptConnection(peer) {
		if (this.size > config.p2pConnections || this.closing) {
			return;
		}
		
		try {
			await this.node.dial(peer.id);
		} catch (err) {
			logTE('p2p', 'Failed to connect to discovered peer', peer.id.toString(), err.message);
		}
	}

	/**
	 * Send protocol check to peer
	 * @param {string} peerId - ID of the peer
	 */
	sendProtocolCheck(peerId) {
		this.sendToPeer(peerId, 'rats:protocol', {
			protocol: 'rats',
			port: config.spiderPort,
			version: this.version,
			peerId: this.peerId,
			info: this.info,
			peers: this.addresses(this.recommendedPeersList()).concat(this.externalPeers)
		});
	}

	/**
	 * Send message to specific peer or topic
	 * @param {string} peerId - ID of the peer
	 * @param {string} topic - Topic to publish to
	 * @param {Object} data - Data to send
	 */
	sendToPeer(peerId, topic, data) {
		try {
			const message = Buffer.from(JSON.stringify(data));
			this.node.pubsub.publish(topic, message);
		} catch (err) {
			logTE('p2p', 'Error sending message to peer', peerId, err);
		}
	}

	/**
	 * Emit message to all peers with request-response pattern
	 * @param {string} type - Message type
	 * @param {Object} data - Message data
	 * @param {Function} callback - Response callback
	 * @param {boolean} permanent - Keep handler after response
	 * @returns {Function} Function to unregister the callback
	 */
	emit(type, data, callback, permanent = false) {
		if (!this.node || !this.node.pubsub) {
			logTE('p2p', 'Node not initialized yet');
			return () => {};
		}
		
		// Map old message types to topics
		const topicMapping = {
			'protocol': 'rats:protocol',
			'peer': 'rats:peer',
			'file': 'rats:file'
		};
		
		const topic = topicMapping[type] || `rats:${type}`;
		
		try {
			// Generate a random ID for tracking responses
			const id = Math.random().toString(36).substring(5);
			
			// If callback provided, set up a response handler
			if (callback) {
				const handler = (message, from) => {
					callback(message, null, { id: from });
				};
				
				// Mark if the handler is permanent
				handler.permanent = permanent;
				this.responseHandlers.set(id, handler);
			}
			
			// Add ID to data
			const messageData = { ...data, id };
			
			// Publish to the topic
			const message = Buffer.from(JSON.stringify(messageData));
			this.node.pubsub.publish(topic, message);
			
			// Return a function to unregister the callback
			return () => {
				if (callback) {
					this.responseHandlers.delete(id);
				}
			};
		} catch (err) {
			logTE('p2p', 'Error emitting message', err);
			return () => {};
		}
	}

	/**
	 * Register a handler for a topic (legacy API compatibility)
	 * @param {string} type - Message type
	 * @param {Function} callback - Message handler
	 */
	on(type, callback) {
		const topicMapping = {
			'protocol': 'rats:protocol',
			'peer': 'rats:peer',
			'file': 'rats:file'
		};
		
		const topic = topicMapping[type] || `rats:${type}`;
		
		this.registerTopicHandler(topic, (data, from, respond) => {
			callback(data, (responseData) => {
				respond(responseData);
			}, { peerId: from }, {
				version: data.version,
				info: data.info
			});
		});
	}

	/**
	 * Download file using p2p
	 * @param {string} path - File path
	 * @param {string} targetPath - Target path
	 * @param {string} remotePeer - Peer to download from
	 * @param {boolean} parent - Parent directory transfer
	 * @returns {Promise<boolean|Function>} Success or rename callback
	 */
	async file(path, targetPath, remotePeer, parent) {
		if (!this.dataDirectory) {
			logTE('transfer', 'No data directory');
			return false;
		}

		if (this.filesRequests[path]) {
			logT('transfer', 'Already downloading', path, 'return downloading request');
			return this.filesRequests[path];
		}

		logT('transfer', 'File request', path);
		const promise = new Promise(async (resolve) => {
			const realPath = (targetPath || path).replace(/\\/g, '/');
			const filePath = this.dataDirectory + '/' + realPath;
			const tmpPath = this.dataDirectory + '/' + realPath.split('/').map(p => p + '.tmp').join('/');

			// Create temporary directory and file for downloading
			await mkdirp(ph.dirname(tmpPath));
			let fileStream;
			if (!fs.existsSync(tmpPath) || !fs.lstatSync(tmpPath).isDirectory()) {
				fileStream = fs.createWriteStream(tmpPath);
			}
            
			let peer = null;
			let firstTransfer = false;
			
			// Generate a unique ID for this file transfer
			const transferId = Math.random().toString(36).substring(2, 15);
			
			// Set up a handler for file responses
			const fileResponseHandler = async (message, from) => {
				if (peer && from !== peer) {
					logT('transfer', 'Ignore other peers response', from);
					return;
				}

				// Handle file transfer completion
				if (message.done) {
					logT('transfer', 'Closing transferring file stream', path);
					this.responseHandlers.delete(transferId);
					
					if (fileStream) {
						fileStream.end();
					}
					
					if (firstTransfer) {
						const renameCallback = async () => {
							await mkdirp(ph.dirname(filePath));
							fs.renameSync(tmpPath, filePath);
						};
						
						if (parent) {
							resolve(renameCallback);
						} else {
							await renameCallback();
							resolve(true);
						}
					}
					return;
				}

				// Handle file list response (directory)
				if (message.filesList) {
					logT('transfer', 'Got folder content', message.filesList);
					this.responseHandlers.delete(transferId);
					
					const transferFiles = () => {
						Promise.all(message.filesList.map(file => this.file(file, null, from, true))).then(async (files) => {
							// Files transfers complete, now move them from tmp dir
							Promise.all(files.map((renameCallback) => renameCallback())).then(() => {
								deleteFolderRecursive(tmpPath);
								logT('transfer', 'Finish transfer all files from folder');
								resolve();
							});
						});
					};
					
					if (fileStream) {
						fileStream.end(null, null, () => {
							fs.unlinkSync(tmpPath);
							transferFiles();
						});
					} else {
						transferFiles();
					}
					return;
				}

				// Handle error response
				if (message.error) {
					logTE('transfer', 'Error on file transfer', path, message.error);
					this.responseHandlers.delete(transferId);
					
					if (fileStream) {
						fileStream.end();
					}
					
					resolve(false);
					return;
				}

				if (!fileStream) {
					logTE('transfer', 'Error on file transfer', path, 'cant create description');
					this.responseHandlers.delete(transferId);
					resolve(false);
					return;
				}

				if (!message.data) {
					logTE('transfer', 'Error on file transfer', path);
					this.responseHandlers.delete(transferId);
					fileStream.end();
					resolve(false);
					return;
				}

				// Make sure no other peer will receive data
				peer = from;
				if (!firstTransfer) {
					firstTransfer = true;
					logT('transfer', 'Got peer for transfer, start transferring file', path, 'from peer', from);
				}
                
				// Write data to file
				fileStream.write(Buffer.from(message.data));
			};
			
			// Register the file response handler
			fileResponseHandler.permanent = true;
			this.responseHandlers.set(transferId, fileResponseHandler);
			
			// Send the file request
			this.sendToPeer(remotePeer || null, 'rats:file', { 
				path, 
				id: transferId,
				chunk: true 
			});
		});

		this.filesRequests[path] = promise;
		promise.then(() => {
			delete this.filesRequests[path];
		});

		return promise;
	}

	/**
	 * Get list of connected peers
	 * @returns {Array} List of connected peers
	 */
	peersList() {
		return Array.from(this.peers.values())
			.filter(peer => peer.connected);
	}

	/**
	 * Get recommended list of peers to share
	 * @returns {Array} Recommended peers list
	 */
	recommendedPeersList() {
		const fullList = this.peersList();
		if (fullList.length === 0) {
			return []; // no list
		}

		// Get 4 random peers from full peers list
		let peers = shuffle(fullList).slice(0, 4);
		
		// Add 2 peers with highest torrents count 
		peers = peers.concat(
			_.orderBy(fullList, peer => peer.info && peer.info.torrents, 'desc').slice(0, 2)
		);
		
		// Add 2 peers with most available connections
		peers = peers.concat(
			_.orderBy(fullList, 
				peer => peer.info && peer.info.maxPeersConnections && peer.info.peersConnections && 
					(peer.info.maxPeersConnections - peer.info.peersConnections), 
				'desc'
			).slice(0, 2)
		);

		return _.uniq(peers);
	}

	/**
	 * Get addresses of peers for sharing
	 * @param {Array} peers - List of peers
	 * @returns {Array} Addresses of peers
	 */
	addresses(peers) {
		if (!peers || !Array.isArray(peers)) {
			return [];
		}
		
		return peers
			.filter(peer => peer.addresses && peer.addresses.length > 0)
			.map(peer => {
				// Extract IP and port from multiaddr string
				const addr = peer.addresses[0];
				const ipMatch = addr.match(/\/ip4\/([^/]+)/);
				const tcpMatch = addr.match(/\/tcp\/(\d+)/);
				
				if (ipMatch && tcpMatch) {
					return {
						address: ipMatch[1],
						port: parseInt(tcpMatch[1], 10)
					};
				}
				return null;
			})
			.filter(Boolean);
	}

	/**
	 * Ignore an address (prevent connections)
	 * @param {string} address - Address to ignore
	 */
	ignore(address) {
		if (this.ignoreAddresses.includes(address)) return;
		
		this.ignoreAddresses.push(address);
		
		// Close all connected peers with this address
		for (const [peerId, peer] of this.peers.entries()) {
			if (peer.addresses && peer.addresses.some(addr => addr.includes(`/ip4/${address}/`))) {
				logT('p2p', 'Disconnecting ignored peer with address', address);
				this.node.hangUp(peerId).catch(err => {
					logTE('p2p', 'Error hanging up connection to peer', peerId, err);
				});
			}
		}
	}
}

module.exports = P2P;