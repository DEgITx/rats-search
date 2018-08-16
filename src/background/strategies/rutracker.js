
const fetch = require('node-fetch')
const cheerio = require('cheerio')

module.exports = class Rutracker
{
	name() { return 'rutracker' }

	async findHash(hash)
	{
		this.hash = hash
		return await this.parse()
	}

	async parse()
	{
		let html; 
		try {
			html = await fetch('https://rutracker.org/forum/viewtopic.php?' + (this.threadId ? `t=${this.threadId}` : (this.hash ? `h=${this.hash}` : '')))
		} catch(err) {
			return
		}
		if(!html)
			return
		html = await html.textConverted()
		const $ = cheerio.load(html)
		const topicTitle = $('#topic-title').text()
		if(!topicTitle)
			return
		return {
			name: topicTitle,
			poster: $('.post_body .postImgAligned').attr('title'),
			description: $('.post_body').text(),
			rutrackerThreadId: parseInt($('a.magnet-link').attr('data-topic_id')),
		}
	}
}