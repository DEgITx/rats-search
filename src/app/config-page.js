import React from 'react';
import Page from './page';

import Toggle from 'material-ui/Toggle';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField'
import Slider from 'material-ui/Slider'

import fs from 'fs'
const {dialog} = require('electron').remote

export default class ConfigPage extends Page {
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

        <Toggle
			  style={{marginTop: '10px'}}
		      label="Enabled UPnP"
		      toggled={this.options.upnp}
		      onToggle={(e, checked) => {
		      	this.options.upnp = checked
		      	this.forceUpdate()
		      }}
		    />

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

        <div style={{marginTop: 10}}>P2P Rats network settings:</div>
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
          <Toggle
          style={{marginTop: '10px'}}
            label="Enabled bootstrap peers"
            toggled={this.options.p2pBootstrap}
            onToggle={(e, checked) => {
              this.options.p2pBootstrap = checked
              this.forceUpdate()
            }}
          />
          <div className='fs0-75' style={{color: 'grey'}}>* Use extrnral bootstrap nodes to get p2p peers when network setted wrong or need external source</div>
        </div>
        <div className='column w100p'>
          <div className='row inline w100p'>
            <div style={{flex: 1}}>Max peers limit (current: {this.options.p2pConnections})</div>
            <Slider
              min={10}
              max={25}
              step={1}
              style={{width: 300}}
              value={this.options.p2pConnections}
              onChange={(event, value) => {
                this.options.p2pConnections = value
                this.forceUpdate()
              }}
            />
          </div>
        </div>
        <div className='column w100p'>
          <Toggle
          style={{marginTop: '10px'}}
            label="P2P torrents replication"
            toggled={this.options.p2pReplication}
            onToggle={(e, checked) => {
              this.options.p2pReplication = checked
              this.forceUpdate()
            }}
          />
          <div className='fs0-75' style={{color: 'grey'}}>* Enable torrents replication from another rats clients. Dont recomended if torrent scanner works correct.</div>
        </div>


        <div style={{marginTop: 10}}>Torrent network scanner settings:</div>
        <div className='column w100p'>
          <div className='row inline w100p'>
            <div style={{flex: 1}}>Scanner walk speed (current: {this.options.spider && this.options.spider.walkInterval}) [affected after program reload]</div>
            <Slider
              min={1}
              max={150}
              step={1}
              style={{width: 300}}
              value={this.options.spider && this.options.spider.walkInterval}
              onChange={(event, value) => {
                this.options.spider.walkInterval = value
                this.forceUpdate()
              }}
            />
          </div>
          <div className='fs0-75' style={{color: 'grey'}}>* Low value - fast initial scanning and high cpu usage. High Value - low cpu usage but very slow scanning. 
            Good value between 3-60. Defaul value: 5</div>
        </div>
        <div className='column w100p'>
          <div className='row inline w100p'>
            <div style={{flex: 1}}>Nodes usage (current: {this.options.spider && this.options.spider.nodesUsage})</div>
            <Slider
              min={0}
              max={1000}
              step={1}
              style={{width: 300}}
              value={this.options.spider && this.options.spider.nodesUsage}
              onChange={(event, value) => {
                this.options.spider.nodesUsage = value
                this.forceUpdate()
              }}
            />
          </div>
          <div className='fs0-75' style={{color: 'grey'}}>* Low Value - very low usage of nodes, low network traffic, slow torrent scanning. High value - high traffic, fast scanning, high routers usage. 
          Recomended value between 10-1000. Defaul value: 100. 0 - Ignore this option (no limit).
          </div>
        </div>
        <div className='column w100p'>
          <div className='row inline w100p'>
            <div style={{flex: 1}}>Reduce network packages (current: {this.options.spider && this.options.spider.packagesLimit})</div>
            <Slider
              min={0}
              max={2000}
              step={1}
              style={{width: 300}}
              value={this.options.spider && this.options.spider.packagesLimit}
              onChange={(event, value) => {
                this.options.spider.packagesLimit = value
                this.forceUpdate()
              }}
            />
          </div>
          <div className='fs0-75' style={{color: 'grey'}}>* Low Value - ignore more usless network packages, lower traffic and routers usage. High Value - high traffic and router usage in prospectю
          Recomended value between 300-2000. Defaul value: 500. 0 - Ignore this option (no limit).
          </div>
        </div>

        {
          this.settingsSavedMessage
          &&
          <div style={{color: 'green'}}>Settings saved</div>
        }

        <div className='row center pad0-75'>
          <RaisedButton label="Save Settings" primary={true} onClick={() => {
            this.saveSettings()
          }} />
        </div>

        </div>
      </div>
    );
  }
}
