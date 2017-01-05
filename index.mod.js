var express = require('express');
var app = express();
var server = require('http').Server(app);

app.get('/', function(req, res)
{
	res.sendfile(__dirname + '/build/index.html');
});

app.use(express.static('build'));

app.get('*', function(req, res)
{
	res.sendfile(__dirname + '/build/index.html');
});

server.listen(8095);
