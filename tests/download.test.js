import { assert } from "chai";
const asyncWait = require('../src/background/asyncWait')
const md5 = require('md5-file/promise')
const config = require('../src/background/config')
const fs = require('fs')

describe("download", function() {
	this.timeout(30000);

	const fileTest = config.client.downloadPath + "/Roblox_setup.exe"

	it("cleanup", function() {
		if(fs.existsSync(fileTest))
			fs.unlinkSync(fileTest);
	})

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

	it("download started", async function() {
		this.timeout(45000);
		const { app } = this
		await app.client.waitForExist('.torrentRow .deleteDownloadBeforeFinish')
	})

	it("check download exists in download tab", async function() {
		this.timeout(8000);
		const { app } = this
		await app.client.click('#downloadTab')
		await app.client.waitForExist('.downloads-list .torrentRow .torrentName')
		const value = await app.client.$('.downloads-list .torrentRow .torrentName').getText()
		assert.equal(value, 'Roblox_setup.exe')
		// cancel in progress button must be exists
		assert(await app.client.isExisting('.torrentRow .deleteDownloadBeforeFinish'));
		assert(await app.client.isExisting('.torrentRow .pauseTorrent'));
		// back to recent search
		await app.client.click('#open-recent-search')
		await app.client.waitForExist('.search-list')
	})

	it("wait until downloaded", async function() {
		this.timeout(90000);
		const { app } = this
		await app.client.waitForExist('.torrentRow .progressDownloading')
		await app.client.waitUntil(async () => {
		  return (await app.client.getText('.torrentRow .progressDownloading')) === '100.0%'
		}, 60000, 'expected that download will be finished', 200)
		
		// Check Buttons After finish
		assert(!(await app.client.isExisting('.torrentRow .deleteDownloadBeforeFinish')));
	})

	it("check file after download", async function() {
		this.timeout(10000);
		const file = config.client.downloadPath + "/Roblox_setup.exe"
		assert(fs.existsSync(file));
		assert.equal(await md5(file), '7df171da63e2013c9b17e1857615b192');
	})

	it("delete download from manager (after finish)", async function() {
		this.timeout(8000);
		const { app } = this
		await app.client.waitForExist('.torrentRow .deleteDownloadAfterFinish')
		assert(await app.client.isExisting('.torrentRow .deleteDownloadAfterFinish'));
		assert.equal(await app.client.getText('.search-list .torrentRow .progressDownloading'), '100.0%')
		// Click cancel of download
		await app.client.click('.torrentRow .deleteDownloadAfterFinish')
		assert(!(await app.client.isExisting('.torrentRow .deleteDownloadAfterFinish')));
		// Download deleted, but must be keeped in search
		const value = await app.client.$('.search-list .torrentRow .torrentName').getText()
		assert.equal(value, 'Roblox_setup.exe')
	})

	it("there must be no download on download tab", async function() {
		this.timeout(8000);
		const { app } = this
		await app.client.click('#downloadTab')
		await app.client.waitForExist('.downloads-list')
		assert(!(await app.client.isExisting('.torrentRow')));
	})

	it("file must still exists after delete from manager", async function() {
		this.timeout(10000);
		assert(fs.existsSync(fileTest));
		assert.equal(await md5(fileTest), '7df171da63e2013c9b17e1857615b192');
	})
});
