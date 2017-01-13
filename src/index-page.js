import React from 'react';
import Page from './page';

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
        Welcome to BT Search! This is file search engine based on the torrents of internet. 
      Here you can easily find torrent or file that you intrested for. We are not responsible for any content of the site:
      this is only information about content that collected automatically! Content right holders and users can mark/block bad content.
      </CardText>
    </Card>
  )
}

export {Header}

export default class IndexPage extends Page {
  constructor(props) {
    super(props)
    this.setTitle('Welcome to files/torrents search engine');
  }
  render() {
    return (
      <div>
      	<Header />
        <Search />
      	<div className='column center w100p pad0-75'>
        	<RecentTorrents />
          <div className='fs0-75 pad0-75 break-word donation-line' style={{color: 'grey'}}>Donation to support project (bitcoin): 1Ega5zeCSMPgyDn6fEMMiuGoqNNpS53ipK</div>
        </div>
      </div>
    );
  }
}
