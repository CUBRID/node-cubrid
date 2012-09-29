<b>node-cubrid</b><br/>
June-October, 2012<br/>
http://www.cubrid.org<br/>


Introduction
=======================================================================================================
The <b>CUBRID</b> node.js driver is an open-source project with the goal of implementing a 100% native node.js driver
for the <b>CUBRID</b> database engine (www.cubrid.org).

The driver is under constant development and teh current release is the <b>Beta 1.0</b>, which features:
- Connect, Query, Fetch, Execute, Commit, Rollback, DB Schema etc.
- Events model
- <b>9.000</b>+ LOC, including the test code
- 50+ test cases
- nodeunit support
- Documentation
- E2E scenarios
- 5 Web sites demos
- ...and many more!


Installation
=======================================================================================================
The beta release does not feature a npm package installer; it will be available soon, in the upcoming stable release.
For the moment, please download the driver code directly.


Usage
=======================================================================================================
The code release contains many (unit and functional) test cases and demos which will show you how to use the driver.
The examples are located in the following project folders:
- <b><i>\demo</i></b>
- <b><i>\src\test</i></b>

Here is a stadard coding example, using driver events model:

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


Here is another coding example, based on the <b>async</b> library (https://github.com/caolan/async):

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


<b>Once again, there are dozens of ready-to-use code examples and functional tests in the project,
that can give you a very fast startup.</b>


TODOs
=======================================================================================================
In the next code release (Stable 1.0, October 2012), we are targeting:
- Create a npm installer
- Additional functionality
- Code improvements, optimizations and refactoring
- More testing
- A tutorial


Authors and Contributors
=======================================================================================================
The authors of this driver are members of the CUBRID API team - http://www.cubrid.org/wiki_apis.
We welcome new contributors and we hope you will enjoy using and coding with CUBRID! :)


Special thanks
=======================================================================================================
We would like to say thanks to the following people & projects for inspiration,
for the code we have (re)used and for doing such a great job for the open-source community!
-	https://github.com/caolan/async
-	https://github.com/felixge/node-mysql
-	https://github.com/jeromeetienne/microcache.js


Project timeline
=======================================================================================================
Here are the scheduled releases for the project:
-	Milestone 1: Basic driver interfaces: connect, queries support (<b>COmpleted</b>)
-	Milestone 2: Technology preview release: ~80% functionality ready (<b>COmpleted</b>)
-	Milestone 3: Beta release (<b>Completed</b>)
-	Milestone 4: Stable release (scheduled for October 2012)
-	Milestone 5: Project additions: Tutorials, Documentation, Improvements etc.

...Stay tuned! :)

 Thank you!
 

