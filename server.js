'use strict'
const chokidar = require('chokidar')
const path = require('path')
const socketsConnected = []

module.exports = (opts, cb) => {
  let baseURL
  const pjson = require(path.join(opts.dir || path.dirname(require.main.filename), 'package.json'))
  baseURL = pjson.jspm && pjson.jspm.directories && pjson.jspm.directories.baseURL || pjson.directories && pjson.directories.baseURL
  if (baseURL) {
    console.log('using baseURL from package.json: ', baseURL)
  } else {
    baseURL = '.'
  }

  let app = opts.app
  if (!app) {
    app = require('http').createServer()
  }

  var io = require('socket.io')(app)
  if (!opts.app) {
    let port = opts.port || 9111
    app.listen(port, () => {
      console.log('chokidar listening on ' + port)
      cb && cb()
    })
  }
  let pathToWath = opts.path || baseURL || '.'
  let chokidarOpts = Object.assign({
    ignored: [/[\/\\]\./, 'node_modules/**', 'jspm_packages/**'],
    ignoreInitial: true
  }, opts.chokidar)
  var watcher = chokidar.watch(pathToWath, chokidarOpts).on('all', (event, onPath) => {
    let absolutePath = path.join(process.cwd(), onPath)
    if (opts.relativeTo) {
      onPath = path.relative(opts.relativeTo, onPath)
    } else if (baseURL) {
      onPath = path.relative(baseURL, onPath)
    }
    if (path.sep === '\\') {
      onPath = onPath.replace(/\\/g, '/')
    } else {

    }
    console.log('File ', onPath, ' emitted: ' + event)
    socketsConnected.forEach((socket) => {
      socket.emit(event, {path: onPath, absolutePath})
    })
  })
  io.on('connection', (socket) => {
    let index = socketsConnected.push(socket)
    socket.on('disconnect', () => {
      socketsConnected.splice(index - 1, 1)
    })

    socket.on('identification', (name) => {
      console.log('connected client: ' + name)
    })

    socket.on('package.json', function (name, fn) {
      fn(pjson)
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
