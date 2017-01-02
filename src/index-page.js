import React, { Component } from 'react';

import RecentTorrents from './recent-torrents'
import Search from './search'

const Header = (props) => {
	return (
		<div className='column center w100p fs0-75'>
			<div style={{width: '60%'}}>
			Welcome to BT Search! This is file search engine to the torrents of the internet. 
			Here you can easily find torrent or file that you intrested for. We are not responsible for any content of the site:
			content are adding automaticly. Content right holders and users can mark/block bad content.
			</div>
		</div>
	);
}

export {Header}

export default class IndexPage extends Component {
  render() {
    return (
      <div>
      	<Header />
        <Search />
      	<div className='column center w100p pad0-75'>
        	<RecentTorrents />
        </div>
      </div>
    );
  }
}
