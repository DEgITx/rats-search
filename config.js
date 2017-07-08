module.exports = {
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

	cleanup: true,
	cleanupDiscLimit: 7 * 1024 * 1024 * 1024,
}
