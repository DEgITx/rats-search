## Data directory configuration

File package.json contains path to data directory, you can move this folder to any other (by default data directory for web server same as root folder with package.json). 

```json
{
	...
	"serverDataDirectory": "./",
	...
}
```

This directory always contain logs and other configuration entities.

## Configuration

After server start in root folder will created rats.json - main configuration files. You can configurate port and database path in it:

```json
{
    "dbPath": "e:\\Projects\\rats\\db",
    "httpPort": 8095
} 
```

Where "httpPort" port which listen http server and "dbPath" path to database folder with collection of torrents
