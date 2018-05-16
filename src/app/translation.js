const fs = require('fs')
let dictionary = {}

function loadJSON(file, callback) {
	if(fs)
	{
		callback(JSON.parse(fs.readFileSync(file, 'utf8')))
	}
	else
	{
		const xobj = new XMLHttpRequest();
		xobj.overrideMimeType("application/json");
		xobj.open('GET', file, true);
		xobj.onreadystatechange = function() {
			if (xobj.readyState == 4 && xobj.status == 200) {
				// .open will NOT return a value but simply returns undefined in async mode so use a callback
				callback(JSON.parse(xobj.responseText));
			}
		}
		xobj.send(null);
	}
}

const changeLanguage = (lang, callback) => {
	loadJSON(`translations/${lang}.json`, (data) => {
		dictionary = data.translations
		if(callback)
			callback()
	})
}

export { changeLanguage }

export default (word) => {
	const translation = dictionary[word]
	if(translation === undefined)
	{
		return word
	}
	return translation
}
