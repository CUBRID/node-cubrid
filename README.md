# node-cubrid

[![Build Status](https://travis-ci.org/CUBRID/node-cubrid.png)](https://travis-ci.org/CUBRID/node-cubrid)
[![Coverage Status](https://coveralls.io/repos/CUBRID/node-cubrid/badge.png)](https://coveralls.io/r/CUBRID/node-cubrid)

## Introduction

This is a Node.js driver for [CUBRID](http://www.cubrid.org) open-source relational database. **node-cubrid** is implemented in 100% JavaScript with no external dependency. Besides the database specific APIs, the module also supplies several *helper* APIs which are useful to sanitize and validate user input values, format and parameterize SQL statements.

## Key features

- Full (backward) compatibility with CUBRID 8.4.1, 8.4.3, 9.0 and 9.1 releases.
- Rich database support: Connect, Query, Fetch, Execute, Commit etc.
- Support or queries queueing
- Support for database schema
- Support for database parameters and transactions
- Support for LOB objects
- Out of the box driver events model
- Extensive tests suite
- User demos: E2E scenarios, web sites
- ...and many more!

## Installation

Installing and using **node-cubrid** is easy. To install, one has to initiate `npm install` command with `node-cubrid` module name as an argument in the directory where a Node.js application is located.

	npm install node-cubrid

This will install the latest version available at [https://npmjs.org/](https://npmjs.org/). Once installed, the module can be accessed by requiring the `node-cubrid` module:

	var CUBRID = require('node-cubrid');

The node-cubrid module exports the following properties and functions:

* `ActionQueue`: an object which provides the [`waterfall()`](https://github.com/caolan/async#waterfall) functionality of [async](https://github.com/caolan/async) module. 
* `Helpers`: an object which provides a set of helper functions.
* `Result2Array`: an object which provides functions to convert DB result sets into JS arrays.
* `createCUBRIDConnection()`: a function which returns a connection object to work with a user defined CUBRID host and database.
* `createDefaultCUBRIDDemodbConnection()`: a function which returns a connection object to work with a local [demodb](http://blog.cubrid.org/wiki_tutorials/entry/getting-started-with-demodb-cubrid-demo-database) database.

## Request flow in node-cubrid

The request flow in node-cubrid module looks as illustrated below.

![Figure 1: Request flow in node-cubrid](http://blog.cubrid.org/files/attach/images/194379/839/471/cubrid_nodejs_events_chain.png)

Because **node-cubrid** is developed to take the full advantage of JavaScript and Node.js programming, when executing a SQL statement in **node-cubrid**, developers need to listen for an `EVENT_QUERY_DATA_AVAILABLE` and `EVENT_ERROR` events, or provide a callback function which will be called once there is a response from the server.

When the request is sent to the server, CUBRID executes it, and returns the response, which can be either a query result set, or the error code. It is by design that CUBRID does not return any identification about the request sender. In other words, in order to associate the response with a request, the driver has to have only one active request which can be the only owner of this response.

For this reason, if a developer wants to execute several queries, they must execute them one after another, i.e. sequentially, NOT in parallel. This is how the communication between the driver and the server is implemented in CUBRID and most other database systems including MySQL.

If there is a vital need to run queries in parallel, developers can use connection pooling modules. An example with this technique is provided below.

## API Documentation

### Establishing a connection

First, user establishes a connection with a CUBRID server by providing a host name (default: `localhost`), the broker port (default: `33000`), database username (default: `public`), password (default: empty string), and finally the database name (default: `demodb`).

#### Callback style

	var CUBRID = require('node-cubrid'),
			dbConf = {
				host: 'localhost',
				port: 33000,
				user: 'public'
				password: '',
				database: 'demodb'
			},
			client = CUBRID.createCUBRIDConnection(dbConf.host, dbConf.port, dbConf.user, dbConf.password, dbConf.database);
	
	client.connect(function (err) {
		if (err) {
			throw err;
		} else {
			console.log('connection is established');
			
			client.close(function (err) {
				if (err) {
					throw err;
				} else {			
					console.log('connection is closed');
				}
			});
		}
	});

The above code illustrates a *callback* style when a function is passed as an argument to a `connect()` API which is called after the module receives a response from CUBRID.

#### Event-based style

Alternatively, developers can write applications based on an event-based coding style. For example, the above code can be rewritten as:

	client.connect();
	
	client.on(conn.EVENT_ERROR, function (err) {
		throw err;
	});

	client.on(conn.EVENT_CONNECTED, function () {
			console.log('connection is established');
			
			client.close();
	});

	client.on(conn.EVENT_CONNECTION_CLOSED, function () {
			console.log('connection is closed');
	});

If you prefer the event-based coding style, refer to the [Driver Event model](http://blog.cubrid.org/wiki_apis/entry/cubrid-node-js-api-overview) wiki page to learn more about other events **node-cubrid** emits for certain API calls.

#### Connection errors

There can be several reasons for a connection to fail:

1. **Connection timeout** when the host does not respond within the specified time. In this case, you will receive the following error message:  

		{ [Error: connect ETIMEDOUT] code: 'ETIMEDOUT', errno: 'ETIMEDOUT', syscall: 'connect' }

2. **Incorrect hostname**:

		{ [Error: getaddrinfo ENOTFOUND] code: 'ENOTFOUND', errno: 'ENOTFOUND', syscall: 'getaddrinfo' }

3. **Incorrect port**:
	* When you try to connect to a port listened by an active service other than CUBRID or if a firewall refuses the connection, you will see the following error message:
	
			{ [Error: connect ECONNREFUSED] code: 'ECONNREFUSED', errno: 'ECONNREFUSED', syscall: 'connect' }
	
	* If the port is not listened by any service, then you will see the **Connection timeout** error as in the first case.
	* The last type of error message you woud receive if an incorrect port is provided is:

			


These error messages are thrown directly by the underlying network socket of Node.js.

### Connection configuration

#### Connection timeout

One of the requests we got for the 2.0 driver release was to implement a connection timeout feature. Simply said - wait for the connection to the database to complete within the specified number of seconds and eventually throw an error if the timeout occurs.

Obviously, the key thing here was to set the connection timeout at the Node.js socket connection layer level (and not on the consumer level):

	self._socket = Net.createConnection(self.initialBrokerPort, self.brokerServer);
	self._socket.setNoDelay(true);
	self._socket.setTimeout(this._CONNECTION_TIMEOUT);

In **node-cubrid** you can get and set the connection timeout value in milliseconds:

* `client.getConnectionTimeout()`
* `client.setConnectionTimeout(2000)`

In **node-cubrid** by default the connection timeout value is set to `0`, i.e. **node-cubrid** will wait long enough until the underlying network socket times out itself. So, if you want or expect the connection to timeout within the specified time, then manually set the timeout value as shown below.

	var client = new CUBRIDConnection(dbConf.host, dbConf.port, dbConf.user, dbConf.password, dbConf.database);
 
 	// 2 seconds timeout.
	client.setConnectionTimeout(2000);
	
	client.connect(function (err) {
		if (err) {
  			console.log(err);
		}
		
		client.close();
	});

As you see, the timeout is specified in milliseconds `2,000`, which is 2 seconds. After the 2 seconds, the script will timeout:

	{ [Error: connect ETIMEDOUT] code: 'ETIMEDOUT', errno: 'ETIMEDOUT', syscall: 'connect' }

#### CUBRID Server Parameters

After connecting to a database, a user can specify some *global* session parameters that will control the behavior of SQL statements transactions’ isolation level execution, the auto-commit behavior and others.

The complete list of these CUBRID database parameters is defined in the [`Constants.js` ](https://github.com/CUBRID/node-cubrid/blob/master/src/constants/CASConstants.js#L367) file:

	/**
	 * Define CUBRID Database parameters constants
	 */
	exports.CCIDbParam = {
		CCI_PARAM_ISOLATION_LEVEL   : 1,
		CCI_PARAM_LOCK_TIMEOUT      : 2,
		CCI_PARAM_MAX_STRING_LENGTH : 3,
		CCI_PARAM_AUTO_COMMIT       : 4
	};

For each parameter, the CUBRID communication protocol implements a dedicated support for GET and SET operations. Therefore, in order to manipulate them, also a dedicate functionality was needed in the Node.js driver and this is what we did in the 2.0 release.

Please note one exception - the `CCI_PARAM_MAX_STRING_LENGTH` parameter **cannot** be set programmatically from code as it is a CUBRID Broker parameter and the client can only query its current value.

To get and set database parameter the following two APIs are available:

* `getDatabaseParameter()` to get a parameter value.
* `setDatabaseParameter()` to set a parameter value.

Let’s see some examples. First, let set the value of the `ISOLATION_LEVEL` parameter:

	var CAS = require('./node_modules/node-cubrid/src/constants/CASConstants');
	
	client.connect(function (err) {
		// handle error, then...
		client.setDatabaseParameter(CAS.CCIDbParam.CCI_PARAM_ISOLATION_LEVEL, CAS.CUBRIDIsolationLevel.TRAN_REP_CLASS_COMMIT_INSTANCE, function (err) {
			// handle error
        	CUBRIDClient.close(function (err) {
				// …
			});
		});
	});
And let’s see how we can retrieve the value of the `LOCK_TIMEOUT` parameter for the current session:

	client.connect(function (err) {
		client.getDatabaseParameter(CAS.CCIDbParam.CCI_PARAM_LOCK_TIMEOUT, function (err, value) {
			// handle error, then...
	    	console.log('LOCK_TIMEOUT is: %s', value);
	    	
    		CUBRIDClient.close(function (err) {
    			// ...
    		});
	  	});
	});

The output result is:

	LOCK_TIMEOUT is: -1

**Note**: The same value can be obtained also from CUBRID Manager Client:

![Figure 2: CUBRID Manager](http://blog.cubrid.org:8080/files/attach/images/194379/729/617/manager.png)

If you need to change the default values for these parameters, it is highly recommended to do it immediately after `connect ()`. One consequence is that you must use an explicit `connect ()` statement in your application, and not the **implicit connect** driver feature (the **implicit connect** feature means that the driver can auto-connect when a query is first executed without the need to issues an explicit `connect()` command).

## Usage

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

This is an example of the 2.0 release newly introduced queries queue processor usage:

    var SQL_1 = 'SELECT COUNT(*) FROM [code]';
    var SQL_2 = 'SELECT * FROM [code] WHERE s_name = \'X\'';
    var SQL_3 = 'SELECT COUNT(*) FROM [code] WHERE f_name LIKE \'M%\'';

    Helpers.logInfo('Executing [1]: ' + SQL_1);
    CUBRIDClient.addQuery(SQL_1, function (err, result) {
      Helpers.logInfo('Result [1]: ' + Result2Array.RowsArray(result));
    });

    Helpers.logInfo('Executing [2]: ' + SQL_2);
    CUBRIDClient.addQuery(SQL_2, function (err, result) {
      Helpers.logInfo('Result [2]: ' + Result2Array.RowsArray(result));
    });

    Helpers.logInfo('Executing [3]: ' + SQL_3);
    CUBRIDClient.addQuery(SQL_3, function (err, result) {
      Helpers.logInfo('Result [3]: ' + Result2Array.RowsArray(result));
      CUBRIDClient.close();
    });

<b>Once again, remember that there are dozens of ready-to-use coding examples featured in the project, that can give you a very fast startup.</b>

For how-to examples and tutorials, the plae to visit is: [http://www.cubrid.org/wiki_apis/entry/cubrid-node-js-tutorials](http://www.cubrid.org/wiki_apis/entry/cubrid-node-js-tutorials).

## Running tests

To run tests on **node-cubrid** module:

1. `npm install` all testing framework development dependencies.
2. Make sure:
	1. CUBRID Server is installed on `localhost`.
	2. CUBRID Broker is listening on port `33000`.
	3. `demodb` database is running.
3. Alternatively, edit test suite connection configurations at `test/nodeunit/testSetup/test_Setup.js` and change the connection information.
4. `npm test` to start testing.

There are over 268K assertion tests which should all pass.

## What's next

We intend to continuosly improve this driver, by adding more features and improving the existing code base.

And you are more than welcomed to suggest what we should improve or add - please let us know! :)


## Authors and Contributors

The authors of this driver are members of the CUBRID API team - [http://www.cubrid.org/wiki_apis](http://www.cubrid.org/wiki_apis).

We welcome any new contributors and we hope you will enjoy using and coding with CUBRID! :)

### Special thanks

We would like to say thanks to the following people & projects for inspiration,
for the code we have (re)used and for doing such a great job for the open-source community!

-	[https://github.com/caolan/async](https://github.com/caolan/async)
-	[https://github.com/felixge/node-mysql](https://github.com/felixge/node-mysql)
-	[https://github.com/jeromeetienne/microcache.js](https://github.com/jeromeetienne/microcache.js)

...Stay tuned for the next great driver releases! :)
