# Basic description

Rats Search server using WebSockets for internal communication. It require two way communication and using socket.io internally. As alternative added REST API implementation, but because of one-way limitation, it require periodic check of backward messages with **/api/queue** . You free to choise one of the ways for communication and implementation of your own client.

## WebSockets communication (1-way)


## REST API communication (2-way)

### Installation

At first you need to prepare server non-interface version

```bash
git clone --recurse-submodules https://github.com/DEgITx/rats-search.git
npm install --force
npm run buildweb
npm run server
```

### Configuration

You need to enable REST API configuration (disabled by default):

edit **rats.json** (change only restApi value):
```json
{
    "restApi": true
}
```

set restApi to true, save

### API usage

#### Search of torrents

endpoint (GET REQUEST):
```
https://localhost:8095/api/searchTorrent?text=DEgITx&navigation={}
```

example of request:
```json
{
    "text": "Search Name of the torrent",
    "navigation": {
        "index": 0,
        "limit": 10,
        "orderBy": "order_field",
        "orderDesc": "DESC"
    }
}
```

fields:
* text (string) - torrent search name
* navigation (object) [optional] - object with navigation params
* * index (int) [optional] - stating of torrent index of navigation
* * limit (int) [optional] [default: 10] - max number of results on page
* * orderBy (text) [optional] - field which is using for order results
* * orderDesc (enum [DESC, ASC]) [optional] - sort direction of the field

#### Reading queue

As said before after each request and periodicly you need to read queue for additional messaged

endpoint (GET REQUEST):
```
https://localhost:8095/api/queue
```

after executing of search **/api/searchTorrent** request **additional result of search will be in queue**!