//= require "Server"

(function (MongoJS) {
  
  MongoJS.Cursor = Cursor;
  function Cursor(collection, id) {
    this.server = collection.server;
    this.id = id;
  }
  
  Cursor.prototype.each = function (callback) {
    this.server.RPCm("cursor.each", {cursor_id: this.id}, MongoJS.sanity(callback));
  };
  
  Cursor.prototype.explain = function (callback) {
    this.server.RPC("cursor.explain", {cursor_id: this.id}, MongoJS.sanity(callback));
  }
  
  Cursor.prototype.toArray = function (callback) {
    this.server.RPC("cursor.toArray", {cursor_id: this.id}, MongoJS.sanity(callback));
  }
  
  Cursor.prototype.nextObject = function (callback) {
    this.server.RPC("cursor.nextObject", {cursor_id: this.id}, MongoJS.sanity(callback));
  }

}(MongoJS));