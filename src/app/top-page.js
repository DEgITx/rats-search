import React from 'react';
import Page from './page';

import TorrentLine from './torrent'
import {List} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import RaisedButton from 'material-ui/RaisedButton';
import LinearProgress from 'material-ui/LinearProgress';

export default class TopPage extends Page {
  constructor(props) {
    super(props)
    this.setTitle('Rats On The Boat - Torrents top');
    this.topTorrents = {};
    this.types = ['main', 'week', 'hours', 'month', 'video', 'audio', 'books', 'pictures', 'application', 'archive']
    this.descriptions = {
      main: 'All',
      video: 'Video',
      audio: 'Audio/Music',
      books: 'Books',
      pictures: 'Pictures/Images',
      application: 'Applications/Games',
      archive: 'Archives',
      week: 'Last week',
      hours: 'Last 24 hours',
      month: 'Last month'
    }
  }
  componentDidMount()
  {
    super.componentDidMount();
    for(const type of this.types)
    {
      window.torrentSocket.emit('topTorrents', type == 'main' ? null : type, window.customLoader((data) => {
        this.topTorrents[type] = data;
        this.forceUpdate()
      }))
    }
    this.remoteTopTorrents = ({torrents, type}) => {
      if(!torrents)
        return
      this.topTorrents[type] = _.orderBy(_.unionBy(this.topTorrents[type], torrents, 'hash'), ['seeders'], ['desc'])
      this.forceUpdate();
    }
    window.torrentSocket.on('remoteTopTorrents', this.remoteTopTorrents);
  }
  componentWillUnmount()
  {
    if(this.remoteTopTorrents)
      window.torrentSocket.off('remoteTopTorrents', this.remoteTopTorrents);
  }
  render() {
    return (
      <div>
      	<div className='column center w100p pad0-75'>
          <RaisedButton label="Back to main page" primary={true} onClick={() => {
            window.router('/')
          }} />
          {
            Object.keys(this.topTorrents).length == 0
            &&
            <div className='pad0-75 w100p '>
              <LinearProgress mode="indeterminate" />
            </div>
          }
          {
            this.types.map((type, index) => {
              const torrents = this.topTorrents[type];

              if(!torrents)
                return null;

              return (
                <List key={index} style={{paddingBottom: '70px'}} className='animated recent-torrents'>
                  <Subheader inset={true}>
                  {
                    this.descriptions[type]
                  }
                  </Subheader>
                {
                  torrents.map((torrent, index) => {
                    return <TorrentLine key={index} torrent={torrent} />
                  })
                }
                </List>
              )
              
            })
          }
        </div>
      </div>
    );
  }
}
