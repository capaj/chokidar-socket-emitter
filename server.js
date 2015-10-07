const chokidar = require('chokidar')
var app = require('http').createServer()
var io = require('socket.io')(app)
var fs = require('fs')
const socketsConnected = []
app.listen(8090)

var watcher = chokidar.watch('.', {ignored: /[\/\\]\./}).on('all', function(event, path) {
  console.log('File ', path, ' emitted: ' , event)
  socketsConnected.forEach((socket) => {
    socket.emit(event, path)
  })
})
io.on('connection', socketsConnected.push)
