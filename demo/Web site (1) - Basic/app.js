var fs = require('fs');
var db_helper = require("./db_helper.js");

var http = require('http').createServer(function handler(req, res) {
  fs.readFile(__dirname + '/index.html', function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html!');
    } else {
      res.writeHead(200);
      res.end(data);
    }
  });
}).listen(8888);

var io = require('c:/Program Files (x86)/nodejs/node_modules/socket.io').listen(http);

io.sockets.on('connection', function (client) {
  console.log('Client connected.');

  // Populate data on first page load
  db_helper.get_employees(function (employees, columns, rowsCount) {
    client.emit('populate', employees, columns, rowsCount);
  });

  client.on('refresh', function () {
    console.log('Repopulate employees on client...');
    db_helper.get_employees(function (employees, columns, rowsCount) {
      console.log('Sent [populate] event...');
      client.emit('populate', employees, columns, rowsCount);
    });
  });

  client.on('add employee', function (data) {
    console.log('Adding employee...');
    db_helper.add_employee(data, function () {
      console.log('Repopulate employees on client...');
      setTimeout(function () {
        db_helper.get_employees(function (employees, columns, rowsCount) {
          console.log('Sent [populate] event...');
          client.emit('populate', employees, columns, rowsCount);
        });
      }, 1000);
    })
  });

  client.on('delete employee', function (data) {
    console.log('Deleting employee(s)...');
    db_helper.delete_employee(data, function () {
      console.log('Repopulate employees on client...');
      setTimeout(function () {
        db_helper.get_employees(function (employees, columns, rowsCount) {
          console.log('Sent [populate] event...');
          client.emit('populate', employees, columns, rowsCount);
        });
      }, 1000);
    })
  });

});

