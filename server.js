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

module.exports = (opts, cb) => {
  let app = opts.app
  if (!app) {
    app = require('http').createServer()
  }

  var io = require('socket.io')(app)
  if (!opts.app) {
    let port = opts.port || 9111
    app.listen(port, () => {
      console.log('chokidar listening on ', port)
      cb && cb()
    })
  }
  let pathToWath = opts.path || baseURL || '.'
  let chokidarOpts = Object.assign({
    ignored: /[\/\\]\./,
    ignoreInitial: true
  }, opts.chokidar)
  var watcher = chokidar.watch(pathToWath, chokidarOpts).on('all', (event, onPath) => {
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

  return {
    io: io,
    app: app,
    watcher: watcher,
    close: (callback) => {
      watcher.close()
      console.log('closing chokidar-socket-emitter')
      socketsConnected.forEach((socket) => {
        socket.disconnect()
      })
      io.httpServer.close(callback)
    }
  }
}
