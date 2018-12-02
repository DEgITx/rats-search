import { assert } from "chai";
const asyncWait = require('../src/background/asyncWait')
const md5 = require('md5-file/promise')
const config = require('../src/background/config')
const fs = require('fs')

describe("download", function() {
	this.timeout(30000);

	it("click download", async function() {
		this.timeout(45000);
		const { app } = this
		await app.client.waitForExist('#searchInput')
		await app.client.$('#searchInput').setValue('1413ba1915affdc3de7e1a81d6fdc32ef19395c9')
		await app.client.click('#search')
		await app.client.waitForExist('.torrentRow .downloadButton')
		// Click download button (must open menu)
		await app.client.click('.torrentRow .downloadButton')
		await app.client.waitForExist('.torrentRow .downloadFullButton')
		// Start downloading
		await app.client.click('.torrentRow .downloadFullButton')
	})

	it("wait until downloaded", async function() {
		this.timeout(90000);
		const { app } = this
		await app.client.waitForExist('.torrentRow .progressDownloading')
		await app.client.waitUntil(async () => {
		  return (await app.client.getText('.torrentRow .progressDownloading')) === '100.0%'
	    }, 60000, 'expected that download will be finished', 200)
	})

	it("check file after download", async function() {
		this.timeout(10000);
		const file = config.client.downloadPath + "/Roblox_setup.exe"
		assert(fs.existsSync(file));
		assert.equal(await md5(file), '7df171da63e2013c9b17e1857615b192');
	})

	it("delete download from manager (after finish)", async function() {
		this.timeout(10000);
		const { app } = this
		await app.client.waitForExist('.torrentRow .deleteDownloadAfterFinish')
		await app.client.click('.torrentRow .deleteDownloadAfterFinish')
	})

	it("file must still exists after delete from manager", async function() {
		this.timeout(10000);
		const file = config.client.downloadPath + "/Roblox_setup.exe"
		assert(fs.existsSync(file));
		assert.equal(await md5(file), '7df171da63e2013c9b17e1857615b192');
	})
});
