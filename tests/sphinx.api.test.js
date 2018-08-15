import { assert } from "chai";
const {pool} = require('../src/background/mysql')

describe("big table for check", () => {
	let sphinx;

	it("init", async function() {
		sphinx = await pool()
		assert(sphinx)
		await sphinx.query(`delete from feed where id >= 1`)
	})

	it("replace with add", async function() {
		await sphinx.query(`insert into feed(id, data) values(1, '{a: 1}')`)
		assert.equal((await sphinx.query(`select data from feed where id = 1`))[0].data, '{"a":1}')
		await sphinx.replaceValues('feed', {id: 1, data: {a: 1, b: 2}}, true)
		assert.equal((await sphinx.query(`select data from feed`))[0].data, '{"a":1,"b":2}')
	})

	it("replace without add", async function() {
		await sphinx.query(`insert into feed(id, data) values(2, '{a: 1}')`)

		await sphinx.replaceValues('feed', {id: 1, data: {a: 1, b: 2, c: 3}}, false)
		assert.equal((await sphinx.query(`select data from feed where id = 1`))[0].data, '{"a":1,"b":2,"c":3}')
		assert.equal((await sphinx.query(`select count(*) as c from feed`))[0].c, 2)
	})

	it("close", async function() {
		await sphinx.end()
	})
});
