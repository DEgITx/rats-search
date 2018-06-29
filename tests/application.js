import electron from "electron";
import { Application } from "spectron";

const startApplication = function() {
	this.timeout(30000);
	this.app = new Application({
		path: electron,
		args: ["."],
		startTimeout: 30000,
		waitTimeout: 30000,
		quitTimeout: 10000
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
