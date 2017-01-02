import React, { Component } from 'react';

import SearchResults from './search-results'
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';

export default class Search extends Component {
  search() {
    window.torrentSocket.emit('search', this.searchValue, (torrents) => {
      this.searchData = torrents;
      this.forceUpdate();
    });
  }
  componentDidMount() {
    window.torrentSocket.emit('statistic', (statistic) => {
      this.stats = statistic;
      this.forceUpdate();
    });
  }
  render() {
    return (
      <div className="column w100p center">
        <div className='row inline w100p pad0-75' style={{maxWidth: '30em'}}>
          <TextField
              hintText="Search torrent or file"
              floatingLabelText="What to search?"
              fullWidth={true}
              ref='searchInput'
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  this.search();
                }
             }}
             onChange={e => {this.searchValue = e.target.value}}
          />
          <RaisedButton style={{marginTop: '15px', marginLeft: '10px'}} label="Search" primary={true} onClick={() =>{
            this.search()
          }} />
        </div>
        {
            this.stats
            ?
            <div className='fs0-75' style={{color: 'rgba(0, 0, 0, 0.541176)'}}>we have {this.stats.torrents} torrents and around {this.stats.files} files here</div>
            :
            null
        }
        <SearchResults results={this.searchData} />
      </div>
    );
  }
}
