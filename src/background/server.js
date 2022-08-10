const appConfig = require('./config')
const spiderCall = require('./spider')
const dbPatcher = require('./dbPatcher')
const startSphinx = require('./sphinx')

const http = require('http')
const express = require('express');
const app = express();
const server = http.Server(app);
const io = require('socket.io')(server);
const fs = require('fs');
const path = require('path')
const os = require('os')
require('tagslog')({logFile: 'rats.log'});

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

server.listen(appConfig.httpPort);
logT('system', 'Rats v' + packageJson.version)
logT('system', 'Listening web server on', appConfig.httpPort, 'port')
logT('system', 'Platform:', os.platform())
logT('system', 'Arch:', os.arch())
logT('system', 'OS Release:', os.release())
logT('system', 'CPU:', os.cpus()[0].model)
logT('system', 'CPU Logic cores:', os.cpus().length)
logT('system', 'Total memory:', (os.totalmem() / (1024 * 1024)).toFixed(2), 'MB')
logT('system', 'Free memory:', (os.freemem() / (1024 * 1024)).toFixed(2), 'MB')
logT('system', 'NodeJS:', process.version)
logT('system', 'Web server')
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

// handle promise rejections
process.on('unhandledRejection', r => logTE('system', 'Rejection:', r));
process.on('uncaughtException', (err, origin) => logTE('system', 'Exception:', err, 'Origin:', origin));

const majorVersion = /v?([0-9]+)\.?([0-9]+)?\.?([0-9]+)?\.?([0-9]+)?/.exec(process.version)[1]
if(majorVersion < 8)
{
	logTE('system', 'Minumum Node.JS version >= 8.0.0, please update and try again')
	process.exit(1);
}

app.use(express.static('web'));

const socketMessages = {}

io.on('connection', (socket) =>
{
	for(const message in socketMessages)
	{
		socket.on(message, (...data) => {
			const id = data.shift();
			socketMessages[message](...data, id)
		})
	}
})

const start = async () => 
{
	({ sphinx } = await startSphinx(() => {
		dbPatcher(() => {
			spider = new spiderCall((...data) => io.sockets.emit(...data), (message, callback) => {
				socketMessages[message] = callback
			}, path.resolve(packageJson.serverDataDirectory), packageJson.version, 'production')
		}, null, sphinx)
	}, path.resolve(packageJson.serverDataDirectory), () => {}))
}
start()

var rl = require("readline").createInterface({
	input: process.stdin,
	output: process.stdout
});

rl.on("SIGINT", function () {
	process.emit("SIGINT");
});

process.on("SIGINT", () => {
	rl.close()
	if(spider)
	{
		spider.stop(() => sphinx.stop(() => process.exit()))
	}
	else if(sphinx)
	{
		sphinx.stop(() => process.exit())
	}
	else
	{
		process.exit()
	}
});

process.on("SIGTERM", () => {
	process.emit("SIGINT");
});