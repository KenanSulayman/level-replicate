var net    = require('net')
var master = require('../')
var level  = require('level-test')()
var sub    = require('level-sublevel')
var u      = require('./util')

var d1     = sub(level('db1'))
var m1     = master(d1, 'master', 'M1')
var d2     = sub(level('db2'))
var m2     = master(d2, 'master', 'M2')

var port   = ~~(10000 + Math.random()*50000)
var stream

u.generate(d1, {
  count: 10,
  interval: 10,
  prefix: 'a',
  }) (function () {

        var server = net.createServer(function (stream) {
          stream.pipe(m1.createStream({tail: true})).pipe(stream)
          stream.on('data', function (data) {
            console.log('2 -> 1:', data.toString())
          })
        }).listen(port, function () {
          stream = net.connect(port)
          stream.pipe(m2.createStream({tail: true})).pipe(stream)
          stream.on('data', function (data) {
            console.log('1 -> 2:', data.toString())
          })
        })

        u.generate(d2, {
          prefix: 'b',
        }) (function () {
              setTimeout(function () {
                stream.end()
                server.close()
              }, 100)    
            })

      })

u.eventuallyConsistent(d1, d2)

