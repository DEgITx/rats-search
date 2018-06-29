const expect = (is) => {
	if(!is)
		throw new Error('expected not done');
}
const {pool} = require('../src/background/mysql')
const forBigTable = require('../src/background/forBigTable')

describe("big table for check", () => {
  let sphinx;

  it("init", function() {
    sphinx = pool()
    expect(sphinx)
  })

  it("insert 13 records for big table check", async function() {
    for(let i = 1; i < 14; i++)
    	await sphinx.query(`insert into feed(id, data) values(${i}, 'a')`)
  })

  it("for each 3 records of big table", async function() {
  	const records = []
    await forBigTable(sphinx, 'feed', record => records.push(record), null, 3)
    expect(records.length === 13)
  })

  it("for each 13 records of big table", async function() {
  	const records = []
    await forBigTable(sphinx, 'feed', record => records.push(record), null, 13)
    expect(records.length === 13)
    expect(records[1].id === 2)
  })

  it("for each 15 records of big table", async function() {
  	const records = []
    await forBigTable(sphinx, 'feed', record => records.push(record), null, 15)
    expect(records.length === 13)
  })
});
