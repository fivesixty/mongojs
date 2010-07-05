var http = require('http'), 
		url = require('url'),
		fs = require('fs'),
		io = require('socket.io'),
		mongo = require('mongodb'),
		sys = require('sys'),
		
send404 = function(res){
	res.writeHead(404);
	res.write('404');
	res.end();
},

host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';

port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : mongo.Connection.DEFAULT_PORT;


var server = http.createServer(function(req, res) {
	var path = url.parse(req.url).pathname;
	switch (path) {
		case '/':
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(fs.readFileSync("index.html", 'utf8'), 'utf8');
			res.end();
			break;
			
		default:
			if (/\.(js|html|swf)$/.test(path)){
				try {
					var swf = path.substr(-4) === '.swf';
					res.writeHead(200, {'Content-Type': swf ? 'application/x-shockwave-flash' : ('text/' + (path.substr(-3) === '.js' ? 'javascript' : 'html'))});
					res.write(fs.readFileSync(__dirname + path, swf ? 'binary' : 'utf8'), swf ? 'binary' : 'utf8');
					res.end();
				} catch(e){ 
					send404(res); 
				}				
				break;
			}
		
			send404(res);
			break;
	}
});

server.listen(21337);

io.Client.prototype.res = function (command, ident, data) {
  this.send(JSON.stringify({e: command, i: ident, p: data}));
}

io.Client.prototype.err = function (command, ident, err) {
  this.send(JSON.stringify({e: command, i: ident, err: err}));
}

function staticForward (client, value, command, ident) {
  return function (err) {
    if (err === null) {
      client.res(command, ident, value);
    } else {
      client.err(command, ident, err);
    }
  }
}

function nilForward (client, command, ident) {
  return staticForward(client, {}, command, ident);
}

function uniForward (client, command, ident) {
  return function (err, res) {
    if (err === null) {
      client.res(command, ident, res);
    } else {
      client.err(command, ident, err);
    }
  }
}

function idForward (client, collection, command, ident) {
  return function (err, res) {
    if (err === null) {
      collection.push(res);
      client.res(command, ident, collection.length - 1);
    } else {
      client.err(command, ident, err);
    }
  }
}

function multiForward (client, command, ident) {
  return function (err, res) {
    if (err === null) {
      if (res === null) {
        client.res(command, ident, {complete: true});
      } else {
        client.res(command, ident, {data: res});
      }
    } else {
      client.err(command, ident, err);
    }
  }
}

var listener = io.listen(server, {
	
	onClientConnect: function(client){
		sys.puts(client.sessionId + ' connected');
	},
	
	onClientDisconnect: function(client){
		sys.puts(client.sessionId + ' disconnected');
	},
	
	onClientMessage: function(message, client) {
	  try {
  		var m = JSON.parse(message);
  		switch (m.e) {
		    case "db.open":
    		  client.mdb = new mongo.Db(m.d.db, new mongo.Server(host, port, {}), {});
    		  client.collections = [];
    		  client.cursors = [];
    		  client.mdb.open(nilForward(client, m.e, m.i));
    		  break;
    		  
    		case "db.close":
    		  client.collections = [];
    		  client.cursors = [];
    		  client.mdb.close(nilForward(client, m.e, m.i));
    		  break;
    	
    		case "db.collection":
    		  client.mdb.collection(m.d.collection, idForward(client, client.collections, m.e, m.i));
    		  break;
    		  
    		case "db.dropDatabase":
    		  client.mdb.dropDatabase(nilForward(client, m.e, m.i));
    		  break;
    		  
    		case "db.createCollection":
    		  client.mdb.createCollection(m.d.name, m.d.opts, idForward(client, client.collections, m.e, m.i));
    		  break;
    		  
    		case "db.dropCollection":
    		  client.mdb.dropCollection(m.d.collection, uniForward(client, m.e, m.i));
    		  break;
    		  
    		case "db.collectionNames":
    		  client.mdb.collectionNames(uniForward(client, m.e, m.i));
    		  break;
    		  
    		case "db.collectionsInfo":
    		  client.mdb.collectionsInfo(idForward(client, client.cursors, m.e, m.i));
    		  break;
    		  
    		case "db.createIndex":
    		  client.mdb.createIndex(m.d.collection, m.d.indexName, uniForward(client, m.e, m.i));
    		  break;
    		
    		case "db.indexInformation":
    		  client.mdb.indexInformation(m.d.collection, uniForward(client, m.e, m.i));
    		  break;
    		
    		
    		
    		case "collection.count":
    		  client.collections[m.d.coll_id].count(uniForward(client, m.e, m.i));
    		  break;
    		  
    		case "collection.createIndex":
    		  client.collections[m.d.coll_id].createIndex(m.d.name, uniForward(client, m.e, m.i));
    		  break;
    		  
    		case "collection.remove":
    		  client.collections[m.d.coll_id].remove(staticForward(client, m.d.coll_id, m.e, m.i));
    		  break;
    		  
    		case "collection.drop":
    		  client.collections[m.d.coll_id].drop(uniForward(client, m.e, m.i));
    		  break;
    		
    		case "collection.find":
    		  for (var s in m.d.s) {
    		    if ((typeof m.d.s[s] === "string") && (m.d.s[s].substr(0,1) === "/")) {
    		      m.d.s[s] = eval(m.d.s[s]);
    		    }
    		  }
    		  
    		  client.collections[m.d.coll_id].find(m.d.s, m.d.opts, idForward(client, client.cursors, m.e, m.i));
    		  break;
    		  
    		case "collection.insert":
    		  client.collections[m.d.coll_id].insert(m.d.o, uniForward(client, m.e, m.i));
    		  break;
    		  
    		
    		
    		
    		case "cursor.each":
    		  client.cursors[m.d.cursor_id].each(multiForward(client, m.e, m.i));
    		  break;
    		
    		case "cursor.toArray":
    		  client.cursors[m.d.cursor_id].toArray(uniForward(client, m.e, m.i));
    		  break;
    		
    		case "cursor.explain":
    		  client.cursors[m.d.cursor_id].explain(uniForward(client, m.e, m.i));
    		  break;
    		  
    		case "cursor.nextObject":
    		  client.cursors[m.d.cursor_id].nextObject(uniForward(client, m.e, m.i));
    		  break;
    		
    		
    		default:
    		  client.err(m.e, m.i, "Invalid Command");
  		}
    } catch (e) {
      sys.puts(sys.inspect(e));
      client.send("Malformed Request. " + JSON.stringify(e));
    }
	}
	
});

// Heartbeat
// todo: per-client tests for cleaning up.
setInterval(function () {
  listener.broadcast(JSON.stringify(new Date));
}, 10000);