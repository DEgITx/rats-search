const { assert } = require('chai')
const Rutracker = require('../../src/background/strategies/rutracker.js')

describe("rutracker", () => {
	let rutracker = new Rutracker();

	it("findHash", async function() {
		const data = await rutracker.findHash('FFEDA8DF683F34A08BE89026114E6C05F881DCCE')
		assert.equal(data.name, '(Vocaloid, Metalcore, Deathcore, Dubstep) Rice Records - Bleak Times Ahead - 2013, MP3, 320 kbps')
		assert.equal(data.poster, 'http://i51.fastpic.ru/big/2013/0225/b1/c53d9e3253ac8ade321d7bed32d898b1.jpg')
	})

	it("notFound", async function() {
		assert(!await rutracker.findHash('FFEDA8DF683F34A08BE89026114E6C05F881DCC0'))
	})

	it("parse", async function() {
		rutracker.threadId = 4220109
		const data = await rutracker.parse()
		assert.equal(data.name, '(Doom metal / Melodic metal / Instrumental) Folie A Deux - Demo - 2012, MP3, 128-320 kbps')
		assert.equal(data.poster, 'http://i44.fastpic.ru/big/2012/1018/a2/4e8740f608387b32b74c5deea72d05a2.jpg')
		assert.equal(data.rutrackerThreadId, 4220109)
	})
});
