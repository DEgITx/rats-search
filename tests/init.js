import {startApplication, stopApplication} from "../tests/application";
global.logT = (...args) => {console.log(...args)}
global.logTE = (...args) => {console.log('error', ...args)}

describe("application", () => {
	before(startApplication);
	after(stopApplication);

	it("check start", async function() {
		this.timeout(5000);
		const { app } = this
		await app.client.$('#index-window')
		// fix realtime config
		require('../src/background/config').reload(await app.electron.remote.app.getPath('userData'))
	});

	//TESTS
});
