import React from 'react';
import Page from './page';
import Footer from './footer';
import {Header} from './index-page'

import Toggle from 'material-ui/Toggle';

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
  	window.torrentSocket.emit('admin', window.customLoader((options) => {
  		this.options = options;
      console.log(this.options)
  		this.forceUpdate();
  	}));
  }
  saveSettings() {
  	window.torrentSocket.emit('setAdmin', this.options)
  	this.forceUpdate()
  }
  render() {
    return (
      <div>
      	<Header />
      	<div className='column center w100p pad0-75'>
          <Toggle
			  style={{marginTop: '10px'}}
		      label="Disable DHT scanning"
		      toggled={this.options.dhtDisabled}
          thumbSwitchedStyle={{backgroundColor: 'red'}}
          trackSwitchedStyle={{backgroundColor: '#ff9d9d'}}
		      onToggle={(e, checked) => {
		      	this.options.dhtDisabled = checked
		      	this.saveSettings()
		      }}
		    />
          <Footer />
        </div>
      </div>
    );
  }
}
