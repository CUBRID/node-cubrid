var client = require('../index.js').createDefaultCUBRIDDemodbConnection(),
  Result2Array = require('../src/resultset/Result2Array');

var sql = 'select * from game';

client.connect(function (err) {
  if (err) {
    throw err.message;
  } else {
    console.log('Connected successfully to ' + client.brokerServer + ':' + client.connectionBrokerPort + '.');
    client.getEngineVersion(function (err, result) {
      if (err) {
        throw err.message;
      } else {
        console.log('CUBRID Engine version is: ' + result);
        console.log('Querying: [' + sql + ']');
        client.query(sql, function (err, queryResults, queryHandle) {
          if (err) {
            throw err.message;
          } else {
            console.log('Query results - Rows count: ' + Result2Array.GetResultsCount(queryResults));
            console.log('Query results - Column names: ' + Result2Array.GetResultsColumnNamesArray(queryResults));
            console.log('Query results - Column data types: ' + Result2Array.GetResultsColumnsTypeArray(queryResults));
            console.log('Query results - Data [displaying only the first 10 rows]:');
            var arr = Result2Array.GetResultsArray(queryResults);
            for (var j = 0; j < 10; j++) {
              console.log(arr[j].toString());
            }
            console.log('Fetching more results:');
            client.fetch(queryHandle, function (err, result) {
              if (err) {
                throw err.message;
              } else {
                if (result) {
                  console.log('Fetch results - Data [displaying only the first 10 rows]:');
                  var arr = Result2Array.GetResultsArray(result);
                  for (var k = 0; k < 10; k++) {
                    console.log(arr[k].toString());
                  }
                } else {
                  console.log('There is no more data to fetch.');
                }
                client.closeRequest(queryHandle, function (err) {
                  if (err) {
                    throw err.message;
                  } else {
                    console.log('Query closed.');
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


