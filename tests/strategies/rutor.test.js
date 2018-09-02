const { assert } = require('chai')
const Rutor = require('../../src/background/strategies/rutor.js')

describe("rutor", () => {
	let rutor = new Rutor({dataDirectory: 'tests/strategies'});

	it("findHash", async function() {
		const data = await rutor.findHash('7ea9e38a48a8d8f4e1a6807e02dda204bd90c94a')
		assert.equal(data.name, 'DJ Farta - Пацанская сборка в тачку. Vol 8 (2015) MP3')
		assert.equal(data.poster, 'http://s016.radikal.ru/i337/1509/72/f76a929da813.jpg')
		assert(data.description.includes('Tracklist'), 'description must contrain equal string')
	})

	it("findHash second", async function() {
		const data = await rutor.findHash('158448f6afbedb079aaf3c4695fb43e7dfa54515')
		assert.equal(data.name, 'Наруто: Ураганные Хроники / Naruto Shippuuden Movie [4 фильм] (2007) DVDRip')
		assert.equal(data.rutorThreadId, 5850)
	})

	it("notFound", async function() {
		assert(!await rutor.findHash('90296af2742232ba80e4a1f335fc2e159011d0da'))
	})

});
