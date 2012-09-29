var fs = require('fs');
var db_helper = require("./db_helper.js");

var httpServer = require('http').createServer(function handler(req, res) {
  switch (req.url) {
    case '/':
      fs.readFile(__dirname + '/index.html', function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading index.html!');
        } else {
          res.writeHead(200, {'Content-Type' : 'text/html'});
          res.end(data);
        }
      });
      break;
    case '/cubrid.png':
      fs.readFile(__dirname + '/cubrid.png', function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading cubrid.png!');
        } else {
          res.writeHead(200, {'Content-Type' : 'image/png'});
          res.end(data);
        }
      });
      break;
    case '/site.css':
      fs.readFile(__dirname + '/site.css', function (err, data) {
        if (err) {
          res.writeHead(500);
          return res.end('Error loading site.css!');
        } else {
          res.writeHead(200, {'Content-Type' : 'text/css'});
          res.end(data);
        }
      });
      break;
    default:
      res.writeHead(404);
      return res.end('Error loading: ' + res.url + '!');
      break;
  }
}).listen(8888);

httpServer.on('close', function () {
  console.log("Server closed.");
});

//TODO Update this with your own socket.io installation path
var io = require('c:/Program Files (x86)/nodejs/node_modules/socket.io').listen(httpServer);
//var io = require('socket.io');

io.sockets.on('connection', function (client) {
  console.log('Client connected.');

  client.on('execute', function (sql) {
    console.log('Got [populate] request from client.');
    db_helper.getQueryData(sql, function (data, columnNames) {
      console.log('Send [populate] event to client...');
      if (columnNames == -1) {
        var errMsg = data.message;
        client.emit('sqlerror', errMsg);
      } else {
        client.emit('populate', data, columnNames);
      }
    });
  });
});

io.sockets.on('disconnect', function () {
  console.log('Client disconnected.');
});


