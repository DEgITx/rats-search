'use strict'

export default class Token {
	constructor() {
		this.generate()
		const it = setInterval(() => this.generate(), 60000 * 15)
		it.unref()
	}

	isValid(t) {
		return t.toString() === this.token.toString()
	}

	generate() {
		this.token = Buffer.from([parseInt(Math.random() * 200), parseInt(Math.random() * 200)])
	}
}