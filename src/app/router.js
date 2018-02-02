//import router from 'page';
import PagesPie from './pages-pie.js';

import IndexPage from './index-page.js'
import TorrentPage from './torrent-page.js'
import DMCAPage from './dmca-page.js'
import AdminPage from './admin-page.js'
import TopPage from './top-page.js'

let routers = {}
const router = (page, callback) => {
	if(!callback)
	{
		if(!page)
			routers['/'].callback()
		else
		{
			const p = page.split('/')
			const pg = routers[`${p[0]}/${p[1]}`]
			if(!pg)
				return

			p.splice(0, 2)
			const params = {}
			for(let i = 0; i < p.length; i++)
			{
				params[pg.args[i]] = p[i]
			}
			console.log(params)
			
			pg.callback({
				params
			})
		}

		return;
	}

	const p = page.split('/')
	routers[`${p[0]}/${p[1]}`] = {callback}
	routers[`${p[0]}/${p[1]}`].args = []
	for(let i = 2; i < p.length; i++)
	{
		if(p[i].startsWith(':'))
			routers[`${p[0]}/${p[1]}`].args.push(p[i].substring(1))
	}
}


window.router = router;

router('/', () => {
	//singleton
	let pie = new PagesPie;
	pie.open(IndexPage, {replace: 'all'});
});

router('/torrent/:hash', (e) => {
	//singleton
	let pie = new PagesPie;
	pie.open(TorrentPage, {
		replace: 'all',
		hash: e.params.hash,
	});
});

router('/DMCA', () => {
	//singleton
	let pie = new PagesPie;
	pie.open(DMCAPage, {replace: 'all'});
});


router('/config', () => {
	//singleton
	let pie = new PagesPie;
	pie.open(AdminPage, {replace: 'all'});
});

router('/top', () => {
	//singleton
	let pie = new PagesPie;
	pie.open(TopPage, {replace: 'all'});
});