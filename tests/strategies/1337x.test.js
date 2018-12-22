const { assert } = require('chai')
const Strategy = require('../../src/background/strategies/1337x.js')

describe("1337x", () => {
	let strategy = new Strategy();

	it("findHash", async function() {
		const data = await strategy.findHash('1734BCCAA7B05BD4D77B86E17820C840BF0C2EF5')
		assert.equal(data.name, 'DEgITx - Discography (01.10.2016) FLAC')
		assert.equal(data.poster, 'http://i58.fastpic.ru/big/2014/0224/62/eec1c9dc98892d5a88b46ade2edc7662.jpg')
		assert.equal(data.x1337ThreadId, 1821018)
		assert(data.description.includes('licensed under Creative Commons'))
		assert.equal(data.contentCategory, 'Music')
	})

	it("notFound", async function() {
		assert(!await strategy.findHash('1734BCCAA7B05BD4D77B86E17820C840BF0C2EF6'))
	})
});
