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
		await sphinx.replaceValues('feed', {id: 1, data: {a: 1, b: 2}}, {particial: true})
		assert.equal((await sphinx.query(`select data from feed`))[0].data, '{"a":1,"b":2}')
	})

	it("replace without add", async function() {
		await sphinx.query(`insert into feed(id, data) values(2, '{a: 1}')`)

		await sphinx.replaceValues('feed', {id: 1, data: {a: 1, b: 2, c: 3}}, {particial: false})
		assert.equal((await sphinx.query(`select data from feed where id = 1`))[0].data, '{"a":1,"b":2,"c":3}')
		assert.equal((await sphinx.query(`select count(*) as c from feed`))[0].c, 2)
	})

	it("replace with merge", async function() {
		await sphinx.replaceValues('feed', {id: 1, data: {d: 4}}, {particial: true, merge: ['data']})
		assert.equal((await sphinx.query(`select data from feed where id = 1`))[0].data, '{"a":1,"b":2,"c":3,"d":4}')
	})

	it("replace with merge and callback modify", async function() {
		await sphinx.replaceValues('feed', {id: 1, data: {d: 6}}, {particial: true, merge: ['data'], mergeCallback: (name, obj) => { console.log(obj); obj.e = 5; } })
		assert.equal((await sphinx.query(`select data from feed where id = 1`))[0].data, '{"a":1,"b":2,"c":3,"d":6,"e":5}')
	})

	it("replace text index as function", async function() {
		await sphinx.replaceValues('feed', {id: 1, data: {a: 6}}, {particial: true, sphinxIndex: { feedIndex: (obj) => {
			assert.equal(obj.data.a, 6)
			return "aabbccdd"
		}} })
		assert.equal((await sphinx.query(`select data from feed where id = 1`))[0].data, '{"a":6}')
		assert.equal((await sphinx.query(`select id from feed where match('aabbccdd')`))[0].id, 1)
	})

	it("insert object to database", async function() {
		const obj = {a: 1, v: 2}
		const p = {id: 3, data: obj}
		await sphinx.insertValues('feed', p)
		assert.equal((await sphinx.query(`select data from feed where id = 3`))[0].data, '{"a":1,"v":2}')
		assert.equal(obj, p.data)
	})

	it("close", async function() {
		await sphinx.end()
	})
});
