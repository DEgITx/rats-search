module.exports = class Feed {
    constructor({sphinx})
    {
        this.feed = []
        this.sphinx = sphinx
    }

    async save() {
		console.log('saving feed')
		await this.sphinx.query('delete from feed where id > 0')
		let id = 0
		return Promise.all(
			this.feed.map(
				async record => await this.sphinx.query('insert into feed(id, data) values(?, ?)', [++id, JSON.stringify(record)])
			)
		)
    }
    
    async load() {
        this.feed = await this.sphinx.query('select * from feed limit 1000')
	    if(this.feed && this.feed.length > 0)
            this.feed = this.feed.map(f => JSON.parse(f.data))
        else
            this.feed = []
            
        this._order()
    }

    clear()
    {
        this.feed = []
    }

    add(data) {
        if(typeof data == 'object')
        {
            data.feedDate = Math.floor(Date.now() / 1000)
        }

        this.feed.push(data)
        this._order()
    }

    _order() {
        this.feed.sort((a, b) => this._compare(b) - this._compare(a))
    }

    _compare(x)
    {
        const rating = 0
        const comments = 0
        const time = Math.floor(Date.now() / 1000) - x.feedDate

        const maxTime = 600000
        if(time > maxTime)
            time = maxTime
        const relativeTime = (maxTime - time) / maxTime
        return relativeTime * relativeTime + rating * 1.5 * relativeTime + comments * 4 * relativeTime
    }
}