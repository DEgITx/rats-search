const client = new (require('./lib/client'))
const spider = new (require('./lib/spider'))(client)

//spider.on('unensureHash', (hash)=> console.log(hash))

spider.on('ensureHash', (hash, addr)=> {
	console.log('new hash');
})

client.on('complete', function (metadata, infoHash) {
	 console.log(metadata.info);
});

// spider.on('nodes', (nodes)=>console.log('foundNodes'))

spider.listen(4445)