import React from 'react';
import Page from './page';
import Footer from './footer';
import {Header} from './index-page'

import Toggle from 'material-ui/Toggle';
import RaisedButton from 'material-ui/RaisedButton';

export default class AdminPage extends Page {
  constructor(props) {
    super(props)
    this.setTitle('-=-= Some page =-=-');
    this.options = {}
  }
  componentDidMount() {
  	this.loadSettings()
  }
  loadSettings() {
  	window.torrentSocket.emit('config', window.customLoader((options) => {
  		this.options = options;
      console.log(this.options)
  		this.forceUpdate();
  	}));
  }
  saveSettings() {
  	window.torrentSocket.emit('setConfig', this.options)
  	this.forceUpdate()
  }
  render() {
    return (
      <div>
      	<Header />
        <div className='row center pad0-75'>
          <RaisedButton label="Back to main page" primary={true} onClick={() => {
            window.router('/')
          }} />
        </div>
      	<div className='column center w100p pad0-75'>
          <Toggle
			  style={{marginTop: '10px'}}
		      label="Enabled network scanning"
		      toggled={this.options.indexer}
          thumbSwitchedStyle={{backgroundColor: 'red'}}
          trackSwitchedStyle={{backgroundColor: '#ff9d9d'}}
		      onToggle={(e, checked) => {
		      	this.options.indexer = checked
		      	this.saveSettings()
		      }}
		    />
          <Footer />
        </div>
      </div>
    );
  }
}
