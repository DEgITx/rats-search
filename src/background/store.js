const objectHash = require('object-hash');

module.exports = class P2PStore {
    constructor(p2p, sphinx)
    {
        this.id = 1

        console.log('connect p2p store...')
        this.p2p = p2p
        this.sphinx = sphinx

        this.sphinx.query("SELECT MAX(`id`) as mx from store", (err, rows) => {
			if(err)
				return

			if(rows[0] && rows[0].mx >= 1)
                this.id = rows[0].mx + 1;
                
            console.log('store db index', this.id)
            this.sync()
		})

        this.p2p.on('dbStore', (record, callback) => {
            if(!record)
                return
            
            if(typeof record !== 'object')
                return

            if(!record.id)
                return
            
            if(record.id <= this.id)
                return

            // store
            this._pushToDb(record)
        })

        this.p2p.on('dbSync', ({id} = {}, callback) => {
            if(!id || this.id <= id)
            {
                callback(false)
                return
            }

            // back 
            this.sphinx.query(`select * from store where id >= ${id}`, (err, records) => {
                if(err)
                {
                    console.log(err)
                    return
                }
    
                if(records.length > 0)
                    callback({records})
            })
        })
    }

    sync()
    {
        this.p2p.emit('dbSync', {id: this.id}, (data) => {
            if(!data || !data.records)
                return

            for(const record of data.records)
            {
                if(!record.id)
                    return

                if(record.id <= this.id)
                    return

                // push to db
                this._pushToDb(record)
            }
        })
    }

    _pushToDb(value, callback)
    {
        const data = this.sphinx.escape(JSON.stringify(value.data))
        this.sphinx.query(
            `insert into store(id, hash, peerId, data` + (value.index ? ', storeIndex' : '') + `) 
            values('${value.id}', '${value.hash}', '${value.peerId}', ${data}` + (value.index ? ',' + this.sphinx.escape(value.index) : '') + ')', 
            (err) => {
            if(err)
            {
                console.log(err)
                return
            }

            if(callback)
                callback()
        })
    }

    store(obj)
    {
        const value = {
            id: this.id++,
            hash: objectHash(obj),
            data: obj,
            index: obj._index,
            peerId: this.p2p.peerId
        }
        console.log('store object', value.id)

        this._pushToDb(value, () => {
            // store record
            this.p2p.emit('dbStore', value) 
        })
    }

    find(index)
    {
        return new Promise((resolve) => {
            this.sphinx.query(`select * from store where match(${this.sphinx.escape(index)}) LIMIT 50000`, (err, records) => {
                if(err)
                {
                    console.log(err)
                    resolve(false)
                    return
                }
    
                resolve(records.map( ({data, peerid}) => Object.assign(JSON.parse(data), { _peerId: peerid }) ))
            })
        })
    }
}