let startTime  = process.hrtime()
let startUsage = process.cpuUsage()

module.exports = () => {
	function secNSec2ms (secNSec) {
	  return secNSec[0] * 1000 + secNSec[1] / 1000000
	}

	var elapTime = process.hrtime(startTime)
	var elapUsage = process.cpuUsage(startUsage)

	var elapTimeMS = secNSec2ms(elapTime)
	var elapUserMS = elapUsage.user
	var elapSystMS = elapUsage.system

	startTime = process.hrtime();
	startUsage = process.cpuUsage();

	return Math.round(100 * ((elapUserMS + elapSystMS) / 1000) / elapTimeMS)
}