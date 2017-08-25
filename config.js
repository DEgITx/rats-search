let config = {
	indexer: false,

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

	mysql: {
	  host     : 'localhost',
	  user     : 'btsearch',
	  password : 'pirateal100x',
	  database : 'btsearch',
	  connectionLimit: 40
	},

	spider: {
		walkInterval: 5,
		cpuLimit: 0,
		cpuInterval: 10,
	},

	downloader: {
		maxConnections: 2000,
		timeout: 5000
	}

	cleanup: true,
	cleanupDiscLimit: 7 * 1024 * 1024 * 1024,
	spaceQuota: false,
	spaceDiskLimit: 7 * 1024 * 1024 * 1024,

	trafficInterface: 'enp2s0',
	trafficMax: 0,
	trafficUpdateTime: 3, //secs
}

const fs = require('fs');
const debug = require('debug')('config')

const configProxy = new Proxy(config, {
	set: (target, prop, value, receiver) => {
		target[prop] = value
	    
	    if(!fs.existsSync('config.json'))
			fs.writeFileSync('config.json', '{}')

		fs.readFile('config.json', 'utf8', (err, data) => {
			let obj = JSON.parse(data)
			obj[prop] = value;
			fs.writeFileSync('config.json', JSON.stringify(obj, null, 4), 'utf8');
			debug('saving config.json:', prop, '=', value)
		})
	}
})

config.load = () => {
	debug('loading configuration')
	if(fs.existsSync('config.json'))
	{
		debug('finded configuration config.json')
		const data = fs.readFileSync('config.json', 'utf8')
		const obj = JSON.parse(data);
		for(let prop in obj) 
		{
			config[prop] = obj[prop]
			debug('config.json:', prop, '=', obj[prop])
		}
	}
	return configProxy
}

module.exports = configProxy.load()