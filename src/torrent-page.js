import React, { Component } from 'react';
import formatBytes from './format-bytes'

const TorrentFiles = (props) => {
	return (
		<div className='column'>
		{
			props.torrent.filesList.map((file, index) => {
				return (
					<div className='row inline' key={index}>
						<div>{file.path}</div>
						<div style={{marginLeft: '8px'}}>({formatBytes(file.size)})</div>
					</div>
				);
			})
		}
		</div>
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
   			<div>
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
