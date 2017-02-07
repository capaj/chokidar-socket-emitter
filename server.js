'use strict'
const chokidar = require('chokidar')
const path = require('path')
const socketsConnected = []

module.exports = (opts, cb) => {
  opts = opts || {}
  let baseURL
  let pjson
  let error
  let log = opts.quiet ? () => {} : console.log.bind(console)
  try {
    pjson = require(path.join(opts.dir || path.dirname(require.main.filename), 'package.json'))
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
    let port = opts.port || 5776
    app.listen(port, () => {
      log('chokidar-socket-emitter listening on ' + port)
      cb && cb()
    })
  }
  const pathToWatch = opts.path || baseURL || '.'
  let ignoredPaths = [
    /[/\\]\./,
    // Ignore relative, top-level dotfiles as well (e.g. '.gitignore').
    /^\.[^/\\]/,
    'node_modules/**',
    (baseURL ? baseURL + '/' : '') + 'jspm_packages/**',
    '.git/**'
  ]
  let chokidarOpts = Object.assign({
    ignored: ignoredPaths,
    ignoreInitial: true
  }, opts.chokidar)
  log('chokidar watching ', path.resolve(pathToWatch))
  var watcher = chokidar.watch(pathToWatch, chokidarOpts).on('all', (event, onPath) => {
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
    log('File ', onPath, ' emitted: ' + event)
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
      log('connected client: ' + name)
    })
    if (pjson) {
      socket.on('package.json', function (fn) {
        fn(pjson)
      })
    }
  })

  return {
    io: io,
    app: app,
    watcher: watcher,
    close: (callback) => {
      watcher.close()
      log('closing chokidar-socket-emitter')
      socketsConnected.forEach((socket) => {
        socket.disconnect()
      })
      io.httpServer.close(callback)
    }
  }
}
