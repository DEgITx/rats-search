
const fetch = require('node-fetch')
const cheerio = require('cheerio')

module.exports = class Rutracker
{
	async findHash(hash)
	{
		this.hash = hash
		return await this.parse()
	}

	async parse()
	{
		let html = await fetch('https://rutracker.org/forum/viewtopic.php?' + (this.threadId ? `t=${this.threadId}` : (this.hash ? `h=${this.hash}` : '')))
		if(!html)
			return
		html = await html.text()
		const $ = cheerio.load(html)
		const topicTitle = $('#topic-title').text()
		if(!topicTitle)
			return
		return {
			name: topicTitle,
			poster: $('.post_body .postImgAligned').attr('title'),
			description: $('.post_body').text(),
		}
	}
}