import { app } from 'electron'

let config = {
	indexer: true,

	domain: 'ratsontheboat.org',
	httpPort: 8095,
	spiderPort: 4445,
	udpTrackersPort: 4446,
	udpTrackersTimeout: 3 * 60 * 1000, 

	sitemapMaxSize: 25000,

	sphinx: {
	  host     : 'localhost',
	  port     : 9306,
	  connectionLimit: 30
	},

	spider: {
		walkInterval: 5,
		cpuLimit: 0,
		cpuInterval: 10,
	},

	downloader: {
		maxConnections: 200,
		timeout: 5000
	},

	cleanup: true,
	cleanupDiscLimit: 7 * 1024 * 1024 * 1024,
	spaceQuota: false,
	spaceDiskLimit: 7 * 1024 * 1024 * 1024,

	trafficInterface: 'enp2s0',
	trafficMax: 0,
	trafficUpdateTime: 3, //secs
	trafficIgnoreDHT: false,

	dbPath: '',

	client: {
		downloadPath: ''
	}
}

const fs = require('fs');
const debug = require('debug')('config')

let configPath = 'rats.json'
if(app && app.getPath("userData") && app.getPath("userData").length > 0)
{
	configPath = app.getPath("userData") + '/rats.json'
}

const configProxy = new Proxy(config, {
	set: (target, prop, value, receiver) => {
		target[prop] = value
	    
	    if(!fs.existsSync(configPath))
			fs.writeFileSync(configPath, '{}')

		const data = fs.readFileSync(configPath)
		let obj = JSON.parse(data)
		obj[prop] = value;
		fs.writeFileSync(configPath, JSON.stringify(obj, null, 4), 'utf8');
		debug('saving rats.json:', prop, '=', value)
		return true
	}
})

config.load = () => {
	debug('loading configuration')
	if(fs.existsSync(configPath))
	{
		debug('finded configuration', configPath)
		const data = fs.readFileSync(configPath, 'utf8')
		const obj = JSON.parse(data);
		for(let prop in obj) 
		{
			config[prop] = obj[prop]
			debug('rats.json:', prop, '=', obj[prop])
		}
	}
	return configProxy
}

module.exports = configProxy.load()