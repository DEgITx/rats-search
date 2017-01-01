import React, { Component } from 'react';

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
      		return(
      			<div key={index} className='clickable' onClick={() => window.router('/torrent/' + torrent.hash)}>
      			{torrent.name}
      			</div>
      		);
      	})
      }
      </div>
    );
  }
}
