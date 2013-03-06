// Load modules

var Chai = require('chai');
var Shot = require('../lib');


// Declare internals

var internals = {};


// Test shortcuts

var expect = Chai.expect;


describe('Shot', function () {

    describe('#inject', function () {

        it('returns single buffer payload', function (done) {

            var reply = 'Hello World';
            var dispatch = function (req, res) {

                res.writeHead(200, { 'Content-Type': 'text/plain', 'Content-Length': reply.length });
                res.end(reply);
            };

            Shot.inject(dispatch, { method: 'get', url: '/' }, function (res) {

                expect(res.payload).to.equal(reply);
                done();
            });
        });

        it('returns chunked payload', function (done) {

            var dispatch = function (req, res) {

                res.writeHead(200);
                res.write('a');
                res.write('b');
                res.end();
            };

            Shot.inject(dispatch, { method: 'get', url: '/' }, function (res) {

                expect(res.payload).to.equal('ab');
                done();
            });
        });

        it('returns multi buffer payload', function (done) {

            var dispatch = function (req, res) {

                res.writeHead(200);
                res.write('a');
                res.write(new Buffer('b'));
                res.end();
            };

            Shot.inject(dispatch, { method: 'get', url: '/' }, function (res) {

                expect(res.payload).to.equal('ab');
                done();
            });
        });

        it('returns null payload', function (done) {

            var dispatch = function (req, res) {

                res.writeHead(200, { 'Content-Length': 0 });
                res.end();
            };

            Shot.inject(dispatch, { method: 'get', url: '/' }, function (res) {

                expect(res.payload).to.equal('');
                done();
            });
        });

        it('allows ending twice', function (done) {

            var dispatch = function (req, res) {

                res.writeHead(200, { 'Content-Length': 0 });
                res.end();
                res.end();
            };

            Shot.inject(dispatch, { method: 'get', url: '/' }, function (res) {

                expect(res.payload).to.equal('');
                done();
            });
        });

        it('identifies injection object', function (done) {

            var dispatch = function (req, res) {

                expect(Shot.isInjection(req)).to.equal(true);
                expect(Shot.isInjection(res)).to.equal(true);

                res.writeHead(200, { 'Content-Length': 0 });
                res.end();
            };

            Shot.inject(dispatch, { method: 'get', url: '/' }, function (res) {

                done();
            });
        });

        describe('#play', function () {

            it('plays payload', function (done) {

                var dispatch = function (req, res) {

                    var buffer = '';
                    req.on('data', function (chunk) {

                        buffer += chunk;
                    });

                    req.on('error', function (err) {
                    });

                    req.on('close', function () {
                    });

                    req.on('end', function () {

                        res.writeHead(200, { 'Content-Length': 0 });
                        res.end(buffer);
                        req.destroy();
                    });
                };

                var body = 'something special just for you';
                Shot.inject(dispatch, { method: 'get', url: '/', payload: body }, function (res) {

                    expect(res.payload).to.equal(body);
                    done();
                });
            });

            it('plays payload with pause', function (done) {

                var dispatch = function (req, res) {

                    req.pause();
                    req.pause();

                    var buffer = '';
                    req.on('data', function (chunk) {

                        buffer += chunk;
                    });

                    req.on('error', function (err) {
                    });

                    req.on('close', function () {
                    });

                    req.on('end', function () {

                        res.writeHead(200, { 'Content-Length': 0 });
                        res.end(buffer);
                        req.destroy();
                    });

                    req.resume();
                    req.resume();
                };

                var body = 'something special just for you';
                Shot.inject(dispatch, { method: 'get', url: '/', payload: body }, function (res) {

                    expect(res.payload).to.equal(body);
                    done();
                });
            });

            it('plays payload with nextTick', function (done) {

                var dispatch = function (req, res) {

                    req.pause();

                    var buffer = '';
                    req.on('data', function (chunk) {

                        buffer += chunk;
                    });

                    req.on('error', function (err) {
                    });

                    req.on('close', function () {
                    });

                    req.on('end', function () {

                        res.writeHead(200, { 'Content-Length': 0 });
                        res.end(buffer);
                        req.destroy();
                    });

                    process.nextTick(function () {

                        req.resume();
                    });
                };

                var body = 'something special just for you';
                Shot.inject(dispatch, { method: 'get', url: '/', payload: body }, function (res) {

                    expect(res.payload).to.equal(body);
                    done();
                });
            });

            it('simulates error', function (done) {

                var dispatch = function (req, res) {

                    var buffer = '';
                    req.on('data', function (chunk) {

                        buffer += chunk;
                    });

                    req.on('error', function (err) {
                        res.writeHead(200, { 'Content-Length': 0 });
                        res.end('error');
                    });

                    req.on('close', function () {
                    });

                    req.on('end', function () {
                    });
                };

                var body = 'something special just for you';
                Shot.inject(dispatch, { method: 'get', url: '/', payload: body, simulate: { error: true } }, function (res) {

                    expect(res.payload).to.equal('error');
                    done();
                });
            });

            it('simulates close', function (done) {

                var dispatch = function (req, res) {

                    var buffer = '';
                    req.on('data', function (chunk) {

                        buffer += chunk;
                    });

                    req.on('error', function (err) {
                    });

                    req.on('close', function () {
                        res.writeHead(200, { 'Content-Length': 0 });
                        res.end('close');
                    });

                    req.on('end', function () {
                    });
                };

                var body = 'something special just for you';
                Shot.inject(dispatch, { method: 'get', url: '/', payload: body, simulate: { close: true } }, function (res) {

                    expect(res.payload).to.equal('close');
                    done();
                });
            });
        });
    });
});
