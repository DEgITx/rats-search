import {startApplication, stopApplication} from "../tests/application";
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import os from 'os';
global.logT = (...args) => {console.log(...args)}
global.logTE = (...args) => {console.log('error', ...args)}

// Helper function to find log in temporary Chromium directories on Linux and Windows
const findLogInTmpChromium = () => {
	try {
		let logPaths = [];
		
		if (os.platform() === 'linux') {
			// Find directories matching the pattern in /tmp on Linux
			const tmpDirs = glob.sync('/tmp/.org.chromium.Chromium.* (test)');
			for (const dir of tmpDirs) {
				const logPath = path.join(dir, 'rats.log');
				if (fs.existsSync(logPath)) {
					console.log(`Found log file in Linux temporary directory: ${logPath}`);
					return logPath;
				}
			}
		} else if (os.platform() === 'win32') {
			// Find directories matching the pattern in Windows temp directory
			const winTempBase = process.env.SystemTemp || 'C:\\Windows\\SystemTemp';
			const tmpDirs = glob.sync(`${winTempBase}\\scoped_dir* (test)`);
			
			if (tmpDirs.length === 0) {
				// Try alternative temp locations if not found
				const tempDir = os.tmpdir();
				const altTmpDirs = glob.sync(`${tempDir}\\scoped_dir* (test)`);
				tmpDirs.push(...altTmpDirs);
			}
			
			for (const dir of tmpDirs) {
				const logPath = path.join(dir, 'rats.log');
				if (fs.existsSync(logPath)) {
					console.log(`Found log file in Windows temporary directory: ${logPath}`);
					return logPath;
				}
			}
		}
	} catch (error) {
		console.error('Error finding log in temporary directories:', error);
	}
	
	return null;
};

describe("application", () => {
	let testsFailed = false;

	before(startApplication);
	
	it("check start", async function() {
		this.timeout(5000);
		const { app } = this
		await app.client.$('#index-window')
		// fix realtime config
		require('../src/background/config').reload(await app.electron.remote.app.getPath('userData'))
	});

	// Track if any tests fail
	afterEach(function() {
		if (this.currentTest.state === 'failed') {
			testsFailed = true;
		}
	});

	// Display full log after all tests completed if any test failed
	after(async function() {
		let appStartFailed = false;
		let logContent = null;
		
		try {
			// Try to get the user data path from the running app
			let logFilePath = null;
			try {
				logFilePath = await this.app.electron.remote.app.getPath('userData') + '/rats.log';
			} catch (error) {
				console.error('Error accessing app data path, electron may have failed to start:', error);
				appStartFailed = true;
				logFilePath = findLogInTmpChromium();
			}
			
			// Stop the application if it's running
			try {
				await stopApplication.call(this);
			} catch (error) {
				console.error('Error stopping application:', error);
				appStartFailed = true;
			}
			
			// Print logs if tests failed or app failed to start
			if (testsFailed || appStartFailed) {
				console.log('\n======== RATS LOG ========');
				try {
					if (typeof logFilePath === 'string' && fs.existsSync(logFilePath)) {
						logContent = fs.readFileSync(logFilePath, 'utf8');
						console.log(logContent);
					} else if (typeof logFilePath === 'string') {
						console.log(`Log file not found at: ${logFilePath}`);
					} else if (logFilePath) {
						// If logFilePath contains the actual log content from findLogInTmpChromium
						console.log(logFilePath);
					} else {
						console.log('No log file path available');
					}
				} catch (error) {
					console.error('Error reading log file:', error);
				}
				console.log('=========================\n');
			}
		} catch (error) {
			console.error('Error in after hook:', error);
		}
	});

	//TESTS
});
