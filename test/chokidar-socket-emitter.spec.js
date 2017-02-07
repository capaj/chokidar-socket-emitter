/* global describe, it, afterEach, after */
'use strict'
const chokidarEvEmitter = require('../server')

const fs = require('fs')
const chai = require('chai')
const expect = chai.expect

describe('chokidar-socket-emitter', function () {
  let chokidarServer
  this.timeout(3000)
  it('should fire a change event when file changes', function (done) {
    chokidarServer = chokidarEvEmitter({port: 7090, path: './test/test-folder', relativeTo: './test'})
    var socket = require('socket.io-client')('http://localhost:7090')
    socket.on('change', function (data) {
      expect(data.path).to.equal('test-folder/labrat.txt')
      expect(data.absolutePath).to.contain('test-folder/labrat.txt')
      done()
    })
    setTimeout(() => {
      fs.writeFile('./test/test-folder/labrat.txt', 'test1', (error) => {
        expect(error).to.equal(null)
      })
    }, 300)
  })

  it('shoud respect baseURL in package.json if no path/relativeTo option is specified', function (done) {
    chokidarServer = chokidarEvEmitter({port: 7091})
    var socket = require('socket.io-client')('http://localhost:7091')
    socket.on('change', function (data) {
      expect(data.path).to.equal('labrat.txt')
      done()
    })
    setTimeout(() => {
      fs.writeFile('./test/nested-baseURL/labrat.txt', 'test2', (error) => {
        expect(error).to.equal(null)
      })
    }, 300)
  })

  it('should expose watcher for manual event subscription', function (done) {
    chokidarServer = chokidarEvEmitter({port: 7090}, done)
  })

  it('should respond with package.json when client emits "package.json"', function (done) {
    chokidarServer = chokidarEvEmitter({port: 7090, path: './test/test-folder', relativeTo: './test'})
    var socket = require('socket.io-client')('http://localhost:7090')
    socket.emit('package.json', function (data) {
      expect(data.name).to.equal('chokidar-socket-emitter')
      done()
    })
  })

  afterEach(function (done) {
    setTimeout(() => {
      chokidarServer.close(done)
    }, 100)
  })

  after(() => {
    fs.writeFileSync('./test/test-folder/labrat.txt', '')
    fs.writeFileSync('./test/nested-baseURL/labrat.txt', '')
  })
})
