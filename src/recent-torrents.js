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
        primaryText={torrent.name}
        secondaryText={formatBytes(torrent.size, 1)}
        secondaryText={
            <div className='column'>
              <div>
              {
                formatBytes(torrent.size, 1)
              }
              </div>
              {
                torrent.path && torrent.path.length > 0
                ?
                <div>{torrent.path}</div>
                :
                null
              }
            </div>
          }
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
    return (
      <List>
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
