import React, { Component } from 'react';

import RecentTorrents from './recent-torrents'
import Search from './search'

export default class IndexPage extends Component {
  render() {
    return (
      <div className="column">
        <RecentTorrents />
        <Search />
      </div>
    );
  }
}
