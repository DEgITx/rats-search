const config = require('./webpack.config.production');
const webpack = require('webpack');

let compiler = webpack(config);
compiler.run((err, stats) => {
    if(err)
        throw new Error(err)
    
    console.log('succesfully builder')
    if(stats.compilation.errors)
    	console.error(stats.compilation.errors)
})
