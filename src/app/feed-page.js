import React from 'react';
import Page from './page.js';

import Feed from './feed.js';

import DBExtendHint from './db-extend-hint.js'

export default class FeedPage extends Page {
	constructor(props) {
		super(props)
		this.setTitle('Rats On The Boat - Content Search Engine');
	}
	render() {
		return (
			<div id='index-window' className='column center'>
				<div className='column center w100p pad0-75'>
					<DBExtendHint />
				</div>
				<div className='column center w100p pad0-75'>
					<Feed />
				</div>
			</div>
		);
	}
}
