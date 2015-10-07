'use strict'
const chokidar = require('chokidar')
var fs = require('fs')
const socketsConnected = []

module.exports = (port, path) => {
  var app = require('http').createServer()
  var io = require('socket.io')(app)
  app.listen(port)

  var watcher = chokidar.watch(path, {
    ignored: /[\/\\]\./,
    ignoreInitial: true
  }).on('all', function(event, path) {
    console.log('File ', path, ' emitted: ' , event)
    socketsConnected.forEach((socket) => {
      socket.emit(event, path)
    })
  })
  io.on('connection', (socket) => {
    console.log('connected')
    let index = socketsConnected.push(socket)
    socket.on('disconnect', () => {
      socketsConnected.splice(index - 1, 1)
    })
  })

  return io
}
