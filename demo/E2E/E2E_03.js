var client = require('../../index.js').createDefaultCUBRIDDemodbConnection(),
  ActionQueue = require('../../src/utils/ActionQueue'),
  Result2Array = require('../../src/resultset/Result2Array'),
  assert = require('assert');

var sql = 'select * from game where rownum < 500';
var returnedQueryHandle;
var fetchResult;

ActionQueue.enqueue(
  [
    function (cb) {
      client.connect(cb);
      console.log('Connected successfully to ' + client.brokerServer + ':' + client.connectionBrokerPort + '.');
    },

    function (cb) {
      console.log('Executing query: [' + sql + ']...');
      client.query(sql, cb);
    },

    function (queryResults, queryHandle, cb) {
      console.log('Query results - Rows count: ' + Result2Array.TotalRowsCount(queryResults));
      console.log('Query results - Column names: ' + Result2Array.ColumnNamesArray(queryResults));
      console.log('Query results - Column data types: ' + Result2Array.ColumnTypesArray(queryResults));
      console.log('Query results - Data [displaying only the first 5 rows]:');
      var arr = Result2Array.RowsArray(queryResults);
      for (var j = 0; j < 5; j++) {
        console.log(arr[j].toString());
      }
      returnedQueryHandle = queryHandle;
      console.log('Fetching more results...');

      ActionQueue.while(
        function () {
          return fetchResult !== null;
        },

        function (callback) {
          client.fetch(returnedQueryHandle, function (err, result) {
            if (result !== null) {
              console.log('Fetch more results - Data [displaying only the first 5 rows]:');
              var arr = Result2Array.RowsArray(result);
              for (var k = 0; k < 5; k++) {
                console.log(arr[k].toString());
              }
            }
            fetchResult = result;
            callback.call(err);
          })
        },

        function (err) {
          if (err) {
            throw err.message;
          } else {
            cb.call(err);
          }
        }
      )
    },

    function (cb) {
      client.closeQuery(returnedQueryHandle, cb);
    },

    function (cb) {
      client.close(cb);
    }
  ],

  function (err) {
    if (err == null) {
      setTimeout(function () {
        console.log('Test passed.');
      }, 1000);
    } else {
      throw err.message;
    }
  }
);
