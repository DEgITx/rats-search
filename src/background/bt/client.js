'use strict'

import Emiter from 'events';
import util from 'util';
import net from 'net';

import PeerQueue from './peer-queue.js';
import Wire from './wire.js';
import debug from 'debug';
import config from '../config.js';

const debugLog = debug('downloader');

class Client extends Emiter
{
	constructor(options) {
		super();
		this.timeout = config.downloader.timeout;
		this.maxConnections = config.downloader.maxConnections;
		debugLog('timeout', this.timeout)
		debugLog('maxConnections', this.maxConnections)
		this.activeConnections = 0;
		this.peers = new PeerQueue(this.maxConnections);
		this.on('download', this._download);

		// if (typeof options.ignore === 'function') {
		//    this.ignore = options.ignore;
		//}
		//else {
		this.ignore = function (infohash, rinfo, ignore) {
			ignore(false);
		};
		// }
	}

	_next(infohash, successful) {
		var req = this.peers.shift(infohash, successful);
		if (req) {
			this.ignore(req.infohash.toString('hex'), req.rinfo, (drop) => {
				if (!drop) {
					this.emit('download', req.rinfo, req.infohash);
				}
			});
		}
	}

	_download(rinfo, infohash)
	{
		debugLog('start download', infohash.toString('hex'), 'connections', this.activeConnections);
		this.activeConnections++;

		// move host -> address
		if(rinfo.host)
		{
			rinfo = Object.assign({}, rinfo)
			rinfo.address = rinfo.host
			delete rinfo.host
		}
		var successful = false;
		var socket = new net.Socket();

		socket.setTimeout(this.timeout || 5000);
		socket.connect(rinfo.port, rinfo.address, () => {
			var wire = new Wire(infohash);
			socket.pipe(wire).pipe(socket);

			wire.on('metadata', (metadata, infoHash) => {
				successful = true;
				debugLog('successfuly downloader', infoHash, rinfo);
				this.emit('complete', metadata, infoHash, rinfo);
				socket.destroy();
			});

			wire.on('fail', () => {
				socket.destroy();
			});

			wire.sendHandshake();
		});

		socket.on('error', (err) => {
			socket.destroy();
		});

		socket.on('timeout', (err) => {
			socket.destroy();
		});

		socket.once('close', () => {
			this.activeConnections--;
			this._next(infohash, successful);
		});
	}

	add(rinfo, infohash) {
		this.peers.push({infohash: infohash, rinfo: rinfo});
		if (this.activeConnections < this.maxConnections && this.peers.length() > 0) {
			this._next();
		}
	}

	isIdle() {
		return this.peers.length() === 0;
	}
}

export default Client;