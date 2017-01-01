import React, { Component } from 'react';
import './app.css';

var io = require("socket.io-client");
window.torrentSocket = io('http://localhost:8099/');

import RecentTorrents from './recent-torrents'
import Search from './search'

class App extends Component {
  render() {
    return (
      <div className="App">
      	<RecentTorrents />
      	<Search />
      </div>
    );
  }
}

export default App;
