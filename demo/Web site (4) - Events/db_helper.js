var Result2Array = require('../../src/resultset/Result2Array');

exports.setup = function (callback) {
  var empNames = [
    'John Doe',
    'Don Mae',
    'Missy Glenn',
    'John Tank',
    'Alec Willson',
    'Donna Doe',
    'Dana Joe',
    'Darling Mo',
    'Master Commander',
    'Senior Dan',
    'Maia Moore',
    'Secret Agent',
    'Dancing Queen',
    'Funny Guy',
    'Daniel Thor',
    'Doctor King',
    'Super Man',
    'Major John Ark',
    'Smiley Man',
    'Bud Thommas',
    'Alan Viking',
    'Beauty Beast',
    'Eleanor Karat'
  ];

  var sqls = [];
  sqls.push('drop table if exists employees');
  sqls.push('create table employees( \
    id int not null auto_increment, \
    f_name varchar(40) not null, \
    salary int not null, \
    primary key (id))');
  for (var i = 0; i < empNames.length; i++) {
    sqls.push("insert into employees(f_name,salary) values('" + empNames[i] + "'," + Math.random() * 10000 + ")");
  }

  var client = require('../../index').createDefaultCUBRIDDemodbConnection();

  client.connect(null);

  client.on(client.EVENT_ERROR, function (err) {
    throw err.message;
  });

  client.on(client.EVENT_CONNECTED, function () {
    console.log('Connected.');
    console.log('Setup employees...');
    console.log(sqls);
    client.batchExecuteNoQuery(sqls, null);
  });

  client.on(client.EVENT_BATCH_COMMANDS_COMPLETED, function () {
    client.close(null);
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    console.log('Connection closed.');
    callback();
  });
};

exports.cleanup = function (callback) {
  var sql = "drop table if exists employees";
  var client = require('../../index').createDefaultCUBRIDDemodbConnection();

  client.connect(null);

  client.on(client.EVENT_ERROR, function (err) {
    throw err.message;
  });

  client.on(client.EVENT_CONNECTED, function () {
    console.log('Connected.');
    console.log('Cleanup...');
    console.log(sql);
    client.batchExecuteNoQuery(sql, null);
  });

  client.on(client.EVENT_BATCH_COMMANDS_COMPLETED, function () {
    client.close(null);
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    console.log('Connection closed.');
    callback();
  });
};

exports.add_employee = function (data, callback) {
  var sql = "insert into employees (f_name, salary) values ('" + data.name + "'," + data.salary + ")";
  var client = require('../../index').createDefaultCUBRIDDemodbConnection();

  client.connect(null);

  client.on(client.EVENT_ERROR, function (err) {
    throw err.message;
  });

  client.on(client.EVENT_CONNECTED, function () {
    console.log('Connected.');
    console.log('Adding employee: ' + data.name + ' with salary: ' + data.salary);
    console.log(sql);
    client.batchExecuteNoQuery(sql, null);
  });

  client.on(client.EVENT_BATCH_COMMANDS_COMPLETED, function () {
    client.close(null);
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    console.log('Connection closed.');
    callback();
  });
};

exports.delete_employee = function (data, callback) {
  var sql = "delete from employees where id in (" + data.toString() + ")";
  var client = require('../../index').createDefaultCUBRIDDemodbConnection();

  client.connect(null);

  client.on(client.EVENT_ERROR, function (err) {
    throw err.message;
  });

  client.on(client.EVENT_CONNECTED, function () {
    console.log('Connected.');
    console.log('Deleting employee(s): ' + data.toString());
    console.log(sql);
    client.batchExecuteNoQuery(sql, null);
  });

  client.on(client.EVENT_BATCH_COMMANDS_COMPLETED, function () {
    client.close(null);
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    console.log('Connection closed.');
    callback();
  });
};

exports.update_employee = function (data, callback) {
  var sql = "update employees set f_name='" + data.name + "', salary=" + data.salary + " where id=" + data.id;
  var client = require('../../index').createDefaultCUBRIDDemodbConnection();

  client.connect(null);

  client.on(client.EVENT_ERROR, function (err) {
    throw err.message;
  });

  client.on(client.EVENT_CONNECTED, function () {
    console.log('Connected.');
    console.log('Updating employee: ' + data.toString());
    console.log(sql);
    client.batchExecuteNoQuery(sql, null);
  });

  client.on(client.EVENT_BATCH_COMMANDS_COMPLETED, function () {
    client.close(null);
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    console.log('Connection closed.');
    callback();
  });
};

exports.get_employees = function (startFrom, selectCount, filter, callback) {
  var sql = "select * from employees";
  if (filter != '') {
    sql += " where f_name like '" + filter + "'";
  }
  sql += " order by f_name asc";
  sql += " for orderby_num() between " + startFrom + " and " + (startFrom + selectCount - 1);

  var sqlCount = "select count(*) from employees";
  if (filter != '') {
    sqlCount += " where (f_name like '" + filter + "')";
  }

  var data = null;
  var cols = null;
  var totalRows = 0;

  var firstQueryCompleted = false;
  var firstQueryClosed = false;

  var client = require('../../index').createDefaultCUBRIDDemodbConnection();

  client.connect(null);

  client.on(client.EVENT_CONNECTED, function () {
    console.log('Connected.');
    console.log('Querying data...');
    console.log(sql);
    client.query(sql, function () {
    });
  });

  client.on(client.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle) {
    if (!firstQueryCompleted) { //first query
      console.log('First query data available...');
      firstQueryCompleted = true;
      data = Result2Array.RowsArray(result);
      cols = Result2Array.ColumnNamesArray(result);
      console.log('Closing first query...');
      client.closeQuery(queryHandle, function () {
      });
    } else { //second query
      console.log('Second query data available...');
      totalRows = Result2Array.RowsArray(result)[0][0];
      console.log('Found ' + totalRows + ' rows.');
      console.log('Closing second query...');
      client.closeQuery(queryHandle, function () {
      });
    }
  });

  client.on(client.EVENT_QUERY_CLOSED, function () {
    if (!firstQueryClosed) {
      firstQueryClosed = true;
      console.log('First query closed.');
      console.log('Executing COUNT query...');
      console.log(sqlCount);
      client.query(sqlCount, function () {
      });
    } else {
      console.log('Second query closed.');
      console.log('Closing connection...');
      client.close(function () {
      });
    }
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    console.log('Connection closed.');
    callback(data, cols, totalRows);
  });
};


