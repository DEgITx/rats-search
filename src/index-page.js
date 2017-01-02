import React, { Component } from 'react';

import RecentTorrents from './recent-torrents'
import Search from './search'

import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Background from './images/pirate-mod.jpg'

const Header = (props) => {
  return (
    <Card>
      <CardMedia
        overlay={<CardTitle title="Arrr, Landlubber rats!" subtitle="Welcome to very anonymous torrent project" />}
      >
        <img src={Background} />
      </CardMedia>
      <CardText>
        Welcome to BT Search! This is file search engine to the torrents of the internet. 
      Here you can easily find torrent or file that you intrested for. We are not responsible for any content of the site:
      content are adding automaticly. Content right holders and users can mark/block bad content.
      </CardText>
    </Card>
  )
}

export {Header}

export default class IndexPage extends Component {
  render() {
    return (
      <div>
      	<Header />
        <Search />
      	<div className='column center w100p pad0-75'>
        	<RecentTorrents />
        </div>
      </div>
    );
  }
}
