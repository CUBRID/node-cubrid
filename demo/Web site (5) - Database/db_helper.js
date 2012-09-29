var Result2Array = require('../../src/resultset/Result2Array');

exports.getQueryData = function (sql, callback) {
  var client = require('../../index').createDefaultCUBRIDDemodbConnection();
  var data = null;
  var cols = null;
  var error = null;

  client.connect();

  client.on(client.EVENT_ERROR, function (err) {
    console.log('Error: ' + err.message);
    error = err;
    client.close();
  });

  client.on(client.EVENT_CONNECTED, function () {
    console.log('Connected.');
    console.log('Executing SQL: ' + sql);
    client.query(sql);
  });

  client.on(client.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle) {
    data = Result2Array.RowsArray(result);
    cols = Result2Array.ColumnNamesArray(result);
    console.log('Closing first query...');
    client.closeQuery(queryHandle, null);
  });

  client.on(client.EVENT_QUERY_CLOSED, function () {
    console.log('Query closed.');
    client.close();
  });

  client.on(client.EVENT_CONNECTION_CLOSED, function () {
    console.log('Connection closed.');
    if (error) {
      callback(error, -1);
    } else {
      callback(data, cols);
    }
  });
};


