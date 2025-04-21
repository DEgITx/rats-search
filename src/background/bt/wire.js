'use strict';

import stream from 'stream';
import crypto from 'crypto';
import util from 'util';

import BitField from 'bitfield';
import bencode from 'bencode';

import { Node } from './table.js';

const BT_RESERVED = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x10, 0x00, 0x01]);
const BT_PROTOCOL = Buffer.from('BitTorrent protocol');
const PIECE_LENGTH = Math.pow(2, 14);
const MAX_METADATA_SIZE = 10000000;
const BITFIELD_GROW = 1000;
const EXT_HANDSHAKE_ID = 0;
const BT_MSG_ID = 20;

var Wire = function(infohash) {
	stream.Duplex.call(this);

	this._bitfield = new BitField(0, { grow: BITFIELD_GROW });
	this._infohash = infohash;

	this._buffer = [];
	this._bufferSize = 0;

	this._next = null;
	this._nextSize = 0;

	this._metadata = null;
	this._metadataSize = null;
	this._numPieces = 0;
	this._ut_metadata = null;

	this._onHandshake();
}

util.inherits(Wire, stream.Duplex);

Wire.prototype._onMessageLength = function (buffer) {
	if (buffer.length >= 4) {
		var length = buffer.readUInt32BE(0);
		if (length > 0) {
			this._register(length, this._onMessage)
		}
	}
};

Wire.prototype._onMessage = function (buffer) {
	this._register(4, this._onMessageLength)
	if (buffer[0] == BT_MSG_ID) {
		this._onExtended(buffer.readUInt8(1), buffer.slice(2));
	}
};

Wire.prototype._onExtended = function(ext, buf) {
	if (ext === 0) {
		try {
			this._onExtHandshake(bencode.decode(buf));
		}
		catch (err) {
			this._fail();
		}
	}
	else {
		this._onPiece(buf);
	}
};

Wire.prototype._register = function (size, next) {
	this._nextSize = size;
	this._next = next;
};

Wire.prototype.end = function() {
	stream.Duplex.prototype.end.apply(this, arguments);
};

Wire.prototype._onHandshake = function() {
	this._register(1, function(buffer) {
		if (buffer.length == 0) {
			this.end();
			return this._fail();
		}
		var pstrlen = buffer.readUInt8(0);
		this._register(pstrlen + 48, function(handshake) {
			var protocol = handshake.slice(0, pstrlen);
			if (protocol.toString() !== BT_PROTOCOL.toString()) {
				this.end();
				this._fail();
				return;
			}
			handshake = handshake.slice(pstrlen);
			if ( !!(handshake[5] & 0x10) ) {
				this._register(4, this._onMessageLength);
				this._sendExtHandshake();
			}
			else {
				this._fail();
			}
		}.bind(this));
	}.bind(this));
};

Wire.prototype._onExtHandshake = function(extHandshake) {
	if (!extHandshake.metadata_size || !extHandshake.m.ut_metadata
            || extHandshake.metadata_size > MAX_METADATA_SIZE) {
		this._fail();
		return;
	}

	this._metadataSize = extHandshake.metadata_size;
	this._numPieces = Math.ceil(this._metadataSize / PIECE_LENGTH);
	this._ut_metadata = extHandshake.m.ut_metadata;

	this._requestPieces();
}

Wire.prototype._requestPieces = function() {
	this._metadata = new Buffer(this._metadataSize);
	for (var piece = 0; piece < this._numPieces; piece++) {
		this._requestPiece(piece);
	}
};

Wire.prototype._requestPiece = function(piece) {
	var msg = Buffer.concat([
		new Buffer([BT_MSG_ID]),
		new Buffer([this._ut_metadata]),
		bencode.encode({msg_type: 0, piece: piece})
	]);
	this._sendMessage(msg);
};

Wire.prototype._sendPacket = function(packet) {
	this.push(packet);
};

Wire.prototype._sendMessage = function(msg) {
	var buf = new Buffer(4);
	buf.writeUInt32BE(msg.length, 0);
	this._sendPacket(Buffer.concat([buf, msg]));
};

Wire.prototype.sendHandshake = function() {
	var peerID = Node.generateID();
	var packet = Buffer.concat([
		new Buffer([BT_PROTOCOL.length]),
		BT_PROTOCOL, BT_RESERVED, this._infohash,  peerID
	]);
	this._sendPacket(packet);
};

Wire.prototype._sendExtHandshake = function() {
	var msg = Buffer.concat([
		new Buffer([BT_MSG_ID]),
		new Buffer([EXT_HANDSHAKE_ID]),
		bencode.encode({m: {ut_metadata: 1}})
	]);
	this._sendMessage(msg);
};

Wire.prototype._onPiece = function(piece) {
	var dict, trailer;
	try {
		var str = piece.toString();
		var trailerIndex = str.indexOf('ee') + 2;
		dict = bencode.decode(str.substring(0, trailerIndex));
		trailer = piece.slice(trailerIndex);
	}
	catch (err) {
		this._fail();
		return;
	}
	if (dict.msg_type != 1) {
		this._fail();
		return;
	}
	if (trailer.length > PIECE_LENGTH) {
		this._fail();
		return;
	}
	trailer.copy(this._metadata, dict.piece * PIECE_LENGTH);
	this._bitfield.set(dict.piece);
	this._checkDone();
};

Wire.prototype._checkDone = function () {
	var done = true;
	for (var piece = 0; piece < this._numPieces; piece++) {
		if (!this._bitfield.get(piece)) {
			done = false;
			break;
		}
	}
	if (!done) {
		return
	}
	this._onDone(this._metadata);
};

Wire.prototype._onDone = function(metadata) {
	try {
		var info = bencode.decode(metadata).info;
		if (info) {
			metadata = bencode.encode(info);
		}
	}
	catch (err) {
		this._fail();
		return;
	}
	var infohash = crypto.createHash('sha1').update(metadata).digest('hex');
	if (this._infohash.toString('hex') != infohash ) {
		this._fail();
		return false;
	}
	this.emit('metadata', {info: bencode.decode(metadata, 'utf8')}, this._infohash);
};

Wire.prototype._fail = function() {
	this.emit('fail');
};

Wire.prototype._write = function (buf, encoding, next) {
	this._bufferSize += buf.length;
	this._buffer.push(buf);

	while (this._bufferSize >= this._nextSize) {
		var buffer = Buffer.concat(this._buffer);
		this._bufferSize -= this._nextSize;
		this._buffer = this._bufferSize
			? [buffer.slice(this._nextSize)]
			: [];
		this._next(buffer.slice(0, this._nextSize));
	}

	next(null);
}

Wire.prototype._read = function() {
	// do nothing
};

export default Wire;
