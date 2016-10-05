'use strict';

const Net = require('net');
const EventEmitter = require('events').EventEmitter;
const Util = require('util');

const ErrorMessages = require('./constants/ErrorMessages');
const DATA_TYPES = require('./constants/DataTypes');
const CASConstants = require('./constants/CASConstants');

const Helpers = require('./utils/Helpers');
const NoopLogger = require('./NoopLogger');
const Query = require('./query/Query');
const Queue = require('./query/Queue');
const PacketReader = require('./packets/PacketReader');
const PacketWriter = require('./packets/PacketWriter');
const ClientInfoExchangePacket = require('./packets/ClientInfoExchangePacket');
const OpenDatabasePacket = require('./packets/OpenDatabasePacket');
const GetEngineVersionPacket = require('./packets/GetEngineVersionPacket');
const ExecuteQueryPacket = require('./packets/ExecuteQueryPacket');
const GetSchemaPacket = require('./packets/GetSchemaPacket.js');
const CloseQueryPacket = require('./packets/CloseQueryPacket');
const BatchExecuteNoQueryPacket = require('./packets/BatchExecuteNoQueryPacket');
const CloseDatabasePacket = require('./packets/CloseDatabasePacket');
const FetchPacket = require('./packets/FetchPacket');
const RollbackPacket = require('./packets/RollbackPacket');
const CommitPacket = require('./packets/CommitPacket');
const LOBReadPacket = require('./packets/LOBReadPacket');
const LOBNewPacket = require('./packets/LOBNewPacket');
const LOBWritePacket = require('./packets/LOBWritePacket');
const SetDbParameterPacket = require('./packets/SetDbParameterPacket');
const GetDbParameterPacket = require('./packets/GetDbParameterPacket');
const PrepareExecutePacket = require('./packets/PrepareExecutePacket');

/**
 * Create a new CUBRID connection instance
 * @param hosts
 * @param port
 * @param user
 * @param password
 * @param database
 * @param connectionTimeout
 * @param maxConnectionRetryCount
 * @param logger
 * @constructor
 */
function CUBRIDConnection(hosts, port, user, password, database, connectionTimeout, maxConnectionRetryCount, logger) {
  // Using EventEmitter.call on an object will do the setup of instance methods / properties
  // (not inherited) of an EventEmitter.
  // It is similar in purpose to super(...) in Java or base(...) in C#, but it is not implicit in Javascript.
  // Because of this, we must manually call it ourselves:
  EventEmitter.call(this);

  // Allow to pass the connection parameters as an object.
  if (typeof hosts === 'object' && !Array.isArray(hosts)) {
    port = hosts.port;
    user = hosts.user;
    password = hosts.password;
    database = hosts.database;
    connectionTimeout = hosts.connectionTimeout;
    maxConnectionRetryCount = hosts.maxConnectionRetryCount;
    logger = hosts.logger;
    // Allow users to specify a single host via `host`
    // or multiple hosts as `hosts` array.
    hosts = hosts.host || hosts.hosts;
  }

  if (!Array.isArray(hosts)) {
    hosts = [hosts];
  }

  // Connection parameters
  this.connectionBrokerPort = -1;
  this.connectionRetryCount = 0;
  this.maxConnectionRetryCount = maxConnectionRetryCount || 1;
  this.currentHostIndex = 0;
  const defaultPort = port || 33000;

  this.hosts = hosts.map(hostPort => {
    !hostPort && (hostPort = 'localhost');

    // Allow to provide custom ports for each host.
    let ix = hostPort.indexOf(':');
    let host;
    let port;

    if (ix > -1) {
      host = hostPort.substr(0, ix);
      port = hostPort.substr(ix);
    } else {
      // If port is not specified with the hostname,
      // use the default port.
      host = hostPort;
      port = defaultPort;
    }

    return {
      host,
      port,
    };
  });

  this.user = user || 'public';
  this.password = password || '';
  this.database = database || 'demodb';
  // Connection timeout in milliseconds.
  this.connectionTimeout = connectionTimeout || 0;
  this.logger = typeof logger === 'object' ? logger : new NoopLogger();

  // Session public variables
  this.autoCommitMode = true;
  this.sessionId = 0;

  // Execution semaphore variables; prevent double-connect-attempts, overlapping-queries etc.
  this.connectionOpened = false;
  this.connectionPending = false;

  // Auto-commit constants
  this.AUTOCOMMIT_ON = true;
  this.AUTOCOMMIT_OFF = !this.AUTOCOMMIT_ON;

  this._CASInfo = [0, 0xFF, 0xFF, 0xFF];
  this._queryResultSets = {};
  this._INVALID_RESPONSE_LENGTH = -1;
  this._LOB_MAX_IO_LENGTH = 128 * 1024;

  // Enforce query execution using the old protocol.
  // One would enforce the old protocol when trying to connect
  // to CUBRID SHARD Broker version 8.4.3 and 9.1.0.
  // On later versions of CUBRID SHARD Broker (8.4.4+, 9.2.0+)
  // users can use the default newer protocol.
  this._ENFORCE_OLD_QUERY_PROTOCOL = false;

  // SQL queries queue.
  this._queue = new Queue();
}

// Support custom events
Util.inherits(CUBRIDConnection, EventEmitter);

/**
 * Get broker connection port
 * @private
 */
function _doGetBrokerPort() {
  this.logger.debug(`_doGetBrokerPort: connectionRetryCount = ${this.connectionRetryCount}.`);

  return new Promise((resolve, reject) => {
    const clientInfoExchangePacket = new ClientInfoExchangePacket();
    const packetWriter = new PacketWriter(clientInfoExchangePacket.getBufferLength());

    const hostInfo = this.hosts[this.currentHostIndex];

    const socket = this._socket = Net.createConnection(hostInfo.port, hostInfo.host);

    socket.setNoDelay(true);
    socket.setTimeout(this.getConnectionTimeout());

    clientInfoExchangePacket.write(packetWriter);

    let callback = (err) => {
      if (err) {
        this.logger.debug(`_doGetBrokerPort error`, err.message);

        // If connection has failed, we need to try to connect to the next
        // broker.
        if (err.message.indexOf(ErrorMessages.ERROR_CONNECTION_TIMEOUT) > -1 ||
            err.message.indexOf('ECONNREFUSED') > -1) {
          // Check if we have any more hosts left to try connecting.
          if (++this.currentHostIndex < this.hosts.length) {
            // Try the next host.
            return resolve(_doGetBrokerPort.call(this));
          }

          // We have already tried all hosts.
          // Try again from the beginning `maxConnectionRetryCount` times.
          if (++this.connectionRetryCount <= this.maxConnectionRetryCount) {
            this.currentHostIndex = 0;

            return resolve(_doGetBrokerPort.call(this));
          }
        }

        return reject(err);
      }

      // Reset the retry counter on successful connection.
      this.connectionRetryCount = 0;
      this.logger.debug(`_doGetBrokerPort: connected to ${hostInfo.host}:${hostInfo.port}.`);

      resolve();
    };

    _setSocketTimeoutErrorListeners.call(this, callback);

    socket.once('data', (data) => {
      // Clear connection timeout
      socket.setTimeout(0);
      socket
          .removeAllListeners('timeout')
          .removeAllListeners('data');

      const packetReader = new PacketReader();

      packetReader.write(data);

      clientInfoExchangePacket.parse(packetReader);

      const newPort = clientInfoExchangePacket.newConnectionPort;

      this.logger.debug(`_doGetBrokerPort: newPort = ${newPort}`);

      this.connectionBrokerPort = newPort;

      if (newPort !== 0) {
        // If the new port is not `0`, i.e. it has changed, we need
        // to close the current socket. The new socket will be open
        // in `_doDatabaseLogin()`.
        // If it is `0`, we will keep using this same socket.
        socket.end();
      }

      if (newPort > -1) {
        return callback();
      }

      // If the `newPort` value is negative, it means
      // an error has occurred.
      callback(new Error(ErrorMessages.ERROR_NEW_BROKER_PORT));
    });

    socket.write(packetWriter._buffer);
  });
}

function _setSocketTimeoutErrorListeners(callback) {
  const socket = this._socket;

  this.logger.debug('_setSocketTimeoutErrorListeners');

  socket.on('timeout', () => {
    // The `timeout` event listener is a one time only event.
    // Refer to http://nodejs.org/api/net.html#net_socket_settimeout_timeout_callback.

    // `timeout` is emitted (without an error message), if the socket
    // times out from inactivity. This is only to notify that the
    // socket has been idle. That's why we must manually close the
    // connection.
    // We need to force disconnection using `destroy()` function
    // which will ensure that no more I/O activity happens on this
    // socket. In contrast, `end()` function doesn't close the
    // connection immediately; the server may still send some data,
    // which we don't want.
    socket.destroy();

    this.connectionOpened = false;

    callback(new Error(ErrorMessages.ERROR_CONNECTION_TIMEOUT));
  });

  this._socketCurrentEventCallback = callback;

  socket.on('error', (err) => {
    this.logger.debug('socket error', err);
    // As of node 0.10.15 there is a known open bug in Node.js
    // (https://github.com/joyent/node/issues/5851)
    // which escalates the stream write error to the network socket,
    // thus the same error is triggered twice. To handle this case,
    // we need to catch only the first of the two events and ignore
    // the second one. Since the same error object is escalated, we
    // can set a boolean flag whether or not this error has been
    // handled by node-cubrid.
    if (!err.isHandledByNodeCubrid) {
      err.isHandledByNodeCubrid = true;
      socket.setTimeout(0);
      socket.removeAllListeners('timeout')
          .removeAllListeners('data');

      // When `error` event is emitted, the socket client gets automatically
      // closed. So, no need to close it manually.
      this.connectionOpened = false;

      const callback = this._socketCurrentEventCallback;
      this._socketCurrentEventCallback = undefined;

      if (typeof callback === 'function') {
        callback(err);
      } else {
        throw err;
      }
    }
  });

  socket.on('close', () => {
    this.logger.debug('socket close');
    this.connectionOpened = false;

    // Since node-cubrid supports reconnecting to the disconnected
    // server, we do not consider socket disconnection by server
    // as a fatal error. However, if anybody is listening for the
    // disconnect event, we are eager to notify them.
    this.emit('disconnect');
  });
}

/**
 * Login to a database
 * @private
 */
function _doDatabaseLogin() {
  this.logger.debug(`_doDatabaseLogin: connectionBrokerPort = ${this.connectionBrokerPort}`);

  return new Promise((resolve, reject) => {
    let socket;

    let callback = (err) => {
      // Clear connection timeout
      socket.setTimeout(0);
      socket.removeAllListeners('timeout');

      if (err) {
        return reject(err);
      }

      resolve();
    };

    if (this.connectionBrokerPort) {
      // The broker port has changed, so we need to create
      // a new socket connection.
      socket = this._socket = Net.createConnection(this.connectionBrokerPort, this.host);

      socket.setNoDelay(true);
      socket.setTimeout(this.getConnectionTimeout());

      _setSocketTimeoutErrorListeners.call(this, callback);
    } else {
      // The broker port has not been changed. We can reuse the socket.
      socket = this._socket;
    }

    let openDatabasePacket = new OpenDatabasePacket({
      database: this.database,
      user: this.user,
      password: this.password,
      logger: this.logger
    });
    const packetWriter = new PacketWriter(openDatabasePacket.getBufferLength());

    openDatabasePacket.write(packetWriter);

    socket.on('data', _receiveBytes.call(this, {
      parserFunction: _parseDatabaseLoginBuffer.bind(this),
      dataPacket: openDatabasePacket
    }, callback));

    socket.write(packetWriter._buffer);
  });
}

/**
 * Get the server database engine version
 */
function _getEngineVersion() {
  this.logger.debug('_getEngineVersion');

  return new Promise((resolve, reject) => {
    let getEngineVersionPacket = new GetEngineVersionPacket({
      casInfo : this._CASInfo
    });
    const packetWriter = new PacketWriter(getEngineVersionPacket.getBufferLength());
    const socket = this._socket;

    getEngineVersionPacket.write(packetWriter);

    let callback = (err, engineVersion) => {
      if (err) {
        return reject(err);
      }

      resolve(engineVersion);
    };

    this._socketCurrentEventCallback = callback;

    socket.on('data', _receiveBytes.call(this, {
      parserFunction: _parseEngineVersionBuffer.bind(this),
      dataPacket: getEngineVersionPacket
    }, callback));

    socket.write(packetWriter._buffer);
  });
}

/**
 * Connect to database
 * @param callback
 */
CUBRIDConnection.prototype.getActiveHost = function (callback) {
  return this
      .connect()
      .then(() => {
        const host = Object.freeze(this.hosts[this.currentHostIndex]);

        if (typeof callback === 'function') {
          return callback(undefined, host);
        }

        return Promise.resolve(host);
      })
      .catch(err => {
        if (typeof callback === 'function') {
          return callback(err);
        }

        throw err;
      });
};
/**
 * Connect to database
 * @param callback
 */
CUBRIDConnection.prototype.connect = function (callback) {
  this.logger.debug(`connect with timeout = ${this.connectionTimeout} ms.`);
  
  return new Promise((resolve, reject) => {
    if (this.connectionOpened) {
      if (typeof callback === 'function') {
        return callback();
      }

      return resolve();
    }

    if (this.connectionPending) {
      let err = new Error(ErrorMessages.ERROR_CONNECTION_ALREADY_PENDING);

      if (typeof callback === 'function') {
        return callback(err);
      }

      return reject(err);
    }

    this.connectionPending = true;

    let cb = (err) => {
      // Reset query execution status
      this.connectionPending = false;
      this.connectionOpened = typeof err === 'undefined';

      if (typeof callback === 'function') {
        return callback(err);
      }

      if (err) {
        return reject(err);
      }

      resolve();
    };

    _doGetBrokerPort.call(this)
        .then(_doDatabaseLogin.bind(this))
        .then(cb)
        .catch(cb);
  });
};

/**
 * Get the server database engine version
 * @param callback
 */
CUBRIDConnection.prototype.getEngineVersion = function (callback) {
  return this
      .connect()
      .then(_getEngineVersion.bind(this))
      .then(version => {
        if (typeof callback === 'function') {
          return callback(undefined, version);
        }

        return Promise.resolve(version);
      })
      .catch(err => {
        if (typeof callback === 'function') {
          return callback(err);
        }

        throw err;
      });
};

/**
 * Execute SQL statements in batch mode
 * @param sqls
 * @param callback
 */
CUBRIDConnection.prototype.batchExecuteNoQuery = function (sqls, callback) {
  return new Promise((resolve, reject) => {
    this._queue.push(done => {
      this.logger.debug('batchExecuteNoQuery', sqls);

      this.connect()
          .then(() => {
            return _batchExecuteNoQuery.call(this, sqls);
          })
          .then(() => {
            done();

            if (typeof callback === 'function') {
              return callback();
            }

            resolve();
          })
          .catch(err => {
            done();

            if (typeof callback === 'function') {
              return callback(err);
            }

            return reject(err);
          });
    });
  });
};

function _batchExecuteNoQuery(sqls) {
  if (!Array.isArray(sqls)) {
    sqls = [sqls]
  }

  if (!sqls.length) {
    return;
  }

  return new Promise((resolve, reject) => {
    const batchExecuteNoQueryPacket = new BatchExecuteNoQueryPacket({
      autoCommit: this.autoCommitMode,
      casInfo: this._CASInfo,
      logger: this.logger,
      protocolVersion: this.brokerInfo.protocolVersion,
      sqls,
    });
    const packetWriter = new PacketWriter(batchExecuteNoQueryPacket.getBufferLength());
    const socket = this._socket;

    batchExecuteNoQueryPacket.write(packetWriter);

    let callback = (err) => {
      // Propagate the error.
      if (err) {
        return reject(err);
      }

      resolve();
    };

    this._socketCurrentEventCallback = callback;

    socket.on('data', _receiveBytes.call(this, {
      parserFunction: _parseBatchExecuteBuffer.bind(this),
      dataPacket: batchExecuteNoQueryPacket
    }, callback));

    socket.write(packetWriter._buffer);
  });
}

// ## client.execute(sql, params, callback);
// `sql` is a string which represents a WRITE query or an array of strings
// for batch processing.
// `callback(err)` function accepts one argument: an error object if any.
CUBRIDConnection.prototype.execute = function execute(sql, params, callback) {
  const query = new Query(sql, params, callback);

  this.logger.info('execute', query.sql);

  if (this.shouldUseOldQueryProtocol()) {
    return this.executeWithTypedParams(query.sql, undefined, undefined, query.callback);
  }

  return this.batchExecuteNoQuery(query.sql, query.callback);
};

/**
 * Execute sql statement with typed parameters
 * @param sql
 * @param params
 * @param dataTypes
 * @param callback
 * @return {*}
 */
CUBRIDConnection.prototype.executeWithTypedParams = function (sql, params, dataTypes, callback) {
  return new Promise((resolve, reject) => {
    this._queue.push(done => {
      this.logger.debug('executeWithTypedParams', sql, params, dataTypes);

      this.connect()
          .then(() => {
            return prepareExecute.call(this, sql, params, dataTypes);
          })
          .then(() => {
            done();

            if (typeof callback === 'function') {
              return callback();
            }

            resolve();
          })
          .catch(err => {
            done();

            if (typeof callback === 'function') {
              return callback(err);
            }

            return reject(err);
          });
    });
  });
};

function prepareExecute(sql, paramValues, paramTypes) {
  this.logger.debug('prepareExecute', sql, paramValues, paramTypes);

  return new Promise((resolve, reject) => {
    if (Array.isArray(sql)) {
      return reject(new Error(ErrorMessages.ERROR_MULTIPLE_QUERIES));
    }

    const prepareExecutePacket = new PrepareExecutePacket({
      autoCommit: this.autoCommitMode,
      casInfo: this._CASInfo,
      logger: this.logger,
      paramTypes,
      paramValues,
      protocolVersion: this.brokerInfo.protocolVersion,
      sql,
    });
    const packetWriter = new PacketWriter(prepareExecutePacket.getPrepareBufferLength());
    const socket = this._socket;

    prepareExecutePacket.writePrepare(packetWriter);

    let callback = (err, result, queryHandle) => {
      if (err) {
        return reject(err);
      }

      resolve(result ? {
        queryHandle,
        result,
      } : undefined);
    };

    this._socketCurrentEventCallback = callback;

    socket.on('data', _receiveBytes.call(this, {
      parserFunction: _parsePrepareBufferForOldProtocol.bind(this),
      dataPacket: prepareExecutePacket
    }, callback));

    socket.write(packetWriter._buffer);
  });
}

function _receiveBytes(options, cb) {
  this._callback = cb;
  this._parserOptions = options;
  this._parserFunction = options.parserFunction;
  this._totalBuffLength = 0;
  this._buffArr = [];
  this._expectedResponseLength = this._INVALID_RESPONSE_LENGTH;

  return _receiveFirstBytes.bind(this);
}

function _receiveFirstBytes(data) {
  const socket = this._socket;

  // Clear timeout if any.
  socket.setTimeout(0);
  socket.removeAllListeners('timeout');

  this._totalBuffLength += data.length;
  this._buffArr.push(data);

  if (this._expectedResponseLength === this._INVALID_RESPONSE_LENGTH &&
      this._totalBuffLength >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
    let l = this._buffArr.length,
        buff;

    socket.pause();
    socket.removeAllListeners('data');

    if (l > 1) {
      buff = Buffer.concat(this._buffArr, this._totalBuffLength);
      // For later, use this already concatenated buffer.
      // First empty the array: http://stackoverflow.com/a/1234337/556678.
      this._buffArr.length = 0;
      // Then push this buffer in.
      this._buffArr.push(buff);
    } else {
      buff = this._buffArr[0];
    }

    this._expectedResponseLength = Helpers._getExpectedResponseLength(buff);

    if (this._totalBuffLength < this._expectedResponseLength) {
      socket.on('data', _receiveRemainingBytes.bind(this));
      socket.resume();
    } else {
      socket.resume();
      _parseBuffer.call(this);
    }
  }
}

function _receiveRemainingBytes(data) {
  this._totalBuffLength += data.length;
  this._buffArr.push(data);

  // If we have received all the expected data, start parsing it.
  if (this._totalBuffLength === this._expectedResponseLength) {
    _parseBuffer.call(this);
  }
}

function _parseBuffer() {
  this._socket.removeAllListeners('data');

  let packetReader = new PacketReader();
  packetReader.write(Buffer.concat(this._buffArr, this._totalBuffLength));

  this._parserFunction(packetReader);
}

function _parseBufferForNewProtocol(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  const error = dataPacket.parse(packetReader);

  if (error) {
    return this._callback(error);
  }

  const queryHandle = dataPacket.queryHandle;

  this._queryResultSets[queryHandle] = dataPacket;

  this._callback(undefined, dataPacket.resultSet, queryHandle);
}

function _parsePrepareBufferForOldProtocol(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;

  const error = dataPacket.parsePrepare(packetReader);

  if (error) {
    return this._callback(error);
  }

  _parseExecuteForOldProtocol.call(this);
}

function _parseExecuteForOldProtocol() {
  const dataPacket = this._parserOptions.dataPacket;
  const packetWriter = new PacketWriter(dataPacket.getExecuteBufferLength());
  const socket = this._socket;

  dataPacket.writeExecute(packetWriter);

  this._socketCurrentEventCallback = this._callback;

  socket.on('data', _receiveBytes.call(this, {
    parserFunction: _parseExecuteBufferForOldProtocol.bind(this),
    dropDataPacket: this._parserOptions.dropDataPacket,
    dataPacket: dataPacket
  }, this._callback));

  socket.write(packetWriter._buffer);
}

function _parseExecuteBufferForOldProtocol(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  const error = dataPacket.parseExecute(packetReader);

  if (error) {
    return this._callback(error);
  }

  const queryHandle = dataPacket.queryHandle;

  if (dataPacket.resultSet) {
    this._queryResultSets[queryHandle] = dataPacket;
  }

  this._callback(undefined, dataPacket.resultSet, queryHandle);
}

function _parseFetchBuffer(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  const error = dataPacket.parse(packetReader, this._queryResultSets[this._parserOptions.queryHandle]);

  this._callback(error, dataPacket.resultSet);
}

function _parseBatchExecuteBuffer(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  // CAS error.
  let error = dataPacket.parse(packetReader);

  if (!error) {
    // Individual SQL errors.
    if (dataPacket.errors.length) {
      error = dataPacket.errors;
    }
  }

  this._callback(error);
}

function _parseDatabaseLoginBuffer(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  const error = dataPacket.parse(packetReader);

  if (!error) {
    this._CASInfo = dataPacket.casInfo;
    this.sessionId = dataPacket.sessionId;
    this.brokerInfo = dataPacket.brokerInfo;
    this.autoCommitMode = this.AUTOCOMMIT_ON;
  }

  this._callback(error);
}

function _parseEngineVersionBuffer(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  const error = dataPacket.parse(packetReader);

  this._callback(error, dataPacket.engineVersion);
}

function _parseCloseQueryBuffer(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  const error = dataPacket.parse(packetReader);

  this._callback(error);
}

function _parseCloseBuffer(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  const error = dataPacket.parse(packetReader);

  // Close internal socket connection.
  this._socket.destroy();

  this._callback(error);
}

function _parseResponseCodeBuffer(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  const error = dataPacket.parse(packetReader);

  this._callback(error);
}

function _parseGetSchemaBuffer(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  const error = dataPacket.parseRequestSchema(packetReader);

  if (error) {
    return this._callback(error);
  }
  
  _parseWriteFetchSchema.call(this);
}

function _parseWriteFetchSchema() {
  let dataPacket = this._parserOptions.dataPacket,
      packetWriter = new PacketWriter(dataPacket.getFetchSchemaBufferLength()),
      socket = this._socket;

  dataPacket.writeFetchSchema(packetWriter);

  this._socketCurrentEventCallback = this._callback;

  socket.on('data', _receiveBytes.call(this, {
    parserFunction: _parseFetchSchemaBuffer.bind(this),
    dataPacket: dataPacket
  }, this._callback));

  socket.write(packetWriter._buffer);
}

function _parseFetchSchemaBuffer(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  const error = dataPacket.parseFetchSchema(packetReader);

  this._callback(error, dataPacket.schemaInfo);
}

function _parseLobNewBuffer(packetReader) {
  const dataPacket = this._parserOptions.dataPacket;
  const error = dataPacket.parse(packetReader);

  this._callback(error, dataPacket.result);
}

CUBRIDConnection.prototype.queryAll = function (sql, params, callback) {
  const query = new Query(sql, params, callback);

  return this
      .query(query.sql)
      .then(response => {
        const result = response.result;

        return this
            .fetch(response.queryHandle, /* fetch all */true)
            .then(res => {
              const extraValues = res.result && res.result.ColumnValues || undefined;

              if (extraValues) {
                const len = extraValues.length;
                let values = result.ColumnValues;

                for (let i = 0; i < len; ++i) {
                  values.push(extraValues[i]);
                }
              }

              // Auto close the query statement because we have already
              // retrieved all the values.
              return this.closeQuery(res.queryHandle);
            })
            .then(() => {
              if (typeof query.callback === 'function') {
                // Return only the result without the query handle.
                return query.callback(undefined, result);
              }

              return Promise.resolve(result);
            });
      })
      .catch(err => {
        if (typeof query.callback === 'function') {
          return query.callback(err);
        }

        throw err;
      });
};

CUBRIDConnection.prototype.queryAllAsObjects = function (sql, params, callback) {
  const query = new Query(sql, params, callback);

  return this
      .queryAll(query.sql)
      .then(result => {
        result = getObjects(result);

        if (typeof query.callback === 'function') {
          // Return only the result without the query handle.
          return query.callback(undefined, result);
        }

        return Promise.resolve(result);
      })
      .catch(err => {
        if (typeof query.callback === 'function') {
          return query.callback(err);
        }

        throw err;
      });
};

function getObjects(result) {
  const columnNames = result.ColumnNames;
  const columnValues = result.ColumnValues;
  const rowsCount = result.ColumnValues.length;
  const colCount = columnNames.length;

  let arr = new Array(rowsCount);

  for (let i = 0; i < rowsCount; ++i) {
    let row = arr[i] = {};

    let columns = columnValues[i];

    for (let j = 0; j < colCount; ++j) {
      row[columnNames[j]] = columns[j];
    }
  }

  return arr;
}

CUBRIDConnection.prototype.queryAsObjects = function (sql, params, callback) {
  const query = new Query(sql, params, callback);

  return this
      .query(query.sql)
      .then(response => {
        let result = getObjects(response.result);

        if (typeof query.callback === 'function') {
          // Return only the result without the query handle.
          return query.callback(undefined, result, response.queryHandle);
        }

        return Promise.resolve({
          queryHandle: response.queryHandle,
          result,
        });
      })
      .catch(err => {
        if (typeof query.callback === 'function') {
          return query.callback(err);
        }

        throw err;
      });
};

CUBRIDConnection.prototype.query = function (sql, params, callback) {
  return new Promise((resolve, reject) => {
    this._queue.push(done => {
      const query = new Query(sql, params, callback);

      this.logger.info('query', query.sql);

      this.connect()
          .then(() => {
            if (this.shouldUseOldQueryProtocol()) {
              return prepareExecute.call(this, query.sql);
            }

            return _queryNewProtocol.call(this, query.sql);
          })
          .then(response => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(undefined, response.result, response.queryHandle);
            }

            resolve(response);
          })
          .catch(err => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(err);
            }

            return reject(err);
          });
    });
  });
};

function _queryNewProtocol(sql) {
  this.logger.debug('_queryNewProtocol');

  return new Promise((resolve, reject) => {
    const executeQueryPacket = new ExecuteQueryPacket({
      autoCommit: this.autoCommitMode,
      casInfo: this._CASInfo,
      logger: this.logger,
      protocolVersion: this.brokerInfo.protocolVersion,
      sql,
    });
    const packetWriter = new PacketWriter(executeQueryPacket.getBufferLength());
    const socket = this._socket;

    executeQueryPacket.write(packetWriter);

    let callback = (err, result, queryHandle) => {
      if (err) {
        return reject(err);
      }

      resolve({
        queryHandle,
        result,
      });
    };

    this._socketCurrentEventCallback = callback;

    // `_receiveBytes()` will return a function which will process the
    // incoming data.
    socket.on('data', _receiveBytes.call(this, {
      sql: sql,
      parserFunction: _parseBufferForNewProtocol.bind(this),
      dataPacket: executeQueryPacket
    }, callback));

    socket.write(packetWriter._buffer);
  });
}

/**
 * Fetch query next rows results
 * @param queryHandle
 * @param callback
 */
CUBRIDConnection.prototype.fetch = function (queryHandle, all, callback) {
  return new Promise((resolve, reject) => {
    this._queue.unshift(done => {
      if (typeof all === 'function') {
        callback = all;
        all = false;
      }

      const query = new Query(callback);

      this.logger.info(`fetch: queryHandle = ${queryHandle}`);

      this.connect()
          .then(() => {
            return _fetch.call(this, queryHandle, all);
          })
          .then(response => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(undefined, response.result, response.queryHandle);
            }

            resolve(response);
          })
          .catch(err => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(err);
            }

            return reject(err);
          });
    });
  });
};

function _fetch(queryHandle, all) {
  return new Promise((resolve, reject) => {
    const packet = this._queryResultSets[queryHandle];
    let results = null;

    if (!packet) {
      return reject(new Error(ErrorMessages.ERROR_NO_ACTIVE_QUERY));
    }

    let fetchSome = (err, result) => {
      if (err) {
        return reject(err);
      }

      if (result) {
        // If we could fetch some data, add them to the existing list.
        if (results) {
          let values = results.ColumnValues;
          const extraValues = result.ColumnValues;

          for (let i = 0, len = extraValues.length; i < len; ++i) {
            values.push(extraValues[i]);
          }
        } else {
          results = result;
        }
      }

      // If there is no more data left to fetch, return what we could retrieve.
      // Or we have received the first batch of results and the user
      // has not requested to retrieve all values, then return what
      // we have.
      if (packet.currentTupleCount === packet.totalTupleCount || results && !all) {
        return resolve({
          queryHandle,
          result: results,
        });
      }

      const fetchPacket = new FetchPacket({
        casInfo: this._CASInfo,
        logger: this.logger,
      });
      const packetWriter = new PacketWriter(fetchPacket.getBufferLength());
      const socket = this._socket;

      fetchPacket.write(packetWriter, packet);

      socket.on('data', _receiveBytes.call(this, {
        queryHandle,
        parserFunction: _parseFetchBuffer.bind(this),
        dataPacket: fetchPacket
      }, fetchSome));

      socket.write(packetWriter._buffer);
    };

    this._socketCurrentEventCallback = fetchSome;

    fetchSome(undefined, null);
  });
}

/**
 * Close query. It is important to close every query because CUBRID Broker
 * (CAS actually that was assigned to this connection by the Broker) will
 * keep the memory occupied by the query. The query statement resources
 * will get closed automatically only on disconnection. Until then the
 * query resources will be kept in memory. If not released on time, OOM
 * (Out Of Memory) issue can be caused on the server side.
 * @param queryHandle
 * @param callback
 */
CUBRIDConnection.prototype.closeQuery = function (queryHandle, callback) {
  return new Promise((resolve, reject) => {
    this._queue.unshift(done => {
      this.logger.debug('closeQuery', queryHandle);

      this.connect()
          .then(() => {
            return _closeQuery.call(this, queryHandle);
          })
          .then(() => {
            done();

            if (typeof callback === 'function') {
              return callback();
            } 
            
            resolve();
          })
          .catch(err => {
            done();

            if (typeof callback === 'function') {
              return callback(err);
            }

            return reject(err);
          });
    });
  });
};

function _closeQuery(queryHandle) {
  return new Promise((resolve, reject) => {
    let queryResultSets = this._queryResultSets;

    if (!queryResultSets[queryHandle]) {
      return reject(new Error(`${ErrorMessages.ERROR_NO_ACTIVE_QUERY}: ${queryHandle}`));
    }

    let closeQueryPacket = new CloseQueryPacket({
      casInfo: this._CASInfo,
      reqHandle: queryHandle,
    });
    const packetWriter = new PacketWriter(closeQueryPacket.getBufferLength());
    const socket = this._socket;

    closeQueryPacket.write(packetWriter);

    function onResponse(err) {
      // Remove the event we've previously bound to.
      socket.removeListener('end', onConnectionReset);

      if (err) {
        return reject(err);
      }

      // Remove the referenced query packet from the hash.
      delete queryResultSets[queryHandle];

      resolve();
    }

    function onConnectionReset() {
      // CUBRID Broker may occasionally reset the connection between the client and the
      // CAS that the Broker has assigned to this client. Refer to
      // https://github.com/CUBRID/node-cubrid/issues/15 for details. According to
      // CUBRID CCI native driver implementation function qe_send_close_handle_msg(),
      // we can consider the connection closed operation as a successful request.
      // This is true because internally CUBRID Broker manages a pool of CAS
      // (CUBRID Application Server) processes. When a client connects, the Broker
      // assigns/connect it to one of the CAS. Then the client sends some query requests
      // to this CAS. After the client receives a response, it may decide to do some
      // other application logic before it closes the query handle. Once the client is
      // done with the response, it may try to close the query handle.
      // In between these receive response and close query, CUBRID Broker may reassign
      // the CAS to another client. Notice the client-Broker connection is not broken.
      // When the actual close query request arrives to the Broker, it finds out that
      // the CAS referred by the client is reassigned, it sends CONNECTION RESET to the
      // client. node-cubrid should listen it and consider such event as if the close
      // query request was successful.
      socket.removeAllListeners('data');
      // Execute `onResponse` without an error.
      onResponse();
    }

    function onError(err) {
      socket.removeAllListeners('data');

      // `ECONNRESET` should also be considered as a connection
      // reset.
      onResponse(err.code == 'ECONNRESET' ? undefined : err);
    }

    this._socketCurrentEventCallback = onError;

    socket.on('data', _receiveBytes.call(this, {
      queryHandle: queryHandle,
      parserFunction: _parseCloseQueryBuffer.bind(this),
      dataPacket: closeQueryPacket
    }, onResponse));

    socket.on('end', onConnectionReset);

    socket.write(packetWriter._buffer);
  });
}

CUBRIDConnection.prototype.getMetaData = function (queryHandle, callback) {
  return new Promise((resolve, reject) => {
    const queryResultSet = this._queryResultSets[queryHandle];

    if (!queryResultSet) {
      let err = new Error(ErrorMessages.ERROR_NO_ACTIVE_QUERY);

      if (typeof callback === 'function') {
        return callback(err);
      }

      return reject(err);
    }

    if (typeof callback === 'function') {
      return callback(undefined, queryResultSet.resultSet);
    }

    resolve(queryResultSet.resultSet);
  });
};

/**
 * Closes the active connection.
 * @alias end()
 * @param callback
 */
CUBRIDConnection.prototype.close = close;
CUBRIDConnection.prototype.end = close;

function close(callback) {
  return new Promise((resolve, reject) => {
    this.logger.debug('close');

    if (!this.connectionOpened) {
      // If the connection has already been closed, no need to emit
      // the error. After all this is what the client wants - to
      // close the connection.
      if (typeof callback === 'function') {
        return callback();
      }

      return resolve();
    }

    // Remove all pending requests.
    this._queue.empty();

    let promise = Promise.resolve();

    // Close open queries.
    const queryHandles = Object.keys(this._queryResultSets);

    queryHandles.forEach(queryHandle => {
      promise = promise.then(() => {
        return this.closeQuery(queryHandle);
      });
    });

    let closeConnection = () => {
      return new Promise((resolve, reject) => {
        let closeDatabasePacket = new CloseDatabasePacket({
          casInfo: this._CASInfo,
        });
        const packetWriter = new PacketWriter(closeDatabasePacket.getBufferLength());
        const socket = this._socket;

        closeDatabasePacket.write(packetWriter);

        let callback = (err) => {
          // Propagate the error.
          if (err) {
            return reject(err);
          }

          resolve();
        };

        // `_socketCurrentEventCallback` is called only when
        // an unexpected error is thrown on the socket layer.
        this._socketCurrentEventCallback = callback;

        socket.on('data', _receiveBytes.call(this, {
          parserFunction: _parseCloseBuffer.bind(this),
          dataPacket: closeDatabasePacket
        }, callback));

        socket.write(packetWriter._buffer);
      });
    };

    // Close the connection.
    promise
        .then(closeConnection)
        .then(() => {
          // Reset connection status
          this.connectionPending = false;
          this.connectionOpened = false;

          if (typeof(callback) === 'function') {
            return callback();
          }

          resolve();
        })
        .catch(err => {
          if (typeof(callback) === 'function') {
            return callback(err);
          }

          reject(err);
        });
  });
}
/**
 * Start transaction
 * @param callback
 */
CUBRIDConnection.prototype.beginTransaction = function (callback) {
  return this.setAutoCommitMode(this.AUTOCOMMIT_OFF, callback);
};

/**
 * End transaction
 * @param callback
 */
CUBRIDConnection.prototype.endTransaction = function (callback) {
  return this.setAutoCommitMode(this.AUTOCOMMIT_ON, callback);
};

/**
 * Set session auto-commit mode
 * @param autoCommitMode
 * @param callback
 */
CUBRIDConnection.prototype.setAutoCommitMode = function (autoCommitMode, callback) {
  return new Promise(resolve => {
    // Accept any truthful value.
    this.autoCommitMode = !!autoCommitMode;

    if (typeof callback === 'function') {
      return callback();
    }

    return resolve();
  });
};

/**
 * Get session auto-commit mode
 */
CUBRIDConnection.prototype.getAutoCommitMode = function () {
  return this.autoCommitMode;
};

/**
 * Rollback transaction
 * @param callback
 */
CUBRIDConnection.prototype.rollback = function (callback) {
  return new Promise((resolve, reject) => {
    this._queue.unshift(done => {
      _rollback
          .call(this)
          .then(() => {
            done();
            
            if (typeof callback === 'function') {
              return callback();
            }

            return resolve();
          })
          .catch(err => {
            done();

            if (typeof callback === 'function') {
              return callback(err);
            }

            reject(err);
          });
    });
  });
};

function _rollback() {
  return new Promise((resolve, reject) => {
    if (this.autoCommitMode) {
      return reject(new Error(ErrorMessages.ERROR_NO_ROLLBACK));
    }

    const rollbackPacket = new RollbackPacket({
      casInfo: this._CASInfo,
    });
    const packetWriter = new PacketWriter(rollbackPacket.getBufferLength());
    const socket = this._socket;

    rollbackPacket.write(packetWriter);

    let callback = (err) => {
      if (err) {
        return reject(err);
      }

      resolve();
    };

    this._socketCurrentEventCallback = callback;

    socket.on('data', _receiveBytes.call(this, {
      parserFunction: _parseResponseCodeBuffer.bind(this),
      dataPacket: rollbackPacket
    }, callback));

    socket.write(packetWriter._buffer);
  });
}

/**
 * Commit transaction
 * @param callback
 */
CUBRIDConnection.prototype.commit = function (callback) {
  return new Promise((resolve, reject) => {
    // `commit` request should be higher priority so that
    // we can free the memory on the server side as soon
    // as we can.
    this._queue.unshift(done => {
      this.logger.debug('commit');

      let cb = (err) => {
        done();

        if (typeof callback === 'function') {
          return callback(err);
        }

        if (err) {
          return reject(err);
        }

        resolve();
      };

      if (!this.connectionOpened) {
        return cb(new Error(ErrorMessages.ERROR_CLOSED_CONNECTION_COMMIT));
      }

      if (this.autoCommitMode) {
        return cb(new Error(ErrorMessages.ERROR_AUTO_COMMIT_ENABLED_COMMIT));
      }

      const commitPacket = new CommitPacket({
        casInfo: this._CASInfo,
      });
      const packetWriter = new PacketWriter(commitPacket.getBufferLength());
      const socket = this._socket;

      commitPacket.write(packetWriter);

      this._socketCurrentEventCallback = cb;

      socket.on('data', _receiveBytes.call(this, {
        parserFunction: _parseResponseCodeBuffer.bind(this),
        dataPacket: commitPacket
      }, cb));

      socket.write(packetWriter._buffer);
    });
  });
};

/**
 * Get database schema information
 * @param schemaType
 * @param tableNameFilter
 * @param callback
 */
CUBRIDConnection.prototype.getSchema = function (schemaType, tableNameFilter, callback) {
  return new Promise((resolve, reject) => {
    this._queue.push(done => {
      if (typeof tableNameFilter === 'function') {
        callback = tableNameFilter;
        tableNameFilter = undefined;
      }
      
      const query = new Query(callback);

      this.logger.debug(`getSchema: schemaType = ${schemaType}; tableNameFilter = ${tableNameFilter}.`);

      this.connect()
          .then(() => {
            return _getSchema.call(this, schemaType, tableNameFilter);
          })
          .then(response => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(undefined, response);
            }

            resolve(response);
          })
          .catch(err => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(err);
            }

            return reject(err);
          });
    });
  });
};

function _getSchema(schemaType, tableNameFilter) {
  this.logger.debug('_getSchema', schemaType, tableNameFilter);

  return new Promise((resolve, reject) => {
    const getSchemaPacket = new GetSchemaPacket({
      casInfo: this._CASInfo,
      protocolVersion: this.brokerInfo.protocolVersion,
      schemaType: schemaType,
      shardId: this.shardId,
      tableNamePattern: tableNameFilter,
    });
    const packetWriter = new PacketWriter(getSchemaPacket.getRequestSchemaBufferLength());
    const socket = this._socket;

    getSchemaPacket.writeRequestSchema(packetWriter);

    let callback = (err, result) => {
      if (err) {
        return reject(err);
      }

      resolve(result);
    };

    this._socketCurrentEventCallback = callback;

    socket.on('data', _receiveBytes.call(this, {
      parserFunction: _parseGetSchemaBuffer.bind(this),
      dataPacket: getSchemaPacket
    }, callback));

    socket.write(packetWriter._buffer);
  });
}

/**
 * Create a new LOB object
 * @param lobType
 * @param callback
 */
CUBRIDConnection.prototype.lobNew = function (lobType, callback) {
  return new Promise((resolve, reject) => {
    this._queue.push(done => {
      const query = new Query(callback);

      this.logger.debug(`lobNew: lobType = ${lobType}.`);

      this.connect()
          .then(() => {
            return _lobNew.call(this, lobType);
          })
          .then(lobObject => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(undefined, lobObject);
            }

            resolve(lobObject);
          })
          .catch(err => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(err);
            }

            return reject(err);
          });
    });
  });
};

function _lobNew(lobType) {
  this.logger.debug('_lobNew', lobType);

  return new Promise((resolve, reject) => {
    const lobNewPacket = new LOBNewPacket({
      casInfo: this._CASInfo,
      lobType,
    });
    const packetWriter = new PacketWriter(lobNewPacket.getBufferLength());
    const socket = this._socket;

    lobNewPacket.write(packetWriter);

    let callback = (err, result) => {
      if (err) {
        return reject(err);
      }

      resolve(result);
    };

    this._socketCurrentEventCallback = callback;

    socket.on('data', _receiveBytes.call(this, {
      parserFunction: _parseLobNewBuffer.bind(this),
      dataPacket: lobNewPacket
    }, callback));

    socket.write(packetWriter._buffer);
  });
}

/**
 * Write data to a LOB object
 * @param lobObject
 * @param offset
 * @param data
 * @param callback
 */
CUBRIDConnection.prototype.lobWrite = function (lobObject, offset, data, callback) {
  return new Promise((resolve, reject) => {
    this._queue.push(done => {
      const query = new Query(callback);

      this.logger.debug('lobNew');

      this.connect()
          .then(() => {
            return _lobWrite.call(this, lobObject, offset, data);
          })
          .then(response => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(undefined, response.lobObject, response.length);
            }

            resolve(response);
          })
          .catch(err => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(err);
            }

            return reject(err);
          });
    });
  });
};

function _lobWrite(lobObject, offset, data) {
  this.logger.debug('_lobWrite', lobObject, offset);

  return new Promise((resolve, reject) => {
    // Ensure sequential write.
    if (lobObject.lobLength !== offset) {
      return reject(new Error(ErrorMessages.ERROR_INVALID_LOB_POSITION));
    }

    if (typeof data !== 'string' && !Buffer.isBuffer(data)) {
      return reject(new Error(ErrorMessages.ERROR_INVALID_LOB_DATA));
    }

    if (typeof data === 'string') {
      // Convert CLOB into a binary buffer.
      data = Helpers.getBufferFromString(data);
    }

    let totalWriteLen = 0;

    const totalBytesToWrite = data.length;
    const writeLen = Math.min(totalBytesToWrite, this._LOB_MAX_IO_LENGTH);

    const callback = (err) => {
      this._socketCurrentEventCallback = undefined;

      if (err) {
        return reject(err);
      }

      lobObject.lobLength = offset;

      resolve({
        lobObject,
        length: offset,
      });
    };

    this._socketCurrentEventCallback = callback;

    let continueWriting = (err) => {
      if (err || totalWriteLen >= totalBytesToWrite) {
        return callback(err);
      }
      
      const lobWritePacket = new LOBWritePacket({
        casInfo: this._CASInfo,
        data: data.slice(offset, offset + writeLen),
        lobObject,
        offset,
      });
      const packetWriter = new PacketWriter(lobWritePacket.getBufferLength());
      const socket = this._socket;

      let buffArr = [];
      let totalBuffLength = 0;
      let expectedResponseLength = this._INVALID_RESPONSE_LENGTH;

      lobWritePacket.write(packetWriter);

      socket.on('data', (data) => {
        totalBuffLength += data.length;
        buffArr.push(data);

        if (expectedResponseLength === this._INVALID_RESPONSE_LENGTH &&
            totalBuffLength >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
          const l = buffArr.length;
          let buff;

          if (l > 1) {
            buff = Buffer.concat(buffArr, totalBuffLength);
            // For later, use this already concatenated buffer.
            // First empty the array: http://stackoverflow.com/a/1234337/556678.
            buffArr.length = 0;
            // Then push this buffer in.
            buffArr.push(buff);
          } else {
            buff = buffArr[0];
          }

          expectedResponseLength = Helpers._getExpectedResponseLength(buff);
        }

        if (totalBuffLength === expectedResponseLength) {
          socket.removeAllListeners('data');

          const packetReader = new PacketReader();
          packetReader.write(Buffer.concat(buffArr, totalBuffLength));

          const error = lobWritePacket.parse(packetReader);

          if (!error) {
            const realWriteLen = lobWritePacket.bytesWritten;
            offset += realWriteLen;
            totalWriteLen += realWriteLen;
          }

          continueWriting(error);
        }
      });

      socket.write(packetWriter._buffer);
    };

    continueWriting();
  });
}

/**
 * Read a LOB object from the database
 * @param lobObject
 * @param offset
 * @param length
 * @param callback
 */
CUBRIDConnection.prototype.lobRead = function (lobObject, offset, length, callback) {
  return new Promise((resolve, reject) => {
    this._queue.push(done => {
      const query = new Query(callback);

      this.logger.debug('lobNew');

      this.connect()
          .then(() => {
            return _lobRead.call(this, lobObject, offset, length);
          })
          .then(response => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(undefined, response.data, response.length);
            }

            resolve(response);
          })
          .catch(err => {
            done();

            if (typeof query.callback === 'function') {
              return query.callback(err);
            }

            return reject(err);
          });
    });
  });
};

function _lobRead(lobObject, offset, length) {
  this.logger.debug('_lobRead', lobObject, offset, length);

  return new Promise((resolve, reject) => {
    if (lobObject.lobLength < offset + length) {
      return reject(new Error(ErrorMessages.ERROR_INVALID_LOB_POSITION));
    }

    let buffers = [];
    let totalReadLen = 0;

    const callback = (err) => {
      this._socketCurrentEventCallback = undefined;

      if (err) {
        return reject(err);
      }

      buffers = Buffer.concat(buffers, totalReadLen);

      if (lobObject.lobType === CASConstants.CUBRIDDataType.CCI_U_TYPE_CLOB) {
        buffers = buffers.toString();
      }

      resolve({
        data: buffers,
        length: totalReadLen,
      });
    };

    this._socketCurrentEventCallback = callback;

    let continueReading = (err) => {
      if (err || length <= totalReadLen) {
        return callback(err);
      }

      const lobReadPacket = new LOBReadPacket({
        casInfo: this._CASInfo,
        bytesToRead: length - totalReadLen,
        lobObject,
        offset,
      });
      const packetWriter = new PacketWriter(lobReadPacket.getBufferLength());
      const socket = this._socket;

      let buffArr = [];
      let expectedResponseLength = this._INVALID_RESPONSE_LENGTH;
      let totalBuffLength = 0;

      lobReadPacket.write(packetWriter);

      socket.on('data', (data) => {
        totalBuffLength += data.length;
        buffArr.push(data);

        if (expectedResponseLength === this._INVALID_RESPONSE_LENGTH &&
            totalBuffLength >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
          const l = buffArr.length;
          let buff;

          if (l > 1) {
            buff = Buffer.concat(buffArr, totalBuffLength);
            // For later, use this already concatenated buffer.
            // First empty the array: http://stackoverflow.com/a/1234337/556678.
            buffArr.length = 0;
            // Then push this buffer in.
            buffArr.push(buff);
          } else {
            buff = buffArr[0];
          }

          expectedResponseLength = Helpers._getExpectedResponseLength(buff);
        }

        if (totalBuffLength === expectedResponseLength) {
          socket.removeAllListeners('data');

          const packetReader = new PacketReader();

          packetReader.write(Buffer.concat(buffArr, totalBuffLength));

          const error = lobReadPacket.parse(packetReader);

          if (!error) {
            const realReadLen = lobReadPacket.readLength;

            // The actual data stored in CUBRID may be empty.
            if (realReadLen === 0) {
              length = 0;
            } else {
              // The data received from the server can be partial.
              // So if we haven't received enough data, we need
              // to keep requesting.
              offset += realReadLen;
              totalReadLen += realReadLen;
            }

            buffers.push(lobReadPacket.lobBuffer);
          }

          setImmediate(continueReading.bind(this, error));
        }
      });

      socket.write(packetWriter._buffer);
    };

    continueReading();
  });
}

/**
 * Set connection timeout value in milliseconds.
 * 1. If the value is <= 0, the timeout is reset to none. In this case,
 * according to our observations, the underlying Node.js network socket
 * times out in about 75 seconds (1 minute 15 seconds).
 * @param timeout (msec)
 */
CUBRIDConnection.prototype.setConnectionTimeout = function (timeout) {
  this.connectionTimeout = timeout > 0 ? timeout : 0;
};

/**
 * Returns the connection timeout
 * @return {Number} (.msec)
 */
CUBRIDConnection.prototype.getConnectionTimeout = function () {
  return this.connectionTimeout;
};

/**
 * Set a database parameter
 * @param parameter id
 * @param value
 * @param callback
 */
CUBRIDConnection.prototype.setDatabaseParameter = function (parameter, value, callback) {
  return new Promise((resolve, reject) => {
    this._queue.push((done) => {
      this
          .connect()
          .then(() => {
            return _setDatabaseParameter.call(this, parameter, value);
          })
          .then(() => {
            done();

            if (typeof callback === 'function') {
              return callback();
            }

            resolve();
          })
          .catch(err => {
            done();

            if (typeof callback === 'function') {
              return callback(err);
            }

            reject(err);
          });
    });
  });
};

function _setDatabaseParameter(parameter, value) {
  return new Promise((resolve, reject) => {
    if (parameter === CASConstants.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH) {
      // The `CCI_PARAM_MAX_STRING_LENGTH` parameter **cannot** be set
      // programmatically from code as it is a CUBRID Broker parameter
      // and the client can only query its current value.
      let error = new Error();
      error.code = -1011;
      error.message = ErrorMessages.resolveErrorCode(error.code);

      return reject(error);
    }

    const setDbParameterPacket = new SetDbParameterPacket({
      casInfo: this._CASInfo,
      parameter,
      value
    });
    const packetWriter = new PacketWriter(setDbParameterPacket.getBufferLength());
    const socket = this._socket;

    setDbParameterPacket.write(packetWriter);

    let callback = (err) => {
      if (err) {
        return reject(err);
      }

      resolve();
    };

    this._socketCurrentEventCallback = callback;

    socket.on('data', _receiveBytes.call(this, {
      parserFunction: _parseResponseCodeBuffer.bind(this),
      dataPacket: setDbParameterPacket
    }, callback));

    socket.write(packetWriter._buffer);
  });
}

/**
 * Get a database parameter
 * @param parameter id
 * @param callback
 */
CUBRIDConnection.prototype.getDatabaseParameter = function (parameter, callback) {
  return new Promise((resolve, reject) => {
    this._queue.push((done) => {
      this
          .connect()
          .then(() => {
            return _getDatabaseParameter.call(this, parameter);
          })
          .then(value => {
            done();

            if (typeof callback === 'function') {
              return callback(undefined, value);
            }

            resolve(value);
          })
          .catch(err => {
            done();

            if (typeof callback === 'function') {
              return callback(err);
            }

            reject(err);
          });
    });
  });
};

function _getDatabaseParameter(parameter) {
  return new Promise((resolve, reject) => {
    if (parameter === CASConstants.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH) {
      let error = new Error();
      error.code = -1011;
      error.message = ErrorMessages.resolveErrorCode(error.code);

      return reject(error);
    }

    const getDbParameterPacket = new GetDbParameterPacket({
      casInfo: this._CASInfo,
      parameter,
    });
    const packetWriter = new PacketWriter(getDbParameterPacket.getBufferLength());
    const socket = this._socket;

    getDbParameterPacket.write(packetWriter);

    let callback = (err) => {
      if (err) {
        return reject(err);
      }

      resolve(getDbParameterPacket.value);
    };

    this._socketCurrentEventCallback = callback;

    socket.on('data', _receiveBytes.call(this, {
      parserFunction: _parseResponseCodeBuffer.bind(this),
      dataPacket: getDbParameterPacket
    }, callback));

    socket.write(packetWriter._buffer);
  });
}

/**
 * Set the protocol to be used for queries execution.
 * If set to true, the driver will use the (old) 8.4.x protocol.
 * If set to false, the driver will use the newer 9.x protocol.
 * @param enforceOldProtocol
 */
CUBRIDConnection.prototype.setEnforceOldQueryProtocol = function (enforceOldProtocol) {
  this.logger.info('setEnforceOldQueryProtocol', enforceOldProtocol);

  this._ENFORCE_OLD_QUERY_PROTOCOL = enforceOldProtocol;
};

/**
 * Returns the protocol used for queries execution.
 * If true, the driver uses the (old) 8.4.x protocol.
 * If false, the driver uses the newer 9.x protocol.
 */
CUBRIDConnection.prototype.shouldUseOldQueryProtocol = function () {
  return !!this._ENFORCE_OLD_QUERY_PROTOCOL;
};

/**
 * Return true if there are pending queries in the queries queue
 * @return {Boolean}
 */
CUBRIDConnection.prototype.isQueueEmpty = function () {
  return this._queue.isEmpty();
};

CUBRIDConnection.prototype.getQueueDepth = function () {
  return this._queue.getDepth();
};

module.exports = CUBRIDConnection;
