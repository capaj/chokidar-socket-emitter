#!/usr/bin/env node

var chokidarEvEmitter = require('./server.js')
var program = require('commander')
var path = require('path')

program
  .option('-l, --port <n>')
  .option('-p, --path <path>')
  .option('-d, --dir <n>')
  .option('-P, --poll')
  .option('-q, --quiet')
  .parse(process.argv)

var opts = {}

opts.port = program.port || '5776'

opts.path = program.path

opts.dir = program.dir || path.resolve('.')

if (program.poll) {
  opts.chokidar = { usePolling: true }
}

opts.quiet = program.quiet

chokidarEvEmitter(opts)
