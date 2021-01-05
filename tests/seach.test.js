import { assert } from "chai";
const asyncWait = require('../src/background/asyncWait')

describe("search", function() {
	this.timeout(30000);

	it("dht seach", async function() {
		this.timeout(45000);
		const { app } = this
		await (await app.client.$('#searchInput')).setValue('1413ba1915affdc3de7e1a81d6fdc32ef19395c9')
		await (await app.client.$('#search')).click()
		const value = await (await app.client.$('.torrentRow .torrentName')).getText()
		assert.equal(value, 'Roblox_setup.exe')
	})

	it("sphinx search", async function() {
		const { app } = this
		await (await app.client.$('#searchInput')).setValue('Roblox_setup')
		await (await app.client.$('#search')).click()
		await app.client.$('.torrentRow .torrentName')
		const results = (await app.client.$$('.torrentRow .torrentName')).length
		assert(results >= 1, 'default search on Roblox must return Roblox_setup record')
	})

	it("sphinx particial search", async function() {
		const { app } = this
		await (await app.client.$('#searchInput')).setValue('Roblo')
		await (await app.client.$('#search')).click()
		await app.client.$('.torrentRow .torrentName')
		const results = (await app.client.$$('.torrentRow .torrentName')).length
		assert(results >= 1, 'particial word search must find string')
	})

	it("magnet search", async function() {
		const { app } = this
		await (await app.client.$('#searchInput')).setValue('magnet:?xt=urn:btih:1413ba1915affdc3de7e1a81d6fdc32ef19395c9')
		await (await app.client.$('#search')).click()
		await app.client.$('.torrentRow .torrentName')
		const results = (await app.client.$$('.torrentRow .torrentName')).length
		assert(results >= 1, 'magnet search must return 1 or more record')
	})
});
