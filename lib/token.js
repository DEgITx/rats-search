'use strict'

module.exports = class {
	constructor() {
		this.generate()
		setInterval(()=> this.generate(), 60000*15)
	}

	isValid(t) {
		return t.toString() === this.token.toString()
	}

	generate() {
		this.token = new Buffer([parseInt(Math.random()*200), parseInt(Math.random()*200)])
	}
}