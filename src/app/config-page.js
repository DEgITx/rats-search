import React from 'react';
import Page from './page';

import Toggle from 'material-ui/Toggle';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField'
import Slider from 'material-ui/Slider'

import fs from 'fs'
let dialog
if(typeof WEB === 'undefined')
  dialog = require('electron').remote.dialog

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
          <RaisedButton label={__('Back to main page')} primary={true} onClick={() => {
            window.router('/')
          }} />
        </div>
      	<div className='column center w100p pad0-75'>
          <Toggle
			  style={{marginTop: '10px'}}
		      label={__('Enabled network scanning')}
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
            <div style={{flex: 1}}>{__('Scanning port')}</div>
            <TextField
              style={{width: 65}}
              hintText={__('Port')}
              errorText={this.options.spiderPort > 0 ? undefined : __('This field is required')}
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
          <div className='fs0-75' style={{color: 'grey'}}>* {__('For current work TCP and UDP ports must be fully open and forward in case of router usage')}</div>
        </div>

        <div className='column w100p'>
          <div className='row inline w100p'>
            <div style={{flex: 1}}>{__('Trackers responce port')}</div>
            <TextField
              style={{width: 65}}
              hintText="Port"
              errorText={this.options.udpTrackersPort > 0 ? undefined : __('This field is required')}
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
          <div className='fs0-75' style={{color: 'grey'}}>* {__('For current work UDP port must be fully open and forward in case of router usage')}</div>
        </div>

        <Toggle
			  style={{marginTop: '10px'}}
		      label={__('Enabled UPnP')}
		      toggled={this.options.upnp}
		      onToggle={(e, checked) => {
		      	this.options.upnp = checked
		      	this.forceUpdate()
		      }}
		    />

        <div className='row inline w100p'>
          <div style={{flex: 1}}>{__('Collection directory')}</div>
          <TextField
            hintText={__('Db path')}
            errorText={this.options.dbPath && this.options.dbPath.length > 0 ? undefined : __('This field is required')}
            value={this.options.dbPath}
            onChange={(e, value) => {
              if(!fs.existsSync(value))
                return

              this.options.dbPath = value
              this.forceUpdate()
            }}
          />
          <RaisedButton style={{marginLeft: 20}} label={__('Browse')} primary={true} onClick={() => {
           if(!dialog)
              return
           const dir = dialog.showOpenDialog({properties: ['openDirectory']})[0]
           if(dir)
            {
              this.options.dbPath = dir
              this.forceUpdate()
            }
          }} />
        </div>

        <div className='row inline w100p'>
          <div style={{flex: 1}}>{__('Download torrents directory')}</div>
          <TextField
            hintText={__('Download path')}
            value={this.options.client && this.options.client.downloadPath}
            onChange={(e, value) => {
              if(!fs.existsSync(value))
                return

              this.options.client.downloadPath = value
              this.forceUpdate()
            }}
          />
          <RaisedButton style={{marginLeft: 20}} label={__('Browse')} primary={true} onClick={() => {
          if(!dialog)
            return
           const dir = dialog.showOpenDialog({properties: ['openDirectory']})[0]
           if(dir)
            {
              this.options.client.downloadPath = dir
              this.forceUpdate()
            }
          }} />
        </div>

        <div style={{marginTop: 10}}>{__('P2P Rats network settings')}:</div>
        <Toggle
			  style={{marginTop: '10px'}}
		      label={__('Enabled p2p search')}
		      toggled={this.options.p2p}
		      onToggle={(e, checked) => {
		      	this.options.p2p = this.options.indexer && checked
		      	this.forceUpdate()
		      }}
		    />
        <div className='column w100p'>
          <Toggle
          style={{marginTop: '10px'}}
            label={__('Enabled bootstrap peers')}
            toggled={this.options.p2pBootstrap}
            onToggle={(e, checked) => {
              this.options.p2pBootstrap = checked
              this.forceUpdate()
            }}
          />
          <div className='fs0-75' style={{color: 'grey'}}>* {__('Use extrnral bootstrap nodes to get p2p peers when network setted wrong or need external source')}</div>
        </div>
        <div className='column w100p'>
          <div className='row inline w100p'>
            <div style={{flex: 1}}>{__('Max peers limit')} ({__('current')}: {this.options.p2pConnections})</div>
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
            label={__('P2P torrents replication')}
            toggled={this.options.p2pReplication}
            onToggle={(e, checked) => {
              this.options.p2pReplication = checked
              this.forceUpdate()
            }}
          />
          <div className='fs0-75' style={{color: 'grey'}}>* {__('Enable torrents replication from another rats clients. Dont recomended if torrent scanner works correct')}.</div>
        </div>


        <div style={{marginTop: 10}}>{__('Torrent network scanner settings')}:</div>
        <div className='column w100p'>
          <div className='row inline w100p'>
            <div style={{flex: 1}}>{__('Scanner walk speed')} ({__('current')}: {this.options.spider && this.options.spider.walkInterval}) [{__('affected after program reload')}]</div>
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
          <div className='fs0-75' style={{color: 'grey'}}>* {__('Low value')} - {__('fast initial scanning and high cpu usage')}. {__('High Value')} - {__('low cpu usage but very slow scanning')}. 
          {__('Good value between')} 3-60. {__('Defaul value')}: 5</div>
        </div>
        <div className='column w100p'>
          <div className='row inline w100p'>
            <div style={{flex: 1}}>{__('Nodes usage')} ({__('current')}: {this.options.spider && this.options.spider.nodesUsage})</div>
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
          <div className='fs0-75' style={{color: 'grey'}}>* {__('Low Value')} - {__('very low usage of nodes, low network traffic, slow torrent scanning')}. {__('High value')} - {__('high traffic, fast scanning, high routers usage')}. 
          {__('Recomended value between')} 10-1000. {__('Defaul value')}: 100. 0 - {__('Ignore this option')} ({__('no limit')}).
          </div>
        </div>
        <div className='column w100p'>
          <div className='row inline w100p'>
            <div style={{flex: 1}}>{__('Reduce network packages')} ({__('current')}: {this.options.spider && this.options.spider.packagesLimit})</div>
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
          <div className='fs0-75' style={{color: 'grey'}}>* {__('Low Value')} - {__('ignore more usless network packages, lower traffic and routers usage')}. {__('High Value')} - {__('high traffic and router usage in prospect')}.
          {__('Recomended value between')} 300-2000. {__('Defaul value')}: 500. 0 - {__('Ignore this option')} ({__('no limit')}).
          </div>
        </div>

        {
          this.settingsSavedMessage
          &&
          <div style={{color: 'green'}}>{__('Settings saved')}</div>
        }

        <div className='row center pad0-75'>
          <RaisedButton label={__('Save Settings')} primary={true} onClick={() => {
            this.saveSettings()
          }} />
        </div>

        </div>
      </div>
    );
  }
}
