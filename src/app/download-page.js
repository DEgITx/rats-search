import React from 'react';
import Page from './page';
import Footer from './footer';

import TorrentLine from './torrent'
import {List} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import RaisedButton from 'material-ui/RaisedButton';

export default class TopPage extends Page {
  downloads = []

  constructor(props) {
    super(props)
    this.setTitle('Current Downloads');
  }
  getDownloads()
  {
    window.torrentSocket.emit('downloads', window.customLoader((downloads) => {
      this.downloads = downloads
      this.forceUpdate()
    }))
  }
  componentDidMount()
  {
    super.componentDidMount();
    this.getDownloads()
    this.downloading = () => this.getDownloads()
    window.torrentSocket.on('downloading', this.downloading);
    this.downloadDone = () => this.getDownloads()
    window.torrentSocket.on('downloadDone', this.downloadDone);
  }
  componentWillUnmount()
  {
    if(this.downloading)
      window.torrentSocket.off('downloading', this.downloading);
    if(this.downloadDone)
      window.torrentSocket.off('downloadDone', this.downloadDone);
  }
  render() {
    return (
      <div>
      	<div className='column center w100p pad0-75'>
          <RaisedButton label="Back to main page" primary={true} onClick={() => {
            window.router('/')
          }} />
            <List style={{paddingBottom: '70px'}} className='animated recent-torrents'>
              {
                this.downloads.map((download, index) => {
                  return <TorrentLine key={index} torrent={download.torrentObject} download={download} />
                })
              }
            </List>
          <Footer />
        </div>
      </div>
    );
  }
}
