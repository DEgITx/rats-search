import { assert, expect } from "chai";
const asyncWait = require('../src/background/asyncWait')
const md5 = require('md5-file')
const config = require('../src/background/config')
const fs = require('fs')

describe("details", function() {
	this.timeout(30000);


	it("open details", async function() {
		const { app } = this
		await (await app.client.$('#searchInput')).setValue('433DF14A5573C0F41E59618FF4C832B835A66F75')
		await (await app.client.$('#search')).click()
		await (await app.client.$('.torrentRow')).click()
		await (await app.client.$('.info-table')).isExisting()
	})

	it("details colums", async function() {
		const { app } = this
		const size = await (await app.client.$('#torrentSizeId')).getText();
		assert(size.includes('22.291'))
		const files = await (await app.client.$('#torrentFilesId')).getText();
		assert(files.includes('6'))
	})

});
