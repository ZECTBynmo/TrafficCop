
/**
 * Module dependencies.
 */

var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var TrafficCop = require('../src/cop.js');

describe('TrafficCop', function() {
    it('should instantiate cleanly', function(done) {
        var cop = new TrafficCop({port: 12873});
        done();
    });

    it('should register requests', function(done) {
        var cop = new TrafficCop({port: 25223});

        var ws = new WebSocket('ws://localhost:25223');

        ws.on('open', function() {
            ws.send(JSON.stringify({
                type: 'register',
                options: {
                    name: 'test',
                    rate: 30,
                }
            }));

            ws.send(JSON.stringify({
                type: 'status',
            }));

            ws.on('message', function(message) {
                var data = JSON.parse(message);

                if(data.type == 'status' && data.data['test'] !== undefined) {
                    done();
                }
            });
        });
    });

    it('should enforce traffic', function(done) {
        var cop = new TrafficCop({port: 21223});

        var ws = new WebSocket('ws://localhost:21223');

        ws.on('open', function() {
            // Choose a rate fast enough to get one before the mocha 2 second timeout
            var rate = 300;
            var triggers = {}

            ws.send(JSON.stringify({
                type: 'register',
                options: {
                    name: 'test',
                    rate: rate,
                    margin: 0,
                }
            }));

            ws.on('message', function(message) {
                var data = JSON.parse(message);

                if(data.type == 'trigger') {
                    if(triggers[data.name] === undefined) {
                        triggers[data.name] = 1
                    } else {
                        triggers[data.name]++;
                    }
                }
            });

            for(var iRequest=0; iRequest<5; iRequest++) {
                ws.send(JSON.stringify({
                    type: 'request',
                    name: 'test',
                }));
            }

            // Make sure we're not requesting too fast
            setTimeout(function() {
                if(triggers.test == 5) {
                    done("Requesting too fast");
                }
            }, 980)

            // Make sure we request the right amount of times
            setTimeout(function() {
                if(triggers.test == 5) {
                    done();
                }
            }, 1020)

        });
    });
});
