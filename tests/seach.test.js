import { assert } from "chai";
const asyncWait = require('../src/background/asyncWait')

describe("search", function() {
	this.timeout(30000);

	it("dht seach", async function() {
		 this.timeout(45000);
		 const { app } = this
		 await app.client.waitForExist('#searchInput')
		 await app.client.$('#searchInput').setValue('1413ba1915affdc3de7e1a81d6fdc32ef19395c9')
		 await app.client.click('#search')
		 await app.client.waitForExist('.torrentRow .torrentName')
		 const value = await app.client.$('.torrentRow .torrentName').getText()
		 assert.equal(value, 'Roblox_setup.exe')
	})

	it("sphinx search", async function() {
		 const { app } = this
		 await app.client.$('#searchInput').setValue('Roblox_setup')
		 await app.client.click('#search')
		 await app.client.waitForExist('.torrentRow .torrentName')
		 const results = (await app.client.$$('.torrentRow .torrentName')).length
		 assert(results >= 1)
	})

	it("sphinx particial search", async function() {
		const { app } = this
		await app.client.$('#searchInput').setValue('Roblo')
		await app.client.click('#search')
		await app.client.waitForExist('.torrentRow .torrentName')
		const results = (await app.client.$$('.torrentRow .torrentName')).length
		assert(results >= 1)
   })

   it("magnet search", async function() {
		const { app } = this
		await app.client.$('#searchInput').setValue('magnet:?xt=urn:btih:1413ba1915affdc3de7e1a81d6fdc32ef19395c9')
		await app.client.click('#search')
		await app.client.waitForExist('.torrentRow .torrentName')
		const results = (await app.client.$$('.torrentRow .torrentName')).length
		assert(results == 1)
	})
});
