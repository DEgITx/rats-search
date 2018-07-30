const { assert } = require('chai')
const Nyaa = require('../../src/background/strategies/nyaa.js')

describe("nyaa", () => {
	let nyaa = new Nyaa();

	it("findHash", async function() {
		const data = await nyaa.findHash('b57cc972ecc31dd31e9349017e5d26c164e08906')
		assert.equal(data.name, '[HorribleSubs] One Piece - 794 [1080p].mkv')
	})

	it("notFound", async function() {
		assert(!await nyaa.findHash('FFEDA8DF683F34A08BE89026114E6C05F881DCC0'))
	})
});
