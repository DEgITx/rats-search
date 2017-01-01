import React, { Component } from 'react';

export default class SearchResults extends Component {
  render() {
    return (
      <div className="list column">
      {
      	this.props.results && this.props.results.length > 0
      	?
      	this.props.results.map((torrent, index) =>{
      		return(
      			<div key={index}>
      			{torrent.name}
      			</div>
      		);
      	})
      	:
      	null
      }
      </div>
    );
  }
}
