import React from 'react';
import Page from './page.js';

import RecentTorrents from './recent-torrents.js'

export default class ActivityPage extends Page {
	constructor(props) {
		super(props)
		this.setTitle('Rats On The Boat - Content Search Engine');
	}
	render() {
		return (
			<div className='column center'>
				<div className='column center w100p pad0-75'>
					<RecentTorrents />
				</div>
			</div>
		);
	}
}
