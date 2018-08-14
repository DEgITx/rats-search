const mysql = require('mysql');
const config = require('./config');

const expand = (sphinx) => {
	const queryOriginal = sphinx.query.bind(sphinx)
	const queryCall = (...args) => {
		if(sphinx.__closed)
		{
			logT('sql', 'prevent sql request after end of connection')
			return
		}
		return queryOriginal(...args)
	}

	sphinx.query = (sql, args, callback) => new Promise((resolve, reject) => {
		if(typeof args === 'function' || typeof args === 'undefined')
		{
			queryCall(sql, (err, res) => {
				if(err)
					reject(err)
				else
					resolve(res)

				if(args)
					args(err, res)
			})
		}
		else
		{
			queryCall(sql, args, (err, res) => {
				if(err)
					reject(err)
				else
					resolve(res)

				if(callback)
					callback(err, res)
			})
		}
	})

	sphinx.insertValues = (table, values, callback) => new Promise((resolve) => {
		let names = '';
		let data = '';
		const parseValues = (values) => {
			let valuesData = ''
			names = ''
			for(const val in values)
			{
				if(values[val] === null)
					continue;
                
				names += '`' + val + '`,';
				valuesData += sphinx.escape(values[val]) + ',';
			}
			names = names.slice(0, -1)
			valuesData = valuesData.slice(0, -1)
			return valuesData
		}
		if(Array.isArray(values))
		{
			for(const value of values)
			{
				data += `(${parseValues(value)}),`
			}
			data = data.slice(0, -1)
		}
		else
		{
			data = `(${parseValues(values)})`
		}
        
		let query = `INSERT INTO ${table}(${names}) VALUES ${data}`;
		queryCall(query, (...responce) => {
			if(callback)
				callback(...responce)
			resolve(...responce)
		})
	})

	sphinx.updateValues = (table, values, whereObject, callback) => new Promise((resolve) => {
		let set = ''
		for(const val in values)
		{
			if(values[val] === null)
				continue;
            
			if(typeof values[val] == 'object')
				continue;

			// skip text indexes (manticore bug https://github.com/manticoresoftware/manticoresearch/issues/84)
			if(typeof values[val] == 'string')
				continue;

			set += '`' + val + '` = ' + sphinx.escape(values[val]) + ',';
		}
		if(set.length == 0)
			return
		set = set.slice(0, -1)

		let where = ''
		for(const w in whereObject)
		{
			if(whereObject[w] === null)
				continue;

			where += '`' + w + '` = ' + sphinx.escape(whereObject[w]) + ' and';
		}
		if(where.length == 0)
			return
		where = where.slice(0, -3)

		const query = `UPDATE ${table} SET ${set} WHERE ${where}`;
		queryCall(query, (...responce) => {
			if(callback)
				callback(...responce)
			resolve(...responce)
		})
	})

	return sphinx
}

const pool = async () => {
	if(/^win/.test(process.platform))
	{
		logT('sql', 'using main pool mechanism')
		let sphinx = mysql.createPool({
			// bug under mac with some problems on big connection size, limit this to very low value on mac os x
			connectionLimit: process.platform === 'darwin' ? 3 : config.sphinx.connectionLimit,
			host     : config.sphinx.host,
			port     : config.sphinx.port
		});
		sphinx = expand(sphinx)
		const end = sphinx.end.bind(sphinx)
		sphinx.end = (cb) => new Promise(resolve => { 
			sphinx.__closed = true
			end(() => {
				resolve()
				if(cb) cb()
			})
		})
		return sphinx
	}
	else
	{
		logT('sql', 'using alternative pool mechanism')
		let connectionPool = []
		let connectionsLimit = config.sphinx.connectionLimit
		let currentConnection = 0
		for(let i = 0; i < connectionsLimit; i++)
		{
			connectionPool[i] = await single().waitConnection() 
		}
		const buildPoolMethod = (name, ...args) => {
			if(!connectionPool)
				return
            
			const data = connectionPool[currentConnection][name](...args)
			currentConnection = (currentConnection + 1) % connectionsLimit
			return data
		}
		return new Proxy({
			query(...args) {
				return buildPoolMethod('query', ...args)
			},
			insertValues(...args) {
				return buildPoolMethod('insertValues', ...args)
			},
			updateValues(...args) {
				return buildPoolMethod('updateValues', ...args)
			},
			async end(cb)
			{
				await Promise.all(connectionPool.map(conn => conn.end()))
				if(cb)
					cb()
				connectionPool = null
			}
		}, {
			get(target, prop)
			{
				if(!target[prop])
				{
					return connectionPool[0][prop]
				}
				return target[prop]
			}
		})
	}
}

const single = (callback) => {
	let mysqlSingle = {
		_mysql: null
	};

	const proxySingle = new Proxy(mysqlSingle, {
		get(target, prop) {
			if(!target[prop])
			{
				let ret = target._mysql[prop]
				if(typeof ret === 'function')
					ret = ret.bind(target._mysql)
				return ret
			}
			return target[prop]
		}
	})

	const start = () =>
	{
		mysqlSingle._mysql = mysql.createConnection({
			host     : config.sphinx.host,
			port     : config.sphinx.port
		});

		let promiseResolve;
		const connectionPromise = new Promise((resolve) => {
			promiseResolve = resolve
		})
		mysqlSingle.waitConnection = () => connectionPromise;
    
		mysqlSingle._mysql.connect((mysqlError) => {
			if (mysqlError) {
				logT('sql', 'error connecting: ' + mysqlError.stack);
				return;
			}

			if(callback)
				callback(proxySingle)

			promiseResolve(proxySingle)
		});
    
		mysqlSingle._mysql.on('error', (err) => {
			if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
				logT('sql', 'lost connection, restart single sql connection')
				mysqlSingle._mysql = undefined
				start();                         // lost due to either server restart, or a
			} else {                                      // connnection idle timeout (the wait_timeout
				logTE('sql', 'db error', err);
				throw err;                                  // server variable configures this)
			}
		});

		mysqlSingle._mysql = expand(mysqlSingle._mysql)
    
		// fix prevent query after closing
		const end = mysqlSingle._mysql.end.bind(mysqlSingle._mysql)
		mysqlSingle._mysql.end = (cb) => new Promise(resolve => {
			mysqlSingle._mysql.__closed = true
			end(() => {
				resolve()
				if(cb)
					cb()
			})  
		})

		return proxySingle
	}

	return start()
}

module.exports = {pool, single}