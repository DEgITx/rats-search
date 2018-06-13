import React, { Component } from 'react';
import TorrentLine from './torrent'
import {List} from 'material-ui/List';
import Divider from 'material-ui/Divider';
import Subheader from 'material-ui/Subheader';

export default class RecentTorrents extends Component {
  constructor() {
  	super()
  	this.torrents = [];
  }
  componentDidMount() {
  	window.torrentSocket.emit('feed', window.customLoader((data) => {
  		if(data) {
  			this.torrents = data;
  			console.log(data)
  			this.forceUpdate();
  		}
  	}))
  }
  render() {
    return (
      <List className='animated torrents-container'>
        <Subheader className='recent-title' inset={true}>
        	{__('Feed')}
        </Subheader>
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
