import React, { Component } from 'react';

export default class Search extends Component {
  componentDidMount() {

  }
  render() {
    return (
      <div className="row">
        <input type='text' ref='searchInput' onKeyPress={(e) => {
          if (e.key === 'Enter') {
            window.torrentSocket.emit('search', e.target.value, (torrents) => {
              console.log(torrents);
            });
          }
        }} />
      </div>
    );
  }
}
