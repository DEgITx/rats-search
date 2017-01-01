import React, { Component } from 'react';

export default class TorrentPage extends Component {
  componentDidMount() {
  	window.torrentSocket.emit('torrent', this.props.hash, {files: true}, (data) => {
  		console.log(data);
  		this.torrent = data
  		this.forceUpdate();
  	});
  }
  render() {
    return (
      <div className="column">
      {
   			this.torrent
   			?
   			<div>
   				{this.torrent.name}
   			</div>
   			:
   			null
      }
      </div>
    );
  }
}
