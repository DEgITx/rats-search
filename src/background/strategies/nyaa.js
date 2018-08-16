
const fetch = require('node-fetch')
const cheerio = require('cheerio')

module.exports = class Nyaa
{
	name() { return 'nyaa' }

	async findHash(hash)
	{
		this.hash = hash
		return await this.parse()
	}

	async parse()
	{
		let html;
		try {
			html = await fetch('https://nyaa.si/' + (this.threadId ? `view/${this.threadId}` : (this.hash ? `?q=${this.hash}` : '')))
		} catch(err) {
			return
		}
		if(!html)
			return
		html = await html.textConverted()
		const $ = cheerio.load(html)
		let topicTitle = $('.panel-title').first().text()
		if(!topicTitle)
			return

		topicTitle = topicTitle.replace(/\t/g, '').replace(/\n/g, '')
		return {
			name: topicTitle,
			description: $('#torrent-description').text(),
		}
	}
}