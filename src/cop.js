
/**
 * Module dependencies.
 */

var WebSocketServer = require('ws').Server;
var utils = require('./utils');
var util = require('util');

/**
 * Prototype
 */

var TrafficCop = module.exports = function(options) {

  options = options || {};

  this.port = options.port || 5000;


  /* --------------- 
    Our collection of throttled requets
   
    var request = {
      name: String,         // The name of this request - used as a unique key
      clients: Array,       // The collection of clients who are asking for traffic
      interval: Object,     // The running update interval for this request
      msPerRequest: Number, // The period of this request's update interval
    }
  ---------------- */
  this.requests = {};

  // Set ourselves up
  this.setup();
}

/**
 * Setup our websocket server and start listening for messages
 *
 * @api private
 */

TrafficCop.prototype.setup = function() {
  var _this = this;

  this.websocketServer = new WebSocketServer({port: this.port});

  // Setup our websocket server
  this.websocketServer.on('connection', function connection(client) {

    // Handle incoming message from clients
    client.on('message', function incoming(message) {

      if(utils.isJSON(message)) {
        // Pass incoming data through to the traffic cop
        _this.handleMessage(JSON.parse(message), client);
      } else {
        console.log('Got a non-JSON message: %s', message);
      }

    });

  });
}

/**
 * Handle an incoming message from a policed client
 *
 * @param {Object} data
 * @return {Boolean}
 * @api private
 */

TrafficCop.prototype.handleMessage = function(data, client) {

  var type = data.type;

  if(type === undefined) {
    console.log("Message with undefined type received");
    return;
  }

  switch(type) {
    case 'register':
      this.registerRequest(data.options, client);
      break;

    case 'request':
      this.requestTraffic(data.name, client);
      break;

    case 'status':
      this.sendRequestStatus(data.options, client);
      break;

    default:
      console.log("Message received with unknown type");
      break;
  }

}

/**
 * Send status information to a client
 *
 * @param {Object} options
 * @param {Object} client
 * @return {Boolean}
 * @api private
 */

TrafficCop.prototype.sendRequestStatus = function(options, client) {

  function requestStatus(request) {
    return {
      name: request.name,
      clients: request.clients.length,
      interval: request.msPerRequest,
    }
  }

  if(options === undefined || options.name === undefined || options.name == 'all') {
    var status = {};
    for(var name in this.requests) {
      status[name] = requestStatus(this.requests[name]);
    }
  } else {
    var request = this.requests[options.name];
    var status = requestStatus(request);
  }

  client.send(JSON.stringify({
    type: 'status',
    data: status,
  }));
}

/**
 * A client wants to make a request. Add them to the queue
 *
 * @param {String} name
 * @param {Object} client
 * @return {Boolean}
 * @api private
 */

TrafficCop.prototype.requestTraffic = function(name, client) {
  if(this.requests[name] === undefined) {
    return;
  } else {
    this.requests[name].clients.push(client);
  }  
}

/**
 * Register a new throttled request
 *
 * @param {Object} options
 * @param {Object} client
 * @return {Boolean}
 * @api private
 */

TrafficCop.prototype.registerRequest = function(options, client) {
  var _this = this;

  if(this.requests[options.name] === undefined) {
    this.requests[options.name] = this.createRequest(options, client);
  } else {
    this.requests[options.name].clients.push(client);
  }
}

/**
 * Create new records for a request we've never seen before
 *
 * @param {Object} options
 * @param {Object} client
 * @return {Object}
 * @api private
 */


TrafficCop.prototype.createRequest = function(options, client) {
  var _this = this;

  var margin = options.margin === undefined ? 0.25 : options.margin;
  var msPerRequest = 1000 * (60 / options.rate)
  var interval = (1 + margin) * msPerRequest;

  var newRequest = {
    name: options.name,
    clients: [client],
    msPerRequest: msPerRequest,
    interval: setInterval(function() {
      _this.triggerRequest(newRequest, client);
    }, interval),
  };

  return newRequest;
}

/**
 * Notify a client that they're clear to make a request
 *
 * @param {Object} request
 * @param {Object} client
 * @api private
 */

TrafficCop.prototype.triggerRequest = function(request, client) {
  if(request.clients.length == 0) {
    return;
  }

  // Grab the client we're about to notify, and remove them from the queue for this request
  var client = request.clients.shift();

  // Send the trigger to the client
  client.send(JSON.stringify({
    type: 'trigger',
    name: request.name,
  }));
}
