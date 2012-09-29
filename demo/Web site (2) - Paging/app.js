var fs = require('fs');
var db_helper = require("./db_helper.js");

var delay = (Math.random() * 100) + 200; // "artificial" operations delay, to simulate a higher network response time
var page_size = 10;

var http = require('http').createServer(function (req, res) {
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
    default:
      res.writeHead(404);
      return res.end('Error loading: ' + res.url + '!');
      break;
  }
}).listen(8888);

//TODO Update this with your own socket.io installation path
var io = require('c:/Program Files (x86)/nodejs/node_modules/socket.io').listen(http);
//var io = require('socket.io');

function populateClient(client, startFrom, selectCount) {
  db_helper.get_employees(startFrom, selectCount, function (employees, columns, rowsCount) {
    console.log('Sent [populate] event to client, with ' + selectCount + ' rows from start position ' + startFrom + '.');
    client.emit('populate', employees, columns, rowsCount);
  });
}

io.sockets.on('connection', function (client) {
  console.log('Client connected.');

  // Populate data on first page load
  db_helper.setup(function () {
    populateClient(client, 1, page_size); // first 10 rows
  });

  client.on('page', function (startFrom, selectCount) {
    console.log('Got [page] request from client.');
    setTimeout(function () {
      populateClient(client, startFrom, selectCount);
    }, delay);
  });

  client.on('add employee', function (data) {
    console.log('Got [add employee] request from client.');
    db_helper.add_employee(data, function () {
      setTimeout(function () {
        populateClient(client, 1, page_size);
      }, delay);
    })
  });

  client.on('delete employee', function (data) {
    console.log('Got [delete employee] request from client.');
    db_helper.delete_employee(data, function () {
      setTimeout(function () {
        populateClient(client, 1, page_size);
      }, delay);
    })
  });

  client.on('update employee', function (data) {
    console.log('Got [update employee] request from client.');
    db_helper.update_employee(data, function () {
      setTimeout(function () {
        populateClient(client, 1, page_size);
      }, delay);
    })
  });

});

io.sockets.on('disconnect', function () {
  console.log('Client disconnected.');
});
