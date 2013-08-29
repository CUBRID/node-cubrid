# node-cubrid

[![Build Status](https://travis-ci.org/CUBRID/node-cubrid.png)](https://travis-ci.org/CUBRID/node-cubrid)
[![Coverage Status](https://coveralls.io/repos/CUBRID/node-cubrid/badge.png)](https://coveralls.io/r/CUBRID/node-cubrid)

## Introduction

This is a Node.js driver for [CUBRID](http://www.cubrid.org) open-source relational database. **node-cubrid** is implemented in 100% JavaScript with no external dependency. Besides the database specific APIs, the module supplies several *helper* APIs which are useful to sanitize and validate user input values, format and parameterize SQL statements, etc.

## Key features

- Full compatibility with CUBRID 8.4.1+ releases.
- Rich database support: Connect, Query, Fetch, Execute, Execute in batch, Commit, Rollback, etc.
- Support for queries queueing.
- Support for database schema.
- Support for database parameters and transactions.
- Support for LOB objects.
- Fully implements the event emitter.
- Extensive tests suite (260K+ assertions).
- User demos: E2E scenarios, web sites.
- ...and many more!

## CHANGELOG

You can find the change logs in [CHANGELOG.md](https://github.com/CUBRID/node-cubrid/blob/master/CHANGELOG.md) file.

## Installation

Installing and using **node-cubrid** is easy. To install, one has to initiate `npm install` command with `node-cubrid` module name as an argument in the directory where a Node.js application is located.

	npm install node-cubrid

This will install the latest version available at [https://npmjs.org/](https://npmjs.org/). Once installed, the module can be accessed by requiring the `node-cubrid` module:

	var CUBRID = require('node-cubrid');

The node-cubrid module exports the following properties and functions:

* `ActionQueue`: an object which provides the [`waterfall()`](https://github.com/caolan/async#waterfall) functionality of [async](https://github.com/caolan/async) module. 
* `Helpers`: an object which provides a set of helper functions.
* `Result2Array`: an object which provides functions to convert DB result sets into JS arrays.
* `createCUBRIDConnection()` or `createConnection()`: a function which returns a connection object to work with a user defined CUBRID host and database.
* `createDefaultCUBRIDDemodbConnection()`: a function which returns a connection object to work with a local [demodb](http://blog.cubrid.org/wiki_tutorials/entry/getting-started-with-demodb-cubrid-demo-database) database.

## Request flow in node-cubrid

The request flow in node-cubrid module looks as illustrated below.

![Figure 1: Request flow in node-cubrid](http://blog.cubrid.org/files/attach/images/194379/839/471/cubrid_nodejs_events_chain.png)

Because **node-cubrid** is developed to take the full advantage of JavaScript and Node.js programming, when executing a SQL statement in **node-cubrid**, developers need to listen for an `EVENT_QUERY_DATA_AVAILABLE` and `EVENT_ERROR` events, or provide a callback function which will be called once there is a response from the server.

When the request is sent to the server, CUBRID executes it, and returns the response, which can be either a query result set, or the error code. It is by design that CUBRID does not return any identification about the request sender. In other words, in order to associate the response with a request, the driver has to have only one active request which can be the only owner of this response.

For this reason, if a developer wants to execute several queries, they must execute them one after another, i.e. sequentially, NOT in parallel. This is how the communication between the driver and the server is implemented in CUBRID and most other database systems including MySQL.

If there is a vital need to run queries in parallel, developers can use connection pooling modules. An example with this technique is provided below.

## API Documentation

### Creating a CUBRID client

	// `createCUBRIDConnection()` function accepts either an object or a list of
	// connection parameters. The following list of parameters are supported at
	// this moment:
	// 1. `host`: an IP or a domain name of the CUBRID host (without http:// part).
	// 	   Defaults to `localhost`.
	// 2. `port`: a port CUBRID is listening at. Defaults to `33000`.
	// 3. `user`: the database username. Defaults to `public`.
	// 4. `password`: the database user password. Defaults to an empty string.
	// 5. `database`: the name of a database to connect to. Default to `demodb`.
	// 6. `cacheTimeout`: the timeout value in milliseconds for the query results
	//	  cache. All query results will be cached if `cacheTimeout > 0`. The
	//	  cached results will be returned if the same SQL query is executed within
	// 	  the timeout period. Defaults to `0`.
	// 7. `connectionTimeout`: the timeout value in milliseconds for the connection.
	//	  If `connectionTimeout = 0`, it will wait until the network socket times out
	//	  itself. Defaults to `0`.

	// All arguments are optional in which case default values will be set.
	var client = CUBRID.createCUBRIDConnection(host, port, user, password, database, cacheTimeout, connectionTimeout);

	// Alias function since version 2.1.0.
	var client = CUBRID.createConnection(host, port, user, password, database, cacheTimeout, connectionTimeout);
	
	// Alternatively, an object of parameters can be passed. Since version 2.1.0.
	var client = CUBRID.createConnection(paramsObject);

The following example shows how to create a client by providing an object of connection parameters.

	var client = CUBRID.createConnection({
		host: host,
		port: port,
		user: user,
		password: password:
		database: database,
		cacheTimeout: cacheTimeout,
		connectionTimeout: connectionTimeout
	});

### Establishing a connection

	// callback(err) function receives one arguments: the error message if any.
	client.connect(callback);

#### Callback style

The code below illustrates a *callback* style when a function is passed as an argument to a `connect()` API which is called after the module receives a response from CUBRID.

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

#### Event-based style

Alternatively, developers can write applications based on an event-based coding style. For example, the above code can be rewritten as:

	client.connect();
	
	client.on(client.EVENT_ERROR, function (err) {
		throw err;
	});

	client.on(client.EVENT_CONNECTED, function () {
			console.log('connection is established');
			
			client.close();
	});

	client.on(client.EVENT_CONNECTION_CLOSED, function () {
			console.log('connection is closed');
	});

If you prefer the event-based coding style, refer to the [Driver Event model](http://blog.cubrid.org/wiki_apis/entry/cubrid-node-js-api-overview) wiki page to learn more about other events **node-cubrid** emits for certain API calls.

#### Implicit connection

**node-cubrid** also provides implicit connection feature. When you execute a query on a client without explicitly establishing a connection with `client.connect()`, the driver will automatically establish a connection, then execute your query.

#### Connection errors

There can be several reasons for a connection to fail:

1. **Connection timeout**:
	1. when the host does not respond within the specified time larger than `0`, you will receive the following error message emitted by **node-cubrid**:

			{ [Error: connect ETIMEDOUT] }

	2. when no timeout value is set or its value is `0`, the following timeout error is emitted by the underlying network socket.

			{ [Error: connect ETIMEDOUT] code: 'ETIMEDOUT', errno: 'ETIMEDOUT', syscall: 'connect' }

2. **Incorrect hostname**:

		{ [Error: getaddrinfo ENOTFOUND] code: 'ENOTFOUND', errno: 'ENOTFOUND', syscall: 'getaddrinfo' }

3. **Incorrect port**:
	* When you try to connect to a port listened by an active service other than CUBRID or if a firewall refuses the connection, you will see the following error message:
	
			{ [Error: connect ECONNREFUSED] code: 'ECONNREFUSED', errno: 'ECONNREFUSED', syscall: 'connect' }
	
	* If the port is not listened by any service, then you will see the **Connection timeout** error as in the first case.
	* The last type of error message you woud receive if an incorrect port is provided is:

			{ [Error: read ECONNRESET] code: 'ECONNRESET', errno: 'ECONNRESET', syscall: 'read' }

### Connection configuration

#### Setting connection timeout

	// Both functions are available since version 2.0.0.
	var timeoutInMsec = client.getConnectionTimeout();
	// Set connection timeout in milliseconds.
	client.setConnectionTimeout(2000);
	
	// Alternatively, set the connection timeout value at client creation time.
	// Available since version 2.1.0.
	var client = CUBRID.createConnection(host, port, user, password, database, cacheTimeout, connectionTimeout);

One of the requests we have got for the 2.0 driver release was to implement a connection timeout feature. Simply said - wait for the connection to the database to complete within the specified number of seconds and eventually throw an error if the timeout occurs.

Obviously, the key thing here was to set the connection timeout at the Node.js socket connection layer level (and not on the consumer level):

	self._socket = Net.createConnection(self.initialBrokerPort, self.brokerServer);
	self._socket.setNoDelay(true);
	self._socket.setTimeout(this._CONNECTION_TIMEOUT);

In **node-cubrid** by default the connection timeout value is set to `0`, i.e. **node-cubrid** will wait long enough until the underlying network socket times out itself. In this case, according to our observations, the `timeout` event is emitted in about 75 seconds (**purely observational point**).

So, if you want or expect the connection to timeout within the specified time, then manually set the timeout value as shown below.

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

	{ [Error: connect ETIMEDOUT] }

#### Setting CUBRID Server Parameters

	// Both functions are available since version 2.0.0.
	client.getDatabaseParameter(paramType);
	client.setDatabaseParameter(paramType, paramValue);

After connecting to a database, a user can override some *global* session parameters that will control the behavior queries being executed. For example, isolation level of transactions, the auto-commit behavior, etc.

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

If you need to change the default values for these parameters, it is highly recommended to do it immediately after `connect ()`. One consequence is that you **must** use an explicit `connect ()` statement in your application, and not the **implicit connect** driver feature (the **implicit connect** feature means that the driver can auto-connect when a query is first executed without the need to issues an explicit `connect()` command).

### Executing SQL queries

#### READ queries

	// Callback style.
	client.query(sql, callback);
	client.query(sql, params, callback);

	// `sql` is a string representation of a READ query. Required.
	
	// `params` is an array of parameter values or the value itself
	//          which a user wants to bind instead of `?` placeholders
	//          in the `sql` query. If no placeholder is found, the `sql`
	//          will not be modified. This argument is optional. When
	//          omitted, `sql` will be sent to the server unmodified. This
	//          `params` argument is available since version 2.1.0.
	
	// `callback` is a function which will be invoked when the query
	//          finishes executing. Optional. The `callback` function
	//          can be omitted in which case only the
	//          `EVENT_QUERY_DATA_AVAILABLE` event will be
	//          emitted when the query finishes execution.
	
	// The `callback(err, result, queryHandle)` function accepts three arguments.
	// 1. `err`: an error object if any.
	// 2. `result`: a string value of the query result. No type casting as of version 2.1.0. Users need to parse the value into JSON manually.
	// 3. `queryHandle`: an integer ID for the query handle. Used to fetch more data.
		
	// Event style.
	client.query(sql);
	client.query(sql, params);
	
	// `callback(result, queryHandle, sql)` function accepts three arguments:
	// 1. `result`: a string value of the query result. No type casting as of version 2.1.0.
	// 2. `queryHandle`: an integer ID for the query handle. Used to fetch more data.
	// 3. `sql`: the SQL query which was executed that matches the `result`.
	// 	  `sql` argument is available since version 2.0.0.
	client.on(client.EVENT_QUERY_DATA_AVAILABLE, callback);
	
	// Queries queueing.
	client.query(sql);
	client.query(sql, params);
	
	// When multiple queries are executed one after another without
	// waiting for a callback or listening for an emmitted event, the queries
	// will be queued and executed sequentially. Thus, callbacks and
	// appropriate events will be executed/emitted in order.

##### Callback example

Here is an example which executes a simple `SELECT	` query.

	var CUBRID = require('node-cubrid'),
		// `Result2Array` is a sub-module which provides a set of helper
		// functions to convert the query result to array, object, etc.
		Result2Array = CUBRID.Result2Array;
	
	// Connection is established implicitly.
	client.query('SELECT * FROM nation', function (err, result, queryHandle) {
      if (err) {
        throw err;
      } else {
        var arr = Result2Array.RowsArray(result);
        
        for (var j = 0, len = arr.length; j < len; ++j) {
          console.log(arr[j]);
        }
        
        // Fetch more data using queryHandle if necessary.
      }
    });

The following example shows how to set placeholders and bind values in `SELECT` queries.

	client.query('SELECT * FROM nation WHERE continent = ?', ['Asia'], function (err, result, queryHandle) {
      if (err) {
        throw err;
      } else {
        var arr = Result2Array.RowsArray(result);
        
        for (var j = 0, len = arr.length; j < len; ++j) {
          console.log(arr[j]);
        }
        
        // Fetch more data using queryHandle if necessary.
      }
    });

Alternatively, the `params` value can be literal value.

	client.query('SELECT * FROM nation WHERE continent = ?', 'Asia', callback);

If the `params` value is `undefined` or `null`, it will be converted to SQL `NULL`.

	client.query('SELECT * FROM nation WHERE continent IS ?', null, callback);

The `Date` type values will be converted into CUBRID compatible `DATETIME` strings.

	client.query('SELECT * FROM game WHERE game_date = ?', [new Date('8/28/2004')], callback);
	// The query will be
	// `SELECT * FROM game WHERE game_date = '8/28/2004 0:0:0.0'`

And finally, everything else will be safely escaped and wrapped in single quotes.

##### Event style example

	// Multiple queries will be queued and executed sequentially.
	client.query('SELECT * FROM nation');
	client.query('SELECT * FROM nation WHERE continent = ?', ['Asia']);
	
	client.on(client.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle, sql) {
      var arr = Result2Array.RowsArray(result);
        
      for (var j = 0, len = arr.length; j < len; ++j) {
        console.log(arr[j]);
      }
      
	  // Do something with `sql` like:
	  switch (sql) {
	    case SQL_A: 
	      break;
	    case SQL_B:
	      break;
	    default:
	  }
        
      // Fetch more data using queryHandle if necessary.
    }

#### Fetch more data

	// Callback style.
	// `queryHandle`: an integer ID for the query handle obtained from query() function.
	// `callback(err, result, queryHandle)` function accepts three arguments.
	// 1. `err`: an error object if any.
	// 2. `result`: a string value of the query result. No type casting as of version 2.1.0.
	// 3. `queryHandle`: an integer ID for the query handle. Used to fetch more data.
	client.fetch(queryHandle, callback);
	
	// Event style.
	client.fetch(sql);
	// `callback(result, queryHandle)` function accepts two arguments.
	client.on(client.EVENT_FETCH_DATA_AVAILABLE, callback);
	// `callback(queryHandle)` function accepts one argument.
	client.on(client.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, callback);

##### Callback example

	client.query('SELECT * FROM nation', function (err, result, queryHandle) {
      if (err) {
        throw err;
      } else {
        var arr = Result2Array.RowsArray(result);
        
        for (var j = 0, len = arr.length; j < len; ++j) {
          console.log(arr[j]);
        }
        
        // Fetch more data using queryHandle if necessary.
        client.fetch(queryHandle, function (err, result, queryHandle) {
        	// Do the above logic here again.
        });
      }
    });

##### Event style example

	client.query('SELECT * FROM nation');

	client.on(client.EVENT_QUERY_DATA_AVAILABLE, function (result, queryHandle) {
      var arr = Result2Array.RowsArray(result);
        
      for (var j = 0, len = arr.length; j < len; ++j) {
        console.log(arr[j]);
      }
        
      // Fetch more data using queryHandle if necessary.
      client.fetch(queryHandle);
    }

	client.on(client.EVENT_FETCH_DATA_AVAILABLE, function (result, queryHandle) {
      var arr = Result2Array.RowsArray(result);
        
      for (var j = 0, len = arr.length; j < len; ++j) {
        console.log(arr[j]);
      }
        
      // Continue fetching.
      client.fetch(queryHandle);
    }

	client.on(client.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function (queryHandle) {
      // Close query;
    }

#### Close Query

	// `queryHandle`: an integer ID for the query handle obtained from `query()`
	// or the last `fetch()` function.
	// `callback(err, queryHandle)` function accepts two arguments:
	// 1. `err`: an error object if any.
	// 2. `queryHandle`: the query handle which has been closed.
	client.closeQuery(queryHandle, callback);
	
	// Event style.
	client.closeQuery(queryHandle);
	// `callback(queryHandle)` function accepts one argument:
	// `queryHandle`: the query handle ID which was just closed.
	client.on(client.EVENT_QUERY_CLOSED, callback);

All READ queries must be closed explicitly.

##### Callback example

	client.query(sql, function (err, result, queryHandle) {
		var arr = Result2Array.RowsArray(result);
		
		if (arr.length) {
			// Try to fetch more.
		} else {
			client.closeQuery(queryHandle, function (err, queryHandle) {
				// Do something else.
			});
		}
	});

##### Event style example

	client.on(client.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, function (queryHandle) {
		client.closeQuery(queryHandle);
    }
    
    client.on(client.EVENT_QUERY_CLOSED, function (queryHandle) {
		// Do something here.
    }

#### WRITE queries

	// `sql` is a string which represents a WRITE query or an array of strings
	// for batch processing.
	// `callback(err)` function accepts one argument: an error object if any.
	client.execute(sql, callback);

##### Example

	client.execute('CREATE TABLE tbl_test(id INT)', function (err) {
      if (err) {
        throw err;
      } else {
        // Do something else.
      }
    });

After executing WRITE queries there is no need to close the query.

#### Queueing

Since **node-cubrid** version 2.1.0 almost all requests, which initiate a network communication, pass through an internal queue. This includes READ and WRITE queries, close query requests, fetch requests, rollback/commit requests.

Thus, in order to put queries into a queue, all you need to do is call query/execute and their equivalent functions one after another. They will be added into the queue as they come in (FIFO).

Here is an example.

	client.execute('CREATE TABLE tbl_test(id INT)', callback);
	client.execute('INSERT INTO tbl_test (id) VALUES (1), (2), (3)', callback);
	client.query('SELECT * FROM tbl_test', callback);
	client.execute('DROP TABLE tbl_test', callback);

Remember that the `callback` is optional in which case you should listen for events.

Alternatively, for backward compatibility we still support `addQeury()` and `addNonQuery()` functions which we introduced in version 2.0.0.

    var SQL_1 = "SELECT COUNT(*) FROM [code]";
    var SQL_2 = "SELECT * FROM [code] WHERE s_name = 'X'";
    var SQL_3 = "SELECT COUNT(*) FROM [code] WHERE f_name LIKE 'M%'";
    var SQL_4 = "DELETE FROM code WHERE s_name = 'ZZZZ'";

    Helpers.logInfo('Executing [1]: ' + SQL_1);
    client.addQuery(SQL_1, function (err, result) {
      Helpers.logInfo('Result [1]: ' + Result2Array.RowsArray(result));
    });

    Helpers.logInfo('Executing [2]: ' + SQL_2);
    client.addQuery(SQL_2, function (err, result) {
      Helpers.logInfo('Result [2]: ' + Result2Array.RowsArray(result));
    });

    Helpers.logInfo('Executing [3]: ' + SQL_3);
    client.addQuery(SQL_3, function (err, result) {
      Helpers.logInfo('Result [3]: ' + Result2Array.RowsArray(result));
    });

    Helpers.logInfo('Executing [4]: ' + SQL_4);
    client.addNonQuery(SQL_4, function (err) {
      Helpers.logInfo('Result [4]: ' + err);
      client.close();
    });

`addQuery()` will simply pass its arguments to the main `query()` function, while `addNonQuery()` will pass its arguments to `execute()` function. Thus, if you want to avoid one more function call, get used to directly calling the `query()` or `execute()` functions.

##### Check if queue is empty

	client.isQueueEmpty();
	client.queriesQueueIsEmpty();

In case you are interested in checking if the queue is empty, call one of the above functions. Returns `true` or `false`.

##### Get queue depth

	client.getQueueDepth();

The above function will return the number of requests currently in the queue. Remember that this number represents all requests, including READ and WRITE, and fetch, and rollback/commit, etc. Briefly all requests which initiate a network communication.

### Closing a connection

	// callback(err) function accepts one arguments: the error message if any.
	client.close(callback);
	// Alias function since version 2.1.0.
	client.end(callback);

#### Callback style

	client.close(function (err) {
		if (err) {
			throw err;
		} else {			
			console.log('connection is closed');
		}
	});

#### Event style

	client.connect();
	
	client.on(client.EVENT_CONNECTED, function () {
			console.log('connection is established');
			
			client.close();
	});

	client.on(client.EVENT_CONNECTION_CLOSED, function () {
			console.log('connection is closed');
	});

When a connection is closed by calling `close()` or `end()`, all pending/queued requests will be removed from the internal queue.

#### Errors on closing the connection

The following errors may be emitted when the application tries to close the connection:

1. If a connection is already closed, the following error is emitted by **node-cubrid**.
	
		{ [Error: The connection is already closed!] }

2. If closing a connection was unsuccessful, an error message returned by a database is emitted.

## More examples

The driver code release contains many demo examples and test cases which you can find in the following directories:

- [/demo](https://github.com/CUBRID/node-cubrid/tree/master/demo)
- [/test](https://github.com/CUBRID/node-cubrid/tree/master/test)

Here is another **node-cubrid** usage example which uses the `ActionQueue` helper. The `ActionQueue.enqueue` function is the same as the [async.waterfall()](https://github.com/caolan/async#waterfall) from the well-known **async** library:

	var CUBRID = require('node-cubrid'),
		ActionQueue = CUBRID.ActionQueue,
		Helpers = CUBRID.Helpers,
		client = CUBRID.createDefaultCUBRIDDemodbConnection();

    ActionQueue.enqueue([
        function (cb) {
           client.connect(cb);
        },
        function (cb) {
          client.getEngineVersion(cb);
        },
        function (engineVersion, cb) {
          Helpers.logInfo('Engine version is: ' + engineVersion);
          client.query('select * from code', cb);
        },
        function (result, queryHandle, cb) {
          Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
          Helpers.logInfo('Query results:');
          var arr = Result2Array.RowsArray(result);

          for (var k = 0; k < arr.length; k++) {
            Helpers.logInfo(arr[k].toString());
          }
          
          client.closeQuery(queryHandle, cb);
        },
        function (cb) {
          Helpers.logInfo('Query closed.');
          client.close(cb);
        }
      ], function (err) {
        if (err) {
          throw err;
        } else {
          Helpers.logInfo('Connection closed.');
        }
      }
    );
	
You can also find more tutorials at [http://www.cubrid.org/wiki_apis/entry/cubrid-node-js-tutorials](http://www.cubrid.org/wiki_apis/entry/cubrid-node-js-tutorials).

## Running tests

To run tests on **node-cubrid** module:

1. `npm install` all testing framework development dependencies.
2. Make sure:
	1. CUBRID Server 8.4.1+ is installed on `localhost`.
	2. CUBRID Broker is listening on port `33000`.
	3. `demodb` database is running.
3. Alternatively, edit test suite connection configurations at `test/testSetup/test_Setup.js` and change the connection information.
4. `npm test` to start testing.

There are over 268K assertion tests which should all pass on CUBRID 8.4.1+.

## What's next

We intend to continuosly improve this driver, by adding more features and improving the existing code base.

And you are more than welcomed to suggest what we should improve or add - please let us know! :)


## Authors and Contributors

The authors of this driver are the members of the CUBRID API team - [http://www.cubrid.org/wiki_apis](http://www.cubrid.org/wiki_apis).

We welcome any new contributors and we hope you will enjoy using and coding with CUBRID! :)

### Special thanks

We would like to say thanks to the following people & projects for inspiration,
for the code we have (re)used and for doing such a great job for the open-source community!

-	[https://github.com/caolan/async](https://github.com/caolan/async)
-	[https://github.com/felixge/node-mysql](https://github.com/felixge/node-mysql)
-	[https://github.com/jeromeetienne/microcache.js](https://github.com/jeromeetienne/microcache.js)

...Stay tuned for the next great driver releases! :)
