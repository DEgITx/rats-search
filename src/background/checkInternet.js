// https://stackoverflow.com/questions/15270902/check-for-internet-connectivity-in-nodejs
import dns from 'dns';

export default function checkInternet(cb) {
	dns.lookup('google.com',function(err) {
		if (err && (err.code == "ENOTFOUND" || err.code == "EAI_AGAIN")) {
			cb(false);
		} else {
			cb(true);
		}
	})
}