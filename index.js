const
  IO = require("socket.io-client");

let Client = function(url, opts) {
  if ('object' == typeof url) {
    opts = url;
    url = null;
  }
  this.serverUrl = url || null;
  this.options = opts || {};
  this.socket = null;
  this.connected = false;
  this.clientName = 'unknown';
  this.apiMethods = null;
  return this;
}

Client.prototype.connect = function(selfName, cb) {
  if ('function' == typeof selfName) {
    cb = selfName;
    selfName = false;
  }
  if ('function' != typeof cb) {
    cb = function() {};
  }

  let _self = this;
  let cbCalled = false;
  this.socket = IO.connect(this.serverUrl, this.options);
  this.socket.on('connect_error', function() {
    if(!cbCalled) {
      cb(new Error('Logger server connection failed'));
      cbCalled = true;
    }
  });
  this.socket.on('reconnect_failed', function() {
    if(!cbCalled) {
      cb(new Error('Logger server reconnection failed'));
      cbCalled = true;
    }
  });

  this.socket.on('connect', function() {
    console.log('LoggeClient connected');
    _self.connected = true;
    cbCalled = true;
    if (selfName) {
      _self.setName(selfName, function(result) {
        return cb(result.success ? null : new Error(result.err));
      });
    } else {
      cb(null);
    }
  });

  return this;
  // }}}
}

Client.prototype.setName = function(selfName, cb) {
  if (!this.socket) {
    cb(new Error("client not connected"));
    return;
  }
  this.socket.emit('ctrl', {
    cmd: 'setName',
    name: selfName
  }, cb);
  return this;
}

Client.prototype.ping = function(cb) {
  if (!this.socket) {
    cb(new Error("client not connected"));
    return;
  }
  this.socket.emit('sping', {}, function(res) {
    cb(null, res);
  });
}


Client.prototype.on = function(eventName, cb, subscribeCb) {
  if (!this.socket) throw new Error("not connected");
  let params = {
    cmd: 'subscribe',
    events: eventName
  };
  this.socket.emit('ctrl', params, function(res) {
    if ('function' == typeof subscribeCb) {
      subscribeCb(res);
    }
  });
  this.socket.on(eventName, cb);
  return this;
}


Client.prototype.send = Client.prototype.emit = function(eventName, data) {
  if (!this.socket) throw new Error("not connected");
  let params = {
    event: eventName,
    data: data
  }
  this.socket.emit('broadcast', params, function(res) {
    if (!res.success) {
      // throw is bad here..
    }
  });
  return this;
}

module.exports = Client;
