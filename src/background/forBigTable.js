module.exports = (sphinx, table, callback, doneCallback, max = 1000, where = '') => new Promise((done) => {
	const checker = (index = 0) => {
		sphinx.query(`SELECT * FROM ${table} WHERE id > ${index} ${where} LIMIT ${max}`, (err, torrents) => {
			const finish = () => {
				if(err)
					logT('sql', 'big table parse error', err)
				if(doneCallback)
					doneCallback(true)
				done(true)
			}

			if(!err && torrents.length > 0)
				Promise.all(torrents.map(callback)).then(() => {
					if(torrents.length === max)
						checker(torrents[torrents.length - 1].id)
					else
						finish()
				})
			else
				finish()
		});
	}
	checker()
})