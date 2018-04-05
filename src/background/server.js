const appConfig = require('./config')
const spiderCall = require('./spider')
const dbPatcher = require('./dbPatcher')
const startSphinx = require('./sphinx')

sphinx = startSphinx(() => {
  dbPatcher(() => {
    spider = spiderCall((...data) => { 
      
    }, (message, callback) => {

    }, './', '0.7.1', 'development')
  }, null, sphinx)
}, './', () => {})