<b>node-cubrid</b><br/>
June-December, 2012<br/>
http://www.cubrid.org<br/>


Introduction
=======================================================================================================
The <b>CUBRID</b> node.js driver is an open-source project with the goal of implementing a 100% native node.js driver
for the <b>CUBRID</b> database engine (www.cubrid.org).

The driver is under constant development and the current release is the <b>1.1</b>, which features:
- Full compatibility with 8.4.1, 8.4.3 and 9.0.0 (beta) CUBRID engine releases
- Rich database support: Connect, Query, Fetch, Execute, Commit, Rollback, DB Schema etc.
- Out of the box driver events model
- <b>10.000</b>+ LOC, including the driver test code and demos
- 50+ test cases
- HTML documentation
- User demos: E2E scenarios, web sites
- User tutorials
...and many more!


Releases
=======================================================================================================
<b>1.1.1</b>
 - Released in January, 2013
 - Added ActionQueue direct export from the node-cubrid module
 - Added createDefaultCUBRIDDemodbConnection function wrapper
 - Added a function that returns an array of objects where column names from the query result are keys
 - Fixed incorrect Datetime type parsing
 - Fixed the delimiters and number datatype handling in the _sqlFormat function
 - Updated test cases suite to provide fixes coverage
 
<b>1.1</b>
 - Released in December, 2012
 - Added compatibility with CUBRID 8.4.3 stable release
 - Added compatibility with CUBRID 9.0.0 beta release
 - Code quality improvements (based on SHint/JSLint code analysis)
 - Issues fixing
 - New test cases
 - New tutorial

<b>1.0</b>
 - Released in October, 2012
 - Compatible with CUBRID 8.4.1 stable release


Installation
=======================================================================================================
The driver features a <b>npm</b> package installer.

To install the driver, execute:
 <b>>npm install node-cubrid</b>
or
 <b>>npm install -g node-cubrid</b>

If you ever need to uninstall the driver, execute:
 <b>>npm uninstall node-cubrid</b>


Usage
=======================================================================================================
The driver code release contains many test cases and demos which will show you how to use the driver.
The examples are located in the following project folders:
- <b><i>\demo</i></b>
- <b><i>\src\test</i></b>

Here is a stadard coding example, using the driver events model:

    CUBRIDClient.connect();

    CUBRIDClient.on(CUBRIDClient.EVENT_ERROR, function (err) {
      Helpers.logError('Error!: ' + err.message);
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
      Helpers.logInfo('Total query result rows count: ' + Result2Array.TotalRowsCount(result));
      Helpers.logInfo('First "batch" of data returned rows count: ' + Result2Array.RowsArray(result).length);
      Helpers.logInfo('Fetching more rows...');
      CUBRIDClient.fetch(queryHandle, function () {
      });
    });

    CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_DATA_AVAILABLE, function (result, queryHandle) {
      Helpers.logInfo('*** Fetch data received for query: ' + queryHandle);
      Helpers.logInfo('*** Current fetch of data returned rows count: ' + Result2Array.RowsArray(result).length);
      Helpers.logInfo('*** First row: ' + Result2Array.RowsArray(result)[0].toString());
      // continue to fetch...
      Helpers.logInfo('...');
      Helpers.logInfo('...fetching more rows...');
      Helpers.logInfo('...');
      CUBRIDClient.fetch(queryHandle, function () {
      });
    });

    CUBRIDClient.on(CUBRIDClient.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function (queryHandle) {
      Helpers.logInfo('No more data to fetch.');
      Helpers.logInfo('Closing query: ' + queryHandle);
      CUBRIDClient.closeQuery(queryHandle, function () {
      });
    });

    CUBRIDClient.on(CUBRIDClient.EVENT_QUERY_CLOSED, function (queryHandle) {
      Helpers.logInfo('Query closed: ' + queryHandle);
      Helpers.logInfo('Closing connection...');

      CUBRIDClient.close(function () {
      });
    });

    CUBRIDClient.on(CUBRIDClient.EVENT_CONNECTION_CLOSED, function () {
      Helpers.logInfo('Connection closed.');
    });


Here is another driver usage example, using the well-known <b>async</b> library (https://github.com/caolan/async):

    ActionQueue.enqueue(
      [
        function (cb) {
          CUBRIDClient.connect(cb);
        },

        function (cb) {
          CUBRIDClient.getEngineVersion(cb);
        },

        function (engineVersion, cb) {
          Helpers.logInfo('Engine version is: ' + engineVersion);
          CUBRIDClient.query('select * from code', cb);
        },

        function (result, queryHandle, cb) {
          Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
          Helpers.logInfo('Query results:');
          var arr = Result2Array.RowsArray(result);
          for (var k = 0; k < arr.length; k++) {
            Helpers.logInfo(arr[k].toString());
          }
          CUBRIDClient.closeQuery(queryHandle, cb);
          Helpers.logInfo('Query closed.');
        },

        function (cb) {
          CUBRIDClient.close(cb);
          Helpers.logInfo('Connection closed.');
        }
      ],

      function (err) {
        if (err == null) {
          Helpers.logInfo('Program closed.');
        } else {
          throw err.message;
        }
      }
    );


Or, if you prefer the standard callbacks "style":

    CUBRIDClient.connect(function (err) {
      if (err) {
        errorHandler(err);
      } else {
        Helpers.logInfo('Connected.');
        Helpers.logInfo('Querying: select * from nation');
        CUBRIDClient.query('select * from nation', function (err, result, queryHandle) {
          if (err) {
            errorHandler(err);
          } else {
            assert(Result2Array.TotalRowsCount(result) === 215);
            Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
            var arr = Result2Array.RowsArray(result);
            for (var j = 0; j < 1; j++) {
              Helpers.logInfo(arr[j].toString());
            }
            CUBRIDClient.closeQuery(queryHandle, function (err) {
              if (err) {
                errorHandler(err);
              } else {
                Helpers.logInfo('Query closed.');
                CUBRIDClient.close(function (err) {
                  if (err) {
                    errorHandler(err);
                  } else {
                    Helpers.logInfo('Connection closed.');
                    Helpers.logInfo('Test passed.');
                  }
                })
              }
            })
          }
        })
      }
    });


<b>Once again, remember that there are dozens of ready-to-use coding examples featured in the project,
that can give you a very fast startup.</b>


What's next
=======================================================================================================
In the next driver release (2.0), we will be targeting:
- Compatibility with the 9.0.0 CUBRID engine stable release
- Additional database functionality (enhanced LOB support, more db schemas etc.)
- New functionalities: integrated connection pool, queries queue, better caching etc.
- Code improvements, optimizations
- More examples

...And you are more than welcomed to suggest what we should improve or add - please let us know! :)


Authors and Contributors
=======================================================================================================
The authors of this driver are members of the CUBRID API team - http://www.cubrid.org/wiki_apis.
We welcome any new contributors and we hope you will enjoy using and coding with CUBRID! :)


Special thanks
=======================================================================================================
We would like to say thanks to the following people & projects for inspiration,
for the code we have (re)used and for doing such a great job for the open-source community!
-	https://github.com/caolan/async
-	https://github.com/felixge/node-mysql
-	https://github.com/jeromeetienne/microcache.js

...Stay tuned for the next great driver releases! :)

Thank you!

