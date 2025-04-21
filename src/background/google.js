import google from 'google';

export default (search) => new Promise((resolve) => {
	google(search, (err, res) => {
		resolve(res.links)
	})
})