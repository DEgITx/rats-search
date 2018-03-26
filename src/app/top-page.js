import React from 'react';
import Page from './page';

import TorrentLine from './torrent'
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import RaisedButton from 'material-ui/RaisedButton';
import LinearProgress from 'material-ui/LinearProgress';

import {Tabs, Tab} from 'material-ui/Tabs';

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
      application: 'Apps/Games',
      archive: 'Archives',
      week: 'Last week',
      hours: 'Last 24 hours',
      month: 'Last month'
    }
    this.state = {value: 'All'}
  }
  loadMoreTorrents(type)
  {
    window.torrentSocket.emit('topTorrents', 
        type == 'main' ? null : type, 
        {index: (this.topTorrents[type] && this.topTorrents[type].length) || 0},
        window.customLoader((data) => {
          if(!this.topTorrents[type])
            this.topTorrents[type] = []
          if(data && data.length > 0)
          {
            this.topTorrents[type] = this.topTorrents[type].concat(data);
            this.forceUpdate()
          }
        })
    )
  }
  componentDidMount()
  {
    super.componentDidMount();
    for(const type of this.types)
    {
      this.loadMoreTorrents(type)
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
  handleChange = (value) =>
  {
    this.setState({
      value,
    });
  }
  render() {
    return (
      <div>
      	<div className='column center w100p'>
          {
            Object.keys(this.topTorrents).length == 0
            &&
            <div className='pad0-75 w100p '>
              <LinearProgress mode="indeterminate" />
            </div>
          }
          <Tabs
            className='w100p'
		        value={this.state.value}
            onChange={this.handleChange}
            tabItemContainerStyle={{flexWrap: 'wrap', alignItems: 'stretch'}}
            inkBarStyle={{display: 'none'}}
		      >
          {
            this.types.map((type, index) => {
              const torrents = this.topTorrents[type];

              if(!torrents)
                return null;

              return (

                <Tab style={{minWidth: 150}} key={index} label={this.descriptions[type]} value={this.descriptions[type]}>
                  <List style={{minWidth: '20em'}}>
                    {
                      torrents.map((torrent, index) => {
                        return <TorrentLine key={index} torrent={torrent} />
                      })
                    }
                    <div>
                      <ListItem innerDivStyle={{textAlign: 'center', padding: '1em'}} primaryText={<span>More Torrents</span>} onClick={() => {
                        this.loadMoreTorrents(type)
                      }} />
                      <Divider />
                    </div>
                  </List>
                </Tab>
              )
              
            })
          }
          </Tabs>
        </div>
      </div>
    );
  }
}
