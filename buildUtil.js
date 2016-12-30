var path = require("path")

var buildModule = require("build-modules")
var colors = require("colors/safe")

//var copyright = '/* Copyright (c) 2015 Billy Tetrud - Free to use for any purpose: MIT License*/'

var moduleName = 'elect'

exports.build = function() {
    doyourthang(false)
}
exports.buildAndWatch = function() {
    doyourthang(true)
}

function doyourthang(watch) {
    build(moduleName, watch, {name: moduleName, minify:false, output: {path:__dirname+'/dist/', name: moduleName+".umd.js"}})
    build("./test/tests", watch, {name: 'tests', minify: false, output: {path:__dirname+'/test/generated/'}})
}

function build(relativeModulePath, watch, options) {
    var emitter = buildModule(path.join(__dirname, relativeModulePath), {
        watch: watch/*, header: copyright*/, name: options.name, minify: options.minify !== false,
        output: options.output
    })
    emitter.on('done', function() {
       console.log((new Date())+" - Done building "+relativeModulePath+"!")
    })
    emitter.on('error', function(e) {
       console.log(e)
    })
    emitter.on('warning', function(w) {
       console.log(colors.grey(w))
    })
}
