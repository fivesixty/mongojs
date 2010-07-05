# MongoJS

A client-side scriptable port/wrapping for node-mongodb-native.
Uses WebSocket (through compatability layer Socket.IO).

Currently a bit incomplete.

## Config

Runs on port 21337 by default.
You need to change your client side server connection (client/index.html), and server side listen port (server/server.js).

## TODO

* Clean up server.js to be less hacked together.
* Add tests
* Wrap more of the API [accurately].