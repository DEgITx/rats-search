## Implementation own tracker strategy

In a case you wanna add support of getting description from any web tracker, here the instruction:

## Strategy implementation

You need to create folowing files:

1. src/background/strategies/`newStrategy`.js (your strategy implementation) - [Examples](../src/background/strategies)
2. tests/strategies/`newStrategy`.js (test for your strategy) - [Examples](../tests/strategies)

You need to implements follwing methods:

* `get name()` - Name of the strategy
* `async findHash()` - Return object of respoce type
* * Example of respoce object:
```json
{ 
	name: 'Name of torrent',
  	poster: 'Link to poster of torrent',
  	description: 'Description of torrent in text format.',
  	contentCategory: 'Category of torrent'
	... Other additional files 
}
```

## Client modification:

Add post to `app/trackers-images.js`:
```javascript
{
	info.trackers.includes('1337x')
	&&
	<a href={`https://example.com/${info.yourFiledForLink}`}><img src='list to image' style={{height: 32}} /></a>
}
```