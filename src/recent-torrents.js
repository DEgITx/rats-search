import React, { Component } from 'react';
import formatBytes from './format-bytes'

const TorrentLine = (props) => {
  const torrent = props.torrent;
  return (
    <div className='clickable row inline fs0-85 pad0-25' onClick={() => window.router('/torrent/' + torrent.hash)}>
        <div>{torrent.name}</div>
        <div style={{marginLeft: '8px'}}>({formatBytes(torrent.size, 1)})</div>
    </div>
  )
}

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
      <div className="list column">
      {
      	this.torrents.map((torrent, index) =>{
      		return <TorrentLine key={index} torrent={torrent} />;
      	})
      }
      </div>
    );
  }
}
