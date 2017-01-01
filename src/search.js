import React, { Component } from 'react';

import SearchResults from './search-results'

export default class Search extends Component {
  render() {
    return (
      <div className="column">
        <div className='row'>
          <input type='text' ref='searchInput' onKeyPress={(e) => {
            if (e.key === 'Enter') {
              window.torrentSocket.emit('search', e.target.value, (torrents) => {
                this.searchData = torrents;
                this.forceUpdate();
              });
            }
          }} />
        </div>
        <SearchResults results={this.searchData} />
      </div>
    );
  }
}
