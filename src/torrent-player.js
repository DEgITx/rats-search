import React from 'react';
import Component from './component';

let WebTorrent = require('webtorrent');

let client = new WebTorrent();

export default class TorrentPlayer extends Component {
  componentDidMount()
  {
    super.componentDidMount();

    this.torrentId = 'magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent';
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
    console.log('removing');
    client.remove(this.torrentId);
  }

  render() {
    return (
      <div className='w100p column'>
      	<div id='playerWindow' />
      </div>
    );
  }
}
