import React from 'react';
import Page from './page';

import Toggle from 'material-ui/Toggle';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField'
import Slider from 'material-ui/Slider'
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';

import fs from 'fs'

export default class ConfigPage extends Page {
  constructor(props) {
    super(props)
    this.setTitle('Rats filters');
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

         <div className='column w100p'>
          <div className='row inline w100p'>
            <div style={{flex: 1}}>Max files per torrent (current: {this.options.filters && this.options.filters.maxFiles})</div>
            <Slider
              min={0}
              max={50000}
              step={1}
              style={{width: 300}}
              value={this.options.spider && this.options.filters.maxFiles}
              onChange={(event, value) => {
                this.options.filters.maxFiles = value
                this.forceUpdate()
              }}
            />
            <TextField
              hintText="Max files"
              className='pad0-75'
              style={{width: 200}}
              value={this.options.filters && this.options.filters.maxFiles}
              onChange={(e, value) => {
                if(!this.options.filters)
                  return
                
                this.options.filters.maxFiles = parseInt(value)
                this.forceUpdate()
              }}
            />
          </div>
          <div className='fs0-75' style={{color: 'grey'}}>* 0 - Disabled.
          </div>
        </div>

        <div className='column w100p'>
          <div className='row inline w100p'>
            <div style={{flex: 1}}>Torrent name regular extension filtering</div>
            <TextField
              hintText="regex"
              className='pad0-75'
              style={{width: 400}}
              value={this.options.filters && this.options.filters.namingRegExp}
              onChange={(e, value) => {
                if(!this.options.filters)
                  return
                
                this.options.filters.namingRegExp = value
                this.forceUpdate()
              }}
            />
            <SelectField
              style={{marginLeft: 15}}
              floatingLabelText="Examples"
              value={this.options.filters && this.options.filters.namingRegExp}
              onChange={(event, index, value) => {
                if(!this.options.filters)
                  return

                this.options.filters.namingRegExp = value
                this.forceUpdate()
              }}
            >
              <MenuItem value={String.raw`^[А-Яа-я0-9A-Za-z.!@?#"$%&:;() *\+,\/;\-=[\\\]\^_{|}<>\u0400-\u04FF]+$`} primaryText="Russian + English only (With symbols)" />
              <MenuItem value={'^[0-9A-Za-z.!@?#"$%&:;() *\+,\/;\-=[\\\]\^_{|}<>]+$'} primaryText="English only (With symbols)" />
              <MenuItem value={'^((?!badword).)*$'} primaryText="Ignore badword" />
            </SelectField>
          </div>
          <Toggle
			    style={{marginTop: '10px'}}
		      label="Negative regular extension filtering"
		      toggled={this.options.filters && this.options.filters.namingRegExpNegative}
		      onToggle={(e, checked) => {
            if(!this.options.filters)
              return

            this.options.filters.namingRegExpNegative = checked
		      	this.forceUpdate()
		      }}
		    />
          <div className='fs0-75' style={{color: 'grey'}}>
          * - clean string means disabled
          </div>
        </div>

        <Toggle
			  style={{marginTop: '10px'}}
		      label="Adult filter"
		      toggled={this.options.filters && this.options.filters.adultFilter}
		      onToggle={(e, checked) => {
            if(!this.options.filters)
              return

		      	this.options.filters.adultFilter = checked
		      	this.forceUpdate()
		      }}
		    />


        {
          this.toRemoveProbably && this.toRemoveProbably > 0
          ?
          <div style={{color: 'orange'}}>Torrents to clean: {this.toRemoveProbably}</div>
          :
          null
        }
        {
          this.toRemove && this.toRemove > 0
          ?
          <div style={{color: 'red'}}>Torrents cleaned: {this.toRemove}</div>
          :
          null
        }

        {
          this.settingsSavedMessage
          &&
          <div style={{color: 'green'}}>Settings saved</div>
        }

        <div className='row center pad0-75'>
          <RaisedButton label="Check torrents" primary={true} onClick={() => {
            window.torrentSocket.emit('removeTorrents', true, window.customLoader((toRemove) => {
              this.toRemoveProbably = toRemove
              this.forceUpdate()
            }));
          }} />
          <RaisedButton label="Clean torrents" secondary={true} onClick={() => {
            window.torrentSocket.emit('removeTorrents', false, window.customLoader((toRemove) => {
              this.toRemove = toRemove
              this.forceUpdate()
            }));
          }} />
        </div>

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
