const mysql = require('mysql');
const config = require('./config');

const expand = (sphinx) => {
	const queryCall = sphinx.query.bind(sphinx)

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

const pool = () => {
	let sphinx = mysql.createPool({
		connectionLimit: config.sphinx.connectionLimit,
		host     : config.sphinx.host,
		port     : config.sphinx.port
	});
	return expand(sphinx)
}

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
const single = (callback) => {
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
			console.error('error connecting: ' + mysqlError.stack);
			return;
		}
  
		if(callback)
			callback(proxySingle)

		promiseResolve(proxySingle)
	});
  
	mysqlSingle._mysql.on('error', (err) => {
		console.log('db error', err);
		if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
			mysqlSingle._mysql = undefined
			single();                         // lost due to either server restart, or a
		} else {                                      // connnection idle timeout (the wait_timeout
			throw err;                                  // server variable configures this)
		}
	});

	mysqlSingle._mysql = expand(mysqlSingle._mysql)
	return proxySingle
}

module.exports = {pool, single}