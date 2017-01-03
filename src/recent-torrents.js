import React, { Component } from 'react';
import formatBytes from './format-bytes'

import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';

const TorrentLine = (props) => {
  const torrent = props.torrent;
return (
    <div>
      <ListItem 
        onClick={() => window.router('/torrent/' + torrent.hash)} 
        primaryText={<span className='break-word'>{torrent.name}</span>}
        secondaryText={
            <div className='column' style={{height: 'auto', whiteSpace: 'normal'}}>
              <div>
              {
                formatBytes(torrent.size, 1) + ' (' + torrent.files + ' files)'
              }
              </div>
              {
                torrent.path && torrent.path.length > 0
                ?
                <div className='break-word fs0-75' style={{paddingTop: '0.3em'}}>{torrent.path}</div>
                :
                null
              }
            </div>
          }
        rightIcon={
          <svg onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            var win = window.open(`magnet:?xt=urn:btih:${torrent.hash}`, '_blank');
         }} viewBox="0 0 24 24">
            <path d="M15.82 10.736l-5.451 6.717c-.561.691-1.214 1.042-1.94 1.042-1.144 
            0-2.327-.899-2.753-2.091-.214-.6-.386-1.76.865-2.784 3.417-2.794 6.716-5.446 
            6.716-5.446l-3.363-4.174s-4.532 3.657-6.771 5.487c-2.581 2.108-3.123 4.468-3.123 
            6.075 0 4.416 4.014 8.438 8.42 8.438 1.604 0 3.963-.543 6.084-3.128 1.835-2.237 
            5.496-6.773 5.496-6.773l-4.18-3.363zm-2.604 9.079c-1.353 1.647-3.01 2.519-4.796 
            2.519-3.471 0-6.753-3.291-6.753-6.771 0-1.789.867-3.443 2.51-4.785 1.206-.986 
            2.885-2.348 4.18-3.398l1.247 1.599c-1.074.87-2.507 2.033-4.118 3.352-1.471 
            1.202-1.987 2.935-1.38 4.634.661 1.853 2.479 3.197 4.322 3.197h.001c.86 0 
            2.122-.288 3.233-1.658l3.355-4.134 1.572 1.294c-1.044 1.291-2.392 2.954-3.373 
            4.151zm6.152-7.934l4.318-2.88-1.575-.638 1.889-2.414-4.421 2.788 1.716.695-1.927 
            2.449zm-7.292-7.186l4.916-1.667-1.356-1.022 2.448-2.006-4.991 1.712 
            1.478 1.114-2.495 1.869z"/></svg>}
      />
      <Divider />
    </div>
  )
}

export { TorrentLine }

export default class RecentTorrents extends Component {
  constructor() {
  	super()
  	this.torrents = [];
  }
  componentDidMount() {
  	window.torrentSocket.emit('recentTorrents', (data) => {
  		this.torrents = data;
  		this.forceUpdate();
  	});
  	window.torrentSocket.on('newTorrent', (torrent) => {
  		this.torrents.unshift(torrent);
  		if(this.torrents.length > 10)
  			this.torrents.pop()
  		this.forceUpdate();
  	});
  }
  render() {
    if(!this.torrents || this.torrents.length == 0)
      return null;

    return (
      <List className='animated'>
        <Subheader inset={true}>Most recent torrents</Subheader>
        <Divider />
        {
        	this.torrents.map((torrent, index) =>{
        		return <TorrentLine key={index} torrent={torrent} />;
        	})
        }
      </List>
    );
  }
}
