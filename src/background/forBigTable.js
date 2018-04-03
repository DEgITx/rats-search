export default (sphinx, table, callback, doneCallback, max = 1000) => new Promise((done) => {
    const checker = (index = 0) => {
        sphinx.query(`SELECT * FROM ${table} WHERE id > ${index} LIMIT ${max}`, (err, torrents) => {
            if(err || torrents.length == 0)
            {
                if(err)
                    console.log('big table parse error', err)
                if(doneCallback)
                    doneCallback(true)
                done(true)
                return
            }
            torrents.forEach(callback)
            checker(torrents[torrents.length - 1].id)
        });
    }
    checker()
})