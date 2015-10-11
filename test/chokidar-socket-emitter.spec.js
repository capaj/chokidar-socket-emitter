/*global describe, it, afterEach, after*/
'use strict'
const chokidarEvEmitter = require('../server')

const fs = require('fs')
const chai = require('chai')
const expect = chai.expect

describe('chokidar-socket-emitter', function () {
  let emitter
  this.timeout(3000)
  it('should fire a change event when file changes', function (done) {
    emitter = chokidarEvEmitter({port: 7090, path: './test/test-folder', relativeTo: './test'})
    var socket = require('socket.io-client')('http://localhost:7090')
    socket.on('change', function (data) {
      expect(data).to.equal('test-folder/labrat.txt')
      done()
    })
    setTimeout(() => {
      fs.writeFile('./test/test-folder/labrat.txt', 'test1', (error) => {
        expect(error).to.equal(null)
      })
    }, 300)
  })

  it('shoud respect baseURL in package.json if no path/relativeTo option is specified', function (done) {
    emitter = chokidarEvEmitter({port: 7091})
    var socket = require('socket.io-client')('http://localhost:7091')
    socket.on('change', function (data) {
      expect(data).to.equal('labrat.txt')
      done()
    })
    setTimeout(() => {
      fs.writeFile('./test/nested-baseURL/labrat.txt', 'test2', (error) => {
        expect(error).to.equal(null)
      })
    }, 300)
  })

  afterEach(function (done) {
    emitter.close(done)
  })

  after(() => {
    fs.writeFileSync('./test/test-folder/labrat.txt', '')
    fs.writeFileSync('./test/nested-baseURL/labrat.txt', '')
  })
})
