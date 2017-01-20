module.exports = {
	indexer: true,

	domain: 'ratsontheboat.org',
	httpPort: 8095,
	spiderPort: 4445,
	udpTrackersPort: 4446, 

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
}
