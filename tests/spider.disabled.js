import { expect } from "chai";

const client = new (require('../src/background/bt/client'))
const spider = new (require('../src/background/bt/spider'))(client)

describe("spider check", () => {
	it("listen", function() {
		spider.listen(4445)
	})

	it("enshure hash recive", function(done) {
		this.timeout(100000);
		spider.once('ensureHash', () => done())
	})

	it("get metadata", function(done) {
		this.timeout(120000);
		client.once('complete', function (metadata, infohash, rinfo) {
			expect(Buffer.isBuffer(infohash))
			expect(infohash.length == 20)
			spider.close(() => done())
		})
	});
  
});
