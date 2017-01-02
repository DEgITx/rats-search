import React, { Component } from 'react';
import formatBytes from './format-bytes'

import {List, ListItem} from 'material-ui/List';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';

import FileFolder from 'material-ui/svg-icons/file/folder';

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

export default class TorrentPage extends Component {
  componentDidMount() {
  	window.torrentSocket.emit('torrent', this.props.hash, {files: true}, (data) => {
  		console.log(data);
  		this.torrent = data
  		this.forceUpdate();
  	});
  }
  render() {
    return (
      <div className="column">
      {
   			this.torrent
   			?
   			<div className='column w100p'>
   				{this.torrent.name}
   				<TorrentFiles torrent={this.torrent} />
   			</div>
   			:
   			null
      }
      </div>
    );
  }
}
