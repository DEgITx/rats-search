import net from 'net';

export default (port, host = '127.0.0.1') => new Promise((resolve, reject) => {
	const tester = net.createServer()
		.once('error', err => (err.code === 'EADDRINUSE' ? resolve(false) : reject(err)))
		.once('listening', () => tester.once('close', () => resolve(true)).close())
		.listen({
			host,
			port
		})
})
