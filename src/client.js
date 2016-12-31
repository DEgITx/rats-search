'use strict'

const Emiter = require('events')
var util = require('util');
var net = require('net');

var PeerQueue = require('./peer-queue');
var Wire = require('./wire');


class Client extends Emiter
{
    constructor(options) {
    	super();
        this.timeout = 5000;
        this.maxConnections = 200;
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
        console.log('start download ' + infohash.toString('hex'));
        this.activeConnections++;

        var successful = false;
        var socket = new net.Socket();

        socket.setTimeout(this.timeout || 5000);
        socket.connect(rinfo.port, rinfo.address, () => {
            var wire = new Wire(infohash);
            socket.pipe(wire).pipe(socket);

            wire.on('metadata', (metadata, infoHash) => {
                successful = true;
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

module.exports = Client;