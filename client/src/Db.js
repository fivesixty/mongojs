//= require "Server"
//= require "Collection"

(function (MongoJS) {
  
  MongoJS.Db = Db;
  function Db(dbname, server, options) {
    this.name = dbname;
    this.server = server;
    this.state = "notConnected";
  }
  
  Db.prototype.open = function (callback) {
    var db = this;
    
    db.server.RPC("db.open", {db: db.name}, function (err) {
      if (err) {
        callback(err);
      } else {
        db.state = "Connected";
        callback(null, db);
      }
    });
  };
  
  Db.prototype.collection = function (collName, callback) {
    var db = this;
    db.server.RPC("db.collection", {collection: collName}, MongoJS.sanity(callback, function (id) {
        return new MongoJS.Collection(db, collName, id);
      }));
  };
  
  Db.prototype.dropDatabase = function (callback) {
    this.server.RPC("db.dropDatabase", {}, MongoJS.sanity(callback));
  };
  
  Db.prototype.dropCollection = function (collName, callback) {
    this.server.RPC("db.dropCollection", {collection: collName}, MongoJS.sanity(callback));
  };
  
  Db.prototype.createCollection = function (collName) {
    if (arguments.length === 2) {
      var callback = arguments[1], opts = {};
    } else {
      var callback = arguments[2], opts = arguments[1];
    }
    
    var db = this;
    this.server.RPC("db.createCollection", {name:collName, opts:opts}, MongoJS.sanity(callback, function (id) {
        return new MongoJS.Collection(db, collName, id);
      }));
  };
  
  Db.prototype.collectionNames = function (callback) {
    this.server.RPC("db.collectionNames", {}, MongoJS.sanity(callback));
  };
  
  Db.prototype.collectionsInfo = function (callback) {
    var db = this;
    this.server.RPC("db.collectionsInfo", {}, MongoJS.sanity(callback, function (id) {
        return new MongoJS.Cursor(db, id);
      }));
  };
  
  Db.prototype.createIndex = function (collection, indexName, callback) {
    this.server.RPC("db.createIndex", {collection:collection, indexName:indexName}, MongoJS.sanity(callback));
  };
  
  Db.prototype.indexInformation = function(collection, callback) {
    this.server.RPC("db.indexInformation", {collection:collection}, MongoJS.sanity(callback));
  };
  
  Db.prototype.close = function (callback) {
    this.server.RPC("db.close", {}, MongoJS.sanity(callback));
  };
  
}(MongoJS));