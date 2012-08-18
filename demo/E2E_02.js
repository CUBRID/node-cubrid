var client = require('../index.js').createDefaultCUBRIDDemodbConnection(),
  Result2Array = require('../src/resultset/Result2Array');

var sqlsSetup = ['drop table if exists node_test',
  'create table node_test(id int)',
  'insert into node_test values(1), (22)'];
var sqlQuery = 'select * from node_test';
var sqlsCleanup = 'drop table node_test';

client.connect(function (err) {
  if (err) {
    throw err.message;
  } else {
    console.log('Connected to ' + client.brokerServer + ':' + client.connectionBrokerPort + '.');
    console.log('Creating test data...');
    client.batchExecuteNoQuery(sqlsSetup, function (err) {
      if (err) {
        throw err.message;
      } else {
        console.log('Querying: [' + sqlQuery + ']');
        client.query(sqlQuery, function (err, queryResults, queryHandle) {
          if (err) {
            throw err.message;
          } else {
            console.log('Query results - Rows count: ' + Result2Array.GetResultsCount(queryResults));
            console.log('Query results - Column names: ' + Result2Array.GetResultsColumnNamesArray(queryResults));
            console.log('Query results - Column data types: ' + Result2Array.GetResultsColumnsTypeArray(queryResults));
            console.log('Query results:');
            var arr = Result2Array.GetResultsArray(queryResults);
            for (var j = 0; j < arr.length; j++) {
              console.log(arr[j].toString());
            }
            client.closeRequest(queryHandle, function (err) {
              if (err) {
                throw err.message;
              } else {
                client.batchExecuteNoQuery(sqlsCleanup, function (err) {
                  if (err) {
                    throw err.message;
                  } else {
                    console.log('Cleanup done.');
                    client.close(function (err) {
                      if (err) {
                        throw err.message;
                      } else {
                        console.log('Connection closed.');
                      }
                    })
                  }
                })
              }
            })
          }
        })
      }
    })
  }
});

