import React from 'react';
import Page from './page';
import formatBytes from './format-bytes'
import Footer from './footer';

import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import {Tabs, Tab} from 'material-ui/Tabs';
import ActionInfo from 'material-ui/svg-icons/action/info';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';

import FileFolder from 'material-ui/svg-icons/file/folder';
import NoImage from './images/no-image-icon.png'

var moment = require('moment');
import RefreshIndicator from 'material-ui/RefreshIndicator';
let rating = require('./rating');
import LinearProgress from 'material-ui/LinearProgress';
import {fileTypeDetect} from './content'
import {contentIcon} from './torrent'

import TorrentPlayer from './torrent-player'

let buildFilesTree = (filesList) => {
	let rootTree = {
		__sizeBT: 0
	};
	filesList.forEach((file) => {
		let pathTree = file.path.split('/');
		let currentItem = rootTree;
		pathTree.forEach((pathItem) => {
			if(!(pathItem in currentItem)) 
			{
				currentItem[pathItem] = {
					__sizeBT: 0
				}
			}
			currentItem = currentItem[pathItem]
			currentItem.__sizeBT += file.size;
		})
		rootTree.__sizeBT += file.size;
	});
	return rootTree;
}

const treeToTorrentFiles = (tree) => {
	let arr = [];
	for(let file in tree)
	{
		if(file == '__sizeBT')
			continue;

		arr.push(<ListItem
			key={file}
			primaryText={file}
	        secondaryText={formatBytes(tree[file].__sizeBT)}
	        nestedItems={treeToTorrentFiles(tree[file])}
	        primaryTogglesNestedList={true}
	        innerDivStyle={{wordBreak: 'break-word'}}
	        leftIcon={tree[file] && Object.keys(tree[file]).length > 1 ? <FileFolder /> : contentIcon(fileTypeDetect({path: file}))}
		 />);
	}
	return arr;
}

const TorrentFiles = (props) => {
  let filesList = props.torrent.filesList;
	let tree = buildFilesTree(filesList);
	return (
		<List className='w100p'>
    {
      filesList.length == 0
      ?
      <div className='w100p'>
  			<Subheader inset={true}>Content of the torrent:</Subheader>
  			{treeToTorrentFiles(tree)}
      </div>
      :
      <div className='column center'>
        <span className='pad0-75'>Processing files...</span>
        <LinearProgress mode="indeterminate" />
      </div>
    }
		</List>
	);
};

const TorrentInformation = (props) => {
	let torrent = props.torrent;
	return (
		<List className='w100p'>
	      <Subheader inset={true}>Information about torrent</Subheader>
	      <ListItem
	        //leftAvatar={<Avatar icon={<ActionAssignment />} backgroundColor={blue500} />}
	        rightIcon={<ActionInfo />}
	        primaryText="Torrent Name"
	        secondaryText={<span className='break-word' style={{whiteSpace: 'normal'}}>{torrent.name}</span>}
	      />
	      <ListItem
	       // leftAvatar={<Avatar icon={<EditorInsertChart />} backgroundColor={yellow600} />}
	        rightIcon={<ActionInfo />}
	        primaryText="Torrent Size"
	        secondaryText={formatBytes(torrent.size)}
	      />
	      <ListItem
	       // leftAvatar={<Avatar icon={<EditorInsertChart />} backgroundColor={yellow600} />}
	        rightIcon={<ActionInfo />}
	        primaryText="Torrent contains files"
	        secondaryText={torrent.files}
	        onClick={() => {
	        	if(!props.parent)
	        		return

	        	props.parent.setState({
			      value: 'files'
			    })
	        }}
	      />
	      <ListItem
	       // leftAvatar={<Avatar icon={<EditorInsertChart />} backgroundColor={yellow600} />}
	        rightIcon={<ActionInfo />}
	        primaryText="Indexed/Added torrent date"
	        secondaryText={moment(torrent.added).format('MMMM Do YYYY, h:mm:ss')}
	      />
	       <ListItem
	       // leftAvatar={<Avatar icon={<EditorInsertChart />} backgroundColor={yellow600} />}
	        rightIcon={<ActionInfo />}
	        primaryText="Content type"
	        secondaryText={torrent.contentType || 'unknown'}
	      />
	      <ListItem
	       // leftAvatar={<Avatar icon={<EditorInsertChart />} backgroundColor={yellow600} />}
	        rightIcon={<ActionInfo />}
	        primaryText="Category"
	        secondaryText={torrent.contentCategory || 'unknown'}
	      />
	    </List>
	);
}

export default class TorrentPage extends Page {
  constructor(props) {
    super(props);
    this.state = {
      value: 'info',
      searchingIndicator: false,
      voting: false,
      voted: false,
    };
    this.setTitle('Information about torrent');
  }

  changeTab(tab) {
  	if(this.state.value != tab) {
	  	this.setState({
	      value: tab
	    });
  		console.log('change');
  	}
  }
  onSwipeRight() {
  	this.changeTab('files');
  }
  onSwipeLeft() {
  	this.changeTab('info');
  }

  handleChange = (value) => {
  	if(value == 'main') {
  		window.router('/');
  		return;
  	}

    this.setState({
      value: value,
    });
  };
  getTorrentInfo() {
  	window.torrentSocket.emit('torrent', this.props.hash, {files: true}, window.customLoader((data) => {
  		if(data) {
  			this.torrent = data
  			this.setTitle(this.torrent.name + ' - RatsOnTheBoat.org');
        if(this.torrent.contentCategory == 'xxx') {
          this.setMetaTag('robots', 'noindex');
        }
  			//this.forceUpdate(); // вызывается через searchingIndicator

  			// Получаем более новую статистику пира
  			if((new Date).getTime() - this.torrent.trackersChecked > 10 * 60 * 1000) {
  				window.torrentSocket.emit('checkTrackers', this.torrent.hash);
  			}
  		}
  	}, () => {
      this.setState({
        searchingIndicator: true
      });
    }, () => {
      this.setState({
        searchingIndicator: false
      });
    }));
  }
  componentDidMount() {
  	super.componentDidMount();

  	this.getTorrentInfo();
  	this.filesUpdated = (hash) => {
  		if(this.props.hash != hash)
      		return;

  		this.getTorrentInfo();
  	}
  	window.torrentSocket.on('filesReady', this.filesUpdated);

  	this.trackerUpdate = (info) => {
      if(this.props.hash != info.hash)
      	return;

      if(!this.torrent)
      	return;

      Object.assign(this.torrent, info);
      this.forceUpdate();
    }
    window.torrentSocket.on('trackerTorrentUpdate', this.trackerUpdate);

    this.onVote = ({hash, good, bad}) => {
      if(this.props.hash != hash)
        return;

      if(!this.torrent)
        return;

      this.torrent.good = good;
      this.torrent.bad = bad;
      this.forceUpdate();
    }
    window.torrentSocket.on('vote', this.onVote);
  }
  componentWillUnmount() {
  	if(this.filesUpdated)
      window.torrentSocket.off('filesReady', this.filesUpdated);
  	if(this.trackerUpdate)
      window.torrentSocket.off('trackerTorrentUpdate', this.trackerUpdate);
    if(this.onVote)
      window.torrentSocket.off('vote', this.onVote);
    if(this.torrent && this.torrent.contentCategory == 'xxx') {
      this.removeMetaTag('robots');
    }
  }
  vote(good) {
    if(!this.torrent)
      return;

    this.setState({
        voting: true
    });
    window.torrentSocket.emit('vote', this.torrent.hash, !!good, window.customLoader((success) => {
      this.setState({
        voted: true,
        voting: false
      });
    }));
  }
  render() {
  	const style = {
      refresh: {
        display: 'inline-block',
        position: 'relative',
      },
    };

    if(this.state.searchingIndicator) {
      return (
        <div className='pad1 w100p column center'>
          <RefreshIndicator
            size={50}
            left={0}
            top={0}
            loadingColor="#FF9800"
            status="loading"
            style={style.refresh}
          />
        </div>
      );
    }

    let torrentRating;
    if(this.torrent) {
      torrentRating = Math.round(rating(this.torrent.good, this.torrent.bad) * 100);
    }

    return (
      <div className="w100p column center">
      {
   			this.torrent
   			?
   			<Tabs
            className='w100p'
		        value={this.state.value}
		        onChange={this.handleChange}
		     >
		    	 <Tab label="Back to main" value="main" />
		     	<Tab label="Information" value="info" >
		     		<div className='column w100p'>
		     			<div className='row w100p torrent-information-row'>
		     				<div className='info-table'>
   								<TorrentInformation torrent={this.torrent} parent={this} />
   							</div>
   							<div style={{flexBasis: '40%'}} className='column center w100p'>
   								<img src={NoImage} className='pad0-75' style={{height: '200px'}} />
   								<RaisedButton
								      href={`magnet:?xt=urn:btih:${this.torrent.hash}`}
								      target="_self"
								      label="Download"
								      secondary={true}
								      icon={<svg fill='white' viewBox="0 0 24 24"><path d="M17.374 20.235c2.444-2.981 6.626-8.157 6.626-8.157l-3.846-3.092s-2.857 3.523-6.571 8.097c-4.312 5.312-11.881-2.41-6.671-6.671 4.561-3.729 8.097-6.57 8.097-6.57l-3.092-3.842s-5.173 4.181-8.157 6.621c-2.662 2.175-3.76 4.749-3.76 7.24 0 5.254 4.867 10.139 10.121 10.139 2.487 0 5.064-1.095 7.253-3.765zm4.724-7.953l-1.699 2.111-1.74-1.397 1.701-2.114 1.738 1.4zm-10.386-10.385l1.4 1.738-2.113 1.701-1.397-1.74 2.11-1.699z"/></svg>}
								    />
								 <div className='fs0-75 pad0-75 center column' style={{color: 'rgba(0, 0, 0, 0.541176)'}}><div>BTIH:</div><div>{this.torrent.hash}</div></div>
								 {
								 	this.torrent.seeders || this.torrent.leechers || this.torrent.completed
								 	?
								 	<div className='fs0-85 pad0-75 center column'>
								 		<div className='pad0-25' style={{color: '#00C853'}}>seeders: {this.torrent.seeders}</div>
								 		<div className='pad0-25' style={{color: '#AA00FF'}}>leechers: {this.torrent.leechers}</div>
								 		<div className='pad0-25' style={{color: '#FF6D00'}}>completed: {this.torrent.completed}</div>
								 	</div>
								 	:
								 	null
								 }
                 {
                   !this.state.voted && !this.state.voting
                   ?
                   <div className='row pad0-25'>
                     <RaisedButton
                        label={`Good (${this.torrent.good})`}
                        labelColor="white"
                        backgroundColor="#00C853"
                        icon={
                          <svg viewBox="0 0 489.543 489.543" fill="white">
                            <g>
                              <path d="M270.024,0c-22.6,0-15,48.3-15,48.3s-48.3,133.2-94.5,168.7c-9.9,10.4-16.1,21.9-20,31.3l0,0l0,0
                                c-0.9,2.3-1.7,4.5-2.4,6.5c-3.1,6.3-9.7,16-23.8,24.5l46.2,200.9c0,0,71.5,9.3,143.2,7.8c28.7,2.3,59.1,2.5,83.3-2.7
                                c82.2-17.5,61.6-74.8,61.6-74.8c44.3-33.3,19.1-74.9,19.1-74.9c39.4-41.1,0.7-75.6,0.7-75.6s21.3-33.2-6.2-58.3
                                c-34.3-31.4-127.4-10.5-127.4-10.5l0,0c-6.5,1.1-13.4,2.5-20.8,4.3c0,0-32.2,15,0-82.7C346.324,15.1,292.624,0,270.024,0z"/>
                              <path d="M127.324,465.7l-35-166.3c-2-9.5-11.6-17.3-21.3-17.3h-66.8l-0.1,200.8h109.1C123.024,483,129.324,475.2,127.324,465.7z"
                                />
                            </g>
                          </svg>
                        }
                        onClick={() => this.vote(true)}
                      />
                      <RaisedButton
                        style={{marginLeft: '9px'}}
                        label={`Bad (${this.torrent.bad})`}
                        labelColor="white"
                        backgroundColor="#D50000"
                        icon={
                          <svg viewBox="0 0 487.643 487.643" fill="white">
                          <g>
                            <path d="M113.869,209.443l46-200.1c0,0,71.2-9.3,142.6-7.8c28.5-2.3,58.9-2.5,83,2.7c81.9,17.4,61.4,74.5,61.4,74.5
                              c44.2,33.2,19,74.6,19,74.6c39.2,41,0.7,75.3,0.7,75.3s21.2,33-6.1,58c-34.2,31.2-126.9,10.5-126.9,10.5l0,0
                              c-6.4-1.1-13.3-2.5-20.7-4.2c0,0-32.1-15,0,82.4s-21.4,112.3-43.9,112.3s-15-48.1-15-48.1s-48.1-132.7-94.1-168
                              c-9.9-10.4-16.1-21.8-19.9-31.2l0,0l0,0c-0.9-2.3-1.7-4.5-2.4-6.5C134.469,227.543,127.869,217.843,113.869,209.443z
                               M70.869,206.643c9.7,0,19.2-7.7,21.2-17.2l34.8-165.6c2-9.5-4.3-17.2-14-17.2H4.169l0.1,200H70.869z"/>
                          </g>
                          </svg>
                        }
                        onClick={() => this.vote(false)}
                      />
                    </div>
                    :
                      this.state.voting
                      ?
                      <div>voting...</div>
                      :
                      <div>Thank you for voting!</div>
                }
                {
                  this.torrent.good > 0 || this.torrent.bad > 0
                  ?
                  <div className='w100p' style={{padding: '7px 35px', marginTop: '10px'}}>
                    <LinearProgress 
                      mode="determinate" 
                      value={torrentRating}
                      color={torrentRating >= 50 ? '#00E676' : '#FF3D00'}
                      style={{
                        height: '5px',
                      }}
                    />
                    <div className='row center pad0-75 fs0-85' style={{color: torrentRating >= 50 ? '#00E676' : '#FF3D00'}}>Torrent rating: {torrentRating}%</div>
                  </div>
                  :
                  null
                }
   							</div>
   						</div>
   					</div>
   				</Tab>
   				<Tab label="Files" value="files" >
   					<TorrentFiles torrent={this.torrent} />
   				</Tab>
          <Tab label="Player" value="player" >
            <TorrentPlayer torrent={this.torrent} />
          </Tab>
   			</Tabs>
   			:
   			null
      }
      	<Footer />
      </div>
    );
  }
}
