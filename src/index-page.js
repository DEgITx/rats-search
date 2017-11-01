import React from 'react';
import Page from './page';
import Footer from './footer';

import RecentTorrents from './recent-torrents'
import Search from './search'

import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Background from './images/pirate-mod.jpg'

const Header = (props) => {
  return (
    <Card>
      <CardMedia
        overlay={<CardTitle title="Yarrr, Landlubbers!" subtitle="Welcome to torrent project" />}
      >
        <img src={Background} />
      </CardMedia>
      <CardText>
        Welcome to BT Search! This is file search engine based on the torrents from the internet. 
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
    this.setTitle('Rats On The Boat - Content Search Engine');
  }
  render() {
    return (
      <div>
      	<Header />
        <Search />
      	<div className='column center w100p pad0-75'>
        	<RecentTorrents />
          <Footer />
        </div>
      </div>
    );
  }
}
