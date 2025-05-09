const config = require('./config');
const shuffle = require('./shuffle');
const os = require('os');
const fs = require('fs');
const ph = require('path');
const EventEmitter = require('events');
const _ = require('lodash');
const mkdirp = require('mkdirp');
const compareVersions = require('compare-versions');
const https = require('https');

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

		this.debug = false;

		this.peers = new Map();
		this.size = 0;
		this.maxSize = config.p2pConnections;
		this.peersProtocol = new Map();
		this.peersProtocolSize = 0;
		this.peersNonProtocol = new Map();
		this.peersNonProtocolSize = 0;
		
		this.events = new EventEmitter();
		this.ignoreAddresses = [];
		this.externalPeers = [];
		this.externalAddresses = [];
		this.p2pStatus = 0;
		this.info = {};
		this.filesRequests = {};
		this.filesBlacklist = [];
		
		this.send = send;
		this.selfAddress = null;
		this.closing = false;
		this.persistentPeerIdPath = 'peer-id.json';

		logT('p2p', 'Rats P2P initialized');
		logT('p2p', 'peers maxSize', this.maxSize);

		// Define help info with getters to ensure values are always current
		Object.defineProperty(this.info, 'maxPeersConnections', { 
			enumerable: true,
			get: () => this.maxSize,
		});
		
		Object.defineProperty(this.info, 'peersConnections', { 
			enumerable: true,
			get: () => this.peersProtocolSize,
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
	 * Detect external IP address using external services
	 * @returns {Promise<string|null>} The external IP address or null if not found
	 */
	async detectExternalIp() {
		const services = [
			'https://api.ipify.org',
			'https://ifconfig.me/ip',
			'https://icanhazip.com',
			'https://ipecho.net/plain'
		];

		// Shuffle the services to distribute load
		const shuffledServices = shuffle(services);
		
		// Try each service until one returns a valid IP
		for (const service of shuffledServices) {
			try {
				logT('p2p', 'Attempting to detect external IP using', service);
				const ip = await new Promise((resolve, reject) => {
					https.get(service, (res) => {
						let data = '';
						res.on('data', (chunk) => data += chunk);
						res.on('end', () => {
							// Validate the IP address format
							const ip = data.trim();
							const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
							if (ipRegex.test(ip)) {
								resolve(ip);
							} else {
								reject(new Error('Invalid IP format: ' + ip));
							}
						});
					}).on('error', reject);
				});
				
				logT('p2p', 'Detected external IP:', ip);
				return ip;
			} catch (err) {
				logTW('p2p', 'Failed to detect external IP using', service, ':', err.message);
			}
		}
		
		logTW('p2p', 'Could not detect external IP from any service');
		return null;
	}

	/**
	 * Helper function to get all network interfaces
		* @returns {string[]} Array of multiaddr strings
		*/
	async _getListenAddresses() {
		const addresses = [];
		
		// Try to detect IP addresses from network interfaces
		const interfaces = os.networkInterfaces();
		for (const name in interfaces) {
			const networkInterface = interfaces[name];
			for (const info of networkInterface) {
				// Include both IPv4 and IPv6 addresses that aren't internal
				if (info.family === 'IPv4' && !info.internal) {
					addresses.push(`/ip4/${info.address}/tcp/${5000}`);
					addresses.push(`/ip4/${info.address}/tcp/${5001}/ws`);
				} else if (info.family === 'IPv6' && !info.internal) {
					// Add IPv6 addresses
					addresses.push(`/ip6/${info.address}/tcp/${5000}`);
					addresses.push(`/ip6/${info.address}/tcp/${5001}/ws`);
				}
			}
		}
		
		return addresses;
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
				{ kadDHT, removePrivateAddressesMapper },
				{ pipe }
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
				import('@libp2p/kad-dht'),
				import('it-pipe')
			]);
			
			// Store multiaddr and pipe for later use
			this.multiaddr = multiaddr;
			this.pipe = pipe;

			// Create protocol string
			this.protocol = `/${this.protocolName}/${this.protocolVersion}`;
			
			// Load or generate persistent peer ID
			let peerId;
			peerId = await this._loadOrGeneratePeerId();
			
			const listenAddresses = await this._getListenAddresses();

			// Create and configure libp2p node
			this.node = await createLibp2p({
				privateKey: peerId,
				addresses: {
					listen: [
						`/ip4/0.0.0.0/tcp/${5000}`,
						`/ip4/0.0.0.0/tcp/${5001}/ws`,
						`/ip6/::/tcp/${5000}`,
						`/ip6/::/tcp/${5001}/ws`
					],
					appendAnnounce: _.uniq(listenAddresses)
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
					ping: ping(),
					pubsub: gossipsub({
						allowPublishToZeroPeers: false,
						emitSelf: false
					}),
					dht: kadDHT({
						// protocol: '/rats/kad/1.0.0',
						clientMode: false, // Run as a full DHT node
					}),
					// aminoDHT: kadDHT({
					// 	protocol: '/ipfs/kad/1.0.0',
					// 	peerInfoMapper: removePrivateAddressesMapper
					// }),
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

			// Set up intervals and store their IDs for cleanup
			this.intervals = {};
			
			this.intervals.stats = setInterval(() => {
				this.printPeerStats();
			}, 10000);

			// Add peer pool management
			this.intervals.peerPool = setInterval(() => {
				this._managePeerPool();
			}, 30000);

			logT('p2p', 'my multiaddresses', this.node.getMultiaddrs());

			// Start DHT peer discovery
			this._startDhtDiscovery();

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
			if (this.debug) {
				logT('p2p', 'Connected to peer:', peerId, 'peers:', this.size + 1);
			}

			if (!this.peers.has(peerId)) {
				// Get multiaddrs from the peer connection, not from our node
				const multiaddrs = [];
				try {
					// In newer libp2p versions, we need to get addresses from the peer connection
					const peerInfo = await this.node.peerStore.get(peer);
					if (peerInfo?.addresses) {
						multiaddrs.push(...peerInfo.addresses.map(addr => addr.multiaddr.toString()));
					}
				} catch (err) {
					if (this.debug) {
						logTW('p2p', 'Error getting peer multiaddrs:', err);
					}
				}

				const peerObject = {
					id: peerId,
					peer: peer,
					addresses: multiaddrs,
					connectedAt: Date.now(),
				}
				this.peers.set(peerId, peerObject);
				this.size++;

				// Check protocol compatibility
				if (!await this.sendProtocolCheck(peerId)) {
					this.peersNonProtocol.set(peerId, peerObject);
					this.peersNonProtocolSize++;
					return;
				} else {
					logT('p2p', 'Connected to protocol peer:', peerId, 'peers:', this.size + 1);
				}
				
				// Update status
				if (this.p2pStatus === 0) {
					this.p2pStatus = 2;
					this.send('p2pStatus', this.p2pStatus);
				}
				
				this.events.emit('peer', { id: peerId });
				
				// Set a timeout to disconnect if protocol not verified
				setTimeout(() => {
					if (this.peers.has(peerId) && !this.peers.get(peerId)[this.protocolName]) {
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

		if (this.debug) {
			logT('p2p', 'Disconnected from peer:', peerId, 'peers:', this.size - 1);
		}

		if (this.peers.has(peerId)) {
			this.peers.delete(peerId);
			this.size--;
		}

		if (this.peersProtocol.has(peerId)) {
			logT('p2p', 'Disconnected from protocol peer:', peerId, 'peers:', this.peersProtocolSize - 1);
			this.peersProtocol.delete(peerId);
			this.peersProtocolSize--;
		}

		if (this.peersNonProtocol.has(peerId)) {
			this.peersNonProtocol.delete(peerId);
			this.peersNonProtocolSize--;
		}
	}

	/**
	 * Set up event listeners for the libp2p node
	 */
	_setupEventListeners() {
		// Peer discovery event
		this.node.addEventListener('peer:discovery', (evt) => {
			const peer = evt.detail;
			if (this.debug) {
				logT('p2p', 'Discovered peer:', peer.id.toString());
			}
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
			try {
				for await (const chunk of stream.source) {
					chunks.push(chunk.subarray());
				}
			} catch (err) {
				logTE('p2p', `Error reading from stream from peer ${peerId}:`, err);
				await stream.abort(err);
				return;
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
			if (!isInitTopic && this.peers.has(peerId) && !this.peers.get(peerId)[this.protocolName]) {
				logTW('p2p', `Ignoring message from unverified peer ${peerId} on topic ${topic}`);
				return;
			}

			const messageData = message.data || message;
			
			// Create respond function for request-response pattern
			const respond = async (responseData) => {
				try {
					// Create response message
					const response = {
						data: responseData,
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

	async _handleFileStream({ stream, connection }) {
		try {
			const peerId = connection.remotePeer.toString();
			logT('p2p', 'New file stream from peer', peerId);
			
			// Read the first message which should contain file info
			const chunks = [];
			let fileInfo = null;
			
			try {
				// Read first chunk which should be JSON with file path
				for await (const chunk of stream.source) {
					chunks.push(chunk);
					break; // Only read the first chunk for file info
				}
				
				// Parse the JSON message
				const message = JSON.parse(Buffer.concat(chunks).toString());
				fileInfo = message;
				
				if (!fileInfo || !fileInfo.filename) {
					throw new Error('Invalid file info message');
				}
				
				// Normalize path for consistent handling
				fileInfo.filename = fileInfo.filename.replace(/\\/g, '/');
				
				logT('p2p', 'Received file request for', fileInfo.filename);
			} catch (err) {
				logTE('p2p', 'Error parsing file info message:', err);
				await stream.abort(err);
				return;
			}
			
			// Basic validation checks
			if (!this.dataDirectory) {
				const err = new Error('No data directory configured');
				logTE('p2p', err.message);
				await stream.sink([Buffer.from(JSON.stringify({ error: err.message }))]);
				return;
			}
			
			// Validate the file path
			const filePath = ph.resolve(this.dataDirectory + '/' + fileInfo.filename);
			if (!filePath.includes(this.dataDirectory) || filePath === this.dataDirectory) {
				const err = new Error('File must be from data directory');
				logTE('p2p', err.message);
				await stream.sink([Buffer.from(JSON.stringify({ error: err.message }))]);
				return;
			}
			
			// Check blacklist
			for (const blackWord of this.filesBlacklist) {
				if (filePath.includes(blackWord)) {
					const err = new Error('File is blacklisted');
					logTE('p2p', err.message, filePath, blackWord);
					await stream.sink([Buffer.from(JSON.stringify({ error: 'blacklisted' }))]);
					return;
				}
			}
			
			// Special handling for requests that specify a directory or path that doesn't exist
			const pathExists = fs.existsSync(filePath);
			const isDirectoryRequest = fileInfo.isDirectory || (pathExists && fs.lstatSync(filePath).isDirectory());
			
			// If this is a directory request for a path that doesn't exist, check if parent exists
			if (!pathExists && isDirectoryRequest) {
				// Try to resolve the parent directory to see if it exists
				const parentDir = ph.dirname(filePath);
				if (fs.existsSync(parentDir) && fs.lstatSync(parentDir).isDirectory()) {
					// Send empty directory listing
					logT('p2p', 'Requested directory does not exist, sending empty listing');
					await stream.sink([Buffer.from(JSON.stringify({
						type: 'directory',
						files: []
					}))]);
					return;
				}
			}
			
			// Check if file exists (normal case)
			if (!pathExists) {
				const err = new Error(`File or directory not found: ${fileInfo.filename}`);
				logTE('p2p', err.message);
				await stream.sink([Buffer.from(JSON.stringify({ error: 'not_found' }))]);
				return;
			}
			
			// Handle directory request
			if (isDirectoryRequest) {
				try {
					// Get directory files recursively
					const filesList = directoryFilesRecursive(filePath)
						.map(file => ph.relative(filePath, file).replace(/\\/g, '/'));
					
					// Sort the file list for consistency
					filesList.sort();
					
					// Send directory listing as JSON
					logT('p2p', 'Sending directory listing', filesList.length, 'files');
					await stream.sink([Buffer.from(JSON.stringify({
						type: 'directory',
						files: filesList,
						path: fileInfo.filename
					}))]);
					
					// Close the stream after sending directory listing
					await stream.close();
					return;
				} catch (err) {
					logTE('p2p', 'Error processing directory request:', err);
					await stream.sink([Buffer.from(JSON.stringify({ error: err.message }))]);
					return;
				}
			}
			
			// Open file stream and pipe to sink
			try {
				// Get file stats to include size information
				const stats = fs.statSync(filePath);
				
				// Send metadata response first
				await stream.sink([Buffer.from(JSON.stringify({
					type: 'file',
					size: stats.size,
					lastModified: stats.mtime.toISOString()
				}))]);
				
				// Open the file for reading
				const fileStream = fs.createReadStream(filePath);
				logT('p2p', `Streaming file ${fileInfo.filename} (${stats.size} bytes)`);
				
				// Handle file stream errors
				fileStream.on('error', async (err) => {
					logTE('p2p', 'Error reading file:', err);
					try {
						await stream.abort(err);
					} catch (abortErr) {
						logTE('p2p', 'Error aborting stream:', abortErr);
					}
				});
				
				// Pipe the file stream to the connection
				await this.pipe(fileStream, stream.sink);
				logT('p2p', 'Completed file stream transfer for', fileInfo.filename);
			} catch (err) {
				logTE('p2p', 'Error streaming file:', err);
				await stream.abort(err);
			}
		} catch (err) {
			logTE('p2p', 'Error in file stream handler:', err);
			try {
				await stream.abort(err);
			} catch (closeErr) {
				logTE('p2p', 'Error closing stream after error:', closeErr);
			}
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
			const isPeerVerified = !this.peers.has(from) || this.peers.get(from)[this.protocolName];
			
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
						data: responseData,
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
		// File transfer protocol handler
		this.node.handle(`${this.protocol}/file`, this._handleFileStream.bind(this));

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
				peer[data.protocolName] = true;
				peer.version = data.version;
				peer.info = data.info;

				this.peersProtocol.set(from, peer);
				this.peersProtocolSize++;

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
		
		// Clear all intervals
		if (this.intervals) {
			Object.values(this.intervals).forEach(interval => {
				clearInterval(interval);
			});
			this.intervals = {};
			logT('p2p', 'Cleared all intervals');
		}
		
		// Stop DHT discovery timers
		if (this.dhtTimers) {
			this.dhtTimers.forEach(timer => clearTimeout(timer));
			this.dhtTimers = [];
			logT('p2p', 'Cleared all DHT timers');
		}
		
		// Close any open file transfers
		for (const path in this.filesRequests) {
			logT('p2p', `Cancelling file transfer for ${path}`);
			delete this.filesRequests[path];
		}
		
		// Stop libp2p node
		if (this.node) {
			try {
				logT('p2p', 'Stopping libp2p node');
				await this.node.stop();
				logT('p2p', 'libp2p node stopped');
			} catch (err) {
				logTE('p2p', 'Error stopping libp2p node:', err);
			}
		}
		
		// Clear all maps and collections
		this.peers.clear();
		this.peersProtocol.clear();
		this.peersNonProtocol.clear();
		this.size = 0;
		this.peersProtocolSize = 0;
		this.peersNonProtocolSize = 0;

		this.responseHandlers.clear();
		this.topicHandlers.clear();

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
	 * Check if a peer is a valid libp2p peer object
	 * @param {Object} peer - Peer to check
	 * @returns {boolean} Whether peer is a valid libp2p peer object
	 */
	isPeerId(peer) {
		return peer !== null 
		&& typeof peer === 'object' 
		&& typeof peer.toString === 'function' 
		&& typeof peer.toCID === 'function';
	}

	/**
	 * Attempt connection to a discovered peer
	 * @param {Object} peer - Peer to connect to
	 * @param {Object} options - Options
	 * @param {boolean} options.protocol - Connect to protocol peer
	 * @returns {Promise<void>}
	 */
	async _attemptConnection(peer, options = {}) {
		if (this.closing) {
			logTW('p2p', 'Not connecting to peer', peer, 'because node is closing');
			return;
		}

		if (!peer) {
			logTE('p2p', 'No peer provided for connection attempt');
			return;
		}

		const isProtocolPeer = peer.protocol || options.protocol || peer[this.protocolName];

		if (!await this._managePeerPool({ protocol: isProtocolPeer })) {
			if (this.debug) {
				logTW('p2p', 'Not connecting to peer', peer, 'because of peer pool management');
			}
			return;
		}
		
		let dialTarget = null;
		
		// Case 1: It's a libp2p peer object with _peerId
		if (this.isPeerId(peer)) {
			dialTarget = peer;
		} 
		// Case 2: It's our own object format with id and possibly addresses
		else if (peer.id) {
			try {
				// If peer.id is a string PeerId, use it directly
				dialTarget = peer.id;
				
				// If we have addresses, create multiaddrs for dialing
				if (peer.addresses && Array.isArray(peer.addresses) && peer.addresses.length > 0) {
					// For peer objects with addresses array, create multiaddrs
					const addresses = peer.addresses.map(addr => {
						// If address is already a multiaddr, use it directly
						if (typeof addr === 'object') return addr;
						// Otherwise create a new multiaddr from string
						return this.multiaddr(addr);
					});
					
					// If there are addresses, use array of multiaddrs
					if (addresses.length > 0) {
						dialTarget = addresses;
					}
				}
			} catch (err) {
				logTE('p2p', 'Error creating multiaddr for peer', peer.id, err.message);
			}
		}

		// If we couldn't create a valid dialTarget, log and return
		if (!dialTarget) {
			logTE('p2p', 'Could not create a valid dial target from peer', peer);
			return;
		}

		if (this.debug) {
			logT('p2p', 'Attempt connection to', dialTarget);
		}

		try {
			await this.node.dial(dialTarget);
		} catch (err) {
			if (this.debug) {
				logTE('p2p', 'Failed to connect to discovered peer', dialTarget, err.message, peer);
			}
		}
	}

	/**
	 * Add a peer by address
	 * @param {Object} peer - Peer address info
	 * @param {Object} options - Options
	 * @param {boolean} options.protocol - Connect to protocol peer
	 * @returns {Promise<void>}
	 */
	async add(peer, options = {}) {
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

		await this._attemptConnection(peer, options);
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
		}, { silent: true });
	}

	/**
	 * Send message to specific peer or topic
	 * @param {string} peerId - ID of the peer (null for broadcast)
	 * @param {string} topic - Topic to publish to
	 * @param {Object} data - Data to send
	 * @returns {boolean} Success status
	 */
	async sendToPeer(peerId, topic, data, options = {}) {
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
				!this.peers.get(peerId)[this.protocolName]) {
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
					if (!options.silent) {
						logTW('p2p', `Error dialing peer ${peerId}`, err);
					}
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
	 * Download file or directory using p2p
	 * @param {string} path - File or directory path
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
			logTE('transfer', 'No path specified for transfer');
			return false;
		}

		// Normalize path to ensure consistent handling
		const normalizedPath = path.replace(/\\/g, '/');

		// Check if already downloading
		if (this.filesRequests[normalizedPath]) {
			logT('transfer', 'Already downloading', normalizedPath, 'returning existing request');
			return await this.filesRequests[normalizedPath];
		}

		logT('transfer', 'New transfer request', normalizedPath);

		const promise = new Promise(async (resolve) => {
			try {
				// Normalize paths
				const realPath = (targetPath || normalizedPath).replace(/\\/g, '/');
				const filePath = ph.join(this.dataDirectory, realPath);
				const tmpPath = ph.join(this.dataDirectory, realPath.split('/').map(p => p + '.tmp').join('/'));
				
				// Validate target path is within data directory
				if (!filePath.startsWith(this.dataDirectory)) {
					throw new Error('File destination outside data directory');
				}

				// Create temporary directory for downloading
				await mkdirp(ph.dirname(tmpPath));
				
				// Connect to peer if specified, otherwise try to find peer with file
				let peerToUse = remotePeer;
				if (!peerToUse) {
					// If no specific peer was provided, we could implement peer discovery here
					// For now, just fail if no peer specified
					logTE('transfer', 'No peer specified for transfer');
					resolve(false);
					return;
				}
				
				// Determine if this is likely a directory request
				// We'll treat paths ending with '/' or without extensions as potential directories
				const isDirectoryRequest = normalizedPath.endsWith('/') || 
					!ph.extname(normalizedPath);
				
				try {
					const peerObj = this.peers.get(peerToUse).peer;
					if (!peerObj) {
						throw new Error(`Peer ${peerToUse} not found`);
					}
					
					// Open a direct stream to the peer for file transfer
					const stream = await this.node.dialProtocol(peerObj, `${this.protocol}/file`);
					
					// Set up a timeout for the transfer
					const transferTimeout = setTimeout(() => {
						logTE('transfer', 'Transfer timed out', normalizedPath);
						stream.abort(new Error('Transfer timeout'))
							.catch(err => logTE('transfer', 'Error aborting stream on timeout', err));
						resolve(false);
					}, 30000); // 30-second timeout
					
					// Send the initial message with file info
					const fileInfoMsg = {
						filename: normalizedPath,
						isDirectory: isDirectoryRequest
					};
					
					// Convert to buffer and send
					const fileInfoBuffer = Buffer.from(JSON.stringify(fileInfoMsg));
					await stream.sink([fileInfoBuffer]);
					
					// Read the response from the stream - first chunk contains metadata
					let firstChunk = null;
					let metadata = null;
					
					for await (const chunk of stream.source) {
						firstChunk = chunk;
						break;
					}
					
					if (!firstChunk) {
						throw new Error('No response from peer');
					}
					
					try {
						metadata = JSON.parse(firstChunk.toString());
					} catch (err) {
						logTE('transfer', 'Failed to parse metadata', err);
						throw new Error('Invalid metadata response');
					}
					
					clearTimeout(transferTimeout);
					
					// Handle error response
					if (metadata.error) {
						logTE('transfer', 'Error from peer during transfer', normalizedPath, metadata.error);
						resolve(false);
						return;
					}
					
					// Handle directory listing
					if (metadata.type === 'directory' && metadata.files) {
						logT('transfer', 'Received directory listing', metadata.files.length, 'files');
						
						// Create directory structure
						await mkdirp(tmpPath);
						
						// Create directory in final location too
						await mkdirp(filePath);
						
						if (metadata.files.length === 0) {
							// Empty directory, just consider it done
							logT('transfer', 'Directory is empty', normalizedPath);
							resolve(true);
							return;
						}
						
						// Transfer all files in directory
						const transferPromises = metadata.files.map(relativeFile => {
							// Join the base path with the relative file path
							const fullPath = normalizedPath.endsWith('/') ? 
								normalizedPath + relativeFile : 
								`${normalizedPath}/${relativeFile}`;
							
							// Calculate the proper target path
							const fileTargetPath = ph.join(realPath, relativeFile).replace(/\\/g, '/');
							
							return this.file(fullPath, fileTargetPath, peerToUse, true);
						});
						
						// Start transfers in parallel but limit concurrency
						const batchSize = 5; // Process 5 files at a time
						const results = [];
						
						for (let i = 0; i < transferPromises.length; i += batchSize) {
							const batch = transferPromises.slice(i, i + batchSize);
							const batchResults = await Promise.all(batch);
							results.push(...batchResults);
						}
						
						// Process rename callbacks
						const renameResults = await Promise.all(
							results.filter(Boolean).map(renameCallback => renameCallback())
						);
						
						if (renameResults.every(Boolean)) {
							logT('transfer', 'Successfully transferred all files from directory', normalizedPath);
							resolve(true);
						} else {
							const failedCount = renameResults.filter(r => !r).length;
							logTE('transfer', `${failedCount} files failed to transfer from directory ${normalizedPath}`);
							resolve(false);
						}
						return;
					}
					
					// Regular file transfer - create write stream
					const fileStream = fs.createWriteStream(tmpPath);
					
					// Track if we received any data
					let dataReceived = false;
					
					// If the first chunk doesn't look like JSON metadata, treat it as file data
					if (metadata.type === 'file') {
						logT('transfer', `Starting file transfer (${metadata.size || 'unknown'} bytes) for`, normalizedPath);
					} else if (!metadata.type && metadata.error === undefined) {
						// Probably raw file data, not metadata
						fileStream.write(firstChunk);
						dataReceived = true;
					}
					
					try {
						// Continue reading stream for file content
						for await (const chunk of stream.source) {
							dataReceived = true;
							const success = fileStream.write(chunk);
							
							// Handle backpressure
							if (!success) {
								await new Promise(resolve => fileStream.once('drain', resolve));
							}
						}
						
						// Close the file when done
						fileStream.end();
						await new Promise(resolve => fileStream.once('close', resolve));
						
						if (!dataReceived) {
							logTE('transfer', 'No data received for file', normalizedPath);
							resolve(false);
							return;
						}
						
						logT('transfer', 'Completed file transfer for', normalizedPath);
						
						// If successful, create rename callback
						const renameCallback = async () => {
							try {
								await mkdirp(ph.dirname(filePath));
								fs.renameSync(tmpPath, filePath);
								logT('transfer', 'Successfully moved file from tmp to destination', filePath);
								return true;
							} catch (err) {
								logTE('transfer', 'Error moving file from tmp to destination', err);
								return false;
							}
						};
						
						// Return rename callback or execute it based on parent flag
						resolve(parent ? renameCallback : await renameCallback());
					} catch (err) {
						logTE('transfer', 'Error reading file data', err);
						fileStream.end();
						resolve(false);
					}
					
				} catch (err) {
					logTE('transfer', 'Error in transfer', normalizedPath, err);
					resolve(false);
				}
				
			} catch (err) {
				logTE('transfer', 'Error in transfer setup', normalizedPath, err);
				resolve(false);
			}
		});
		
		// Track the current request
		this.filesRequests[normalizedPath] = promise;
		
		// Clean up the request tracking when done
		promise.finally(() => {
			delete this.filesRequests[normalizedPath];
		});
		
		return promise;
	}

	/**
	 * Print peer stats to console
	 * Shows total peer count and connection duration for each peer in a readable format
	 */
	printPeerStats() {
		const now = Date.now();
		
		const protocolPeers = this.protocolPeersList();
		const nonProtocolPeers = this.nonProtocolPeersList();
		
		console.log(`\n===== P2P Network Stats =====`);
		console.log(`Total peers connected: ${this.size}`);
		console.log(`Protocol peers: ${protocolPeers.length}`);
		console.log(`Non-protocol peers: ${nonProtocolPeers.length}`);
		
		if (this.size === 0) {
			console.log('No peers currently connected');
			console.log(`============================\n`);
			return;
		}
		
		console.log('\nPeer Details:');
		console.log('-------------------------------------------------');
		console.log('| Peer ID                                 | Connected For      | Protocol   |');
		console.log('-------------------------------------------------');
		
		// Helper to format duration in a readable way
		const formatDuration = (ms) => {
			const seconds = Math.floor(ms / 1000);
			const minutes = Math.floor(seconds / 60);
			const hours = Math.floor(minutes / 60);
			const days = Math.floor(hours / 24);
			
			if (days > 0) {
				return `${days}d ${hours % 24}h`;
			} else if (hours > 0) {
				return `${hours}h ${minutes % 60}m`;
			} else if (minutes > 0) {
				return `${minutes}m ${seconds % 60}s`;
			} else {
				return `${seconds}s`;
			}
		};
		
		// Sort peers by connection time (oldest first)
		const sortedPeers = Array.from(this.peers.values())
			.sort((a, b) => a.connectedAt - b.connectedAt);
		
		// Print each peer's details
		for (const peer of sortedPeers) {
			const peerId = peer.id.substring(0, 36) + (peer.id.length > 36 ? '...' : '');
			const duration = formatDuration(now - peer.connectedAt);
			const protocol = peer[this.protocolName] ? this.protocolName : 'Unknown';
			
			console.log(`| ${peerId.padEnd(39)} | ${duration.padEnd(17)} | ${protocol.padEnd(10)} |`);
		}
		
		console.log('-------------------------------------------------');
		console.log(`============================\n`);
	}

	/**
	 * Get list of connected peers
	 * @returns {Array} List of connected peers
	 */
	peersList() {
		return Array.from(this.peers.values());
	}

	/**
	 * Get list of peers that have been verified for our protocol
	 * @returns {Array} List of protocol peers
	 */
	protocolPeersList() {
		return Array.from(this.peersProtocol.values());
	}

	/**
	 * Get list of peers that have not been verified for our protocol
	 * @returns {Array} List of non-protocol peers
	 */
	nonProtocolPeersList() {
		return Array.from(this.peersNonProtocol.values());
	}

	/**
	 * Get recommended list of peers to share
	 * @returns {Array} Recommended peers list
	 */
	recommendedPeersList() {
		// Get protocol peers since they're more reliable to share
		const protocolPeers = this.protocolPeersList();
		
		// If we don't have any protocol peers, return empty list
		if (protocolPeers.length === 0) {
			return []; // no list
		}

		// Get 4 random protocol peers
		let peers = shuffle(protocolPeers).slice(0, 4);
		
		// Add 2 protocol peers with highest torrents count 
		peers = peers.concat(
			_.orderBy(protocolPeers, peer => peer.info && peer.info.torrents, 'desc').slice(0, 2)
		);
		
		// Add 2 protocol peers with most available connections
		peers = peers.concat(
			_.orderBy(protocolPeers, 
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
			.map(peer => ({
				id: peer.id,
				addresses: peer.addresses,
				[this.protocolName]: peer[this.protocolName],
			}));
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
	async _disconnectPeer(peerId) {
		if (this.debug) {
			logT('p2p', 'Disconnecting peer', peerId);
		}
		try {
			await this.node.hangUp(peerId);
		} catch (err) {
			logTE('p2p', 'Error hanging up connection to peer', peerId, err);
		}
	}

	/**
	 * Start DHT-based peer discovery
	 */
	async _startDhtDiscovery() {
		try {
			if (!this.node || !this.node.services.dht) {
				logTW('p2p', 'DHT service not available for peer discovery');
				return;
			}

			logT('p2p', 'Starting DHT-based peer discovery');

			// Import CID from multiformats for proper routing key format
			const { CID } = await import('multiformats/cid');
			const { sha256 } = await import('multiformats/hashes/sha2');

			// Create a hash of our protocol identifier
			const routingKeyText = `/rats/${this.protocolVersion}`;
			const routingKeyBytes = new TextEncoder().encode(routingKeyText);
			const hash = await sha256.digest(routingKeyBytes);

			// Create a CID from the hash (using raw codec 0x55)
			const routingKey = CID.create(1, 0x55, hash);

			// Initialize timers array for cleanup
			this.dhtTimers = [];

			const provideContent = async () => {
				if (this.closing) return;

				try {
					logT('p2p-dht', 'Providing content to DHT with CID:', routingKey.toString());
					await this.node.contentRouting.provide(routingKey);
					logT('p2p-dht', 'Content provided to DHT with CID:', routingKey.toString());
				} catch (err) {
					logTE('p2p-dht', 'Error providing content to DHT:', err);
				}

				if (!this.closing) {
					const timer = setTimeout(provideContent, 60000); // Run every minute
					this.dhtTimers.push(timer);
				}
			};

			// Function to discover peers periodically
			const discoverPeers = async () => {
				if (this.closing) return;
				
				try {		
					// Then find other providers
					logT('p2p-dht', 'Querying DHT for peers with CID:', routingKey.toString());
					
					// Find providers for our protocol
					for await (const provider of this.node.contentRouting.findProviders(routingKey)) {
						const providerId = provider.id.toString();
						
						// Skip if it's us
						if (providerId === this.peerId) {
							continue;
						}
						
						logT('p2p-dht', 'Found provider peer in DHT:', providerId);
						this.add(provider, { protocol: true }); // Add as protocol peer
					}
				} catch (err) {
					logTE('p2p-dht', 'Error during DHT peer discovery:', err);
				}

				if (!this.closing) {
					const timer = setTimeout(discoverPeers, 120000); // Run every 2 minutes
					this.dhtTimers.push(timer);
				}
			};
			
			// Start the DHT processes (uncomment when needed)
			const timer1 = setTimeout(provideContent, 1000);
			const timer2 = setTimeout(discoverPeers, 1000);
			this.dhtTimers.push(timer1, timer2);
		} catch (err) {
			logTE('p2p', 'Failed to start DHT discovery:', err);
		}
	}

	/**
	 * Perform periodic management of the peer pool
	 * Ensures we maintain a healthy ratio of protocol to non-protocol peers
	 * @returns {boolean} True if we should continue connection to peer
	 */
	async _managePeerPool(options = {}) {
		if (this.closing) {
			return false;
		}

		// If we have no protocol peers, we keep all non-protocol peers to faster protocol peers discovery
		if (this.peersProtocolSize == 0) {
			return true;
		}
		
		const protocolPeers = this.protocolPeersList();
		const nonProtocolPeers = this.nonProtocolPeersList();
		
		if (this.debug) {
			logT('p2p', `Peer pool: ${protocolPeers.length} protocol peers, ${nonProtocolPeers.length} non-protocol peers`);
		}
		
		const roomSizeForNonProtocolPeers = Math.max(0, this.maxSize - protocolPeers.length);
		const nonProtocolPeersToDisconnect = nonProtocolPeers.length - roomSizeForNonProtocolPeers;
		if (nonProtocolPeersToDisconnect > 0) {
			const peersToDisconnect = nonProtocolPeers.slice(0, nonProtocolPeersToDisconnect);
			if (this.debug) {
				logT('p2p', `Disconnecting ${peersToDisconnect.length} non-protocol peers to maintain peer pool health`);
			}
			for (const peer of peersToDisconnect) {
				await this._disconnectPeer(peer.id);
			}
		}

		if (options.protocol) {
			if (protocolPeers.length < this.maxSize) {
				return true;
			} else {
				return false;
			}
		} else {
			const initialBoost = Math.max(0, 3 - protocolPeers.length);
			if (this.size >= this.maxSize + (this.maxSize * initialBoost)) {
				return false;
			} else {
				return true;
			}
		}

		return false;
	}
}

module.exports = P2P;