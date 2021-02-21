import { assert, expect } from "chai";
const asyncWait = require('../src/background/asyncWait')
const md5 = require('md5-file')
const config = require('../src/background/config')
const fs = require('fs')

describe("download", function() {
	this.timeout(30000);

	const fileTest = config.client.downloadPath + "/Roblox_setup.exe"
	const fileFolder = config.client.downloadPath + "/folderTest"
	const fileFolderTest = fileFolder + "/Roblox_setup.exe"

	it("cleanup", function() {
		if(fs.existsSync(fileTest))
			fs.unlinkSync(fileTest);
		if(fs.existsSync(fileFolderTest))
			fs.unlinkSync(fileFolderTest);
	})

	it("click download", async function() {
		this.timeout(45000);
		const { app } = this
		await (await app.client.$('#searchInput')).setValue('1413ba1915affdc3de7e1a81d6fdc32ef19395c9')
		await (await app.client.$('#search')).click()
		// Click download button (must open menu)
		await (await app.client.$('.torrentRow .downloadButton')).click()
		// Start downloading
		await (await app.client.$('.torrentRow .downloadFullButton')).click()
	})

	it("download started", async function() {
		this.timeout(45000);
		const { app } = this
		await app.client.$('.torrentRow .deleteDownloadBeforeFinish')
	})

	it("check download exists in download tab", async function() {
		this.timeout(10000);
		const { app } = this
		await (await app.client.$('#downloadTab')).click()
		const value = await (await app.client.$('.downloads-list .torrentRow .torrentName')).getText()
		assert.equal(value, 'Roblox_setup.exe')
		let progress = parseInt(await (await app.client.$('.torrentRow .progressDownloading')).getText());
		console.log('download progress', progress, '%');
		// cancel in progress button must be exists
		if (progress < 50) {
			console.log('testing buttons')
			assert(await (await app.client.$('.torrentRow .deleteDownloadBeforeFinish')).isExisting());
			assert(await (await app.client.$('.torrentRow .pauseTorrent')).isExisting());
		}
		// back to recent search
		await (await app.client.$('#open-recent-search')).click()
		await app.client.$('.search-list')
	})

	it("wait until downloaded", async function() {
		this.timeout(120000);
		const { app } = this
		await app.client.$('.torrentRow .progressDownloading')
		console.log('download progress', await (await app.client.$('.torrentRow .progressDownloading')).getText());
		await app.client.waitUntil(async () => {
			return (await (await app.client.$('.torrentRow .progressDownloading')).getText()) === '100.0%'
		}, 100000, 'expected that download will be finished', 200)
		// There is some time before button will be replaced
		await asyncWait(800);

		// Check Buttons After finish
		assert(await app.client.notExisting$('.torrentRow .deleteDownloadBeforeFinish'));
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
		assert(await (await app.client.$('.torrentRow .deleteDownloadAfterFinish')).isExisting());
		assert.equal(await (await app.client.$('.search-list .torrentRow .progressDownloading')).getText(), '100.0%')
		// Click cancel of download
		await (await app.client.$('.torrentRow .deleteDownloadAfterFinish')).click()
		assert(await app.client.notExisting$('.torrentRow .deleteDownloadAfterFinish'));
		// Download deleted, but must be keeped in search
		const value = await (await app.client.$('.search-list .torrentRow .torrentName')).getText()
		assert.equal(value, 'Roblox_setup.exe')
	})

	it("there must be no download on download tab", async function() {
		this.timeout(8000);
		const { app } = this
		await (await app.client.$('#downloadTab')).click()
		await app.client.$('.downloads-list')
		assert(await app.client.notExisting$('.torrentRow'));
	})

	it("file must still exists after delete from manager", async function() {
		this.timeout(10000);
		assert(fs.existsSync(fileTest));
		assert.equal(await md5(fileTest), '7df171da63e2013c9b17e1857615b192');
	})

	it("download file to folder", async function() {
		this.timeout(120000);
		const { app } = this
		await (await app.client.$('#searchInput')).setValue('1413ba1915affdc3de7e1a81d6fdc32ef19395c9')
		await (await app.client.$('#search')).click()
		// Click download button (must open menu)
		await (await app.client.$('.torrentRow .downloadButton')).click()
		await app.client.$('.torrentRow .downloadDirectoryButton')
		// Click download to folder and start download
		await app.client.execute((folder) => {
	        window.downloadFolderTest = folder
	    }, fileFolder)
		await (await app.client.$('.torrentRow .downloadDirectoryButton')).click()
		// Downloading check
		await app.client.waitUntil(async () => {
			return (await (await app.client.$('.torrentRow .progressDownloading')).getText()) === '100.0%'
		}, 100000, 'expected that download will be finished', 200)
		// Check downloaded to directory
		assert(fs.existsSync(fileFolderTest));
		assert.equal(await md5(fileFolderTest), '7df171da63e2013c9b17e1857615b192');
	})
});
