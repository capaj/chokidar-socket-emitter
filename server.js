'use strict'
const chokidar = require('chokidar')
const path = require('path')
const appRoot = require('app-root-path');

const socketsConnected = []

module.exports = (opts, cb) => {
  let baseURL
  let pjson
  let error
  try {
    pjson = require(path.join(opts.dir || path.dirname(appRoot, 'package.json'))
  } catch (err) {
    error = err
  }
  if (!error) {
    baseURL = pjson.jspm && pjson.jspm.directories && pjson.jspm.directories.baseURL || pjson.directories && pjson.directories.baseURL
  }

  let app = opts.app
  if (!app) {
    app = require('http').createServer()
  }

  var io = require('socket.io')(app)
  if (!opts.app) {
    let port = opts.port || 9111
    app.listen(port, () => {
      console.log('chokidar-socket-emitter listening on ' + port)
      cb && cb()
    })
  }
  let pathToWath = opts.path || baseURL || '.'
  let chokidarOpts = Object.assign({
    ignored: [/[\/\\]\./, 'node_modules/**', baseURL + '/jspm_packages/**', '.git/**'],
    ignoreInitial: true
  }, opts.chokidar)
  console.log('chokidar watching ', path.resolve(pathToWath))
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

    socket.on('package.json', function (fn) {
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
