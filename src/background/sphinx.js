const path = require("path");
let env
try{
	env = require("env");
} catch(e){}
const appPath = require('./electronAppPath')
const fs = require('fs')
const iconv = require('iconv-lite')
const { spawn, exec } = require('child_process')
const appConfig = require('./config')
const findFiles = require('./findFiles')
const _ = require('lodash')

const writeSphinxConfig = (path, dbPath) => {
	let config = `
  index torrents
  {
    type = rt
    path = ${dbPath}/database/torrents
    
    min_prefix_len = 3
    expand_keywords = 1
    
    rt_attr_string = hash
    rt_attr_string = name
    rt_field = nameIndex
    rt_attr_bigint = size
    rt_attr_uint = files
    rt_attr_uint = piecelength
    rt_attr_timestamp = added
    rt_attr_string = ipv4
    rt_attr_uint = port
    rt_attr_string = contentType
    rt_attr_string = contentCategory
    rt_attr_uint = seeders
    rt_attr_uint = leechers
    rt_attr_uint = completed
    rt_attr_timestamp = trackersChecked
    rt_attr_uint = good
    rt_attr_uint = bad
  }

  index files
  {
      type = rt
      path = ${dbPath}/database/files
      
      rt_attr_string = path
      rt_field = pathIndex
    rt_attr_string = hash
    rt_attr_bigint = size
  }

  index version
  {
      type = rt
      path = ${dbPath}/database/version
      
      rt_attr_uint = version
      rt_field = versionIndex
  }

  index store
  {
      type = rt
      path = ${dbPath}/database/store
      
      rt_field = storeIndex
      rt_attr_json = data
      rt_attr_string = hash
      rt_attr_string = peerId
  }

  index feed
  {
      type = rt
      path = ${dbPath}/database/feed

      rt_field = feedIndex
      rt_attr_json = data
  }

  searchd
  {
    listen      = 9312
    listen      = 9306:mysql41
    read_timeout    = 5
    max_children    = 30
    seamless_rotate   = 1
    preopen_indexes   = 1
    unlink_old    = 1
    workers     = threads # for RT to work
    pid_file    = ${path}/searchd.pid
    log     = ${path}/searchd.log
    query_log   = ${path}/query.log
    binlog_path = ${path}
  }
  `;

	// clear dir in test env
	if(env && env.name === 'test')
	{
		if (fs.existsSync(`${dbPath}/database`)) {
			fs.readdirSync(`${dbPath}/database`).forEach(function(file, index){
				const curPath = `${dbPath}/database` + "/" + file;
				if (!fs.lstatSync(curPath).isDirectory()) {
					fs.unlinkSync(curPath);
				}
			});

			fs.readdirSync(path).forEach(function(file, index){
				if(!file.startsWith('binlog'))
					return;
				const curPath = path + "/" + file;
				if (!fs.lstatSync(curPath).isDirectory()) {
					fs.unlinkSync(curPath);
				}
			});
		}
	}

	// clean query.log because it too large and don't consist any good info
	if(fs.existsSync(`${path}/query.log`))
	{
		fs.unlinkSync(`${path}/query.log`)
	}

	let isInitDb = false

	if (!fs.existsSync(`${dbPath}/database`)){
		fs.mkdirSync(`${dbPath}/database`);
		isInitDb = true
	}

	if(/^win/.test(process.platform))
		config = iconv.encode(config, 'win1251')

	fs.writeFileSync(`${path}/sphinx.conf`, config)
	console.log(`writed sphinx config to ${path}`)
	console.log('db path:', dbPath)

	return {isInitDb}
}

module.exports = (callback, dataDirectory, onClose) => {
	const start = (callback) => {

		const sphinxPath = path.resolve(appPath('searchd'))
		console.log('Sphinx Path:', sphinxPath)

		const sphinxConfigDirectory = dataDirectory
		appConfig['dbPath'] = appConfig.dbPath && appConfig.dbPath.length > 0 ? appConfig.dbPath : sphinxConfigDirectory;
		// on portable dir can move database directory
		if(!fs.existsSync(appConfig.dbPath) && fs.existsSync(sphinxConfigDirectory))
		{
			appConfig['dbPath'] = sphinxConfigDirectory
		}

		const { isInitDb } = writeSphinxConfig(sphinxConfigDirectory, appConfig.dbPath)

		const config = `${sphinxConfigDirectory}/sphinx.conf`
		const options = ['--config', config]
		if(!(/^win/.test(process.platform)))
		{
			options.push('--nodetach')
		}
		const sphinx = spawn(sphinxPath, options)
		// remeber initizalizing of db
		sphinx.start = start
		sphinx.isInitDb = isInitDb
		sphinx.directoryPath = appConfig.dbPath
		sphinx.directoryPathDb = appConfig.dbPath + '/database'

		const optimizeResolvers = {}

		sphinx.stdout.on('data', (data) => {
			console.log(`sphinx: ${data}`)

			// don't listen if we are in fixing mode
			if(sphinx.fixing)
				return

			if (data.includes('accepting connections')) {
				console.log('catched sphinx start')
				if(callback)
					callback()
			}

			if(data.includes('invalid meta file'))
			{
				sphinx.fixDatabase()
			}
    
			const checkOptimized = String(data).match(/index ([\w]+): optimized/)
			if(checkOptimized)
			{
				if(optimizeResolvers[checkOptimized[1]])
				{
					console.log('resolve optimizer', checkOptimized[1])
					optimizeResolvers[checkOptimized[1]]()
				}
			}
		})

		sphinx.on('close', (code, signal) => {
			console.log(`sphinx closed with code ${code} and signal ${signal}`)
			if(onClose && !sphinx.replaceOnClose) // sometime we don't want to call default callback
				onClose()
			if(sphinx.onClose)
				sphinx.onClose()
		})

		sphinx.stop = (onFinish, replaceFinish) => {
			console.log('sphinx closing...')
			if(onFinish)
				sphinx.onClose = onFinish
			if(replaceFinish)
				sphinx.replaceOnClose = true // sometime we don't want to call default callback
			exec(`"${sphinxPath}" --config "${config}" --stopwait`)
		}

		sphinx.waitOptimized = (table) => new Promise((resolve) => {
			optimizeResolvers[table] = () => {
				delete optimizeResolvers[table];
				resolve()
			}
		})

		sphinx.fixDatabase = async () => {
			if(sphinx.fixing)
				return
			sphinx.fixing = true

			// close db
			await new Promise((resolve) => {
				sphinx.stop(resolve, true)
				console.log('revent start')
			})

			const checkNullFile = (file) => new Promise((resolve) => {
				let f = fs.createReadStream(file)
				f.on('data', (chunk) => {  
					for(const byte of chunk)
						if(byte != 0)
						{
							resolve(true)
							f.destroy()
							return
						}
				}).on('end', () => {
					resolve(false)
				});
			})

			// check meta files
			const probablyCoruptedFiles = await findFiles(`${sphinx.directoryPath}/**/*.+(meta|ram)`)
			let brokenFiles = await Promise.all(probablyCoruptedFiles.map(file => checkNullFile(file)))
			brokenFiles = probablyCoruptedFiles.filter((file, index) => !brokenFiles[index])
			
			brokenFiles.forEach(file => {
				console.log('FIXDB: clean file because of broken', file)
				fs.unlinkSync(file)
			})

			sphinx.fixing = false

			_.merge(sphinx, sphinx.start(callback));
		}

		return sphinx

	}

	return start(callback)
}