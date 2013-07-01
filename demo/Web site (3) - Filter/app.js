var fs = require('fs');
var db_helper = require("./db_helper.js");

var delay = (Math.random() * 100) + 200; // Introduce a delay, to simulate a higher network response time
var page_size = 10; // Rows displayed per page

var http = require('http').createServer(function handler(req, res) {
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

//TODO Update this with your own socket.io installation path
var io = require('c:/Program Files (x86)/nodejs/node_modules/socket.io').listen(http);
//var io = require('socket.io');

function populateClient(client, startFrom, selectCount, filter) {
  db_helper.get_employees(startFrom, selectCount, filter, function (employees, columns, rowsCount) {
    console.log('Sent [populate] event to client, with ' + selectCount + ' rows from start position ' + startFrom + '.');
    client.emit('populate', employees, columns, rowsCount);
  });
}

io.sockets.on('connection', function (client) {
  console.log('Client connected.');

  client.on('setup', function () {
    console.log('Initial setup needed...');
    db_helper.setup(function () {
      populateClient(client, 1, page_size, '');
    });
  });

  client.on('refresh', function (filter) {
    populateClient(client, 1, page_size, filter); // First [page_size] rows
  });

  client.on('page', function (startFrom, selectCount, filter) {
    console.log('Got [page] request from client.');
    setTimeout(function () {
      populateClient(client, startFrom, selectCount, filter);
    }, delay);
  });

  client.on('add employee', function (data, filter) {
    console.log('Got [add employee] request from client.');
    db_helper.add_employee(data, function () {
      setTimeout(function () {
        populateClient(client, 1, page_size, filter);
      }, delay);
    })
  });

  client.on('delete employee', function (data, filter) {
    console.log('Got [delete employee] request from client.');
    db_helper.delete_employee(data, function () {
      setTimeout(function () {
        populateClient(client, 1, page_size, filter);
      }, delay);
    })
  });

  client.on('update employee', function (data, filter) {
    console.log('Got [update employee] request from client.');
    db_helper.update_employee(data, function () {
      setTimeout(function () {
        populateClient(client, 1, page_size, filter);
      }, delay);
    })
  });

});

io.sockets.on('disconnect', function () {
  console.log('Client disconnected.');
});
