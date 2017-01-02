import React, { Component } from 'react';
import formatBytes from './format-bytes'

import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import {Tabs, Tab} from 'material-ui/Tabs';
import ActionInfo from 'material-ui/svg-icons/action/info';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';

import FileFolder from 'material-ui/svg-icons/file/folder';

var moment = require('moment');

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
	        primaryText="Adult content"
	        secondaryText='unknown'
	      />
	    </List>
	);
}

export default class TorrentPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 'info',
    };
  }

  handleChange = (value) => {
    this.setState({
      value: value,
    });
  };
  componentDidMount() {
  	window.torrentSocket.emit('torrent', this.props.hash, {files: true}, (data) => {
  		console.log(data);
  		this.torrent = data
  		this.forceUpdate();
  	});
  }
  render() {
    return (
      <div className="w100p">
      {
   			this.torrent
   			?
   			<Tabs
		        value={this.state.value}
		        onChange={this.handleChange}
		     >
		     	<Tab label="Information" value="info" >
		     		<div className='column w100p'>
		     			<div className='row w100p torrent-information-row'>
		     				<div style={{flexBasis: '60%'}}>
   								<TorrentInformation torrent={this.torrent} />
   							</div>
   							<div style={{flexBasis: '40%'}} className='column center w100p'>
   								<RaisedButton
								      href={`magnet:?xt=urn:btih:${this.torrent.hash}`}
								      target="_blank"
								      label="Download"
								      secondary={true}
								      icon={<FontIcon className="muidocs-icon-custom-github" />}
								    />
								 <div className='fs0-75 pad0-75 center column' style={{color: 'rgba(0, 0, 0, 0.541176)'}}><div>TTH:</div><div>{this.torrent.hash}</div></div>
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
      </div>
    );
  }
}
