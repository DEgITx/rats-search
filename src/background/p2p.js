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
		this.protocolVersion = '2.0.0';
		this.protocolName = 'rats';

		this.events = new EventEmitter();
		this.peers = new Map();
		this.ignoreAddresses = [];
		this.externalPeers = [];
		this.size = 0;
		this.p2pStatus = 0;
		this.info = {};
		this.filesRequests = {};
		this.filesBlacklist = [];
		
		this.send = send;
		this.selfAddress = null;
		this.closing = false;
		this.persistentPeerIdPath = 'peer-id.json';

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
	 * Load or generate a persistent peer ID
	 * @returns {Promise<Object>} Private key for libp2p
	 */
	async _loadOrGeneratePeerId() {
		try {
			const { generateKeyPair, privateKeyFromProtobuf, privateKeyToProtobuf } = await import('@libp2p/crypto/keys');
			
			// Check if key file exists
			if (fs.existsSync(this.persistentPeerIdPath)) {
				try {
					// Load existing key
					const keyData = JSON.parse(fs.readFileSync(this.persistentPeerIdPath, 'utf8'));
					if (keyData && keyData.privateKey) {
						// Convert base64 string back to Uint8Array
						const privateKeyBytes = Buffer.from(keyData.privateKey, 'base64');
						// Deserialize the private key from protobuf format
						const privateKey = privateKeyFromProtobuf(privateKeyBytes);
						logT('p2p', 'Loaded persistent private key');
						return privateKey;
					}
					throw new Error('Invalid key data in file');
				} catch (err) {
					logTE('p2p', 'Error loading private key, will generate new one:', err);
				}
			}
			
			// Generate new Ed25519 key pair
			logT('p2p', 'Generating new Ed25519 key pair...');
			const keyPair = await generateKeyPair('Ed25519');
			
			// Serialize the private key to protobuf format
			const privateKeyProtobuf = privateKeyToProtobuf(keyPair);
			
			// Save private key to file
			const keyData = {
				privateKey: Buffer.from(privateKeyProtobuf).toString('base64'),
				type: 'Ed25519'
			};
			
			fs.writeFileSync(
				this.persistentPeerIdPath, 
				JSON.stringify(keyData, null, 2)
			);
			
			logT('p2p', 'Generated and saved new private key');
			return keyPair;
		} catch (err) {
			logTE('p2p', 'Failed to load or generate private key:', err);
			throw err;
		}
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
				{ yamux }, 
				{ noise }, 
				{ mdns }, 
				{ bootstrap }, 
				{ gossipsub }, 
				{ ping }, 
				{ webSockets }, 
				{ multiaddr },
				{ identify },
				{ kadDHT, removePrivateAddressesMapper }
			] = await Promise.all([
				import('libp2p'),
				import('@libp2p/tcp'),
				import('@chainsafe/libp2p-yamux'),
				import('@chainsafe/libp2p-noise'),
				import('@libp2p/mdns'),
				import('@libp2p/bootstrap'),
				import('@chainsafe/libp2p-gossipsub'),
				import('@libp2p/ping'),
				import('@libp2p/websockets'),
				import('@multiformats/multiaddr'),
				import('@libp2p/identify'),
				import('@libp2p/kad-dht')
			]);
			
			// Store multiaddr for later use
			this.multiaddr = multiaddr;

			// Create protocol string
			this.protocol = `/${this.protocolName}/${this.protocolVersion}`;
			
			// Load or generate persistent peer ID
			let peerId;
			peerId = await this._loadOrGeneratePeerId();
			
			// Create and configure libp2p node
			this.node = await createLibp2p({
				privateKey: peerId,
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
				streamMuxers: [yamux()],
				connectionEncrypters: [noise()],
				peerDiscovery: [
					mdns({
						interval: 20000
					}),
					bootstrap({
						list: [
							// Default bootstrap nodes
							'/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
							'/dnsaddr/bootstrap.libp2p.io/ipfs/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
							'/dnsaddr/bootstrap.libp2p.io/ipfs/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
						],
						interval: 60000
					})
				],
				services: {
					identify: identify(),
					ping: ping({
						protocolPrefix: 'rats'
					}),
					pubsub: gossipsub({
						allowPublishToZeroPeers: false,
						emitSelf: false
					}),
					dht: kadDHT({
						protocol: '/rats/kad/1.0.0',
						clientMode: false, // Run as a full DHT node
					}),
					aminoDHT: kadDHT({
						protocol: '/ipfs/kad/1.0.0',
						peerInfoMapper: removePrivateAddressesMapper
					}),
				}
			});

			// Store the node's PeerId for use in the RATS protocol
			this.peerId = this.node.peerId.toString();
			logT('p2p', 'Using libp2p node PeerId:', this.peerId);
			
			// Set up event listeners
			this._setupEventListeners();
			
			// Subscribe to topics
			this._setupTopicHandlers();
			
			// Start the node
			await this.node.start();
			logT('p2p', 'libp2p node started successfully');
			
			// test
			setTimeout(() => {
				this.add({
					id: '12D3KooWEtimiSnXThfMsPrc5e8NG28bMQ4vmYpo39wLyGYF3ycb',
					address: '167.71.11.56',
					port: 5000,
				});
			}, 10000);

			return this;
		} catch (err) {
			logTE('p2p', 'Failed to initialize libp2p node:', err);
			throw err;
		}
	}

	/**
	 * Handle peer connection
	 * @param {Object} peer - Peer object
	 */
	async _onConnect(peer) {
		const peerId = peer.toString();
		
		try {
			logT('p2p', 'Connected to peer:', peerId);

			if (!this.peers.has(peerId)) {
				const multiaddrs = this.node.getMultiaddrs(peerId).map(addr => addr.toString());
				
				this.peers.set(peerId, {
					id: peerId,
					peer: peer,
					addresses: multiaddrs,
					connectedAt: Date.now(),
				});
				
				this.size++;

				// Check protocol compatibility
				if (!await this.sendProtocolCheck(peerId)) {
					logT('p2p', 'Protocol not verified with dial protocol, disconnecting peer:', peerId);
					this._disconnectPeer(peerId);
					return;
				}
				
				// Update status
				if (this.p2pStatus === 0) {
					this.p2pStatus = 2;
					this.send('p2pStatus', this.p2pStatus);
				}
				
				this.events.emit('peer', { id: peerId });
				
				// Set a timeout to disconnect if protocol not verified
				setTimeout(() => {
					if (this.peers.has(peerId) && this.peers.get(peerId).protocolName !== this.protocolName) {
						logTW('p2p', 'Protocol not verified within timeout, disconnecting peer:', peerId);
						this._disconnectPeer(peerId);
					}
				}, 10000); // 10 second timeout for protocol verification
			}
		} catch (err) {
			logTE('p2p', `Failed to dial protocol to peer ${peerId}:`, err.message);
			// If we couldn't establish a protocol stream, disconnect the peer
			this._disconnectPeer(peerId);
		}
	}

	/**
	 * Handle peer disconnection
	 * @param {Object} peer - Peer object
	 */
	_onDisconnect(peer) {
		const peerId = peer.toString();

		if (this.peers.has(peerId)) {
			logT('p2p', 'Disconnected from peer:', peerId);
			this.peers.delete(peerId);
			this.size--;
		}
	}

	/**
	 * Set up event listeners for the libp2p node
	 */
	_setupEventListeners() {
		// Peer discovery event
		this.node.addEventListener('peer:discovery', (evt) => {
			const peer = evt.detail;
			logT('p2p', 'Discovered peer:', peer.id.toString());
			this._attemptConnection(peer);
		});

		// Peer connection event
		this.node.addEventListener('peer:connect', async (evt) => {
			const peer = evt.detail;
			this._onConnect(peer);
		});

		// Peer disconnection event
		this.node.addEventListener('peer:disconnect', (evt) => {
			const peer = evt.detail;
			this._onDisconnect(peer);
		});

		// PubSub message event
		this.node.services.pubsub.addEventListener('message', this._handlePubSubMessage.bind(this));
	}

	/**
	 * Get a protocol stream to a peer
	 * @param {string} peerId - ID of the peer
	 * @returns {Promise<Stream>} - Protocol stream
	 */
	async _sendProtocolStreamData(peerId, data) {
		if (!this.peers.has(peerId.toString())) {
			logTE('p2p', 'Peer not found for stream', peerId);
			return null;
		}

		const peer = this.peers.get(peerId.toString()).peer;
		const stream = await this.node.dialProtocol(peer, this.protocol);
		await stream.sink([data]);
		await stream.close();
	}

	/**
	 * Handle incoming protocol messages
	 * @param {Event} evt - Message event
	 */
	async _handleProtocolStream({ stream, connection }) {
		try {
			// Get peer ID
			const peerId = connection.remotePeer.toString();
			logT('p2p', 'New protocol stream from peer', peerId);
			
			// Read the message from the stream
			const chunks = [];
			for await (const chunk of stream.source) {
				chunks.push(chunk.subarray());
			}
			
			// Parse the message
			const message = JSON.parse(Buffer.concat(chunks).toString());
			const topic = message.topic;
			
			if (!topic) {
				logTW('p2p', 'Received message without topic', message);
				return;
			}
			
			// For init topic, we always process it
			const isInitTopic = topic === `${this.protocol}/init`;
			
			// For other topics, verify protocol compatibility
			if (!isInitTopic && this.peers.has(peerId) && this.peers.get(peerId).protocolName !== this.protocolName) {
				logTW('p2p', `Ignoring message from unverified peer ${peerId} on topic ${topic}`);
				return;
			}

			const messageData = message.data || message;
			
			// Create respond function for request-response pattern
			const respond = async (responseData) => {
				try {
					// Create response message
					const response = {
						...responseData,
						id: message.id,
						isResponse: true,
						topic
					};
					
					// Convert to buffer
					const responseBuffer = Buffer.from(JSON.stringify(response));
					
					// Send response
					await this._sendProtocolStreamData(peerId, responseBuffer);
					logT('p2p', `Sent direct response to ${peerId} for topic ${topic}`);
				} catch (err) {
					logTE('p2p', 'Error sending direct response', err);
				}
			};
			
			// Check if this is a response to a request
			if (message.id && message.isResponse && this.responseHandlers.has(message.id)) {
				const responseHandler = this.responseHandlers.get(message.id);
				responseHandler(messageData, peerId);
				
				// Remove one-time handlers
				if (!responseHandler.permanent) {
					this.responseHandlers.delete(message.id);
				}
				return;
			}
			
			// Handle topic-specific messages
			if (this.topicHandlers.has(topic)) {
				const topicHandler = this.topicHandlers.get(topic).handler;
				
				// For request-response pattern, include the ability to reply
				topicHandler(messageData, peerId, respond);
			} else {
				logTW('p2p', `No handler for topic ${topic}`);
			}
		} catch (err) {
			logTE('p2p', 'Error handling protocol stream', err);
		} finally {
			await stream.close();
		}
	}

	/**
	 * Handle incoming pubsub messages
	 * @param {Event} evt - Message event
	 */
	_handlePubSubMessage(evt) {
		try {
			const { data, topic, from } = evt.detail;
			const message = JSON.parse(Buffer.from(data).toString());
			
			// Check if this is an init message or if the peer is verified
			const isInitMessage = topic === `${this.protocol}/init`;
			const isPeerVerified = !this.peers.has(from) || this.peers.get(from).protocolName === this.protocolName;
			
			// Only process message if it's an init message or the peer is verified
			if (!isInitMessage && !isPeerVerified) {
				logT('p2p', `Ignoring message from unverified peer ${from} on topic ${topic}`);
				return;
			}
			
			const messageData = message.data || message;

			// Check if this is a response to a request
			if (message.id && message.isResponse && this.responseHandlers.has(message.id)) {
				const handler = this.responseHandlers.get(message.id);
				handler(messageData, from);
				
				// Remove one-time handlers
				if (!handler.permanent) {
					this.responseHandlers.delete(message.id);
				}
				return;
			}
			
			// Handle topic-specific messages
			if (this.topicHandlers.has(topic)) {
				const handlerConfig = this.topicHandlers.get(topic);
				
				// Skip if pubsub is disabled for this handler
				if (!handlerConfig.pubsub) {
					return;
				}
				
				// For request-response pattern, include the ability to reply
				const respond = (responseData) => {
					this.sendToPeer(from, topic, {
						...responseData,
						id: message.id,
						isResponse: true
					});
				};
				
				handlerConfig.handler(messageData, from, respond);
			}
		} catch (err) {
			logTE('p2p', 'Error handling pubsub message:', err);
		}
	}

	/**
	 * Set up handlers for specific topics
	 */
	_setupTopicHandlers() {
		// Main protocol handler
		this.node.handle(this.protocol, this._handleProtocolStream.bind(this));

		// Protocol message handler
		this.registerTopicHandler(`${this.protocol}/init`, async (data, from, respond) => {
			if (!data || data.protocolName !== this.protocolName) {
				logTE('p2p', `Ignoring peer with incorrect protocol name: ${data?.protocolName}`);
				if (this.peers.has(from)) {
					this._disconnectPeer(from);
				}
				return;
			}
			
			if (compareVersions(data.protocolVersion, this.protocolVersion) < 0) {
				logTE('p2p', `Ignoring peer because of protocol version ${data.protocolVersion} < ${this.protocolVersion}`);
				if (this.peers.has(from)) {
					this._disconnectPeer(from);
				}
				return;
			}
			
			if (from === this.peerId) {
				logT('p2p', 'Try connection to myself, ignore', from);
				return;
			}
			
			// Update peer information
			if (this.peers.has(from)) {
				const peer = this.peers.get(from);
				peer.protocolName = data.protocolName;
				peer.protocolVersion = data.protocolVersion;
				peer.version = data.version;
				peer.info = data.info;

				// Create a peer object without stream for logging
				logT('p2p', `${this.protocolName} peer connected`, peer);
				
				// Add other peers
				if (data.peers && Array.isArray(data.peers) && data.peers.length > 0) {
					data.peers.forEach(peer => this.add(peer));
				}
			}
		}, { direct: true });

		// Peer exchange handler
		this.registerTopicHandler(`${this.protocol}/peer`, (peer) => {
			logT('p2p', 'Got peer exchange', peer);
			this.add(peer);
		}, { direct: true });

		// File transfer handler
		this.registerTopicHandler(`${this.protocol}/file`, async ({ path, id, chunk, done }, from, respond) => {
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
					this._streamFileToRequester(filePath, path, id, respond);
				}
			} catch (err) {
				logTE('transfer', 'Error processing file request:', err);
				respond({ id, error: err.message });
			}
		}, { direct: true });
	}

	/**
	 * Stream a file to the requester
	 * @param {string} filePath - Path to the file
	 * @param {string} path - Relative path for logging
	 * @param {string} id - Request ID
	 * @param {Function} respond - Response function
	 */
	_streamFileToRequester(filePath, path, id, respond) {
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
	 * @param {Object} options - Handler options
	 * @param {boolean} options.pubsub - Enable pubsub for this topic (default: true when both are disabled)
	 * @param {boolean} options.direct - Enable direct dial for this topic (default: true when both are disabled)
	 */
	registerTopicHandler(topic, handler, options = {}) {
		// Default to enabling both communication methods
		let { pubsub = false, direct = false } = options;
		if (!pubsub && !direct) {
			pubsub = true;
			direct = true;
		}
		
		// Subscribe to pubsub topic if enabled
		if (pubsub && !this.topicHandlers.has(topic)) {
			this.node.services.pubsub.subscribe(topic);
			logT('p2p', 'Subscribed to pubsub topic', topic);
		}
		
		// Store the handler with its communication preferences
		const handlerConfig = {
			handler,
			pubsub,
			direct
		};
		this.topicHandlers.set(topic, handlerConfig);
	}

	/**
	 * Attempt connection to a discovered peer
	 * @param {Object} peer - Peer to connect to
	 * @returns {Promise<void>}
	 */
	async _attemptConnection(peer) {
		if ((this.size > config.p2pConnections && !peer.force) || this.closing) {
			return;
		}
		
		let address = null;
		// Build multiaddress using just id
		if (peer.address && peer.port && peer.id) {
			address = this.multiaddr(`/ip4/${peer.address}/tcp/${peer.port}/p2p/${peer.id}`);
		} else if (peer.id) {
			address = peer.id;
		} else {
			logTE('p2p', 'Invalid peer', peer);
			return;
		}

		logT('p2p', 'Attempt connection to', address);

		try {
			await this.node.dial(address);
		} catch (err) {
			logTE('p2p', 'Failed to connect to discovered peer', address, err.message, peer);
		}
	}

	/**
	 * Add a peer by address
	 * @param {Object} peer - Peer address info
	 * @param {boolean} force - Force connection even if max peers reached
	 * @returns {Promise<void>}
	 */
	async add(peer, force = false) {
		if (!config.p2p) {
			return;
		}

		// Check ignore list
		if (this._isAddressIgnored(peer)) {
			return;
		}
		
		// Check if we're already connected to this address
		if (this._isAlreadyConnected(peer)) {
			return;
		}

		// Set force flag if provided
		if (force) {
			peer.force = true;
		}

		await this._attemptConnection(peer);
	}

	/**
	 * Check if a peer is in the ignore list
	 * @param {Object} peer - Peer to check 
	 * @returns {boolean} Whether peer is ignored
	 */
	_isAddressIgnored(peer) {
		// Only check if peer ID is in ignore list
		return this.ignoreAddresses.includes(peer.id);
	}

	/**
	 * Check if we're already connected to this peer
	 * @param {Object} peer - Peer to check
	 * @returns {boolean} Whether already connected
	 */
	_isAlreadyConnected(peer) {
		// Only check by ID
		return this.peers.has(peer.id);
	}

	/**
	 * Send protocol check to peer
	 * @param {string} peerId - ID of the peer
	 */
	async sendProtocolCheck(peerId) {
		return await this.sendToPeer(peerId, `${this.protocol}/init`, {
			protocolName: this.protocolName,
			protocolVersion: this.protocolVersion,
			version: this.version,
			info: this.info,
			peers: this.addresses(this.recommendedPeersList()).concat(this.externalPeers)
		});
	}

	/**
	 * Send message to specific peer or topic
	 * @param {string} peerId - ID of the peer (null for broadcast)
	 * @param {string} topic - Topic to publish to
	 * @param {Object} data - Data to send
	 * @returns {boolean} Success status
	 */
	async sendToPeer(peerId, topic, data) {
		try {
			// Ensure node is available
			if (!this.node) {
				logTE('p2p', 'Cannot send message - node not initialized');
				return false;
			}

			// For specific peer, check protocol verification except for init messages
			if (peerId && 
				topic !== `${this.protocol}/init` && 
				this.peers.has(peerId) && 
				this.peers.get(peerId).protocolName !== this.protocolName) {
				logTW('p2p', `Cannot send message to unverified peer ${peerId} on topic ${topic}`);
				return false;
			}

			// Serialize message once
			if (peerId) {
				data.topic = topic;
			}
			const message = Buffer.from(JSON.stringify(data));
			
			if (peerId) {
				// For specific peer, use direct dial
				try {
					await this._sendProtocolStreamData(peerId, message);
					logT('p2p', `Sent direct message to peer ${peerId} on topic ${topic}`);
					return true;
				} catch (err) {
					logTW('p2p', `Error dialing peer ${peerId}`, err);
					return false;
				}
			} else {
				// For broadcast, use pubsub
				if (!this.node.services.pubsub) {
					logTE('p2p', 'Cannot broadcast - pubsub not available');
					return false;
				}
				
				await this.node.services.pubsub.publish(topic, message);
				logT('p2p', `Broadcast message to topic ${topic}`);
				return true;
			}

		} catch (err) {
			const peerInfo = peerId ? `peer ${peerId}` : 'topic broadcast';
			logTW('p2p', `Error sending message to ${peerInfo}`, err);
			return false;
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
	async emit(type, data, callback, permanent = false) {
		if (!this.node || !this.node.services.pubsub) {
			logTE('p2p', 'Node not initialized yet');
			return () => {};
		}
		
		// Map old message types to topics
		const topicMapping = {
			'init': `${this.protocol}/init`,
			'peer': `${this.protocol}/peer`,
			'file': `${this.protocol}/file`
		};
		
		const topic = topicMapping[type] || `${this.protocol}/${type}`;
		
		try {
			// Generate a random ID for tracking responses
			const id = Math.random().toString(36).substring(5);
			
			// If callback provided, set up a response handler
			if (callback) {
				const handler = (message, from) => {
					callback(message, null, this.peers.get(from));
				};
				
				// Mark if the handler is permanent
				handler.permanent = permanent;
				this.responseHandlers.set(id, handler);
			}
			
			// Add ID to data
			const messageData = { data, id };
			
			// Use sendToPeer method to send to all peers
			if (!(await this.sendToPeer(null, topic, messageData))) {
				// If sending failed, clean up handler
				this.responseHandlers.delete(id);
			}
			
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
			'init': `${this.protocol}/init`,
			'peer': `${this.protocol}/peer`,
			'file': `${this.protocol}/file`
		};
		
		const topic = topicMapping[type] || `${this.protocol}/${type}`;
		
		this.registerTopicHandler(topic, (data, from, respond) => {
			callback(data, (responseData) => {
				respond(responseData);
			}, this.peers.get(from));
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
		// Validate parameters and environment
		if (!this.dataDirectory) {
			logTE('transfer', 'No data directory configured');
			return false;
		}

		if (!path) {
			logTE('transfer', 'No path specified for file transfer');
			return false;
		}

		// Check if already downloading
		if (this.filesRequests[path]) {
			logT('transfer', 'Already downloading', path, 'returning existing request');
			return this.filesRequests[path];
		}

		logT('transfer', 'New file request', path);

		const promise = new Promise(async (resolve) => {
			try {
				// Normalize paths
				const realPath = (targetPath || path).replace(/\\/g, '/');
				const filePath = ph.join(this.dataDirectory, realPath);
				const tmpPath = ph.join(this.dataDirectory, realPath.split('/').map(p => p + '.tmp').join('/'));
				
				// Validate target path is within data directory
				if (!filePath.startsWith(this.dataDirectory)) {
					throw new Error('File destination outside data directory');
				}

				// Create temporary directory for downloading
				await mkdirp(ph.dirname(tmpPath));
				
				// Only create file stream if target is not a directory
				let fileStream = null;
				if (!fs.existsSync(tmpPath) || !fs.lstatSync(tmpPath).isDirectory()) {
					fileStream = fs.createWriteStream(tmpPath);
				}
				
				// Track transfer state
				let peer = null;
				let firstTransfer = false;
				let isError = false;
				
				// Generate a unique ID for this file transfer
				const transferId = Math.random().toString(36).substring(2, 15);
				
				// Set up cleanup function
				const cleanup = () => {
					this.responseHandlers.delete(transferId);
					if (fileStream) {
						fileStream.end();
					}
				};
				
				// Set up a handler for file responses
				const fileResponseHandler = async (message, from) => {
					// Validate sender if we're already receiving from a specific peer
					if (peer && from !== peer) {
						logT('transfer', 'Ignoring response from different peer', from);
						return;
					}

					// Handle file transfer completion
					if (message.done) {
						logT('transfer', 'Completed file transfer', path);
						cleanup();
						
						if (firstTransfer) {
							const renameCallback = async () => {
								try {
									await mkdirp(ph.dirname(filePath));
									fs.renameSync(tmpPath, filePath);
									logT('transfer', 'Successfully moved file from tmp to destination', filePath);
								} catch (err) {
									logTE('transfer', 'Error moving file from tmp to destination', err);
									return false;
								}
								return true;
							};
							
							if (parent) {
								resolve(renameCallback);
							} else {
								const success = await renameCallback();
								resolve(success);
							}
						} else {
							resolve(false);
						}
						return;
					}

					// Handle file list response (directory)
					if (message.filesList) {
						logT('transfer', 'Received directory listing', message.filesList.length, 'files');
						cleanup();
						
						const transferFiles = async () => {
							try {
								const transfers = await Promise.all(
									message.filesList.map(file => this.file(file, null, from, true))
								);
								
								// Process rename callbacks
								const results = await Promise.all(
									transfers.filter(Boolean).map(renameCallback => renameCallback())
								);
								
								if (results.every(Boolean)) {
									try {
										if (fs.existsSync(tmpPath)) {
											deleteFolderRecursive(tmpPath);
										}
										logT('transfer', 'Successfully transferred all files from directory', path);
										resolve(true);
									} catch (err) {
										logTE('transfer', 'Error cleaning up temporary directory', err);
										resolve(true); // Still consider success even if tmp cleanup fails
									}
								} else {
									logTE('transfer', 'Some files failed to transfer');
									resolve(false);
								}
							} catch (err) {
								logTE('transfer', 'Error in directory transfer', err);
								resolve(false);
							}
						};
						
						if (fileStream) {
							fileStream.end(null, null, async () => {
								try {
									if (fs.existsSync(tmpPath)) {
										fs.unlinkSync(tmpPath);
									}
								} catch (err) {
									logTE('transfer', 'Error removing temporary file', err);
								}
								await transferFiles();
							});
						} else {
							await transferFiles();
						}
						return;
					}

					// Handle error response
					if (message.error) {
						logTE('transfer', 'Error from peer during file transfer', path, message.error);
						cleanup();
						isError = true;
						resolve(false);
						return;
					}

					// Validate we have a file stream
					if (!fileStream) {
						logTE('transfer', 'No file stream available for transfer', path);
						cleanup();
						isError = true;
						resolve(false);
						return;
					}

					// Validate we have data
					if (!message.data) {
						logTE('transfer', 'Received empty data chunk for transfer', path);
						cleanup();
						isError = true;
						fileStream.end();
						resolve(false);
						return;
					}

					// Assign peer on first data and track transfer start
					if (!peer) {
						peer = from;
						firstTransfer = true;
						logT('transfer', 'Starting file transfer', path, 'from peer', from);
					}
					
					// Write data to file with proper error handling
					try {
						const data = Buffer.from(message.data);
						const success = fileStream.write(data);
						
						// Handle backpressure if write buffer is full
						if (!success) {
							await new Promise(resolve => fileStream.once('drain', resolve));
						}
					} catch (err) {
						logTE('transfer', 'Error writing to file stream', err);
						cleanup();
						isError = true;
						resolve(false);
					}
				};
				
				// Register the file response handler
				fileResponseHandler.permanent = true;
				this.responseHandlers.set(transferId, fileResponseHandler);
				
				// Send the file request
				this.sendToPeer(remotePeer || null, `${this.protocol}/file`, { 
					path, 
					id: transferId,
					chunk: true 
				});
				
				// Set a timeout to automatically clean up if no response
				setTimeout(() => {
					if (this.responseHandlers.has(transferId)) {
						logTE('transfer', 'File transfer timed out', path);
						cleanup();
						if (!isError) {
							resolve(false);
						}
					}
				}, 30000); // 30-second timeout
				
			} catch (err) {
				logTE('transfer', 'Error in file transfer setup', path, err);
				resolve(false);
			}
		});

		// Track the current request
		this.filesRequests[path] = promise;
		
		// Clean up the request tracking when done
		promise.finally(() => {
			delete this.filesRequests[path];
		});

		return promise;
	}

	/**
	 * Get list of connected peers
	 * @returns {Array} List of connected peers
	 */
	peersList() {
		return Array.from(this.peers.values());
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
			.filter(peer => peer.id)
			.map(peer => {
				// Start with the basic peer object containing the ID
				const result = {
					id: peer.id
				};
				
				// Only add address and port if addresses are available
				if (peer.addresses && peer.addresses.length > 0) {
					// Extract IP and port from multiaddr string
					const addr = peer.addresses[0];
					const ipMatch = addr.match(/\/ip4\/([^/]+)/);
					const tcpMatch = addr.match(/\/tcp\/(\d+)/);
					
					if (ipMatch && tcpMatch) {
						result.address = ipMatch[1];
						result.port = parseInt(tcpMatch[1], 10);
					}
				}
				
				return result;
			});
	}

	/**
	 * Ignore a peer (prevent connections)
	 * @param {string|Object} peerOrId - Peer object or ID string to ignore
	 */
	ignore(peerOrId) {
		// Extract peer ID from argument
		const peerId = typeof peerOrId === 'string' ? peerOrId : (peerOrId && peerOrId.id);
		
		if (!peerId) {
			logTW('p2p', 'Attempted to ignore invalid peer', peerOrId);
			return;
		}
		
		// Add peer ID to ignore list if not already there
		if (!this.ignoreAddresses.includes(peerId)) {
			logT('p2p', 'Adding peer to ignore list', peerId);
			this.ignoreAddresses.push(peerId);
			
			// Disconnect directly if we're connected to this peer ID
			if (this.peers.has(peerId)) {
				this._disconnectPeer(peerId);
			}
		}
	}
	
	/**
	 * Disconnect from a peer
	 * @param {string} peerId - ID of the peer to disconnect
	 * @private
	 */
	_disconnectPeer(peerId) {
		logT('p2p', 'Disconnecting peer', peerId);
		this.node.hangUp(peerId).catch(err => {
			logTE('p2p', 'Error hanging up connection to peer', peerId, err);
		});
	}
}

module.exports = P2P;