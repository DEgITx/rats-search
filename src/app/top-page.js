import React from 'react';
import Page from './page';

import TorrentLine from './torrent'
import {List, ListItem} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';
import RaisedButton from 'material-ui/RaisedButton';
import LinearProgress from 'material-ui/LinearProgress';

import {Tabs, Tab} from 'material-ui/Tabs';
import _ from 'lodash'

export default class TopPage extends Page {
  constructor(props) {
    super(props)
    this.setTitle('Rats On The Boat - Torrents top');
    this.topTorrents = {};
    this.types = ['main', 'video', 'audio', 'books', 'pictures', 'application', 'archive']
    this.descriptions = {
      main: 'All',
      video: 'Video',
      audio: 'Audio/Music',
      books: 'Books',
      pictures: 'Pictures/Images',
      application: 'Apps/Games',
      archive: 'Archives'
    }
    this.times = {
      overall: 'Overall',
      hours: 'Last hour',
      week: 'Last week',
      month: 'Last month'
    }
    this.state = {type: 'main', time: 'overall'}
  }
  loadMoreTorrents(type, time)
  {
    time = time ? time : this.state.time
    window.torrentSocket.emit('topTorrents', 
        type == 'main' ? null : type, 
        {index: (this.topTorrents[type] && this.topTorrents[type][time] && this.topTorrents[type][time].length) || 0, time},
        window.customLoader((data) => {
          if(!this.topTorrents[type])
            this.topTorrents[type] = {}
          if(!this.topTorrents[type][time])
            this.topTorrents[type][time] = []

          if(data && data.length > 0)
          {
            this.topTorrents[type][time] = this.topTorrents[type][time].concat(data);
            this._update()
          }
        })
    )
  }
  _update()
  {
    if(this.timeForce)
      return
    this.timeForce = setTimeout(() => {
      delete this.timeForce
      this.forceUpdate()
    }, 550)
  }
  componentDidMount()
  {
    super.componentDidMount();
    for(const type of this.types)
    {
      this.loadMoreTorrents(type)
    }
    this.remoteTopTorrents = ({torrents, type, time}) => {
      if(!torrents)
        return

      time = time ? time : 'overall'
      type = type ? type : 'main'
      this.topTorrents[type][time] = _.orderBy(_.unionBy(this.topTorrents[type][time], torrents, 'hash'), ['seeders'], ['desc'])
      this._update();
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
		        value={this.state.type}
            onChange={(type) => {
              this.setState({type});
              // lost other content
              if(!this.topTorrents[type][this.state.time])
              {
                this.loadMoreTorrents(type, this.state.time)
              }
            }}
            tabItemContainerStyle={{flexWrap: 'wrap', alignItems: 'stretch'}}
            inkBarStyle={{display: 'none'}}
		      >
          {
            this.types.map((type, index) => {
              if(!this.topTorrents[type])
                return null;

              return (
                <Tab buttonStyle={type === this.state.type ? {fontWeight: 'bold'} : undefined} style={{minWidth: 150}} key={index} label={this.descriptions[type]} value={type}>
                  <Tabs
                    className='w100p'
                    value={this.state.time}
                    onChange={(time) => {
                      this.setState({time})
                      // lost other content
                      if(!this.topTorrents[type][time])
                      {
                        this.loadMoreTorrents(type, time)
                      }
                    }}
                    tabItemContainerStyle={{flexWrap: 'wrap', alignItems: 'stretch'}}
                    inkBarStyle={{display: 'none'}}
                  >
                  {
                    Object.keys(this.times).map((time, index) => {
                      const torrents = this.topTorrents[type][time];

                      if(!torrents)
                        return (
                          <Tab buttonStyle={time === this.state.time ? {fontWeight: 'bold'} : undefined} style={{minWidth: 150}} key={index} label={this.times[time]} value={time}>
                            <div className='pad0-75 w100p '>
                              <LinearProgress mode="indeterminate" />
                            </div>
                          </Tab>
                        )

                      return (
                      <Tab buttonStyle={time === this.state.time ? {fontWeight: 'bold'} : undefined} style={{minWidth: 150}} key={index} label={this.times[time]} value={time}>
                        <List style={{minWidth: '20em'}}>
                          {
                            torrents.map((torrent, index) => {
                              return <TorrentLine key={index} torrent={torrent} />
                            })
                          }
                          {
                          torrents.length > 0
                          &&
                          <div>
                            <ListItem innerDivStyle={{textAlign: 'center', padding: '1em'}} primaryText={<span>More Torrents</span>} onClick={() => {
                              this.loadMoreTorrents(type)
                            }} />
                            <Divider />
                          </div>
                          }
                        </List>
                      </Tab>)
                    })
                  }
                    
                  </Tabs>
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
