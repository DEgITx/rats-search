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
        "orderDesc": "DESC",
        "safeSearch": false
    }
}
```

| Field | Type | Optional | Default Value | Description |
| ----- | ---- | -------- | ------------- | ----------- |
| text | string | ❎ |  | torrent search name |
| navigation | object (Navigation) | ✅ |  | object with navigation params |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; index | int | ✅ | 0 | stating of torrent index of navigation |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; limit | int | ✅ | 10 | max number of results on page |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; orderBy | text | ✅ |  | field which is using for order results |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; orderDesc | enum [**DESC, ASC**] | ✅ | ASC | sort direction of the field |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; safeSearch | bool | ✅ | true | disable/enable safe search for torrents |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; type | string | ✅ |  | type of content for search |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; size | object (Interval) | ✅ |  | size of torrent |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; min | uint64 | ✅ |  | minumum size of the torrent |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; max | uint64 | ✅ |  | maximum size of the torrent |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; files | object (Interval) | ✅ |  | files on the torrent |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; min | int | ✅ |  | minumum size of the torrent |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; max | int | ✅ |  | maximum size of the torrent |

### Reading queue

As said before after each request and periodicly you need to read queue for additional messages.

endpoint (GET REQUEST):
```
https://localhost:8095/api/queue
```

after executing of search **/api/searchTorrent** request **additional result of search will be in queue**!

### Search of the torrent by files

endpoint (GET REQUEST):
```
https://localhost:8095/api/searchFiles?text=TorrentWithFileName&navigation={}
```

| Field | Type | Optional | Default Value | Description |
| ----- | ---- | -------- | ------------- | ----------- |
| text | string | ❎ |  | torrent search name |
| navigation | object (Navigation) | ✅ |  | object with navigation params |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; index | int | ✅ | 0 | stating of torrent index of navigation |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; limit | int | ✅ | 10 | max number of results on page |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; orderBy | text | ✅ |  | field which is using for order results |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; orderDesc | enum [**DESC, ASC**] | ✅ | ASC | sort direction of the field |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; safeSearch | bool | ✅ | true | disable/enable safe search for torrents |

### Recheck trackers info for the torrent

endpoint (GET REQUEST):
```
https://localhost:8095/api/checkTrackers?hash=29ebe63feb8be91b6dcff02bacc562d9a99ea864
```

| Field | Type | Optional | Default Value | Description |
| ----- | ---- | -------- | ------------- | ----------- |
| hash | string | ❎ |  | torrent hash to refresh token |

### Top torrents

endpoint (GET REQUEST):
```
https://localhost:8095/api/topTorrents?type=video&navigation={"time":"week"}
```

| Field | Type | Optional | Default Value | Description |
| ----- | ---- | -------- | ------------- | ----------- |
| type | string | ❎ |  | type of category for top of the torrents |
| navigation | object (Navigation) | ✅ |  | object with navigation params (check /api/searchTorrent for mo details) |
| &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; time | enum [hours, week, month] | ✅ |  | time for the top

