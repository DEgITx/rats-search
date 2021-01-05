import electron from "electron";
import { Application } from "spectron";

const startApplication = function() {
	this.timeout(30000);
	this.app = new Application({
		path: electron,
		args: ["."],
		chromeDriverArgs: ['remote-debugging-port=' + Math.floor(Math.random() * (9999 - 9000) + 9000)],
		startTimeout: 30000,
		waitTimeout: 500,
		quitTimeout: 15000
	});
	return this.app.start();
};

const stopApplication = function() {
	this.timeout(30000);
	if (this.app && this.app.isRunning()) {
		return this.app.stop();
	}
	return undefined;
};

export {
	startApplication,
	stopApplication
};
