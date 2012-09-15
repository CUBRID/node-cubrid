<b>node-cubrid</b><br/>
June-September, 2012<br/>
http://www.cubrid.org<br/>


Introduction
=======================================================================================================
The <b>CUBRID</b> node.js driver is an open-source project with the goal of implementing a 100% native node.js driver for the <b>CUBRID</b> database engine (www.cubrid.org).

The driver is currently under development and this (September 2012) is the 2nd release (Milestone 2) of the driver code, 
which features:
- 3.000+ LOC
- Connect/Close connection, Query/Close query, Fetch, Batch Execute, Set auto-commit, Commit, Rollback etc. completed
- More data types support implemented since Milestone 1
- Complete events model implemented
- 30+ functional test cases
- 30+ unit tests
- 3 E2E demos
- 4 Web site full demos
- ...and many more additions and improvements

The main project deliverables we will target for the <b>cubrid-node</b> project are:
-	The driver source code
-	Test cases
-	Code documentation
-	Demos 
-   Tutorials
-	A npm package (http://search.npmjs.org/)


Installation
=======================================================================================================
This release does not yet feature a npm installer - it will be available in the upcoming beta release.
For now, please download the driver code on your machine.


Usage
=======================================================================================================
The code release contains many test cases and demos which will show you how to use the driver.
The examples are located in the following (sub)folders:
- <b><i>\demo</i></b>
- <b><i>\src\test</i></b>

Here is a typical usage scenario, using events:

    var CUBRIDClient = require('./test_Setup').testClient,
      Helpers = require('../src/utils/Helpers'),
      Result2Array = require('../src/resultset/Result2Array');

    global.savedQueryHandle = null;

    CUBRIDClient.connect(function () {
    });

    CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
      Helpers.logError('Error!: ' + err.message);
      throw 'We should not get here!';
    });

    CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTED, function () {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Querying: select * from game');
      CUBRIDClient.query('select * from game', function () {
      });
    });

    CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle) {
      Helpers.logInfo('Data received.');
      Helpers.logInfo('Returned active query handle: ' + queryHandle);
      global.savedQueryHandle = queryHandle; // save handle - needed for further fetch operations
      Helpers.logInfo('Total query result rows count: ' + Result2Array.TotalRowsCount(result));
      Helpers.logInfo('First "batch" of data returned rows count: ' + Result2Array.RowsArray(result).length);
      Helpers.logInfo('Fetching more rows...');
      CUBRIDClient.fetch(global.savedQueryHandle, function () {
      });
    });

    CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_DATA_AVAILABLE, function (result) {
      Helpers.logInfo('*** Fetch data received.');
      Helpers.logInfo('*** Current fetch of data returned rows count: ' + Result2Array.RowsArray(result).length);
      Helpers.logInfo('*** First row: ' + Result2Array.RowsArray(result)[0].toString());
      // continue to fetch...
      Helpers.logInfo('...');
      Helpers.logInfo('...fetching more rows...');
      Helpers.logInfo('...');
      CUBRIDClient.fetch(global.savedQueryHandle, function () {
      });
    });

    CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function () {
      Helpers.logInfo('No more data to receive.');
      Helpers.logInfo('Closing query...');
      CUBRIDClient.closeQuery(global.savedQueryHandle, function () {
      });
    });

    CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_CLOSED, function () {
      Helpers.logInfo('Query closed.');
      global.savedQueryHandle = null;
      Helpers.logInfo('Closing connection...');
      CUBRIDClient.close(function () {
      });
    });

    CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
      Helpers.logInfo('Connection closed.');
    });


Or, if you prefere the callbacks-style:

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


TODOs
=======================================================================================================
In the next code release (Beta - End September 2012), we are targeting:
- Schema support
- Documentation release & publishing
- More functionality & more testing
- Additional demos
- Code improvements, optimizations and refactoring
- A npm installer


Authors and Contributors
=======================================================================================================
The main authors of this driver are the members of the CUBRID API team - http://www.cubrid.org/wiki_apis.

We welcome any contributors and we hope you will enjoy coding with CUBRID! :)


Special thanks
=======================================================================================================
We would like to thanks to the following people & projects for inspiration, 
for the code we have reused and for doing such a great job for the open-source community!
-	https://github.com/caolan/async
-	https://github.com/felixge/node-mysql
-	https://github.com/jeromeetienne/microcache.js


Scheduled releases
=======================================================================================================
Here are the scheduled releases for this project:
-	Milestone 1: Basic driver interfaces: connect, queries support
-	Milestone 2: Technology preview release: ~80% functionality ready
-	Milestone 3: Beta release
-	Milestone 4: Stable release
-	Milestone 5: Tutorials & Installer/Package completed; web awareness achieved.

...Stay tuned! :)

 Thank you!
 

