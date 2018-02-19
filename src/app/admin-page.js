import React from 'react';
import Page from './page';
import Footer from './footer';
import {Header} from './index-page'

import Toggle from 'material-ui/Toggle';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField'
import Slider from 'material-ui/Slider'

import fs from 'fs'
const {dialog} = require('electron').remote

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
    this.settingsSavedMessage = true
    this.forceUpdate()
    setTimeout(() => {
      this.settingsSavedMessage = false
      this.forceUpdate()
    }, 1000)
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
		      onToggle={(e, checked) => {
            this.options.indexer = checked
            if(!this.options.indexer)
              this.options.p2p = false
		      	this.forceUpdate()
		      }}
		    />
        <Toggle
			  style={{marginTop: '10px'}}
		      label="Enabled p2p search"
		      toggled={this.options.p2p}
		      onToggle={(e, checked) => {
		      	this.options.p2p = this.options.indexer && checked
		      	this.forceUpdate()
		      }}
		    />
        <div className='column w100p'>
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
          <div className='fs0-75' style={{color: 'grey'}}>* For current work TCP and UDP ports must be fully open and forward in case of router usage</div>
        </div>

        <div className='column w100p'>
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
          <div className='fs0-75' style={{color: 'grey'}}>* For current work UDP port must be fully open and forward in case of router usage</div>
        </div>

        <div className='row inline w100p'>
          <div style={{flex: 1}}>Collection directory</div>
          <TextField
            hintText="Db path"
            errorText={this.options.dbPath && this.options.dbPath.length > 0 ? undefined : "This field is required"}
            value={this.options.dbPath}
            onChange={(e, value) => {
              if(!fs.existsSync(value))
                return

              this.options.dbPath = value
              this.forceUpdate()
            }}
          />
          <RaisedButton style={{marginLeft: 20}} label="Browse" primary={true} onClick={() => {
           const dir = dialog.showOpenDialog({properties: ['openDirectory']})[0]
           if(dir)
            {
              this.options.dbPath = dir
              this.forceUpdate()
            }
          }} />
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

        <div className='row inline w100p'>
          <div style={{flex: 1}}>Download torrents directory</div>
          <TextField
            hintText="Download path"
            value={this.options.client && this.options.client.downloadPath}
            onChange={(e, value) => {
              if(!fs.existsSync(value))
                return

              this.options.client.downloadPath = value
              this.forceUpdate()
            }}
          />
          <RaisedButton style={{marginLeft: 20}} label="Browse" primary={true} onClick={() => {
           const dir = dialog.showOpenDialog({properties: ['openDirectory']})[0]
           if(dir)
            {
              this.options.client.downloadPath = dir
              this.forceUpdate()
            }
          }} />
        </div>

        {
          this.settingsSavedMessage
          &&
          <div style={{color: 'green'}}>Settings saved</div>
        }

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
