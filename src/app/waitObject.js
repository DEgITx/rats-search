export default (obj, val) => new Promise((resolve) => {
	if(typeof obj[val] === 'object')
	{
		resolve()
		return
	}

	const w = setInterval(() => {
		if(typeof obj[val] === 'object')
		{
			clearInterval(w)
			resolve()
		}
	}, 3)
})