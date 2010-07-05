//= require "Server"
//= require "Cursor"

(function (MongoJS) {
  
  function preserveRegex(obj) {
    for (var o in obj) {
      if (obj[o] instanceof RegExp) {
        obj[o] = obj[o].toString();
      }
    }
    return obj;
  }
  
  MongoJS.Collection = Collection;
  function Collection(db, name, id) {
    this.server = db.server;
    this.name = name;
    this.id = id;
    this.hint = null;
  }
  
  Collection.prototype.count = function (callback) {
    this.server.RPC("collection.count", {coll_id: this.id}, MongoJS.sanity(callback));
  };
  
  Collection.prototype.find = function () {
    var coll = this;
    
    if (arguments.length === 1) {
      var callback = arguments[0], query = {s: {}, opts: {}};
    } else if (arguments.length === 2) {
      var callback = arguments[1], query = {s: preserveRegex(arguments[0]), opts: {}};
    } else if (arguments.length === 3) {
      var callback = arguments[2], query = {s: preserveRegex(arguments[0]), opts: arguments[1]};
    }
    query.coll_id = coll.id;
    if (this.hint) {
      query.opts.hint = query.opts.hint || this.hint;
    }
    
    coll.server.RPC("collection.find", query, MongoJS.sanity(callback, function (id) {
        return new MongoJS.Cursor(coll, id); 
      }));
  };
  
  Collection.prototype.insert = function (obj, callback) {
    this.server.RPC("collection.insert", {coll_id: this.id, o: obj}, MongoJS.sanity(callback));
  };
  
  Collection.prototype.createIndex = function (name, callback) {
    this.server.RPC("collection.createIndex", {coll_id: this.id, name:name}, MongoJS.sanity(callback));
  };
  
  Collection.prototype.remove = function (callback) {
    var coll = this;
    this.server.RPC("collection.remove", {coll_id: this.id}, MongoJS.sanity(callback, function () {
        return coll;
      }));
  };
  
  Collection.prototype.drop = function (callback) {
    this.server.RPC("collection.drop", {coll_id: this.id}, MongoJS.sanity(callback));
  };

}(MongoJS));