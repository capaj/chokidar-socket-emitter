var chokidarEvEmitter = require('../server')
chokidarEvEmitter({port: 7090, path: './test/test-folder', relativeTo: './test'})
var socket = require('socket.io-client')('http://localhost:7090')
var fs = require('fs')
var chai = require('chai')
var expect = chai.expect
var path = require('path')

describe("chokidar-socket-emitter", function () {
  this.timeout(3000)
  it("fire a change event when file changes", function (done) {
    setTimeout(() => {
      fs.writeFile('./test/test-folder/labrat.txt', 'test', (error) => {
        socket.on('change', function(data){
          expect(data).to.equal('test-folder/labrat.txt')
          done()
        });
      })
    }, 300)

  })

  after(() => {
    fs.writeFileSync('./test/test-folder/labrat.txt', '')
  })
})
