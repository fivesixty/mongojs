(function () {

  var MongoJS = window.MongoJS = {};
  
  var nullFn = function () {};
  
  MongoJS.sanity = function (fn, transform) {
    if (fn === undefined) {
      return nullFn;
    }
    return function (err, res) {
      if (err) {
        fn(err);
      } else {
        fn(null, transform ? transform(res) : res);
      }
    }
  }
  
  MongoJS.nodeCompatability = function () {
    window.sys = {
      puts: function (m) { console.log(m); },
      inspect: function (o) { return JSON.stringify(o); }
    };
    
    String.prototype.toHexString = function () {
      return this.toString(16);
    }
  }
  
  MongoJS.Server = Server;
  function Server(proxyLocation, ready) {
    var iframe = this.iframe = document.createElement("iframe");
    iframe.src = proxyLocation;
    iframe.style.display = "none";
    document.body.appendChild(iframe);
    
    this.intID = 1;
    this.proxy = iframe.contentWindow;
    var $this = this;
    this.ready = ready;
    window.addEventListener("message", function () { Server.prototype.receiveMessage.apply($this, arguments); } );
  }
  
  Server.prototype.send = function (obj) {
    var data = JSON.stringify(obj);
    // console.log("sending: " + data);
    this.proxy.postMessage(JSON.stringify(obj), "*");
  };
  
  Server.prototype.receiveMessage = function(e) {
    // console.log("receiving: " + e.data);
    if (e.data === "IFRAMECONNECTED") {
      this.ready(this);
      return;
    }
    var response = JSON.parse(e.data);
    this.trigger(response.e, response.i, [response.err || null, response.p]);
  };
  
  Server.prototype.bind = function (eventName, ident, callback) {
    if (this.listeners === undefined) {
      this.listeners = {};
    }
    if (this.listeners[eventName] === undefined) {
      this.listeners[eventName] = {};
    }
    this.listeners[eventName][ident] = callback;
  };
  
  Server.prototype.trigger = function (eventName, ident, data) {
    if (this.listeners && this.listeners[eventName] && this.listeners[eventName][ident]) {
      this.listeners[eventName][ident].apply({}, data);
    }
  };
  
  Server.prototype.unbind = function (eventName, ident) {
    this.listeners[eventName][ident] = undefined;
  };
  
  Server.prototype.newID = function () {
    this.intID += 1;
    return this.intID;
  };
  
  Server.prototype.RPC = function(method, data, callback) {
    var ident = this.newID(), $this = this;
    this.bind(method, ident, function (err, res) {
      $this.unbind(method, ident);
      callback(err, res);
    });
    this.send({e:method, i: ident, d: data});
  }
  
  Server.prototype.RPCm = function(method, data, callback) {
    var ident = this.newID(), $this = this;
    this.bind(method, ident, function (err, res) {
      if (err || res.complete) {
        $this.unbind(method, ident);
      }
      if (!res.complete) {
        callback(err, res.data);
      } else {
        callback(null, null);
      }
    });
    this.send({e:method, i: ident, d: data});
  }

}());