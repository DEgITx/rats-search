# Rats on The Boat - BitTorrent search engine

<p align="center"><a href="https://github.com/DEgiTx/rats-search"><img src="https://raw.githubusercontent.com/DEgITx/rats-search/master/resources/rat-logo.png"></a></p>

[![CircleCI Build Status](https://circleci.com/gh/DEgITx/rats-search.png?style=shield)](https://circleci.com/gh/DEgITx/rats-search)
[![Appveyor Build Status](https://ci.appveyor.com/api/projects/status/1eh0lug97fboscib?svg=true)](https://ci.appveyor.com/project/DEgITx/rats-search)
[![Travis Build Status](https://travis-ci.org/DEgITx/rats-search.svg?branch=master)](https://travis-ci.org/DEgITx/rats-search)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Release](https://img.shields.io/github/release/DEgITx/rats-search.svg)](https://github.com/DEgITx/rats-search/releases)
[![Documentation](https://img.shields.io/badge/docs-faq-brightgreen.svg)](https://github.com/DEgITx/rats-search/blob/master/docs/MANUAL.md)

BitTorrent search program for desktop and web. Collect and navigate over base of torrents statistic, categories, and give easy access to it. Work over p2p network and support Windows, Linux, Mac OS platforms.

## Features
* Works over p2p torrent network, doesn't require any trackers
* Search over torrent collection
* Torrent and files search
* Search filters
* Trackers peers scan supported
* Integrated torrent client
* Pretty safe to use and don't send any information about collected torrents data (statistic)
* Collect only statistic information and don't save any torrents internal data
* Supports torrents rating (voting)
* P2P Search. Search in other Rats clients.
* Web version (web interface) for servers
* Torrents top list

## Architecture
![Basic Architecture](docs/img/ratsarch.png)

## Contributing
We are welcome any contributing: bug fixes, improvements, code refactoring and other stuffs.

## Usage Manuals
* [English](docs/USAGE.md)
* [Russian](docs/USAGE.RU.md)

## Server version install
Clone repository, then make sure that you have Node.js and NPM (with Node.js) installed in your system, then:

```bash
npm install
```

Then compile web version:

```bash
npm run buildweb
```

Finally start server application:

```bash
npm run server
```

Now you can get access to web interface on 8095 port: http://localhost:8095

[More about configuration](docs/SERVER.md)

[More about server compatibility](docs/SERVER_COMPATIBILITY.md)

## Screenshots

![Main Window](docs/img/screen_1.png)
![Torrent Details](docs/img/screen_2.png)

## Donation

## License
[MIT](https://github.com/DEgiTx/rats-search/blob/master/LICENSE)
