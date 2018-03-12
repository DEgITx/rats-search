import React from 'react';
import Page from './page';
import Footer from './footer';

import RecentTorrents from './recent-torrents'
import Search from './search'

import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';
import Background from './images/pirate-mod.jpg'

import RaisedButton from 'material-ui/RaisedButton';

const Header = (props) => {
  return (
    <Card style={{height: '100%', position: 'relative'}}>
      <CardMedia
        overlay={<CardTitle title="Yarrr, Landlubbers!" subtitle="Welcome to torrent project" />}
      >
        <div className='row' style={{
            padding: '15px',
            background: `url('${Background}') no-repeat`,
            minHeight: 360,
            backgroundSize: 'cover'
          }}>
          <RaisedButton
            label="Downloads"
            onClick={() => {
              window.router('/downloads')
            }}
            backgroundColor='#2080E4'
            labelColor='white'
            style={{height: 60, borderRadius: 5, margin: 5, zIndex: 1}}
            buttonStyle={{borderRadius: 5}}
            icon={<svg fill='white' style={{height: 30}} viewBox="0 0 548.176 548.176">
                    <path d="M524.326,297.352c-15.896-19.89-36.21-32.782-60.959-38.684c7.81-11.8,11.704-24.934,11.704-39.399
                      c0-20.177-7.139-37.401-21.409-51.678c-14.273-14.272-31.498-21.411-51.675-21.411c-18.083,0-33.879,5.901-47.39,17.703
                      c-11.225-27.41-29.171-49.393-53.817-65.95c-24.646-16.562-51.818-24.842-81.514-24.842c-40.349,0-74.802,14.279-103.353,42.83
                      c-28.553,28.544-42.825,62.999-42.825,103.351c0,2.474,0.191,6.567,0.571,12.275c-22.459,10.469-40.349,26.171-53.676,47.106
                      C6.661,299.594,0,322.43,0,347.179c0,35.214,12.517,65.329,37.544,90.358c25.028,25.037,55.15,37.548,90.362,37.548h310.636
                      c30.259,0,56.096-10.711,77.512-32.12c21.413-21.409,32.121-47.246,32.121-77.516C548.172,339.944,540.223,317.248,524.326,297.352
                      z M362.595,308.344L262.38,408.565c-1.711,1.707-3.901,2.566-6.567,2.566c-2.664,0-4.854-0.859-6.567-2.566L148.75,308.063
                      c-1.713-1.711-2.568-3.901-2.568-6.567c0-2.474,0.9-4.616,2.708-6.423c1.812-1.808,3.949-2.711,6.423-2.711h63.954V191.865
                      c0-2.474,0.905-4.616,2.712-6.427c1.809-1.805,3.949-2.708,6.423-2.708h54.823c2.478,0,4.609,0.9,6.427,2.708
                      c1.804,1.811,2.707,3.953,2.707,6.427v100.497h63.954c2.665,0,4.855,0.855,6.563,2.566c1.714,1.711,2.562,3.901,2.562,6.567
                      C365.438,303.789,364.494,306.064,362.595,308.344z"/>
                  </svg>
             }
          />
          <RaisedButton
            label="Top"
            onClick={() => {
              window.router('/top')
            }}
            backgroundColor='#B1CE57'
            labelColor='white'
            style={{height: 60, width: 120, borderRadius: 5, margin: 5, zIndex: 1}}
            buttonStyle={{borderRadius: 5}}
            icon={<svg fill='white' style={{height: 30}} viewBox="0 0 284.929 284.929">
                    <g>
                      <path d="M17.128,167.872c1.903,1.902,4.093,2.854,6.567,2.854c2.474,0,4.664-0.952,6.567-2.854L142.466,55.666l112.208,112.206
                        c1.902,1.902,4.093,2.854,6.563,2.854c2.478,0,4.668-0.952,6.57-2.854l14.274-14.277c1.902-1.902,2.847-4.093,2.847-6.563
                        c0-2.475-0.951-4.665-2.847-6.567L149.028,7.419c-1.901-1.906-4.088-2.853-6.562-2.853s-4.665,0.95-6.567,2.853L2.856,140.464
                        C0.95,142.367,0,144.554,0,147.034c0,2.468,0.953,4.658,2.856,6.561L17.128,167.872z"/>
                      <path d="M149.028,117.055c-1.901-1.906-4.088-2.856-6.562-2.856s-4.665,0.953-6.567,2.856L2.856,250.1
                        C0.95,252.003,0,254.192,0,256.67c0,2.472,0.953,4.661,2.856,6.564l14.272,14.276c1.903,1.903,4.093,2.848,6.567,2.848
                        c2.474,0,4.664-0.951,6.567-2.848l112.204-112.209l112.208,112.209c1.902,1.903,4.093,2.852,6.563,2.852
                        c2.478,0,4.668-0.948,6.57-2.852l14.274-14.276c1.902-1.903,2.847-4.093,2.847-6.564c0-2.478-0.951-4.667-2.847-6.57
                        L149.028,117.055z"/>
                    </g>
                  </svg>
             }
          />
        </div>
      </CardMedia>
      <CardText>
        Welcome to ROTB! This is file search engine based on the torrents from the internet. 
      Here you can easily find torrent or file that you intrested for. We are not responsible for any content:
      this is only information about content that collected automatically!
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
      <div id='index-window'>
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
