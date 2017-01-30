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
	        leftIcon={tree[file] && Object.keys(tree[file]).length > 1 ? <FileFolder /> : null}
		 />);
	}
	return arr;
}

const TorrentFiles = (props) => {
	let tree = buildFilesTree(props.torrent.filesList);
	return (
		<List className='w100p'>
			<Subheader inset={true}>Content of the torrent:</Subheader>
			{treeToTorrentFiles(tree)}
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
      searchingIndicator: false
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
  }
  componentWillUnmount() {
  	if(this.filesUpdated)
      window.torrentSocket.off('filesReady', this.filesUpdated);
  	if(this.trackerUpdate)
      window.torrentSocket.off('trackerTorrentUpdate', this.trackerUpdate);
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

    return (
      <div className="w100p">
      {
   			this.torrent
   			?
   			<Tabs
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
   							</div>
   						</div>
   					</div>
   				</Tab>
   				<Tab label="Files" value="files" >
   					<TorrentFiles torrent={this.torrent} />
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
