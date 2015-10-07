# chokidar-socket-emitter
a simple chokidar watcher and socket.io which emits file system events to all connected socket.io clients

## Install
```
npm i chokidar-socket-emitter
```

## Usage
```javascript
var chokidarEvEmitter = require('chokidar-socket-emitter')
chokidarEvEmitter({port: 8090, path: '.'})
```
all options have defaults
