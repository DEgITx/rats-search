import router from 'page';
window.router = router;
import PagesPie from './pages-pie.js';

import IndexPage from './index-page.js'
import TorrentPage from './torrent-page.js'
import DMCAPage from './dmca-page.js'
import AdminPage from './admin-page.js'

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


router('/admi5p', () => {
	//singleton
	let pie = new PagesPie;
	pie.open(AdminPage, {replace: 'all'});
});