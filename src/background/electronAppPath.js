const path = require('path')
const fs = require('fs')

module.exports = (app) => {
	if (fs.existsSync(`./${app}`)) {
		return `./${app}`
	}

	if (process.arch === 'arm' || process.arch === 'arm64') {
		return `imports/${process.arch}/${app}`
	}

	if (/^win/.test(process.platform) && fs.existsSync(`./${app}.exe`)) {
		return `./${app}.exe`
	}

	if (/^win/.test(process.platform) && fs.existsSync(`./${process.arch}/${app}.exe`)) {
		return `./${process.arch}/${app}.exe`
	}

	if(/^win/.test(process.platform) && fs.existsSync(path.dirname(process.execPath) + `/${app}.exe`)) {
		return path.dirname(process.execPath) + `/${app}.exe`
	}

	if(/^win/.test(process.platform) && fs.existsSync(path.dirname(process.execPath) + `/${process.arch}/${app}.exe`)) {
		return path.dirname(process.execPath) + `/${process.arch}/${app}.exe`
	}

	if (fs.existsSync(fs.realpathSync(__dirname) + `/${app}`)) {
		return fs.realpathSync(__dirname) + `/${app}`
	}

	if (fs.existsSync(fs.realpathSync(__dirname) + `/${process.arch}/${app}`)) {
		return fs.realpathSync(__dirname) + `/${process.arch}/${app}`
	}

	if (fs.existsSync(fs.realpathSync(path.join(__dirname, '/../../..')) + `/${app}`)) {
		return fs.realpathSync(path.join(__dirname, '/../../..')) + `/${app}`
	}

	if (fs.existsSync(fs.realpathSync(path.join(__dirname, '/../../..')) + `/${process.arch}/${app}`)) {
		return fs.realpathSync(path.join(__dirname, '/../../..')) + `/${process.arch}/${app}`
	}

	try {
		if (process.platform === 'darwin' && fs.existsSync(fs.realpathSync(path.join(__dirname, '/../../../MacOS')) + `/${app}`)) {
			return fs.realpathSync(path.join(__dirname, '/../../../MacOS')) + `/${app}`
		}
	} catch (e) {}

	if (/^win/.test(process.platform) && fs.existsSync(`imports/win/${app}.exe`)) {
		return `imports/win/${app}.exe`
	}

	if (/^win/.test(process.platform) && fs.existsSync(`imports/win/${process.arch}/${app}.exe`)) {
		return `imports/win/${process.arch}/${app}.exe`
	}

	if (process.platform === 'linux' && fs.existsSync(`imports/linux/${app}`)) {
		return `imports/linux/${app}`
	}

	if (process.platform === 'linux' && fs.existsSync(`imports/linux/${process.arch}/${app}`)) {
		return `imports/linux/${process.arch}/${app}`
	}

	if (process.platform === 'darwin' && fs.existsSync(`imports/darwin/${app}`)) {
		return `imports/darwin/${app}`
	}

	return `${app}`
}
