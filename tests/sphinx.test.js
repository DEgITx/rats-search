import { expect } from "chai";
import testUtils from "./utils";

const mysql = require('mysql')
const config = require('../src/background/config')

describe("sphinx", () => {
  before(testUtils.beforeEach);
  after(testUtils.afterEach);

  it("runned", async function() {
    const { app } = this
    await app.client.waitForExist('#index-window')
  });

  let sphinx;

  it("init", function() {
    sphinx = mysql.createPool({
      connectionLimit: config.sphinx.connectionLimit,
      host     : config.sphinx.host,
      port     : config.sphinx.port
    });
    expect(sphinx)
  })

  it("insert",  function(done) {
    sphinx.query("INSERT INTO files(id, hash, path, pathIndex, size) VALUES(1, 'a', 'bashaa', 'bashaa', 50)", (err) => {
      if(err)
        throw new Error(err)
      
        sphinx.query("INSERT INTO files(id, hash, path, pathIndex, size) VALUES(2, 'b', 'biotu', 'biotu', 30)", (err) => {
          if(err)
            throw new Error(err)

          done()
        })
    })
  })

  it("select",  function(done) {
    sphinx.query("select * from files where hash = 'a'", (err, result) => {
      if(!result)
        throw new Error(err)
      if(result.length !== 1)
        throw new Error('not one result')
      
      if(result[0].size !== 50)
        throw new Error('not 50 in field')

      done()
    })
  })

  it("search",  function(done) {
    sphinx.query("select * from files where MATCH('bashaa')", (err, result) => {
      if(!result)
        throw new Error(err)
      if(result.length !== 1)
        throw new Error('not one result')
      
      if(result[0].hash !== 'a')
        throw new Error('not a in hash')
      if(result[0].size !== 50)
        throw new Error('not 50 in field')

      done()
    })
  })
});
