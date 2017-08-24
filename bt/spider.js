'use strict'

const dgram = require('dgram')
const Emiter = require('events')
const bencode = require('bencode')
const {Table, Node} = require('./table')
const Token = require('./token')
const cpuUsage = require('./cpu-usage')
const config = require('../config')
const fs = require('fs')

const _debug = require('debug')
const cpuDebug = _debug('spider:cpu')
const trafficDebug = _debug('spider:traffic')

const bootstraps = [{
    address: 'router.bittorrent.com',
    port: 6881
}, {
    address: 'router.utorrent.com',
    port: 6881
}, {
    address: 'dht.transmissionbt.com',
    port: 6881
}, {
    address: 'dht.aelitis.com',
    port: 6881
}]

function isValidPort(port) {
    return port > 0 && port < (1 << 16)
}

function generateTid() {
    return parseInt(Math.random() * 99).toString()
}

class Spider extends Emiter {
    constructor(client) {
        super()
        const options = arguments.length? arguments[0]: {}
        this.udp = dgram.createSocket('udp4')
        this.table = new Table(options.tableCaption || 1000)
        this.bootstraps = options.bootstraps || bootstraps
        this.token = new Token()
        this.client = client
        this.ignore = false; // ignore all requests
        this.initialized = false;
        this.trafficSpeed = 0

        this.walkInterval = config.spider.walkInterval;
        this.cpuLimit = config.spider.cpuLimit;
        this.cpuInterval = config.spider.cpuInterval;
    }

    send(message, address) {
        const data = bencode.encode(message)
        this.udp.send(data, 0, data.length, address.port, address.address)
    }

    findNode(id, address) {
        const message = {
            t: generateTid(),
            y: 'q',
            q: 'find_node',
            a: {
                id: id,
                target: Node.generateID()
            }
        }
        this.send(message, address)
    }

    join() {
        this.bootstraps.forEach((bootstrap) => {
            this.findNode(this.table.id, bootstrap)
        })
    }

    walk() {
    	if(!this.client || this.client.isIdle()) {
            if(
                !this.ignore 
                && (this.cpuLimit <= 0 || cpuUsage() < this.cpuLimit + this.cpuInterval)
                && (config.trafficMax <= 0 || this.trafficSpeed == 0 || this.trafficSpeed < config.trafficMax)
            ) 
            {
                const node = this.table.shift()
                if (node) {
                    this.findNode(Node.neighbor(node.id, this.table.id), {address: node.address, port: node.port})
                }
            }
    	}
        setTimeout(()=>this.walk(), this.walkInterval)
    }

    onFoundNodes(data) {
        const nodes = Node.decodeNodes(data)
        nodes.forEach((node) => {
            if (node.id != this.table.id && isValidPort(node.port)) {
                this.table.add(node)
            }
        })
        this.emit('nodes', nodes)
    }

    onFindNodeRequest(message, address) {
        if(this.cpuLimit > 0 && cpuUsage() > this.cpuLimit) {
            return
        }

    	const {t: tid, a: {id: nid, target: infohash}} = message

        if (tid === undefined || target.length != 20 || nid.length != 20) {
            return
        }

        this.send({
            t: tid,
            y: 'r',
            r: {
                id: Node.neighbor(nid, this.table.id),
                nodes: Node.encodeNodes(this.table.first())
            }
        }, address)
    }

    onGetPeersRequest(message, address) {
        if(this.cpuLimit > 0 && cpuUsage() > this.cpuLimit) {
            return
        }

        const {t: tid, a: {id: nid, info_hash: infohash}} = message

        if (tid === undefined || infohash.length != 20 || nid.length != 20) {
            return
        }

        this.send({
            t: tid,
            y: 'r',
            r: {
                id: Node.neighbor(nid, this.table.id),
                nodes: Node.encodeNodes(this.table.first()),
                token: this.token.token
            }
        }, address)

        this.emit('unensureHash', infohash.toString('hex').toUpperCase())
    }

    onAnnouncePeerRequest(message, address) {
        let {t: tid, a: {info_hash: infohash, token: token, id: id, implied_port: implied, port: port}} = message
        if (!tid) return

        if (!this.token.isValid(token)) return
       
        port = (implied != undefined && implied != 0) ? address.port : (port || 0)
        if (!isValidPort(port)) return

        this.send({ t: tid, y: 'r', r: { id: Node.neighbor(id, this.table.id) } }, address)

        let addressPair = {
            address: address.address,
            port: port
        };
    	this.emit('ensureHash', infohash.toString('hex').toUpperCase(), addressPair)
        if(this.client && !this.ignore) {
            cpuDebug('cpu usage:' + cpuUsage())
            if(this.cpuLimit <= 0 || cpuUsage() <= this.cpuLimit + this.cpuInterval) {
                this.client.add(addressPair, infohash);
            }
        }
    }

    onPingRequest(message, address) {
    	this.send({ t: message.t, y: 'r', r: { id: Node.neighbor(message.a.id, this.table.id) } }, address)
    }

    parse(data, address) {
        try {
            const message = bencode.decode(data)
            if (message.y.toString() == 'r' && message.r.nodes) {
                this.onFoundNodes(message.r.nodes)
            } else if (message.y.toString() == 'q') {
            	switch(message.q.toString()) {
            		case 'get_peers':
            		this.onGetPeersRequest(message, address)
            		break
            		case 'announce_peer':
            		this.onAnnouncePeerRequest(message, address)
            		break
            		case 'find_node':
            		this.onFindNodeRequest(message, address)
            		break
            		case 'ping':
            		this.onPingRequest(message, address)
            		break
            	}
            }
        } catch (err) {}
    }

    listen(port) {
        if(this.initialized)
            return
        this.initialized = true

        this.udp.bind(port)
        this.udp.on('listening', () => {
            console.log(`Listen DHT protocol on ${this.udp.address().address}:${this.udp.address().port}`)
        })
        this.udp.on('message', (data, addr) => {
            this.parse(data, addr)
        })
        this.udp.on('error', (err) => {})
        setInterval(() => { 
            if(!this.client || this.client.isIdle()) {
                this.join()
            }
        }, 3000)
        this.join()
        this.walk()

        if(config.trafficMax > 0)
        {
            const path = `/sys/class/net/${config.trafficInterface}/statistics/rx_bytes`
            if(fs.existsSync(path))
            {
                let traffic = 0
                setInterval(() => { 
                    fs.readFile(path, (err, newTraffic) => {
                        if(err)
                            return

                        if(traffic === 0)
                            traffic = newTraffic

                        this.trafficSpeed = (newTraffic - traffic) / config.trafficUpdateTime

                        trafficDebug('traffic rx', this.trafficSpeed / 1024, 'kbps/s')

                        traffic = newTraffic
                    })
                }, 1000 * config.trafficUpdateTime)
            }
        }
    }
}

module.exports = Spider