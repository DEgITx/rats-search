import electron from "electron";
import { Application } from "spectron";

const startApplication = function() {
	this.timeout(30000);
	this.app = new Application({
		path: electron,
		args: ["."],
		chromeDriverArgs: ['remote-debugging-port=' + Math.floor(Math.random() * (9999 - 9000) + 9000)],
		startTimeout: 30000,
		waitTimeout: 30000,
		quitTimeout: 15000
	});
	return this.app.start().then(() => {
		this.app.client.notExisting$ = async (selector) => {
			const waitforTimeout = this.app.client.options.waitforTimeout;
			try {
				this.app.client.options.waitforTimeout = 150;
				await this.app.client.setTimeouts(this.app.client.options.waitforTimeout, this.app.client.options.waitforTimeout, this.app.client.options.waitforTimeout);
				const notExistElement = await this.app.client.$(selector)
				const isExist = await notExistElement.isExisting();
				this.app.client.options.waitforTimeout = waitforTimeout;
				await this.app.client.setTimeouts(this.app.client.options.waitforTimeout, this.app.client.options.waitforTimeout, this.app.client.options.waitforTimeout);
				return !isExist
			} catch(error) {
				this.app.client.options.waitforTimeout = waitforTimeout;
				await this.app.client.setTimeouts(this.app.client.options.waitforTimeout, this.app.client.options.waitforTimeout, this.app.client.options.waitforTimeout);
				return true;
			}
		}
	});
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
