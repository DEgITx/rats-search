import React, { Component } from 'react';

import AdvancedSearch from './search-advanced-controls'
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import RefreshIndicator from 'material-ui/RefreshIndicator';

import Checkbox from 'material-ui/Checkbox';
import Visibility from 'material-ui/svg-icons/action/visibility';
import VisibilityOff from 'material-ui/svg-icons/action/visibility-off';
import AddIcon from 'material-ui/svg-icons/content/add';
import RemoveIcon from 'material-ui/svg-icons/content/remove';

import formatBytes from './format-bytes'

import _ from 'lodash'
import singleton from './singleton';

class TorrentsStatistic extends Component {
  constructor(props)
  {
    super(props)
    
    this.stats = props.stats || {}
  }
  componentDidMount()
  {
    this.newTorrentFunc = (torrent) => {
      this.stats.size += torrent.size;
      this.stats.torrents++;
      this.stats.files += torrent.files; 
      this.forceUpdate()
    }

    window.torrentSocket.on('newTorrent', this.newTorrentFunc);
  }
  componentWillUnmount()
  {
    if(this.newTorrentFunc)
      window.torrentSocket.off('newTorrent', this.newTorrentFunc);
  }
  render()
  {
    return (
      <div className='fs0-75 pad0-75' style={{color: 'rgba(0, 0, 0, 0.541176)'}}>you have information about {this.stats.torrents} torrents and around {this.stats.files} files and { formatBytes(this.stats.size, 1) } of data</div>
    )
  }
}

class Search extends Component {
  constructor(props)
  {
    super(props)
    this.onSearchUpdate = () => {}

    this.state = { 
      searchingIndicator: false,
      safeSearchText: 'safe search enabled',
      safeSearchColor: 'rgb(0, 188, 212)',
      moreTorrentsIndicator: false,
      moreFilesIndicator: false,
      orderBy: null,
      orderDesc: false,
      advancedSearch: false,
    }
    this.searchLimit = 10
    this.advanced = {}
    this.searchError = undefined;
  }

  search(oldSearch) {
    this.setState({
      searchingIndicator: true
    });
    this.onSearchUpdate('indicator')
    
    this.searchTorrents = [];
    this.moreSearchTorrents = true;
    this.searchFiles = [];
    this.moreSearchFiles = true;
    this.currentSearch = this.searchValue;
    let queries = 2;
    let searchTorrentsParams = {
        limit: this.searchLimit, 
        safeSearch: !this.notSafeSearch,
        orderBy: this.state.orderBy,
        orderDesc: this.state.orderDesc,
    };
    if(this.state.advancedSearch && this.advanced)
      searchTorrentsParams = Object.assign(searchTorrentsParams, this.advanced);

    window.torrentSocket.emit('searchTorrent', oldSearch ? this.currentSearch : this.searchValue, searchTorrentsParams, window.customLoader((torrents) => {
      if(torrents) {
        this.searchTorrents = torrents;
        if(torrents.length != this.searchLimit)
          this.moreSearchTorrents = false;
      }
      else
      {
        this.moreSearchTorrents = false;
      }
      if(--queries == 0) {
        this.setState({
          searchingIndicator: false
        });
      }
      this.onSearchUpdate('torrents')
    }));
    let searchFilesParams = {
      limit: this.searchLimit, 
      safeSearch: !this.notSafeSearch,
      orderBy: this.state.orderBy,
      orderDesc: this.state.orderDesc,
    };
    if(this.state.advancedSearch && this.advanced)
      searchFilesParams = Object.assign(searchFilesParams, this.advanced);
    
    window.torrentSocket.emit('searchFiles', oldSearch ? this.currentSearch : this.searchValue, searchFilesParams, window.customLoader((torrents) => {
      if(torrents) {
        this.searchFiles = torrents;
        let files = 0;
        torrents.forEach((torrent) => {
          if(torrent.path && torrent.path.length > 0)
            files += torrent.path.length
        });
        if(files != this.searchLimit)
          this.moreSearchFiles = false;
      }
      else
      {
        this.moreSearchFiles = false;
      }
      if(--queries == 0) {
        this.setState({
          searchingIndicator: false
        });
      }
      this.onSearchUpdate('files')
    }));
  }
  moreTorrents() {
    this.setState({moreTorrentsIndicator: true});
    this.onSearchUpdate('indicator')

    window.torrentSocket.emit('searchTorrent', this.currentSearch, {
        index: this.searchTorrents.length,
        limit: this.searchLimit, 
        safeSearch: !this.notSafeSearch,
        orderBy: this.state.orderBy,
        orderDesc: this.state.orderDesc,
    }, window.customLoader((torrents) => {
      if(torrents) {
        this.searchTorrents = this.searchTorrents.concat(torrents);
        if(torrents.length != this.searchLimit)
          this.moreSearchTorrents = false;

        this.setState({moreTorrentsIndicator: false});
        this.onSearchUpdate('more torrents')
      }
    }));
  }
  moreFiles() {
    let index = 0;
    this.searchFiles.forEach((torrent) => {
      if(torrent.path && torrent.path.length > 0)
        index += torrent.path.length;
    });

    this.setState({moreFilesIndicator: true});
    this.onSearchUpdate('indicator')

    window.torrentSocket.emit('searchFiles', this.currentSearch, {
        index: index,
        limit: this.searchLimit, 
        safeSearch: !this.notSafeSearch,
        orderBy: this.state.orderBy,
        orderDesc: this.state.orderDesc,
    }, window.customLoader((torrents) => {
      if(torrents) {
        this.searchFiles = this.searchFiles.concat(torrents);
        let files = 0;
        torrents.forEach((torrent) => {
          if(torrent.path && torrent.path.length > 0)
            files += torrent.path.length
        });
        if(files != this.searchLimit)
          this.moreSearchFiles = false;

        this.mergeFiles()

        this.setState({moreFilesIndicator: false});
        this.onSearchUpdate('more files')
      }
    }));
  }
  mergeFiles()
  {
    for(let i = 0; i < this.searchFiles.length; i++)
    {
      for(let j = i + 1; j < this.searchFiles.length; j++)
      {
        if(this.searchFiles[i].hash != this.searchFiles[j].hash)
          continue

        if(!this.searchFiles[i].remove)
        {
          this.searchFiles[i].path = this.searchFiles[i].path.concat(this.searchFiles[j].path)
        }
        
        this.searchFiles[j].remove = true
      }
    }

    this.searchFiles = this.searchFiles.filter(torrent => !torrent.remove)
  }

  componentDidMount() {
    this.newStatisticFunc = (statistic) => {
      if(statistic) {
        this.stats = statistic;
        this.forceUpdate();
      }
    };
    window.torrentSocket.emit('statistic', window.customLoader(this.newStatisticFunc));
    window.torrentSocket.on('newStatistic', this.newStatisticFunc);

    this.remoteSearchTorrent = (torrents) => {
      if(!torrents)
        return
      this.searchTorrents = _.unionBy(this.searchTorrents, torrents, 'hash')
      this.onSearchUpdate('remote torrents')
    }
    window.torrentSocket.on('remoteSearchTorrent', this.remoteSearchTorrent);

    this.remoteSearchFiles = (torrents) => {
      if(!torrents)
        return
      this.searchFiles = _.unionBy(this.searchFiles, torrents, 'hash')
      this.mergeFiles()
      this.onSearchUpdate('remote files')
    }
    window.torrentSocket.on('remoteSearchFiles', this.remoteSearchFiles);
  }
  componentWillUnmount()
  {
    if(this.newStatisticFunc)
      window.torrentSocket.off('newStatistic', this.newStatisticFunc);

    if(this.remoteSearchTorrent)
      window.torrentSocket.off('remoteSearchTorrent', this.remoteSearchTorrent);

    if(this.remoteSearchFiles)
      window.torrentSocket.off('remoteSearchFiles', this.remoteSearchFiles);
  }
  setSafeSearch(ch) {
    this.notSafeSearch = ch;
    if(ch)
    {
      return {safeSearchText: 'safe search disabled', safeSearchColor: '#EC407A'}
    }
    else
    {
      return {safeSearchText: 'safe search enabled', safeSearchColor: 'rgb(0, 188, 212)'}
    }
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
              defaultValue={this.searchValue}
              errorText={this.searchError}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  this.search();
                }
             }}
             onChange={e => {
               this.searchValue = e.target.value
               if(this.searchValue.length < 3 && this.searchValue.length > 0)
                this.searchError = 'too short string for search';
               else
                this.searchError = undefined;
               this.forceUpdate()
             }}
          />
          <RaisedButton style={{marginTop: '15px', marginLeft: '10px'}} label="Search" primary={true} onClick={() =>{
            this.search()
          }} />
        </div>
        <div className='row w100p center wrap' style={{padding: '0 8px'}}>
        <div style={{padding: '0px 17px'}}>
            <Checkbox
              ref='safeSearch'
              checked={this.notSafeSearch ? true : false}
              checkedIcon={<Visibility />}
              uncheckedIcon={<VisibilityOff />}
              label={<span className='text-nowrap' style={{fontSize: '0.87em', transition: '0.1s', color: this.state.safeSearchColor}}>{this.state.safeSearchText}</span>}
              iconStyle={{fill: this.state.safeSearchColor}}
              onCheck={(ev, ch) => {
                this.setState(this.setSafeSearch(ch));
              }}
              style={{paddingBottom: '0.8em'}}
            />
          </div>
          <div style={{padding: '0px 17px'}}>
            <Checkbox
              ref='advancedSearch'
              checked={this.state.advancedSearch}
              checkedIcon={<RemoveIcon />}
              uncheckedIcon={<AddIcon />}
              label={<span className='text-nowrap' style={{fontSize: '0.87em', transition: '0.1s', color: 'black'}}>advanced search</span>}
              iconStyle={{fill: 'black'}}
              onCheck={(ev, ch) => {
                this.setState({advancedSearch: ch});
              }}
              style={{paddingBottom: '0.8em'}}
            />
          </div>
        </div>
        {
          this.state.advancedSearch
          &&
          <AdvancedSearch onChange={(state) => {
            this.advanced = state;
          }} state={this.advanced} />
        }
        {
            this.stats
            &&
            <TorrentsStatistic stats={this.stats} />
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
      </div>
    );
  }
}

export default singleton(Search)