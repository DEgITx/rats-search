import React, { Component } from 'react';

import SearchResults from './search-results'
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import RefreshIndicator from 'material-ui/RefreshIndicator';

import formatBytes from './format-bytes'

export default class Search extends Component {
  constructor(props)
  {
    super(props)
    this.state = { searchingIndicator: false }
  }

  search() {
    this.setState({
      searchingIndicator: true
    });
    this.searchData = [];
    let queries = 2;
    window.torrentSocket.emit('searchTorrent', this.searchValue, {limit: 10}, (torrents) => {
      if(torrents) {
        this.searchData = this.searchData.concat(torrents);
      }
      if(--queries == 0) {
        this.setState({
          searchingIndicator: false
        });
      } else {
        this.forceUpdate();
      }
    });
    window.torrentSocket.emit('searchFiles', this.searchValue, {limit: 10}, (torrents) => {
      if(torrents) {
        this.searchData = this.searchData.concat(torrents);
      }
      if(--queries == 0) {
        this.setState({
          searchingIndicator: false
        });
      } else {
        this.forceUpdate();
      }
    });
  }
  componentDidMount() {
    window.torrentSocket.emit('statistic', (statistic) => {
      this.stats = statistic;
      this.forceUpdate();
    });
    window.torrentSocket.on('newStatistic', (statistic) => {
      this.stats = statistic;
      this.forceUpdate();
    });
  }
  render() {
    const style = {
      refresh: {
        display: 'inline-block',
        position: 'relative',
      },
    };

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
            <div className='fs0-75 pad0-75' style={{color: 'rgba(0, 0, 0, 0.541176)'}}>we have information about {this.stats.torrents} torrents and around {this.stats.files} files and { formatBytes(this.stats.size, 1) } of data</div>
            :
            null
        }
        {
          this.state.searchingIndicator
          ?
          <div className='pad1'>
            <RefreshIndicator
              size={50}
              left={0}
              top={0}
              loadingColor="#FF9800"
              status="loading"
              style={style.refresh}
            />
          </div>
          :
          null
        }
        <SearchResults results={this.searchData} />
      </div>
    );
  }
}
