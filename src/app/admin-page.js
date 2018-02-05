import React from 'react';
import Page from './page';
import Footer from './footer';
import {Header} from './index-page'

import Toggle from 'material-ui/Toggle';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField'
import Slider from 'material-ui/Slider'

export default class AdminPage extends Page {
  constructor(props) {
    super(props)
    this.setTitle('Rats settings');
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
		      	this.forceUpdate()
		      }}
		    />
        <div className='row inline w100p'>
          <div style={{flex: 1}}>Scanning port</div>
          <TextField
            style={{width: 65}}
            hintText="Port"
            errorText={this.options.spiderPort > 0 ? undefined : "This field is required"}
            value={this.options.spiderPort}
            onChange={(e, value) => {
              if(!value)
                value = 0
              if(value > 65535)
                value = 65535

              this.options.spiderPort = parseInt(value)
              this.forceUpdate()
            }}
          />
        </div>

        <div className='row inline w100p'>
          <div style={{flex: 1}}>Trackers responce port</div>
          <TextField
            style={{width: 65}}
            hintText="Port"
            errorText={this.options.udpTrackersPort > 0 ? undefined : "This field is required"}
            value={this.options.udpTrackersPort}
            onChange={(e, value) => {
              if(!value)
                value = 0
              if(value > 65535)
                value = 65535

              this.options.udpTrackersPort = parseInt(value)
              this.forceUpdate()
            }}
          />
        </div>

        <div className='row inline w100p'>
          <div style={{flex: 1}}>CPU usage limitation</div>
          <Slider
            min={0}
            max={100}
            step={1}
            style={{width: 300}}
            value={this.options.spider && this.options.spider.cpuLimit === 0 ? 100 : this.options.spider && this.options.spider.cpuLimit}
            onChange={(event, value) => {
              if(value === 100)
                value = 0
              
              this.options.spider.cpuLimit = value
              this.forceUpdate()
            }}
          />
        </div>

        <div className='row center pad0-75'>
          <RaisedButton label="Save Sttings" primary={true} onClick={() => {
            this.saveSettings()
          }} />
        </div>
          <Footer />
        </div>
      </div>
    );
  }
}
