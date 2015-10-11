'use strict'
const chokidar = require('chokidar')
const path = require('path')
const socketsConnected = []
let baseURL
try {
  const pjson = require(path.join(path.dirname(require.main.filename), 'package.json'))
  baseURL = pjson.jspm.directories.baseURL || pjson.directories.baseURL
} catch (err) {}
if (baseURL) {
  console.log('using baseURL from package.json: ', baseURL)
}

module.exports = (opts) => {
  const port = opts.port || 9111

  var app = require('http').createServer()
  var io = require('socket.io')(app)
  app.listen(port)

  let pathToWath = opts.path || baseURL || '.'
  var watcher = chokidar.watch(pathToWath, {
    ignored: /[\/\\]\./,
    ignoreInitial: true
  }).on('all', function (event, onPath) {
    if (opts.relativeTo) {
      onPath = path.relative(opts.relativeTo, onPath)
    } else if (baseURL) {
      onPath = path.relative(baseURL, onPath)
    }
    if (path.sep === '\\') {
      onPath = onPath.replace(/\\/g, '/')
    } else {

    }
    console.log('File ', onPath, ' emitted: ', event)
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

  io.close = (callback) => {
    watcher.close()
    console.log('closing chokidar-socket-emitter')
    socketsConnected.forEach(function (socket) {
      socket.disconnect()
    })
    io.httpServer.close(callback)
  }

  return io
}
