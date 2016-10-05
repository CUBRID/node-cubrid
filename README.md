# node-cubrid

[![Build Status](https://travis-ci.org/CUBRID/node-cubrid.png)](https://travis-ci.org/CUBRID/node-cubrid)

This is a Node.js driver for [CUBRID](http://www.cubrid.org) open-source relational database.
**node-cubrid** is implemented in 100% JavaScript with no external dependency (except the 
development dependencies). Besides the database specific APIs, the module supplies several
*helper* APIs which are useful to sanitize and validate user input values, format and 
parametrize SQL statements, etc.

**Table of Contents**

* [Key features](#key-features)
* [CHANGELOG](#changelog)
* [Installation](#installation)
* [Request flow in node-cubrid](#request-flow-in-node-cubrid)
* [API Documentation](#api-documentation)
    * [Creating a CUBRID client](#creating-a-cubrid-client)
    * [Establishing a connection](#establishing-a-connection)
    * [Connection configuration](#connection-configuration)
        * [Setting connection timeout](#setting-connection-timeout)
        * [Setting CUBRID Server Parameters](#setting-cubrid-server-parameters)
    * [Executing SQL queries](#executing-sql-queries)
        * [READ queries](#read-queries)
        * [Close Query](#close-query)
        * [WRITE queries](#write-queries)
    * [Queueing](#queueing)
    * [Transactions](#transactions)
    * [Closing a connection](#closing-a-connection)
    * [Events by EventEmitter](#events-by-eventemitter)
* [More examples](#more-examples)
* [Running tests](#running-tests)
    * [Running tests in a Docker container](#running-tests-in-a-docker-container)
* [What's next](#whats-next)
* [Authors and Contributors](#authors-and-contributors)
* [Special thanks](#special-thanks)

## Key features

- Full compatibility with CUBRID 8.4.1+ releases.
- Rich database support: Connect, Query, Fetch, Execute, Execute in batch, Commit, Rollback, etc.
- Support for queries queueing.
- Support for database schema.
- Support for database parameters and transactions.
- Support for [LOB](http://www.cubrid.org/manual/93/en/sql/datatype.html#blob-clob-data-types) (Binary and Character) objects.
- Support for [ENUM](http://www.cubrid.org/manual/93/en/sql/datatype.html#enum-data-type) data types since CUBRID 9+.
- Fully implements the event emitter.
- Extensive tests suite (90% code coverage).
- Full `Promise` support since `v3.0.0`.

## CHANGELOG

Refer to https://github.com/CUBRID/node-cubrid/releases tab.

## Installation

Since `v3.0.0` the driver requires Node `>=v4`. If you are on an older version of Node,
you can use the previous `node-cubrid` `v2.2.5`.

    npm install node-cubrid

This will install the latest version available at https:* www.npmjs.com/package/node-cubrid.
Once installed, the module can be accessed by requiring the `node-cubrid` module:

    const CUBRID = require('node-cubrid');

The node-cubrid module exports the following properties and functions:

- `Helpers`: an object which provides a set of helper functions.
- `createConnection()` (*alias* `createCUBRIDConnection()`): a function which returns a new client connection object to work with a user defined CUBRID host and database.
- `createDefaultCUBRIDDemodbConnection()`: a function which returns a connection object to work with a local [demodb](http://blog.cubrid.org/wiki_tutorials/entry/getting-started-with-demodb-cubrid-demo-database) database.

## Request flow in node-cubrid

When the request is sent to the server, CUBRID executes it, and returns the response, which can be either a query result set, or the error code. It is by design that CUBRID does not return any identification about the request sender. In other words, in order to associate the response with a request, the driver has to have only one active request which can be the only owner of this response.

For this reason, if a developer wants to execute several queries, they must execute them one after another, i.e. sequentially, NOT in parallel. This is how the communication between the driver and the server is implemented in CUBRID and most other database systems including MySQL.

If there is a vital need to run queries in parallel, developers can use connection pooling modules. An example with this technique is provided below.

## API Documentation

### Creating a CUBRID client

    /* 
     *  `createCUBRIDConnection()` function accepts either an object or a list of
     *  connection parameters. The following list of parameters are supported:
     *  1. `hosts`: Can be either:
     *      - a string representing an IP or a domain name of the CUBRID host 
     *        (without the `http://` part)
     *      - (since 3.0.0) an array of strings like 
     *        `['host1[:port1]', 'host2[:port2]', ...]`.
     *               
     *        When a custom `port` is not specified, the driver will use the
     *        default `port` specified by the user when creating a connection.
     *        When a user has not specified the default `port`, it defaults to 
     *        `33000`.
     *               
     *     Defaults to `localhost`.
     *  2. `port`: a port CUBRID is listening to. Defaults to `33000`.
     *  3. `user`: the database username. Defaults to `public`.
     *  4. `password`: the database user password. Defaults to an empty string.
     *  5. `database`: the name of a database to connect to. Default to `demodb`.
     *  7. `connectionTimeout`: the timeout value in milliseconds for the connection.
     *     If `connectionTimeout = 0`, it will wait until the network socket times out
     *     itself. Defaults to `0`.
     *  8. `maxConnectionRetryCount`: the number of times the connection needs to
     *     be retried in case of failure. Defaults to `1`. Since `3.0.0`.
     *  9. `logger`: a custom logger that implements at least `debug` and `info` 
     *     functions. Defaults to noop (nothing will be logged). For more details
     *     refer to **Logging** section below. Since `3.0.0`.
     */

    // All arguments are optional in which case default values will be set.
    var client = CUBRID.createCUBRIDConnection(host, port, user, password, database, connectionTimeout);

    *  Alias function since version 2.1.0.
    var client = CUBRID.createConnection(host, port, user, password, database, connectionTimeout);
    
    // Alternatively, an object of parameters can be passed. Since version 2.1.0.
    var client = CUBRID.createConnection(paramsObject);

The following example shows how to create a client by providing an object of connection parameters.

    const client = CUBRID.createConnection({
        host: host,
        port: port,
        user: user,
        password: password:
        database: database,
        connectionTimeout: connectionTimeout,
        maxConnectionRetryCount: maxConnectionRetryCount,
        logger: logger
    });

### Establishing a connection

    // callback(err) function receives one arguments: the error message if any.
    const promise = client.connect(callback);

#### Callback style

The code below illustrates a *callback* style when a function is passed as an argument
to a `connect()` API which is called after the module receives a response from CUBRID.

    const CUBRID = require('node-cubrid');
    const dbConf = {
        host: 'localhost',
        port: 33000,
        user: 'public'
        password: '',
        database: 'demodb'
    };
    const client = CUBRID.createConnection(dbConf);
    
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

#### Promise style

Alternatively, a `Promise` style is supported. For example, the above code can be rewritten as:

    client
        .connect()
        .then(() => {
          console.log('connection is established');
          
          return client.close();
        })
        .catch(err => {
          throw err;
        });
    
#### Implicit connection

**node-cubrid** performs an implicit connection whenever necessary. When you execute a query
on a client without explicitly establishing a connection by calling `client.connect()`, the 
driver will automatically establish a connection before executing your query.

#### Connection errors

There can be several reasons for a connection to fail:

- **Connection timeout**:

    - when the host does not respond within the specified time larger than `0`, 
       you will receive the following error message:

            { [Error: connect ETIMEDOUT] }

    - when no timeout value is set or its value is `0`, the following timeout
       error is emitted by the underlying network socket.

            { [Error: connect ETIMEDOUT] code: 'ETIMEDOUT', errno: 'ETIMEDOUT', syscall: 'connect' }

- **Incorrect hostname**:

        { [Error: getaddrinfo ENOTFOUND] code: 'ENOTFOUND', errno: 'ENOTFOUND', syscall: 'getaddrinfo' }

- **Incorrect port**:

    * When you try to connect to a port listened by an active service other than 
      CUBRID or if a firewall refuses the connection, you will see the following error message:
    
            { [Error: connect ECONNREFUSED] code: 'ECONNREFUSED', errno: 'ECONNREFUSED', syscall: 'connect' }
    
    * If the port is not listened by any service, then you will see the **Connection timeout** 
      error as in the first case.
      
    * The last type of error message you would receive if an incorrect port is provided is:

            { [Error: read ECONNRESET] code: 'ECONNRESET', errno: 'ECONNRESET', syscall: 'read' }

### Connection configuration

#### Setting connection timeout

    // Both functions are available since version 2.0.0.
    const timeoutInMilliseconds = client.getConnectionTimeout();
    
    // Set connection timeout in milliseconds.
    client.setConnectionTimeout(2000);
    
    // Alternatively, set the connection timeout value at client creation time.
    // Available since version 2.1.0.
    var client = CUBRID.createConnection(host, port, user, password, database, connectionTimeout);

One of the requests we have got for the 2.0 driver release was to implement a connection
timeout feature. Simply said - wait for the connection to the database to complete within
the specified number of seconds and eventually throw an error if the timeout occurs.

Obviously, the key thing here was to set the connection timeout at the Node.js socket 
connection layer level (and not on the consumer level):

    this._socket = Net.createConnection(hostInfo.port, hostInfo.host);
    this._socket.setNoDelay(true);
    this._socket.setTimeout(this.getConnectionTimeout());

In **node-cubrid** by default the connection timeout value is set to `0`, i.e. 
the driver will wait long enough until the underlying network socket times out itself. 
In this case, according to our observations, the `timeout` event is emitted in about 
`75` seconds (**purely observational point**).

So, if you want or expect the connection to timeout within the specified time, then 
manually set the timeout value as shown below.

    const client = new CUBRIDConnection(dbConf.host, dbConf.port, dbConf.user, dbConf.password, dbConf.database, /* connectionTimeout */ 2000);
 
     // Or at runtime.
    client.setConnectionTimeout(2000);
    
    client.connect(function (err) {
        if (err) {
              console.log(err);
        }
        
        client.close();
    });

As you see, the timeout is specified in milliseconds `2000`, which is 2 seconds.
After 2 seconds, the script will timeout with an error like:

    { [Error: connect ETIMEDOUT] }

#### Setting CUBRID Server Parameters

    // Both functions are available since version 2.0.0.
    client.getDatabaseParameter(paramType);
    client.setDatabaseParameter(paramType, paramValue);

After connecting to a database, a user can override some *global* session parameters 
that will control the behavior queries being executed. For example, isolation level 
of transactions, the auto-commit behavior, etc.

The complete list of these CUBRID database parameters is defined in the 
[`Constants.js` ](https://github.com/CUBRID/node-cubrid/blob/master/src/constants/CASConstants.js#L371) file:

    /**
     * Define CUBRID Database parameters constants
     */
    exports.CCIDbParam = {
        CCI_PARAM_ISOLATION_LEVEL   : 1,
        CCI_PARAM_LOCK_TIMEOUT      : 2,
        CCI_PARAM_MAX_STRING_LENGTH : 3,
        CCI_PARAM_AUTO_COMMIT       : 4
    };

For each parameter, the CUBRID communication protocol implements a dedicated support for GET 
and SET operations. Therefore, in order to manipulate them, also a dedicate functionality was 
needed in the driver and this is what we did in the 2.0 release.

Please note one exception - the `CCI_PARAM_MAX_STRING_LENGTH` parameter **cannot** be set 
programmatically from code as it is a CUBRID Broker parameter and the client can only query
its current value.

Let’s see some examples. First, let set the value of the `ISOLATION_LEVEL` parameter:

    const CAS = require('./node_modules/node-cubrid/src/constants/CASConstants');
    
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

If you need to change the default values for these parameters, it is highly recommended 
to do it immediately after `connect ()`.

### Executing SQL queries

#### READ queries

    // Callback style.
    client.query(sql, callback);
    client.query(sql, params, callback);

    /*
     * 1. `sql`: a string representation of a single READ query. Required.
     * 2. `params` is an array of parameter values or the value itself
     *    which a user wants to bind instead of `?` placeholders
     *    in the `sql` query. If no placeholder is found, the `sql`
     *    will not be modified. This argument is optional. When
     *    omitted, `sql` will be sent to the server unmodified. This
     *    `params` argument is available since version 2.1.0.
     * 3. `callback` is a function which will be invoked when the query
     *    finishes executing. Optional. The `callback` function
     *    can be omitted in which case users need to handle the 
     *    return value of the `Promise`.
     */
    
    /* 
     * The `callback(err, result, queryHandle)` function accepts three arguments.
     * 1. `err`: an error object if any.
     * 2. `result`: a query result object which has the following properties:
     *     - `ColumnDataTypes`: an array of strings that represent the column data type.
     *     - `ColumnNames`: an array of strings that represent the column names.
     *     - `ColumnValues`: an array of arrays that represent rows of records
     *        each row having one or more columns. Here each column represents a value
     *        of that column.
     *     - `RowsCount`: total number of records that match the provided SQL query.
     *       **Note** that not all records may have been fetched.
     * 3. `queryHandle`: an integer ID for the query handle. Used to fetch more data
     *     or close the query statement in order to release the memory being kept
     *     on the CUBRID server side.
     */
        
    // Promise style.
    const promise = client.query(sql);
    const promise = client.query(sql, params);
    
    /*
     * A `promise` is resolved with a single `response` object that has the following
     * properties described above:
     * - result
     * - queryHandle
     *
     * A `promise` is rejected with a single instance of `Error` object.
     */
    
    /* 
     * Queries queueing: calling `query()` multiple times will result in queuing
     * the queries which will be executed sequentially one after another.
     */
    client.query(sql);
    client.query(sql, params);
       
    // Under the hood, `query()` and other functions that accept `params` all 
    // call `Helpers._sqlFormat()` function to perform the actual formatting.
        
    // When multiple queries are executed one after another without
    // waiting for a callback, the queries
    // will be queued and executed sequentially.

##### Callback example

Here is an example which executes a simple `SELECT` query.

    const CUBRID = require('node-cubrid');
        
    // Connection is established implicitly.
    client.query('SELECT * FROM nation', function (err, result, queryHandle) {
      if (err) {
        throw err;
      } else {
        const rows = result.ColumnValues;
        const rowsCount = result.RowsCount;
        
        for (let i = 0; i < rowsCount; ++i) {
          let columns = rows[i];
          
          for (let j = 0, columnsCount = columns.length; j < columnsCount; ++j) {
            console.log(columns[j]);
          }
        }
        
        // Fetch more data using queryHandle if necessary.
        // Refer to examples below.
      }
    });

The following example shows how to set placeholders and bind values in `SELECT` queries.

    client.query('SELECT * FROM nation WHERE continent = ?', ['Asia'], callback);

Alternatively, the `params` value can be a literal value.

    client.query('SELECT * FROM nation WHERE continent = ?', 'Asia', callback);

If the `params` value is `undefined` or `null`, it will be converted to SQL `NULL`.

    client.query('SELECT * FROM nation WHERE continent IS ?', null, callback);

The `Date` type values will be converted into CUBRID compatible `DATETIME` strings.

    client.query('SELECT * FROM game WHERE game_date = ?', [new Date('8/28/2004')], callback);
    // The query will be
    // `SELECT * FROM game WHERE game_date = '8/28/2004 0:0:0.0'`
    // Note that as of CUBRID v9.3.0 it does not support time zones.

And finally, everything else will be safely escaped and wrapped in single quotes.

##### Promise example

    const promise = client
        .query('SELECT * FROM nation')
        .then(response => {
          const result = response.result;
          const queryHandle = response.queryHandle;
          
          const rowsCount = result.RowsCount;
          const rows = result.ColumnValues;
                    
          for (let i = 0; i < rowsCount; ++i) {
            let columns = rows[i];
              
            for (let j = 0, columnsCount = columns.length; j < columnsCount; ++j) {
              console.log(columns[j]);
            }
          }
          
          // Do something more.
        })
        .catch(err => {
          // Handle the error.
        });

#### Fetch more data

    /*
     * `fetch()` accepts three arguments:
     * 1. `queryHandle`: an integer ID for the query handle obtained from `query()` function.
     * 2. `all`: a boolean that tells whether to fetch all available records or just the 
     *    next batch. Defaults to `false`. Since `3.0.0`.
     * 2. `callback(err, result, queryHandle)` function accepts the same three arguments
     *    accepted by the `query()` function.
     */
    client.fetch(queryHandle, all, callback);
    
    // Promise style is resolved and rejected similarly like the promise from `query()`.
    const promise = client.fetch(queryHandle, all);
    
##### Callback example

    client.query('SELECT * FROM nation', function (err, result, queryHandle) {
      if (err) {
        throw err;
      } else {
        const rows = result.ColumnValues;
        const rowsCount = result.RowsCount;
        
        for (let i = 0; i < rowsCount; ++i) {
          let columns = rows[i];
          
          for (let j = 0, columnsCount = columns.length; j < columnsCount; ++j) {
            console.log(columns[j]);
          }
        }
        
        // Fetch more data using the `queryHandle`.
        client.fetch(queryHandle, function (err, result, queryHandle) {
            // Handle the error and response.
            // Note that the fetch does not return all the records
            // but only some. So, users need to fetch records in batches.
        });
      }
    });

##### Promise example

    const promise = client
        .query('SELECT * FROM nation')
        .then(response => {
          const result = response.result;
          const queryHandle = response.queryHandle;
          
          const rowsCount = result.RowsCount;
          const rows = result.ColumnValues;
                    
          for (let i = 0; i < rowsCount; ++i) {
            let columns = rows[i];
              
            for (let j = 0, columnsCount = columns.length; j < columnsCount; ++j) {
              console.log(columns[j]);
            }
          }
          
          return client.fetch(queryHandle);
        })
        .then(response => {
          // The same `response` as after `query()`.
        })
        .catch(err => {
          // Handle the error.
        });

#### Close Query

It is vital to always close all the READ queries when they are no longer necessary.
When you query, CUBRID allocates a part of memory to hold the query statement 
information necessary to return values on consecutive `fetch()` requests. Unless
the connection with the client is disconnected, CUBRID will keep this information
in memory. When not released during the lifetime of the connection, eventual 
OOM (Out Of Memory) problems can occur on the server side. This is why when you
are done with the query results, close the queries. If the connection is disconnected,
CUBRID will automatically close all the query statements to free the memory.

    /*
     * `closeQuery()` accepts two arguments:
     * 1. `queryHandle`: an integer ID for the query handle obtained from `query()`
     *    or the last `fetch()`.
     * 2. `callback(err)` function that accepts one argument:
     *    1. `err`: an error object if any.
     */
    client.closeQuery(queryHandle, callback);
    
All READ queries **must be** closed explicitly except when you call `queryAll`
in which case the driver will close queries for you because there is no more
data that you may possibly request.

##### Callback example

    client.query(sql, function (err, result, queryHandle) {
        const arr = result.ColumnValues;
        
        if (arr.length) {
            // Try to fetch more.
        } else {
            client.closeQuery(queryHandle, function (err) {
                // Do something else.
            });
        }
    });

##### Promise example

    // Promise style.
    const promise = client
        .query(sql)
        .then(response => {
          // Do something with response.
            
          return client.closeQuery(response.queryHandle);  
        })
        .then(() => {
        
        })
        .catch(err => {
          // Handle the error.
        });

#### Query As Objects

There is a convenient function provided in case you want to retrieve result set
as an array of traditional JSON objects with column names and values as object 
properties and their corresponding values.
 
    /*
     * `queryAsObjects()` calls `query()`, therefore it accepts the same 
     * arguments as `query()`. Available since `3.0.0`.
     * 1. `sql`
     * 2. `params`
     * 3. `callback(err, result, queryHandle)` is different from the callback passed
     *    to `query()`. It accepts the same number of arguments, but `result` is no
     *    longer an object but an array that represents rows of record objects.
     *    1. `err`: an error object if any.
     *    2. `result`: an array of records each representing a single row object
     *       where keys are columns names and their values are column values.
     *    3. `queryHandle`: an integer ID for the query handle. Used to fetch more data
     *       or close the query statement in order to release the memory being kept
     *       on the CUBRID server side.
     */
    client.queryAsObjects(sql, params, callback);
 
    // Promise style.
    const promise = client.queryAsObjects(sql);
    const promise = client.queryAsObjects(sql, params);
    
**Note** that the `result` returned by `queryAsObjects` is no longer a result object 
but an array that represents rows of record objects. Thus, you cannot access the 
column meta information via `result.ColumnDataTypes`, `result.ColumnNames` or
`result.RowsCount`. If such information is necessary, call `getMetaData(queryHandle)`
explained below.

##### Callback example

Here is an example which executes a simple `SELECT` query.

    // Connection is established implicitly.
    client.queryAsObjects('SELECT * FROM nation', function (err, result, queryHandle) {
      if (err) {
        throw err;
      } else {
        // `result` is now an array of row objects.
        const rowsCount = result.length;
        
        for (let i = 0; i < rowsCount; ++i) {
          const row = rows[i];
          
          console.log(row.code);
          console.log(row.name);
          console.log(row.continent);
          console.log(row.capital);
        }
       
        // Do something more.
      }
    });

##### Promise example

    const promise = client
        .queryAsObjects('SELECT * FROM nation')
        .then(response => {
          const result = response.result;
          const queryHandle = response.queryHandle;
          
          // `result` is now an array of row objects.
          const rowsCount = result.length;
          
          for (let i = 0; i < rowsCount; ++i) {
            const row = rows[i];
            
            console.log(row.code);
            console.log(row.name);
            console.log(row.continent);
            console.log(row.capital);
          }
         
          // Do something more.
        })
        .catch(err => {
          // Handle the error.
        });

##### Get Query Result Metadata

    /*
     * `getMetaData()` accepts two arguments:
     * 1. `queryHandle`: that is associated with the required query result,
     *    obtained from the last `query()`.
     * 2. `callback(err, result)` accepts two arguments:
     *    1. `err`: an error object if any. 
     *    2. `result`: the same `result` object that is returned when calling 
     *       `query()` function. It provides the same `ColumnDataTypes`,
     *       `ColumnNames`, `ColumnValues`, and `RowsCount` properties. 
     */

    // Callback style.
    client.getMetaData(queryHandle, callback);
   
    // Promise style.
    const promise = client.getMetaData(queryHandle);
       
#### Query All

There is a convenient function provided in case you want to query all records
that match the SQL.
 
**Note** that this may potentially result in OOM in your application especially 
considering that in Node environment a typical process has a limited memory
around 1.6GB.

Use this function when you are sure that the result set will fit into your app's
memory.

    /*
     * `queryAll()` calls `query()` and then calls `fetch()` multiple times until
     * all records are retrieved, and finally calls `closeQuery()` explicitly to
     * close the query for you. Thus, it accepts the same arguments as `query()`.
     * Available since `3.0.0`.
     * 1. `sql`
     * 2. `params`
     * 3. `callback(err, result)` function is different from the callback you
     *    pass to `query()` in the way that in `queryAll` it accepts only
     *    the error and the result object. No `queryHandle` is returned.
     */
    client.queryAll(sql, params, callback);
 
    // Promise style.
    const promise = client.queryAll(sql);
    const promise = client.queryAll(sql, params);
    
##### Callback example

Here is an example which executes a simple `SELECT` query.

    // Connection is established implicitly.
    client.queryAll('SELECT * FROM nation', function (err, result) {
      if (err) {
        throw err;
      } else {
        // `rows` now include all records that matched the SQL query.
        const rows = result.ColumnValues;
        const rowsCount = result.RowsCount;
        
        for (let i = 0; i < rowsCount; ++i) {
          let columns = rows[i];
          
          for (let j = 0, columnsCount = columns.length; j < columnsCount; ++j) {
            console.log(columns[j]);
          }
        }
        
        // No need to fetch anything more.
        // No need to close the query as it is already closed by `queryAll()`.
      }
    });

**Note** once again that there is no need to call `closeQuery()` after `queryAll()`
because `queryAll()` automatically closes the query after all `fetch()` has been 
done.

##### Promise example

    const promise = client
        .queryAll('SELECT * FROM nation')
        .then(result => {
          const rowsCount = result.RowsCount;
          // `rows` now include all records that matched the SQL query.
          const rows = result.ColumnValues;
                    
          for (let i = 0; i < rowsCount; ++i) {
            let columns = rows[i];
              
            for (let j = 0, columnsCount = columns.length; j < columnsCount; ++j) {
              console.log(columns[j]);
            }
          }
          
          // No need to fetch anything more.
          // No need to close the query as it is already closed by `queryAll()`.
        })
        .catch(err => {
          // Handle the error.
        });

#### Query All As Objects

In case you want to retrieve all records as object, there is a function just for
that.

    /*
     * `queryAllAsObjects()` calls `queryAll()`, therefore it accepts the same 
     * arguments as `queryAll()`. Available since `3.0.0`.
     * 1. `sql`
     * 2. `params`
     * 3. `callback(err, result)` accepts the same number of arguments as `queryAll()`:
     *    1. `err`: an error object if any.
     *    2. `result`: an array of records each representing a single row object
     *       where keys are columns names and their values are column values.
     */
    client.queryAllAsObjects(sql, params, callback);
 
    // Promise style.
    const promise = client.queryAllAsObjects(sql);
    const promise = client.queryAllAsObjects(sql, params);
    
**Note** that just like with `queryAsObjects()`, the `result` returned by 
`queryAllAsObjects` is an array that represents rows of record objects. Likewise,
there is no need to call `closeQuery()` after `queryAllAsObjects()` as `queryAll()`
automatically closes the query after all `fetch()` has been done.

##### Callback example

Here is an example which executes a simple `SELECT` query.

    // Connection is established implicitly.
    client.queryAllAsObjects('SELECT * FROM nation', function (err, result) {
      if (err) {
        throw err;
      } else {
        // `result` is now an array of all row objects.
        const rowsCount = result.length;
        
        for (let i = 0; i < rowsCount; ++i) {
          const row = rows[i];
          
          console.log(row.code);
          console.log(row.name);
          console.log(row.continent);
          console.log(row.capital);
        }
       
        // Do something more.
      }
    });

##### Promise example

    const promise = client
        .queryAllAsObjects('SELECT * FROM nation')
        .then(result => {
          // `result` is now an array of row objects.
          const rowsCount = result.length;
          
          for (let i = 0; i < rowsCount; ++i) {
            const row = rows[i];
            
            console.log(row.code);
            console.log(row.name);
            console.log(row.continent);
            console.log(row.capital);
          }
        })
        .catch(err => {
          // Handle the error.
        });

#### WRITE queries

    /*
     * `execute(sql, params, callback)` function accepts three arguments.
     * 1. `sql`: a string which represents a WRITE query or an array
     *    of strings for batch processing. `sql` must be a string if
     *    `params` are provided.
     * 2. `params` is an array of parameter values or the value itself
     *    which a user wants to bind instead of `?` placeholders
     *    in the `sql` query. If no placeholder is found, the `sql`
     *    will not be modified. This argument is optional. When
     *    omitted, `sql` will be sent to the server unmodified.
     *    Available since `3.0.0`.
     * 3. `callback(err)`: a function that accepts one argument:
          1. `err`: an error object if any.

    // Callback style.
    client.execute(sql, callback);
    client.execute(sql, params, callback);
    
    // Promise style.
    const promise = client.execute(sql);
    const promise = client.execute(sql, params);

    /*
     * A `promise` is resolved with no arguments.
     * A `promise` is rejected with a single instance of `Error` object.
     */
     
    /* 
     * Queries queueing: calling `execute()` multiple times will result in queuing
     * the queries which will be executed sequentially one after another.
     */
    client.execute(sql);
    client.execute(sql, params);

After executing WRITE queries there is no need to close the query.

##### Callback example

Here is an example which executes a simple `INSERT` query.

    client.execute('INSERT INTO tbl VALUES(1, 2, 3)', function (err) {
      // Handle the error;
    });

The following example shows how to set placeholders and bind values in `INSERT` queries.

    client.execute('INSERT INTO tbl VALUES(?, ?, ?)', [1, 2, 3], function (err) {
      // Handle the error;
    });

Alternatively, the `params` value can be a literal value.

    client.execute('INSERT INTO tbl (name) VALUES(?)', 'cubrid', function (err) {
      // Handle the error;
    });

If the `params` value is `undefined` or `null`, it will be converted to SQL `NULL`.

    client.execute('INSERT INTO tbl (name) VALUES(?)', null, function (err) {
      // Handle the error;
    });

The `Date` type values will be converted into CUBRID compatible `DATETIME` strings.

    client.execute('INSERT INTO tbl (d) VALUES(?)', [new Date('8/28/2004')], callback);
    // The query will be
    // `INSERT INTO tbl (d) VALUES('8/28/2004 0:0:0.0')`
    // Note that as of CUBRID v9.3.0 it does not support time zones.

And finally, everything else will be safely escaped and wrapped in single quotes.

    batchExecuteNoQuery()

#### Execute with Typed Parameters

For cases when implicit type casting is insufficient or the result
is not as expected, data types can be specified by calling `executeWithTypedParams()`.

    /* 
     * `executeWithTypedParams()` accepts four arguments.
     * 1. `sql`: a string which represents a single WRITE query.
     *    **Note** not an array of strings.
     * 2. `params`: an optional array of parameter values which a user 
     *    wants to bind instead of `?` placeholders in the `sql`
     *    query. If no placeholder is found, the `sql` will not 
     *    be modified.
     * 3. `dataTypes`: an optional array of string values where each 
     *    element represents a data type for the corresponding
     *    value in `params`. The following data types are supported:
     *    `char`, `varchar`, `nchar`, `string`, `varnchar`, `short`, `int`,
     *    `bigint`, `float`, `double`, `monetary`, `numeric`, `date`, `time`,
     *    `datetime`, `timestamp`, `object`, `bit`, `varbit`, `set`, `multiset`,
     *    `sequence`, `blob`, `clob`, `resultset`.
     *    `dataTypes` are required if `params` are specified.
     * 4. `callback(err)`: a function that accepts one argument:
          1. `err`: an error object if any.
     */
          
    const sql = 'INSERT INTO a VALUES(?, ?, ?, ?)';
    const params = [1, 23, 'val', new Date()];
    const dataTypes = ['int', 'short', 'varchar', 'datetime'];
    
    client.executeWithTypedParams(sql, params, paramDelimiters, function callback(err) {});
    
    // Promise way.
    const promise = client.executeWithTypedParams(sql, params, paramDelimiters);
    
**Note** that `executeWithTypedParams()` does not replace `?` placeholders.
The `param` and `dataTypes` are sent to CUBRID directly, and the server handles
explicit type casing.

#### Queueing

Since **node-cubrid** version 2.1.0 almost all requests, which initiate a network
communication, pass through an internal queue. This includes READ and WRITE queries,
close query requests, fetch requests, rollback/commit requests.

Thus, in order to put queries into a queue, all you need to do is call `query()` / `execute()`
and their equivalent functions one after another. They will be added into the queue as 
they come in (FIFO).

Here is an example.

    client.execute('CREATE TABLE tbl_test(id INT)', callback);
    client.execute('INSERT INTO tbl_test (id) VALUES (1), (2), (3)', callback);
    client.query('SELECT * FROM tbl_test', callback);
    client.execute('DROP TABLE tbl_test', callback);

Remember that the `callback` is optional in which case you should handle the promises.

##### Check if queue is empty

In case you are interested in checking if the queue is empty, call the following function. 
Returns `true` or `false`.

    client.isQueueEmpty();

##### Get queue depth

The below function will return the number of requests currently in the queue. 
Remember that this number represents all requests, including READ and WRITE, 
and fetch, and rollback/commit, etc. Briefly all requests which initiate a 
network communication, including those which are currently in-flight.

    client.getQueueDepth();

### Transactions
    
This driver fully supports SQL transactions. By default `auto_commit` mode is set 
to `true` meaning after every WRITE query CUBRID Server will commit the changes to the disk.

You can begin, end, commit, and rollback transactions by calling these functions.

    client.beginTransaction(callback);
    client.endTransaction(callback);
    client.commit(callback);
    client.rollback(callback);
    
    // All `callback(err)` functions accept one argument: the error message if any.

`beginTransaction()` and `endTransaction()` functions simply call the following
`setAutoCommitMode()` by specifying a `false` or `true` arguments respectively.

    client.setAutoCommitMode(boolean, callback);
    
    // `boolean` is a boolean value which represents the auto_commit
    //           mode you wish to set the current transaction to.
    
    // The `callback(err)` function accepts one argument: the error message if any.

`beginTransaction()`, `endTransaction()` and `setAutoCommitMode()` functions are 
idempotent, that is you can call them multiple times and the result will be the same. 

**Note:** Unlike in other DBMS vendor drivers, in **node-cubrid** when a transaction is 
rolled back or committed, the `auto_commit` mode remains unchanged, i.e. `false`. This is 
according to CUBRID spec. This means that after you commit/rollback the transaction and 
you no longer need to execute queries in `auto_commit = false` mode, explicitly turn the 
`auto_commit` mode to `true` by calling `setAutoCommitMode()` function.

Moreover, enabling the auto commit mode by calling `setAutoCommitMode()` will not
commit the changes automatically. You need to explicitly `commit()` or `rollback()` the
changes.

Here is a promise based example that shows how to start and end a transaction. 

    client
        .execute('CREATE TABLE test_tran(id INT)')
        .then(() => {
            return client.beginTransaction();
        })
        .then(() => {
            return client.execute('INSERT INTO test_tran VALUES(1)');
        })
        .then(() => {
            return client.query('SELECT * FROM test_tran');
        })
        .then(response => {
            assert(response.result.RowsCount === 1);
            
            return client.closeQuery(response.queryHandle);
        })
        .then(() => {
            return client.rollback();
        })
        .then(() => {
            // **Note** that the auto commit mode is still OFF
            // even after the `rollback()`. 
            return client.query('SELECT * FROM test_tran');
        })
        .then(response => {
            assert(response.result.RowsCount === 0);
            
            return client.closeQuery(response.queryHandle);
        })
        .then(() => {
            // We are still inside the same transaction with
            // auto commit mode OFF.
            return client.execute('DROP TABLE test_tran');
        })
        .then(() => {
            return client.commit();
        })
        .then(() => {
            return client.endTransaction();
        })
        .then(() => { 
            return client.query("SELECT COUNT(*) FROM db_class WHERE class_name = 'test_tran'");
        })
        .then(response => {
            assert(response.result.RowsCount === 0);
            
            // Closing a connection will automatically close
            // all query statements.
            return client.close();
        });

### Requesting CUBRID Server information

There are a few functions that report meta information about the server.

    /*
     * `getEngineVersion()` accepts one argument:
     * 1. `callback(err, version)` accepts two arguments:
     *    1. `err`: an error object if any. 
     *    2. `version`: CUBRID Database version like `9.2.3.0005`.  
     */

    // Callback style.
    client.getEngineVersion(callback);
   
    // Promise style.
    const promise = client.getEngineVersion();
       
    /*
     * `getActiveHost()` accepts one argument:
     * 1. `callback(err, host)` accepts two arguments:
     *    1. `err`: an error object if any. 
     *    2. `host`: an object with `host` and `port` properties that 
     *       represents the server which the client is connected to.  
     */

    // Callback style.
    client.getActiveHost(callback);
   
    // Promise style.
    const promise = client.getActiveHost();

### Closing a connection

    /*
     * `close()` or its alias `end()` functions accept one argument:
     * The alias `end()` function is available since 2.1.0.
     * 1. `callback(err)` accepts one argument:
     *    1. `err`: an error object if any.   
     */

    // Callback style.
    client.close(callback);
    client.end(callback);
   
    // Promise style.
    const promise = client.close();
    const promise = client.end();

#### Callback style

    client.close(function (err) {
        if (err) {
            throw err;
        } else {            
            console.log('connection is closed');
        }
    });

#### Promise style

    const promise = client
        .connect()
        .then(() => {
            return client.close();
        });

When a connection is closed by calling `close()` or `end()`, all pending/queued 
requests will be removed from the internal queue. All in-flight queries will be
requested to be closed.

#### Errors on closing the connection

The following errors may be emitted when the application tries to close the connection:

1. If closing a connection was unsuccessful, an error message returned by a database is emitted.

## More examples

You can also find more tutorials at [http://www.cubrid.org/wiki_apis/entry/cubrid-node-js-tutorials](http://www.cubrid.org/wiki_apis/entry/cubrid-node-js-tutorials).

## Running tests

To run tests on **node-cubrid** module:

1. Make sure you are using Node `v4` or higher.
2. `npm install` all development dependencies.
3. Make sure:
    1. CUBRID Server 8.4.1+ is installed on `localhost`.
    2. CUBRID Broker is listening on port `33000`.
    3. `demodb` database is running.
    4. Alternatively, edit the test suite connection configurations at 
       `test/testSetup/index.js` and change the connection information.
4. `npm test` to start testing.
4. `npm run coverage` to prepare the code coverage report.

### Running CUBRID in a Docker container

If you do not have CUBRID already running, you can use the publicly available Docker image.
In fact this method is recommended as you can spin up multiple versions of CUBRID on
the same machine and run tests against all of them at once.

Run the following command to start CUBRID 9.2.3.0005 and its `demodb` database
inside a Docker container.

    docker run -p 33000:33000 --name cubrid lighthopper/cubrid:9.2.3.0005 ./create-start-demodb.sh

Refer to https://github.com/kadishmal/cubrid-docker for other versions.

## What's next

We intend to continuously improve this driver, by adding more features and improving the existing code base.
You are more than welcome to suggest what we should improve or add - please let us know! :)

## Authors and Contributors

The authors of this driver are the members of the CUBRID API team - [http://www.cubrid.org/wiki_apis](http://www.cubrid.org/wiki_apis).

We welcome new contributors and hope you will enjoy using and coding with CUBRID! :)

### Special thanks

We would like to say thanks to the following people & projects for inspiration,
for the code we have (re)used and for doing such a great job for the open-source community!

-    [https://github.com/caolan/async](https://github.com/caolan/async)
-    [https://github.com/felixge/node-mysql](https://github.com/felixge/node-mysql)
-    [https://github.com/jeromeetienne/microcache.js](https://github.com/jeromeetienne/microcache.js)

... Stay tuned for the next great driver release! :)
