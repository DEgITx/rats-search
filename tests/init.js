import {startApplication, stopApplication} from "../tests/application";
global.logT = (...args) => {console.log(...args)}

describe("application", () => {
	before(startApplication);
	after(stopApplication);

	it("check start", async function() {
		const { app } = this
		await app.client.waitForExist('#index-window')
	});

	//TESTS
});
