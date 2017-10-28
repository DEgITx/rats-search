import React from 'react';
import Component from './component';

let WebTorrent = require('webtorrent');

let client = new WebTorrent();

export default class TorrentPlayer extends Component {
  componentDidMount()
  {
    super.componentDidMount();

    //const hash = this.props.torrent.hash;
    const hash = '24147293ebcca6c1a76c7fa23e89a0b55db312d8';
    if(!hash)
      return;

    console.log('trying to add', hash)
    this.torrentId = `magnet:?xt=urn:btih:${hash}&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F`;
    client.add(this.torrentId, function (torrent) {
      // Got torrent metadata! 
      console.log('Client is downloading:', torrent.infoHash)
      torrent.files.forEach(function (file) {
        // Display the file by appending it to the DOM. Supports video, audio, images, and 
        // more. Specify a container element (CSS selector or reference to DOM node). 
        file.appendTo('#playerWindow')
      })
    })
  }
  componentWillUnmount()
  {
    super.componentWillUnmount();
    if(this.torrentId)
    {
      console.log('removing', this.torrentId)
      client.remove(this.torrentId);
    }
  }

  render() {
    return (
      <div className='w100p column'>
      	<div id='playerWindow' />
      </div>
    );
  }
}
