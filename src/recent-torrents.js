import React, { Component } from 'react';
import formatBytes from './format-bytes'

import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import FlatButton from 'material-ui/FlatButton';

const TorrentLine = (props) => {
  const torrent = props.torrent;
return (
    <div>
      <ListItem 
        onClick={() => window.router('/torrent/' + torrent.hash)} 
        primaryText={<span className='break-word' style={{
        	color: torrent.contentCategory != 'xxx' ? 'black' : 'grey'
        }}>{torrent.name}</span>}
        secondaryText={
            <div className='column' style={{height: 'auto', whiteSpace: 'normal'}}>
              <div>
              {
                formatBytes(torrent.size, 1) + ' (' + torrent.files + ' files)'
              }
              </div>
              {
                torrent.path && torrent.path.length > 0
                ?
                <div className='break-word fs0-75' style={{paddingTop: '0.3em'}}>{torrent.path}</div>
                :
                null
              }
              {
                torrent.seeders || torrent.leechers || torrent.completed
                ?
                <div className='break-word fs0-85' style={{paddingTop: '0.3em'}}>
                  <span style={{color: (torrent.seeders > 0 ? '#00C853' : 'grey')}}>{torrent.seeders} seeders</span>
                  <span style={{color: (torrent.leechers > 0 ? '#AA00FF' : 'grey'), marginLeft: '12px'}}>{torrent.leechers} leechers</span>
                  <span style={{color: (torrent.completed > 0 ? '#FF6D00' : 'grey'), marginLeft: '12px'}}>{torrent.completed} completed downloads</span>
                </div>
                :
                null
              }
            </div>
          }
        leftIcon={
          (() => {
            switch(torrent.contentType)
            {
                case 'video':
                  return (
                    <svg viewBox="0 0 491.858 491.858" fill="grey">
                          <path d="M357.714,423.331c0,9.328-10.676,16.891-23.847,16.891H23.847C10.676,440.222,0,432.659,0,423.331V203.735
                            c0-9.33,10.676-16.892,23.847-16.892h310.02c13.171,0,23.847,7.564,23.847,16.892V423.331L357.714,423.331z"/>
                          <circle cx="89.428" cy="118.706" r="59.619"/>
                          <circle cx="253.381" cy="103.801" r="74.524"/>
                          <path d="M491.858,447.677c0,0-1.986,14.904-15.899,14.904c-13.912,0-103.34-83.42-103.34-94.397V258.882
                            c0-10.976,87.443-94.398,103.34-94.398c15.899,0,15.899,14.905,15.899,14.905V447.677z"/>
                    </svg>
                  )
                case 'audio':
                  return (
                    <svg viewBox="0 0 46 46" fill="grey">
                      <path d="M28.38,0c-0.551,0-1.097,0.153-1.579,0.444c-0.046,0.027-0.09,0.059-0.13,0.093L13.121,12H2.487c-0.553,0-1,0.447-1,1v19
                        c0,0.553,0.447,1,1,1h10.61L26.64,45.436c0.05,0.046,0.104,0.086,0.161,0.12C27.284,45.847,27.83,46,28.38,46
                        c1.713,0,3.106-1.416,3.106-3.156V3.156C31.487,1.416,30.093,0,28.38,0z M14.487,31c0,0.553-0.447,1-1,1s-1-0.447-1-1v-4
                        c0-0.553,0.447-1,1-1s1,0.447,1,1V31z M14.487,18c0,0.553-0.447,1-1,1s-1-0.447-1-1v-4c0-0.553,0.447-1,1-1s1,0.447,1,1V18z"/>
                      <path d="M44.513,22.5c0-5.972-4.009-11.302-9.749-12.962c-0.533-0.151-1.084,0.152-1.238,0.684
                        c-0.153,0.53,0.152,1.085,0.684,1.238c4.889,1.413,8.304,5.953,8.304,11.04s-3.415,9.627-8.304,11.04
                        c-0.531,0.153-0.837,0.708-0.684,1.238c0.127,0.438,0.526,0.723,0.961,0.723c0.092,0,0.185-0.013,0.277-0.039
                        C40.504,33.802,44.513,28.472,44.513,22.5z"/>
                    </svg>

                  )
                case 'pictures':
                  return (
                    <svg viewBox="0 0 58 58" fill="grey">
                    <path d="M57,6H1C0.448,6,0,6.447,0,7v44c0,0.553,0.448,1,1,1h56c0.552,0,1-0.447,1-1V7C58,6.447,57.552,6,57,6z M16,17
                      c3.071,0,5.569,2.498,5.569,5.569c0,3.07-2.498,5.568-5.569,5.568s-5.569-2.498-5.569-5.568C10.431,19.498,12.929,17,16,17z
                       M52.737,35.676c-0.373,0.406-1.006,0.435-1.413,0.062L40.063,25.414l-9.181,10.054l4.807,4.807c0.391,0.391,0.391,1.023,0,1.414
                      s-1.023,0.391-1.414,0L23.974,31.389L7.661,45.751C7.471,45.918,7.235,46,7,46c-0.277,0-0.553-0.114-0.751-0.339
                      c-0.365-0.415-0.325-1.047,0.09-1.412l17.017-14.982c0.396-0.348,0.994-0.329,1.368,0.044l4.743,4.743l9.794-10.727
                      c0.179-0.196,0.429-0.313,0.694-0.325c0.264-0.006,0.524,0.083,0.72,0.262l12,11C53.083,34.636,53.11,35.269,52.737,35.676z"/>
                    </svg>
                  )
                 case 'application':
                  return (
                    <svg viewBox="0 0 483.85 483.85" fill="grey">
                        <path d="M471.325,211.856l-56.9-56.9c-23.4-23.4-9.1-48.1,16.4-49.6c42-2.6,65.6-47.4,31.3-84.7c-37.3-34.2-81.9-10.7-84.5,31.2
                          c-1.6,25.5-26.5,39.9-49.8,16.6l-55.7-55.7c-16.7-16.7-43.8-16.7-60.5,0l-56.4,56.4c-23.4,23.4-48.2,8.9-49.8-16.6
                          c-2.6-42-47.6-65.9-84.9-31.6c-34.4,37.4-10.5,82.4,31.5,85c25.5,1.6,40,26.5,16.7,49.9l-56.2,56.1c-16.7,16.7-16.7,43.8,0,60.5
                          l55.7,55.7c23.4,23.3,9.5,47.6-16,49.2c-42,2.6-65.5,47.3-31.2,84.6c37.3,34.3,81.8,10.9,84.4-31.1c1.6-25.5,26-39.5,49.4-16.2
                          l56.2,56.2c17,17,44.8,17,61.8,0.1l39.4-39.4l16.9-16.9c22.1-23.1,7.8-47.4-17.4-49c-42-2.6-65.8-47.6-31.5-84.9
                          c37.3-34.3,82.3-10.4,84.9,31.6c1.6,25.2,25.8,39.4,48.9,17.3l15.3-15.3l41.2-41.2c0.1-0.1,0.1-0.1,0.2-0.2l0.6-0.6
                          C488.025,255.656,488.025,228.556,471.325,211.856z"/>
                    </svg>
                  )
                case 'books':
                  return (
                    <svg viewBox="0 0 296.999 296.999" fill="grey">
                        <g>
                          <path d="M45.432,35.049c-0.008,0-0.017,0-0.025,0c-2.809,0-5.451,1.095-7.446,3.085c-2.017,2.012-3.128,4.691-3.128,7.543
                            v159.365c0,5.844,4.773,10.61,10.641,10.625c24.738,0.059,66.184,5.215,94.776,35.136V84.023c0-1.981-0.506-3.842-1.461-5.382
                            C115.322,40.849,70.226,35.107,45.432,35.049z"/>
                          <path d="M262.167,205.042V45.676c0-2.852-1.111-5.531-3.128-7.543c-1.995-1.99-4.639-3.085-7.445-3.085c-0.009,0-0.018,0-0.026,0
                            c-24.793,0.059-69.889,5.801-93.357,43.593c-0.955,1.54-1.46,3.401-1.46,5.382v166.779
                            c28.592-29.921,70.038-35.077,94.776-35.136C257.394,215.651,262.167,210.885,262.167,205.042z"/>
                          <path d="M286.373,71.801h-7.706v133.241c0,14.921-12.157,27.088-27.101,27.125c-20.983,0.05-55.581,4.153-80.084,27.344
                            c42.378-10.376,87.052-3.631,112.512,2.171c3.179,0.724,6.464-0.024,9.011-2.054c2.538-2.025,3.994-5.052,3.994-8.301V82.427
                            C297,76.568,292.232,71.801,286.373,71.801z"/>
                          <path d="M18.332,205.042V71.801h-7.706C4.768,71.801,0,76.568,0,82.427v168.897c0,3.25,1.456,6.276,3.994,8.301
                            c2.545,2.029,5.827,2.78,9.011,2.054c25.46-5.803,70.135-12.547,112.511-2.171c-24.502-23.19-59.1-27.292-80.083-27.342
                            C30.49,232.13,18.332,219.963,18.332,205.042z"/>
                        </g>
                    </svg>
                  )
                default:
                  return (
                    <svg viewBox="0 0 123.769 123.769" fill="grey">
                      <g>
                        <path d="M76.05,1.568l-10.101,9.3c-2.3,2.1-5.8,2.1-8.1,0l-10.2-9.2c-3.1-2.8-8-1.7-9.6,2.1l-8.3,20h64.2l-8.3-20.1
                          C84.05-0.131,79.149-1.231,76.05,1.568z"/>
                        <path d="M10.749,42.068c-2.9,1.4-1.8,5.7,1.3,5.7h49.8h49.701c3.199,0,4.199-4.3,1.399-5.7l-12.2-6.3h-77.8L10.749,42.068z"/>
                        <path d="M0.549,90.168l5.3,28.801c0.5,2.899,3,4.8,5.9,4.8h50.1h50.201c2.899,0,5.399-2,5.899-4.8l5.3-28.801
                          c0.5-2.8-1-5.6-3.699-6.699c-12.801-5-26.2-7.7-36.801-9.301c-2.699-0.399-5.3,1.101-6.3,3.5l-10.1,22.9c-1.8,4-7.5,4-9.201-0.1
                          l-9.8-22.7c-1.1-2.5-3.7-4-6.4-3.601c-10.6,1.5-24,4.301-36.7,9.301C1.549,84.469-0.051,87.269,0.549,90.168z"/>
                      </g>
                    </svg>
                  )
            }
          })()
        }
        rightIcon={
          <a href={`magnet:?xt=urn:btih:${torrent.hash}`}>
	          <svg style={{
	          	height: '24px',
	          	fill: torrent.contentCategory != 'xxx' ? 'black' : 'grey'
	      	}} onClick={(e) => {
	            e.preventDefault();
	            e.stopPropagation();
	            var win = window.open(`magnet:?xt=urn:btih:${torrent.hash}`, '_self');
	         }} viewBox="0 0 24 24">
	            <path d="M15.82 10.736l-5.451 6.717c-.561.691-1.214 1.042-1.94 1.042-1.144 
	            0-2.327-.899-2.753-2.091-.214-.6-.386-1.76.865-2.784 3.417-2.794 6.716-5.446 
	            6.716-5.446l-3.363-4.174s-4.532 3.657-6.771 5.487c-2.581 2.108-3.123 4.468-3.123 
	            6.075 0 4.416 4.014 8.438 8.42 8.438 1.604 0 3.963-.543 6.084-3.128 1.835-2.237 
	            5.496-6.773 5.496-6.773l-4.18-3.363zm-2.604 9.079c-1.353 1.647-3.01 2.519-4.796 
	            2.519-3.471 0-6.753-3.291-6.753-6.771 0-1.789.867-3.443 2.51-4.785 1.206-.986 
	            2.885-2.348 4.18-3.398l1.247 1.599c-1.074.87-2.507 2.033-4.118 3.352-1.471 
	            1.202-1.987 2.935-1.38 4.634.661 1.853 2.479 3.197 4.322 3.197h.001c.86 0 
	            2.122-.288 3.233-1.658l3.355-4.134 1.572 1.294c-1.044 1.291-2.392 2.954-3.373 
	            4.151zm6.152-7.934l4.318-2.88-1.575-.638 1.889-2.414-4.421 2.788 1.716.695-1.927 
	            2.449zm-7.292-7.186l4.916-1.667-1.356-1.022 2.448-2.006-4.991 1.712 
	            1.478 1.114-2.495 1.869z"/></svg>
            </a>
        }
      />
      <Divider />
    </div>
  )
}

export { TorrentLine }

export default class RecentTorrents extends Component {
  constructor() {
  	super()
  	this.torrents = [];
  	this.displayQueue = [];
    this.displayQueueAssoc = {};
  	this.state = { pause: false }
  }
  componentDidMount() {
  	window.torrentSocket.emit('recentTorrents', (data) => {
  		if(data) {
  			this.torrents = data;
  			this.forceUpdate();
  		}

  		this.displayNewTorrent = setInterval(() => {
	  		if(this.displayQueue.length == 0)
	  			return;

	  		if(this.state.pause)
	  			return;

	  		let torrent = this.displayQueue.shift();
	  		this.torrents.unshift(torrent);
	  		if(this.torrents.length > 10) {
	  			let toDelete = this.torrents.pop()
          delete this.displayQueueAssoc[toDelete.hash];
        }

	  		this.forceUpdate();
	  	}, 850);
  	});
  	this.newTorrentFunc = (torrent) => {
  		this.displayQueue.push(torrent);
      this.displayQueueAssoc[torrent.hash] = torrent;
  		this.forceUpdate();
  	};
  	window.torrentSocket.on('newTorrent', this.newTorrentFunc);
    
    this.tracketUpdate = (statistic) => {
      if(statistic.hash in this.displayQueueAssoc)
      {
        Object.assign(this.displayQueueAssoc[statistic.hash], statistic);
        this.forceUpdate();
      }
    }
    window.torrentSocket.on('trackerTorrentUpdate', this.tracketUpdate);
  }
  pauseAndContinue() {
  	this.setState({
      pause: !this.state.pause
    });
  }
  componentWillUnmount() {
  	if(this.newTorrentFunc)
  		window.torrentSocket.off('newTorrent', this.newTorrentFunc);
    if(this.tracketUpdate)
      window.torrentSocket.off('trackerTorrentUpdate', this.tracketUpdate);
  	if(this.displayNewTorrent)
  		clearInterval(this.displayNewTorrent);
  }
  render() {
    if(!this.torrents || this.torrents.length == 0)
      return null;

    return (
      <List className='animated'>
        <Subheader className='recent-title' inset={true}>
        	<FlatButton style={{marginRight: '8px'}} label={!this.state.pause ? 'running' : 'stoped'} secondary={this.state.pause} primary={!this.state.pause} onClick={() =>{
	            this.pauseAndContinue()
	        }} />
        	Most recent torrents{this.displayQueue.length > 0 ? ` (and ${this.displayQueue.length} more)` : null}
        </Subheader>
        <Divider />
        {
        	this.torrents.map((torrent, index) =>{
        		return <TorrentLine key={index} torrent={torrent} />;
        	})
        }
      </List>
    );
  }
}
