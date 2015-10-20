# chokidar-socket-emitter
a simple chokidar watcher and socket.io server which emits file system events to all connected socket.io clients

## Install
```
npm i chokidar-socket-emitter
```

## Usage
```javascript
var chokidarEvEmitter = require('chokidar-socket-emitter')
chokidarEvEmitter({port: 8090}) //path is taken from jspm/directories/baseURL or if that is not set up, '.' is used
//or specify the path
chokidarEvEmitter({port: 8090, path: '.'})

//you can also supply an http server instance, that way it will run withing your server on your own port
require('chokidar-socket-emitter')({app: server})
```

This was created to work in conjunction with **[jspm-hot-reloader](https://github.com/capaj/jspm-hot-reloader)**
