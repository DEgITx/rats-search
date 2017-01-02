import React, { Component } from 'react';

import { TorrentLine } from './recent-torrents'
import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';

export default class SearchResults extends Component {
  render() {
    return (
      <List style={{minWidth: '20em'}}>
      	  {
	      	this.props.results && this.props.results.length > 0
	      	?
	      	<Subheader inset={true}>Search results</Subheader>
	      	:
	      	null
	      }
	      {
	      	this.props.results && this.props.results.length > 0
	      	?
	      	this.props.results.map((torrent, index) =>{
	      		return(
	      			<TorrentLine torrent={torrent} key={index} />
	      		);
	      	})
	      	:
	      	null
	      }
      </List>
    );
  }
}
