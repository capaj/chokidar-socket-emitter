'use strict'
const chokidar = require('chokidar')
var fs = require('fs')
var path = require('path')
const socketsConnected = []

module.exports = (opts) => {
  const port = opts.port || 9111

  var app = require('http').createServer()
  var io = require('socket.io')(app)
  app.listen(port)

  var watcher = chokidar.watch(opts.path || '.', {
    ignored: /[\/\\]\./,
    ignoreInitial: true
  }).on('all', function(event, onPath) {
    if (opts.relativeTo) {
      onPath = path.relative(opts.relativeTo, onPath)
    }
    console.log('File ', onPath, ' emitted: ' , event)
    socketsConnected.forEach((socket) => {
      socket.emit(event, onPath)
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
