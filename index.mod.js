var express = require('express');
var app = express();

app.get('/', function(req, res)
{
	res.sendfile(__dirname + '/build/index.html');
});

app.use(express.static('build'));

app.get('*', function(req, res)
{
	res.sendfile(__dirname + '/build/index.html');
});

