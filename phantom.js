var system = require('system');
var url = system.args[1];
var page = require('webpage').create();

page.open(url, function(status) {
    if (status == 'fail')
        phantom.exit();
 
    var intervalTime = 1;
    setInterval(function() {
      var ready = page.evaluate(function () {
        if(typeof window.isReady !== 'undefined')
        {
            return window.isReady();
        }
        return false;
      });
      if (ready) {
        var out = page.content;
        out = out.replace(/<script[^>]+>(.|\n|\r)*?<\/script\s*>/ig, '');
        out = out.replace('<meta name="fragment" content="!" />', '');
		out = out.replace('<meta name="fragment" content="!">', '');
        console.log(out)
        phantom.exit();
      }
    }, intervalTime++);
});