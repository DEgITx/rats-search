import React, { Component } from 'react';

import SearchResults from './search-results'
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import RefreshIndicator from 'material-ui/RefreshIndicator';

import Checkbox from 'material-ui/Checkbox';
import Visibility from 'material-ui/svg-icons/action/visibility';
import VisibilityOff from 'material-ui/svg-icons/action/visibility-off';

import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

import formatBytes from './format-bytes'

let session;

export default class Search extends Component {
  constructor(props)
  {
    super(props)
    this.state = { 
      searchingIndicator: false,
      safeSearchText: 'safe search enabled',
      safeSearchColor: 'rgb(0, 188, 212)',
      moreTorrentsIndicator: false,
      moreFilesIndicator: false,
      orderBy: null,
      orderDesc: false,
    }
    this.searchLimit = 10
    
    if(session)
    {
      this.searchTorrents = session.searchTorrents;
      this.searchFiles = session.searchFiles;
      this.moreSearchTorrents = session.moreSearchTorrents;
      this.moreSearchFiles = session.moreSearchFiles;
      this.currentSearch = session.currentSearch;
      this.searchValue = session.searchValue;
      Object.assign(this.state, this.setSafeSearch(session.notSafeSearch))
      this.state.orderBy = session.orderBy;
      this.state.orderDesc = session.orderDesc;
    }
  }

  search(oldSearch) {
    this.setState({
      searchingIndicator: true
    });
    this.searchTorrents = [];
    this.moreSearchTorrents = true;
    this.searchFiles = [];
    this.moreSearchFiles = true;
    this.currentSearch = this.searchValue;
    let queries = 2;
    window.torrentSocket.emit('searchTorrent', oldSearch ? this.currentSearch : this.searchValue, {
        limit: this.searchLimit, 
        safeSearch: !this.notSafeSearch,
        orderBy: this.state.orderBy,
        orderDesc: this.state.orderDesc,
    }, window.customLoader((torrents) => {
      if(torrents) {
        this.searchTorrents = torrents;
        if(torrents.length != this.searchLimit)
          this.moreSearchTorrents = false;
      }
      if(--queries == 0) {
        this.setState({
          searchingIndicator: false
        });
      } else {
        this.forceUpdate();
      }
    }));
    window.torrentSocket.emit('searchFiles', oldSearch ? this.currentSearch : this.searchValue, {
      limit: this.searchLimit, 
      safeSearch: !this.notSafeSearch,
      orderBy: this.state.orderBy,
      orderDesc: this.state.orderDesc,
    }, window.customLoader((torrents) => {
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
      if(--queries == 0) {
        this.setState({
          searchingIndicator: false
        });
      } else {
        this.forceUpdate();
      }
    }));
  }
  moreTorrents() {
    this.setState({moreTorrentsIndicator: true});

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

        this.setState({moreFilesIndicator: false});
      }
    }));
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
  }
  componentWillUnmount()
  {
    if(this.newStatisticFunc)
      window.torrentSocket.off('newStatistic', this.newStatisticFunc);

    session = {
      searchTorrents: this.searchTorrents,
      searchFiles: this.searchFiles,
      moreSearchTorrents: this.moreSearchTorrents,
      moreSearchFiles: this.moreSearchFiles,
      currentSearch: this.currentSearch,
      searchValue: this.searchValue,
      notSafeSearch: this.notSafeSearch,
      orderBy: this.state.orderBy,
      orderDesc: this.state.orderDesc,
    } 
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

    const orderText = (text, field) => {
      if(field !== this.state.orderBy)
        return text;

      if(this.state.orderDesc)
        return text + ' ⇩'
      else
        return text + ' ⇧'
    }

    return (
      <div className="column w100p center">
        <div className='row inline w100p pad0-75' style={{maxWidth: '30em'}}>
          <TextField
              hintText="Search torrent or file"
              floatingLabelText="What to search?"
              fullWidth={true}
              ref='searchInput'
              defaultValue={this.searchValue}
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
        <div className='row'>
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
        <SearchResults 
          torrentsSearchResults={this.searchTorrents} 
          filesSearchResults={this.searchFiles}
          currentSearching={this.state.searchingIndicator}
          
          resultSelector={
            <SelectField
            floatingLabelText="Sort by"
            floatingLabelFixed={true}
            value={this.state.orderBy}
            onChange={(event, index, value) => {
              event.preventDefault(); // fix overclick on torrent
              if(value === 'none') {
                this.setState({orderBy: null}, () => {
                  this.search(true)
                })
                return;
              }

              if(value === this.state.orderBy)
              {
                this.setState({orderDesc: !this.state.orderDesc}, () => {
                  this.search(true)
                })
                return;
              }

              this.setState({
                orderBy: value, 
                orderDesc: (value === 'seeders' || value === 'completed' || value === 'added') ? true : this.state.orderDesc
              }, () => {
                this.search(true)
              })
            }}
          >
              <MenuItem value='none' primaryText={'None'} />
              <MenuItem value='seeders' primaryText={orderText('Seeders', 'seeders')} />
              <MenuItem value='name' primaryText={orderText('Name', 'name')} />
              <MenuItem value='files' primaryText={orderText('Files', 'files')} />
              <MenuItem value='size' primaryText={orderText('Size', 'size')} />
              <MenuItem value='added' primaryText={orderText('Added date', 'added')} />
              <MenuItem value='completed' primaryText={orderText('Completed', 'completed')} />
            </SelectField>
          }

          moreTorrentsEnabled={this.moreSearchTorrents && !this.state.searchingIndicator}
          moreFilesEnabled={this.moreSearchFiles && !this.state.searchingIndicator}
          onMoreTorrents={() => this.moreTorrents()}
          onMoreFiles={() => this.moreFiles()}
          moreTorrentsIndicator={this.state.moreTorrentsIndicator}
          moreFilesIndicator={this.state.moreFilesIndicator}
        />
      </div>
    );
  }
}
