const appPath = require('./electronAppPath')
const { spawn } = require('child_process')

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

let tryies = 5;

const startSSH = (port, host, user, password, callback) => {
	let remotePort = getRandomInt(10000, 65000)

	if(tryies-- <= 0)
	{
		if(callback)
			callback(false) 

		return
	}

	const options = [
		'-N',
		'-T', 
		'-R', `0.0.0.0:${remotePort}:127.0.0.1:${port}`,
		`${user}@${host}`,
		'-pw', password,
		'-v'
	]

	const ssh = spawn(appPath('plink'), options)

	const checkMessage = (data) => {
		if(data.includes(`Remote port forwarding from 0.0.0.0:${remotePort}`))
		{
			if(data.includes('refused'))
			{
				ssh.kill()
				startSSH(port, host, user, password, callback)
			}
			else if(data.includes('enabled'))
			{
				if(callback)
					callback({address: host, port: remotePort})
			}
		}
	}

	ssh.stdout.on('data', (data) => {
		logT('ssh', `ssh: ${data}`)
		checkMessage(data)
		if(data.includes('Store key in cache?'))
		{
			ssh.stdin.write("y")
			ssh.stdin.end()
		}
	})

	ssh.stderr.on('data', (data) => {
		logT('ssh', `ssh error: ${data}`);
		checkMessage(data)
		if(data.includes('Password authentication failed'))
		{
			ssh.kill()
		}
		if(data.includes('Store key in cache?'))
		{
			ssh.stdin.write("y")
			ssh.stdin.end()
		}
	});

	ssh.on('close', (code, signal) => {
		logT('ssh', `ssh closed with code ${code} and signal ${signal}`)
		if(callback)
			callback(false)
	})

	return ssh
}

module.exports = startSSH