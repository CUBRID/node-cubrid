var Net = require('net'),
  EventEmitter = require('events').EventEmitter,
  Util = require('util'),
  ErrorMessages = require('./constants/ErrorMessages'),
  DATA_TYPES = require('./constants/DataTypes'),
  CASConstants = require('./constants/CASConstants'),
  PacketReader = require('./packets/PacketReader'),
  PacketWriter = require('./packets/PacketWriter'),
  ActionQueue = require('./utils/ActionQueue'),
  Helpers = require('../src/utils/Helpers'),
  Cache = require('../src/utils/Cache');

var ClientInfoExchangePacket = require('./packets/' + '/ClientInfoExchangePacket'),
  OpenDatabasePacket = require('./packets/' + '/OpenDatabasePacket'),
  GetEngineVersionPacket = require('./packets/' + '/GetEngineVersionPacket'),
  ExecuteQueryPacket = require('./packets/' + '/ExecuteQueryPacket'),
  GetSchemaPacket = require('./packets/' + '/GetSchemaPacket.js'),
  CloseQueryPacket = require('./packets/' + '/CloseQueryPacket'),
  BatchExecuteNoQueryPacket = require('./packets/' + '/BatchExecuteNoQueryPacket'),
  CloseDatabasePacket = require('./packets/' + '/CloseDatabasePacket'),
  FetchPacket = require('./packets/' + '/FetchPacket'),
  SetAutoCommitModePacket = require('./packets/' + '/SetAutoCommitModePacket'),
  RollbackPacket = require('./packets/' + '/RollbackPacket'),
  CommitPacket = require('./packets/' + '/CommitPacket'),
  LOBReadPacket = require('./packets/' + '/LOBReadPacket'),
  LOBNewPacket = require('./packets/' + '/LOBNewPacket'),
  LOBWritePacket = require('./packets/' + '/LOBWritePacket'),
  SetDbParameterPacket = require('./packets/' + '/SetDbParameterPacket'),
  GetDbParameterPacket = require('./packets/' + '/GetDbParameterPacket'),
  PrepareExecuteOldProtocolPacket = require('./packets/' + '/PrepareExecuteOldProtocolPacket');

module.exports = CUBRIDConnection;

// Support custom events
Util.inherits(CUBRIDConnection, EventEmitter);

/**
 * Create a new CUBRID connection instance
 * @param brokerServer
 * @param brokerPort
 * @param user
 * @param password
 * @param database
 * @param cacheTimeout
 * @constructor
 */
function CUBRIDConnection(brokerServer, brokerPort, user, password, database, cacheTimeout) {
  // Using EventEmitter.call on an object will do the setup of instance methods / properties
  // (not inherited) of an EventEmitter.
  // It is similar in purpose to super(...) in Java or base(...) in C#, but it is not implicit in Javascript.
  // Because of this, we must manually call it ourselves:
  EventEmitter.call(this);

  this._queryCache = null;
  if (typeof cacheTimeout !== 'undefined' && cacheTimeout > 0) {
    this._queryCache = new Cache();
  }

  this._socket = new Net.Socket();

  // Connection parameters
  this.brokerServer = brokerServer || 'localhost';
  this.initialBrokerPort = brokerPort || 33000;
  this.connectionBrokerPort = -1;
  this.user = user || 'public';
  this.password = password || '';
  this.database = database || 'demodb';

  // Session public variables
  this.autoCommitMode = null; // Will be initialized on connect
  this.sessionId = 0;

  // Execution semaphore variables; prevent double-connect-attempts, overlapping-queries etc.
  this.connectionOpened = false;
  this.connectionPending = false;
  this.queryPending = false;

  // Driver events
  this.EVENT_ERROR = 'error';
  this.EVENT_CONNECTED = 'connect';
  this.EVENT_ENGINE_VERSION_AVAILABLE = 'engine version';
  this.EVENT_BATCH_COMMANDS_COMPLETED = 'batch execute done';
  this.EVENT_QUERY_DATA_AVAILABLE = 'query data';
  this.EVENT_SCHEMA_DATA_AVAILABLE = 'schema data';
  this.EVENT_FETCH_DATA_AVAILABLE = 'fetch';
  this.EVENT_FETCH_NO_MORE_DATA_AVAILABLE = 'fetch done';
  this.EVENT_BEGIN_TRANSACTION = 'begin transaction';
  this.EVENT_SET_AUTOCOMMIT_MODE_COMPLETED = 'set autocommit mode';
  this.EVENT_COMMIT_COMPLETED = 'commit';
  this.EVENT_ROLLBACK_COMPLETED = 'rollback';
  this.EVENT_QUERY_CLOSED = 'close query';
  this.EVENT_CONNECTION_CLOSED = 'close';
  this.EVENT_LOB_READ_COMPLETED = 'LOB read completed';
  this.EVENT_LOB_NEW_COMPLETED = 'LOB new completed';
  this.EVENT_LOB_WRITE_COMPLETED = 'LOB write completed';
  this.EVENT_SET_DB_PARAMETER_COMPLETED = 'set db parameter completed';
  this.EVENT_GET_DB_PARAMETER_COMPLETED = 'get db parameter completed';

  // Auto-commit constants
  this.AUTOCOMMIT_ON = true;
  this.AUTOCOMMIT_OFF = !this.AUTOCOMMIT_ON;

  // Database schema variables
  this.SCHEMA_TABLE = CASConstants.CUBRIDSchemaType.CCI_SCH_CLASS;
  this.SCHEMA_VIEW = CASConstants.CUBRIDSchemaType.CCI_SCH_VCLASS;
  this.SCHEMA_ATTRIBUTE = CASConstants.CUBRIDSchemaType.CCI_SCH_ATTRIBUTE;
  this.SCHEMA_CONSTRAINT = CASConstants.CUBRIDSchemaType.CCI_SCH_CONSTRAIT;
  this.SCHEMA_PRIMARY_KEY = CASConstants.CUBRIDSchemaType.CCI_SCH_PRIMARY_KEY;
  this.SCHEMA_IMPORTED_KEYS = CASConstants.CUBRIDSchemaType.CCI_SCH_IMPORTED_KEYS;
  this.SCHEMA_EXPORTED_KEYS = CASConstants.CUBRIDSchemaType.CCI_SCH_EXPORTED_KEYS;
  this.SCHEMA_CLASS_PRIVILEGE = CASConstants.CUBRIDSchemaType.CCI_SCH_CLASS_PRIVILEGE;

  // LOB types variables
  this.LOB_TYPE_BLOB = CASConstants.CUBRIDDataType.CCI_U_TYPE_BLOB;
  this.LOB_TYPE_CLOB = CASConstants.CUBRIDDataType.CCI_U_TYPE_CLOB;

  this._CASInfo = [0, 0xFF, 0xFF, 0xFF];
  this._queriesPacketList = [];
  this._INVALID_RESPONSE_LENGTH = -1;
  this._PREVENT_CONCURRENT_REQUESTS = true;
  this._LOB_MAX_IO_LENGTH = 128 * 1024;

  // Database engine version
  this._DB_ENGINE_VER = '';

  // Timeout values (msec.)
  this._CONNECTION_TIMEOUT = 0;

  // Enforce execute query using the old protocol
  this._ENFORCE_OLD_QUERY_PROTOCOL = false;

  // Each element in the queries queue array contains:
  // 0:query handle, 1:sql, 2:query status, 3:callback to call when done
  this._queriesQueue = [];
  this._QUERY_INFO = {
    HANDLE   : 0,
    SQL      : 1,
    STATUS   : 2,
    CALLBACK : 3,
    SQL_TYPE : 4
  };

  this._QUERY_STATUS = {
    NOT_STARTED  : 0,
    IN_EXECUTION : 1,
    CLOSED       : 2
  };

  this._SQL_TYPE = {
    IS_QUERY     : 0,
    IS_NON_QUERY : 1
  };

  // Queries queue check interval (msec.)
  // You can try to reduce this value to speed-up queries queue processing
  // However, a small value will introduce a memory overhead and potential queries collision side effects
  this._QUERIES_QUEUE_CHECK_INTERVAL = 1000;

  // Current active status of the queries queue background processor
  this._QUERIES_QUEUE_PROCESSOR_STARTED = false;

  // Used for standard callbacks 'err' parameter
  this._NO_ERROR = null;

  // Uncomment the following lines if you will not always provide an 'error' listener in your consumer code,
  // to avoid any unexpected exception. Be aware that:
  // Error events are treated as a special case in node. If there is no listener for it,
  // then the default action is to print a stack trace and exit the program.
  // http://nodejs.org/api/events.html
  // this.on('error',function(err){
  // Helpers.logError(err.message);
  //// ... (add your own error-handling code)
  //});
}

/**
 * Get broker connection port
 * @param self
 * @param callback
 * @private
 */
CUBRIDConnection.prototype._doGetBrokerPort = function (self, callback) {
  var err = self._NO_ERROR;
  self._socket = Net.createConnection(self.initialBrokerPort, self.brokerServer);
  self._socket.setNoDelay(true);
  self._socket.setTimeout(this._CONNECTION_TIMEOUT);

  var packetWriter = new PacketWriter();
  var clientInfoExchangePacket = new ClientInfoExchangePacket();
  clientInfoExchangePacket.write(packetWriter);
  self._socket.write(packetWriter._buffer);

  self._socket.on('timeout', function (err) {
    this.connectionOpened = false;
    callback.call(self, new Error(ErrorMessages.ERROR_CONNECTION_TIMEOUT));
  });

  self._socket.on('error', function (err) {
    this.connectionOpened = false;
    callback.call(self, err);
  });

  self._socket.once('data', function (data) {
    self._socket.setTimeout(0); // Clear connection timeout
    var packetReader = new PacketReader();
    packetReader.write(data);
    clientInfoExchangePacket.parse(packetReader);
    var newPort = clientInfoExchangePacket.newConnectionPort;
    self.connectionBrokerPort = newPort;
    if (newPort > 0) {
      self._socket.end();
    }
    if (callback && typeof(callback) === 'function') {
      if (newPort >= 0) {
        callback.call(null);
      } else {
        err = new Error(ErrorMessages.ERROR_NEW_BROKER_PORT);
        callback.call(self, err);
      }
    }
  });
};

/**
 * Login to a database
 * @param self
 * @param callback
 * @private
 */
CUBRIDConnection.prototype._doDatabaseLogin = function (self, callback) {
  var err = self._NO_ERROR;
  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  if (self.connectionBrokerPort > 0) {
    self._socket = Net.createConnection(self.connectionBrokerPort, self.brokerServer);
    self._socket.setNoDelay(true);
    self._socket.setTimeout(self._CONNECTION_TIMEOUT);
  }

  var packetWriter = new PacketWriter();
  var openDatabasePacket = new OpenDatabasePacket(
    {
      database : self.database,
      user     : self.user,
      password : self.password,
      casInfo  : self._CASInfo
    }
  );
  openDatabasePacket.write(packetWriter);
  self._socket.write(packetWriter._buffer);

  self._socket.on('timeout', function (err) {
    self._socket.end();
    this.connectionOpened = false;
    callback.call(self, new Error(ErrorMessages.ERROR_CONNECTION_TIMEOUT));
  });

  self._socket.on('error', function (err) {
    self.connectionOpened = false;
    callback.call(self, err);
  });

  self._socket.on('data', function (data) {
    self._socket.setTimeout(0); // Clear connection timeout
    responseData = Helpers._combineData(responseData, data);
    if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
      responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
      self._socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(responseData);
      openDatabasePacket.parse(packetReader);
      self._CASInfo = openDatabasePacket.casInfo;
      var errorCode = openDatabasePacket.errorCode;
      var errorMsg = openDatabasePacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      } else {
        self.sessionId = openDatabasePacket.sessionId;
        self.autoCommitMode = self.AUTOCOMMIT_ON;
      }
      callback.call(self, err);
    }
  });
};

/**
 * Get the server database engine version
 * @param self
 * @param callback
 */
CUBRIDConnection.prototype._getEngineVersion = function (self, callback) {
  var err = self._NO_ERROR;
  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  var packetWriter = new PacketWriter();
  var getEngineVersionPacket = new GetEngineVersionPacket(
    {
      casInfo : self._CASInfo
    }
  );

  getEngineVersionPacket.write(packetWriter);
  self._socket.write(packetWriter._buffer);

  self._socket.on('data', function (data) {
    responseData = Helpers._combineData(responseData, data);
    if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
      responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
      self._socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(responseData);
      getEngineVersionPacket.parse(packetReader);
      var errorCode = getEngineVersionPacket.errorCode;
      var errorMsg = getEngineVersionPacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      } else {
        self._DB_ENGINE_VER = getEngineVersionPacket.engineVersion;
      }
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err);
      }
    }
  });
};

/**
 * Connect to database
 * @param callback
 */
CUBRIDConnection.prototype.connect = function (callback) {
  var self = this;
  var err = self._NO_ERROR;

  if (self.connectionOpened === true) {
    err = new Error(ErrorMessages.ERROR_CONNECTION_ALREADY_OPENED);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  if (self.connectionPending === true) {
    err = new Error(ErrorMessages.ERROR_CONNECTION_ALREADY_PENDING);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  self.connectionPending = true;

  ActionQueue.enqueue(
    [
      function (cb) {
        self._doGetBrokerPort(self, cb);
      },

      function (cb) {
        self._doDatabaseLogin(self, cb);
      },

      function (cb) {
        self._getEngineVersion(self, cb);
      }
    ],

    function (err) {
      self.queryPending = false; // Reset query execution status
      self.connectionPending = false;
      self.connectionOpened = !(typeof err !== 'undefined' && err !== null);
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_CONNECTED);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err);
      }
    }
  );
};

/**
 * Get the server database engine version
 * @param callback
 */
CUBRIDConnection.prototype.getEngineVersion = function (callback) {
  var self = this;
  Helpers._emitEvent(self, self._NO_ERROR, self.EVENT_ERROR, self.EVENT_ENGINE_VERSION_AVAILABLE, self._DB_ENGINE_VER);
  if (callback && typeof(callback) === 'function') {
    callback.call(self, self._NO_ERROR, self._DB_ENGINE_VER);
  }
};

/**
 * Execute SQL statements in batch mode
 * @param sqls
 * @param callback
 */
CUBRIDConnection.prototype.batchExecuteNoQuery = function (sqls, callback) {
  var self = this;
  var sqlsArr = null;
  var err = self._NO_ERROR;

  if (Array.isArray(sqls)) {
    if (sqls.length === 0) {
      // No commands to execute
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_BATCH_COMMANDS_COMPLETED);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err);
      }
      return;
    }
    sqlsArr = sqls;
  } else {
    sqlsArr = new Array(sqls);
  }

  for (var i = 0; i < sqlsArr.length; i++) {
    if (!Helpers._validateInputSQLString(sqlsArr[i])) {
      err = new Error(ErrorMessages.ERROR_INPUT_VALIDATION);
      Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err);
      }
      return;
    }
  }

  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  ActionQueue.enqueue(
    [
      function (cb) {
        if (self.connectionOpened === false) {
          self.connect(cb);
        } else {
          cb();
        }
      },

      function (cb) {
        var packetWriter = new PacketWriter();
        var batchExecuteNoQueryPacket = new BatchExecuteNoQueryPacket(
          {
            SQLs           : sqlsArr,
            casInfo        : self._CASInfo,
            autoCommitMode : self.autoCommitMode,
            dbVersion      : self._DB_ENGINE_VER
          }
        );
        batchExecuteNoQueryPacket.write(packetWriter);
        self._socket.write(packetWriter._buffer);

        self._socket.on('data', function (data) {
          responseData = Helpers._combineData(responseData, data);
          if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
            responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
            self._socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(responseData);
            batchExecuteNoQueryPacket.parse(packetReader);
            var errorCode = batchExecuteNoQueryPacket.errorCode;
            var errorMsg = batchExecuteNoQueryPacket.errorMsg;
            if (!self._DB_ENGINE_VER.startsWith('8.4.1')) {
              for (var i = 0; i < batchExecuteNoQueryPacket.arrResultsCode.length; i++) {
                if (batchExecuteNoQueryPacket.arrResultsCode[i] < 0) {
                  if (err === null) {
                    err = [];
                  }
                  err.push(new Error(batchExecuteNoQueryPacket.arrResultsCode[i] +
                    ':' + batchExecuteNoQueryPacket.arrResultsMsg[i]));
                }
              }
            } else {
              if (errorCode !== 0) {
                err = new Error(errorCode + ':' + errorMsg);
              }
            }
            if (cb && typeof(cb) === 'function') {
              cb.call(self, err);
            }
          }
        });
      }
    ],

    function (err) {
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_BATCH_COMMANDS_COMPLETED);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err);
      }
    }
  );
};

/**
 * Execute a SQL statement which does not return records
 * @param sql
 * @param callback
 */
CUBRIDConnection.prototype.execute = function (sql, callback) {
  var self = this;
  var err = self._NO_ERROR;

  if (!Helpers._validateInputSQLString(sql)) {
    err = new Error(ErrorMessages.ERROR_INPUT_VALIDATION);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return null;
  }

  var arrSQL = [];
  arrSQL.push(sql);

  if(this._ENFORCE_OLD_QUERY_PROTOCOL === true)
  {
    return self.executeWithTypedParams(sql, null, null, callback);
  } else {
    return self.batchExecuteNoQuery(arrSQL, callback);
  }
};

/**
 * Execute sql statement with parameters
 * @param sql
 * @param arrParamsValues
 * @param arrDelimiters
 * @param callback
 * @return {*}
 */
CUBRIDConnection.prototype.executeWithParams = function (sql, arrParamsValues, arrDelimiters, callback) {
  var self = this;
  var formattedSQL = Helpers._sqlFormat(sql, arrParamsValues, arrDelimiters);
  Helpers.logInfo('Formatted sql is: ' + formattedSQL);

  return self.execute(formattedSQL, callback);
};

/**
 * Execute sql statement with typed parameters
 * @param sql
 * @param arrParamsValues
 * @param arrParamsDataTypes
 * @param callback
 * @return {*}
 */
CUBRIDConnection.prototype.executeWithTypedParams = function (sql, arrParamsValues, arrParamsDataTypes, callback) {
  var self = this;
  var err = self._NO_ERROR;

  if (!Helpers._validateInputSQLString(sql)) {
    Helpers._emitEvent(self, new Error(ErrorMessages.ERROR_INPUT_VALIDATION), self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  ActionQueue.enqueue(
    [
      function (cb) {
        if (self.connectionOpened === false) {
          self.connect(cb);
        } else {
          cb();
        }
      },

      function (cb) {
        var packetWriter = new PacketWriter();
        var prepareExecuteOldProtocolPacket = new PrepareExecuteOldProtocolPacket(
          {
            sql            : sql,
            casInfo        : self._CASInfo,
            autoCommitMode : self.autoCommitMode,
            dbVersion      : self._DB_ENGINE_VER,
            paramValues    : arrParamsValues,
            paramTypes     : arrParamsDataTypes
          }
        );
        prepareExecuteOldProtocolPacket.writePrepare(packetWriter);
        self._socket.write(packetWriter._buffer);

        self._socket.on('data', function (data) {
          responseData = Helpers._combineData(responseData, data);
          if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
            responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
            self._socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(responseData);
            prepareExecuteOldProtocolPacket.parsePrepare(packetReader);
            var errorCode = prepareExecuteOldProtocolPacket.errorCode;
            var errorMsg = prepareExecuteOldProtocolPacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            }
            if (cb && typeof(cb) === 'function') {
              cb.call(self, err, prepareExecuteOldProtocolPacket);
            }
          }
        });
      },

      function (prepareExecuteOldProtocolPacket, cb) {
        expectedResponseLength = self._INVALID_RESPONSE_LENGTH;
        responseData = new Buffer(0);
        var packetWriter = new PacketWriter();
        prepareExecuteOldProtocolPacket.writeExecute(packetWriter);
        self._socket.write(packetWriter._buffer);

        self._socket.on('data', function (data) {
          responseData = Helpers._combineData(responseData, data);
          if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
            responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
            self._socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(responseData);
            prepareExecuteOldProtocolPacket.parseExecute(packetReader);
            var errorCode = prepareExecuteOldProtocolPacket.errorCode;
            var errorMsg = prepareExecuteOldProtocolPacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            }
            if (cb && typeof(cb) === 'function') {
              cb.call(self, err);
            }
          }
        });
      }
    ],

    function (err) {
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_BATCH_COMMANDS_COMPLETED);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err);
      }
    }
  );
};

/**
 * Execute query and retrieve rows results
 * @param sql
 * @param callback
 */
CUBRIDConnection.prototype.query = function (sql, callback) {
  if (this._ENFORCE_OLD_QUERY_PROTOCOL) {
    return this._queryOldProtocol(sql, null, null, callback);
  } else {
    return this._queryNewProtocol(sql, callback);
  }
};

/**
 * Execute query and retrieve rows results, using the newer 9.x query protocol
 * @param sql
 * @param callback
 */
CUBRIDConnection.prototype._queryNewProtocol = function (sql, callback) {
  var self = this;
  var err = self._NO_ERROR;

  if (self.queryPending === true && self._PREVENT_CONCURRENT_REQUESTS) {
    err = new Error(ErrorMessages.ERROR_QUERY_ALREADY_PENDING);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  if (!Helpers._validateInputSQLString(sql)) {
    Helpers._emitEvent(self, new Error(ErrorMessages.ERROR_INPUT_VALIDATION), self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  self.queryPending = true;

  ActionQueue.enqueue(
    [
      function (cb) {
        if (self.connectionOpened === false) {
          self.connect(cb);
        } else {
          cb();
        }
      },

      function (cb) {
        // Check if data is already in cache
        if (self._queryCache !== null) {
          if (self._queryCache.contains(sql)) {
            self.queryPending = false;
            // Query handle set to null, to prevent further fetch (cache is intended only for small data)
            Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_QUERY_DATA_AVAILABLE, self._queryCache.get(sql), null);
            if (callback && typeof(callback) === 'function') {
              callback(err, self._queryCache.get(sql), null);
            }
            return;
          }
        }

        var packetWriter = new PacketWriter();
        var executeQueryPacket = new ExecuteQueryPacket(
          {
            sql            : sql,
            casInfo        : self._CASInfo,
            autoCommitMode : self.autoCommitMode,
            dbVersion      : self._DB_ENGINE_VER
          }
        );
        executeQueryPacket.write(packetWriter);
        self._socket.write(packetWriter._buffer);

        self._socket.on('data', function (data) {
          responseData = Helpers._combineData(responseData, data);
          if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
            responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
            self._socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(responseData);
            var result = executeQueryPacket.parse(packetReader).resultSet;
            var errorCode = executeQueryPacket.errorCode;
            var errorMsg = executeQueryPacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            } else {
              self._queriesPacketList.push(executeQueryPacket);
            }
            if (cb && typeof(cb) === 'function') {
              if (typeof err !== 'undefined' && err !== null) {
                //self.queryPending = false;
              } else {
                if (self._queryCache !== null) {
                  self._queryCache.getSet(sql, result);
                }
              }
              cb.call(self, err, result, executeQueryPacket.queryHandle);
            }
          }
        });
      }
    ],

    function (err, result, handle) {
      self.queryPending = false;
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_QUERY_DATA_AVAILABLE, result, handle, sql);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err, result, handle);
      }
    }
  );
};

/**
 * Execute query and retrieve rows results, using the older 8.4.x query protocol
 * @param sql
 * @param arrParamsValues
 * @param arrParamsDataTypes
 * @param callback
 */
CUBRIDConnection.prototype._queryOldProtocol = function (sql, arrParamsValues, arrParamsDataTypes, callback) {
  var self = this;
  var err = self._NO_ERROR;

  if (self.queryPending === true && self._PREVENT_CONCURRENT_REQUESTS) {
    err = new Error(ErrorMessages.ERROR_QUERY_ALREADY_PENDING);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  if (!Helpers._validateInputSQLString(sql)) {
    Helpers._emitEvent(self, new Error(ErrorMessages.ERROR_INPUT_VALIDATION), self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  self.queryPending = true;

  ActionQueue.enqueue(
    [
      function (cb) {
        if (self.connectionOpened === false) {
          self.connect(cb);
        } else {
          cb();
        }
      },

      function (cb) {
        var packetWriter = new PacketWriter();
        var prepareExecuteOldProtocolPacket = new PrepareExecuteOldProtocolPacket(
          {
            sql            : sql,
            casInfo        : self._CASInfo,
            autoCommitMode : self.autoCommitMode,
            dbVersion      : self._DB_ENGINE_VER,
            paramValues    : arrParamsValues,
            paramTypes     : arrParamsDataTypes
          }
        );
        prepareExecuteOldProtocolPacket.writePrepare(packetWriter);
        self._socket.write(packetWriter._buffer);

        self._socket.on('data', function (data) {
          responseData = Helpers._combineData(responseData, data);
          if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
            responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
            self._socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(responseData);
            prepareExecuteOldProtocolPacket.parsePrepare(packetReader);
            var errorCode = prepareExecuteOldProtocolPacket.errorCode;
            var errorMsg = prepareExecuteOldProtocolPacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            }
            if (cb && typeof(cb) === 'function') {
              cb.call(self, err, prepareExecuteOldProtocolPacket);
            }
          }
        });
      },

      function (prepareExecuteOldProtocolPacket, cb) {
        expectedResponseLength = self._INVALID_RESPONSE_LENGTH;
        responseData = new Buffer(0);
        var packetWriter = new PacketWriter();
        prepareExecuteOldProtocolPacket.writeExecute(packetWriter);
        self._socket.write(packetWriter._buffer);

        self._socket.on('data', function (data) {
          responseData = Helpers._combineData(responseData, data);
          if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
            responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
            self._socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(responseData);
            var result = prepareExecuteOldProtocolPacket.parseExecute(packetReader).resultSet;
            var errorCode = prepareExecuteOldProtocolPacket.errorCode;
            var errorMsg = prepareExecuteOldProtocolPacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            } else {
              self._queriesPacketList.push(prepareExecuteOldProtocolPacket);
            }
            if (cb && typeof(cb) === 'function') {
              cb.call(self, err, result, prepareExecuteOldProtocolPacket.queryHandle);
            }
          }
        });
      }

    ],

    function (err, result, handle) {
      self.queryPending = false;
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_QUERY_DATA_AVAILABLE, result, handle, sql);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err, result, handle);
      }
    }
  );
};

/**
 * Execute query with parameters
 * @param sql
 * @param arrParamsValues
 * @param arrDelimiters
 * @param callback
 * @return {*}
 */
CUBRIDConnection.prototype.queryWithParams = function (sql, arrParamsValues, arrDelimiters, callback) {
  var self = this;
  var formattedSQL = Helpers._sqlFormat(sql, arrParamsValues, arrDelimiters);
  Helpers.logInfo('Formatted sql is: ' + formattedSQL);

  return self.query(formattedSQL, callback);
};

/**
 * Execute query with typed parameters
 * @param sql
 * @param arrParamsValues
 * @param arrParamsDataTypes
 * @param callback
 * @return {*}
 */
CUBRIDConnection.prototype.queryWithTypedParams = function (sql, arrParamsValues, arrParamsDataTypes, callback) {
  return this._queryOldProtocol(sql, arrParamsValues, arrParamsDataTypes, callback);
};

/**
 * Fetch query next rows results
 * @param queryHandle
 * @param callback
 */
CUBRIDConnection.prototype.fetch = function (queryHandle, callback) {
  var self = this;
  var err = self._NO_ERROR;
  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  self._socket.on('data', function (data) {
    responseData = Helpers._combineData(responseData, data);
    if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
      responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
      self._socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(responseData);
      var result = fetchPacket.parse(packetReader, self._queriesPacketList[i]).resultSet;
      var errorCode = fetchPacket.errorCode;
      var errorMsg = fetchPacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      }
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_FETCH_DATA_AVAILABLE, result, queryHandle);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err, result, queryHandle);
      }
    }
  });

  var foundQueryHandle = false;
  for (var i = 0; i < self._queriesPacketList.length; i++) {
    if (self._queriesPacketList[i].queryHandle === queryHandle) {
      foundQueryHandle = true;
      break;
    }
  }

  if (!foundQueryHandle) {
    err = new Error(ErrorMessages.ERROR_NO_ACTIVE_QUERY);
    self._socket.removeAllListeners('data');
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err, null, null);
    }
  } else {
    if (self._queriesPacketList[i].currentTupleCount === self._queriesPacketList[i].totalTupleCount) {
      self._socket.removeAllListeners('data');
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, queryHandle);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err, null, queryHandle);
      }
    } else {
      var packetWriter = new PacketWriter();
      var fetchPacket = new FetchPacket(
        {
          casInfo    : self._CASInfo,
          db_version : self._DB_ENGINE_VER
        }
      );
      fetchPacket.write(packetWriter, self._queriesPacketList[i]);
      self._socket.write(packetWriter._buffer);
    }
  }
};

/**
 * Close query
 * @param queryHandle
 * @param callback
 */
CUBRIDConnection.prototype.closeQuery = function (queryHandle, callback) {
  var self = this;
  var err = self._NO_ERROR;
  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  if (!Helpers._validateInputPositive(queryHandle)) {
    Helpers._emitEvent(self, new Error(ErrorMessages.ERROR_INPUT_VALIDATION), self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, new Error(ErrorMessages.ERROR_INPUT_VALIDATION));
    }
    return;
  }

  self.queryPending = false;

  var foundQueryHandle = false;
  for (var i = 0; i < self._queriesPacketList.length; i++) {
    if (self._queriesPacketList[i].queryHandle === queryHandle) {
      foundQueryHandle = true;
      break;
    }
  }
  if (!foundQueryHandle) {
    err = new Error(ErrorMessages.ERROR_NO_ACTIVE_QUERY + ": " + queryHandle);
    self._socket.removeAllListeners('data');
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err, null);
    }
  } else {
    // Check if closing a query in the queriesQueue
    // In this case, if there is a query executing in a queue try to close later
    if (self._QUERIES_QUEUE_PROCESSOR_STARTED) {
      // Check if some query is still in execution
      for (i = 0; i < self._queriesQueue.length; i++) {
        if (self._queriesQueue[i][self._QUERY_INFO.HANDLE] === queryHandle &&
          self._queriesQueue[i][self._QUERY_INFO.STATUS] === self._QUERY_STATUS.IN_EXECUTION) {
          Helpers.logInfo('...found a query in execution: ' + self._queriesQueue[i][self._QUERY_INFO.SQL] + ' ...retrying later...]');
          // Retry queue processing after a while
          setTimeout(function () {
            self.closeQuery(queryHandle, callback);
          }, self._QUERIES_QUEUE_CHECK_INTERVAL);
          return;
        }
      }
    }
    var packetWriter = new PacketWriter();
    var closeQueryPacket = new CloseQueryPacket(
      {
        casInfo    : self._CASInfo,
        reqHandle  : queryHandle,
        db_version : self._DB_ENGINE_VER
      }
    );
    closeQueryPacket.write(packetWriter);
    self._socket.write(packetWriter._buffer);
  }

  self._socket.on('data', function (data) {
    responseData = Helpers._combineData(responseData, data);
    if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
      responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
      self._socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(responseData);
      closeQueryPacket.parse(packetReader);
      var errorCode = closeQueryPacket.errorCode;
      var errorMsg = closeQueryPacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      } else {
        for (var i = 0; i < self._queriesPacketList.length; i++) {
          if (self._queriesPacketList[i].queryHandle === queryHandle) {
            self._queriesPacketList.splice(i, 1);
            break;
          }
        }
        // Remove query from queue
        if (self._QUERIES_QUEUE_PROCESSOR_STARTED) {
          for (i = 0; i < self._queriesQueue.length; i++) {
            if (self._queriesQueue[i][self._QUERY_INFO.HANDLE] === queryHandle) {
              // Remove query from queue
              self._queriesQueue.splice(i, 1);
            }
          }
        }
      }
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_QUERY_CLOSED, queryHandle);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err, queryHandle);
      }
    }
  });
};

/**
 * Close connection
 * @param callback
 */
CUBRIDConnection.prototype.close = function (callback) {
  var self = this;
  var err = self._NO_ERROR;
  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  if (self.connectionOpened === false) {
    err = new Error(ErrorMessages.ERROR_CONNECTION_ALREADY_CLOSED);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  // Reset connection status
  self.queryPending = false;
  self.connectionPending = false;
  self.connectionOpened = false;

  ActionQueue.enqueue(
    [
      function (cb) {
        ActionQueue.while(
          function () {
            return (self._queriesPacketList[0] !== null && self._queriesPacketList[0] !== undefined);
          },

          function (callb) {
            self.closeQuery(self._queriesPacketList[0].queryHandle, callb);
          },

          function (err) {
            // Log non-blocking error
            if (typeof err !== 'undefined' && err !== null) {
              Helpers.logError(ErrorMessages.ERROR_ON_CLOSE_QUERY_HANDLE + err);
            }
            cb.call(null);
          }
        );
      },

      function (cb) {
        var packetWriter = new PacketWriter();
        var closeDatabasePacket = new CloseDatabasePacket(
          {
            casInfo    : self._CASInfo,
            db_version : self._DB_ENGINE_VER
          }
        );
        closeDatabasePacket.write(packetWriter);
        self._socket.write(packetWriter._buffer);

        self._socket.on('data', function (data) {
          responseData = Helpers._combineData(responseData, data);
          if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
            responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
            self._socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(responseData);
            closeDatabasePacket.parse(packetReader);
            // Close internal socket connection
            self._socket.destroy();
            var errorCode = closeDatabasePacket.errorCode;
            var errorMsg = closeDatabasePacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            }
            if (cb && typeof(cb) === 'function') {
              cb.call(self, err);
            }
          }
        });
      }
    ],

    function (err) {
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_CONNECTION_CLOSED);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err);
      }
    }
  );
};

/**
 * Start transaction
 * @param callback
 */
CUBRIDConnection.prototype.beginTransaction = function (callback) {
  var self = this;
  _toggleAutoCommitMode(self, self.AUTOCOMMIT_OFF, function (err) {
    Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_BEGIN_TRANSACTION);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
  });
};

/**
 * Set session auto-commit mode
 * @param autoCommitMode
 * @param callback
 */
CUBRIDConnection.prototype.setAutoCommitMode = function (autoCommitMode, callback) {
  var self = this;
  _toggleAutoCommitMode(self, autoCommitMode, function (err) {
    Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_SET_AUTOCOMMIT_MODE_COMPLETED);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
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
  var self = this;
  var err = self._NO_ERROR;
  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  if (self.autoCommitMode === false) {
    var packetWriter = new PacketWriter();
    var rollbackPacket = new RollbackPacket(
      {
        casInfo    : self._CASInfo,
        db_version : self._DB_ENGINE_VER
      }
    );
    rollbackPacket.write(packetWriter);
    self._socket.write(packetWriter._buffer);
  } else {
    self._socket.removeAllListeners('data');
    err = new Error(ErrorMessages.ERROR_NO_ROLLBACK);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  self._socket.on('data', function (data) {
    responseData = Helpers._combineData(responseData, data);
    if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
      responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
      self._socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(responseData);
      rollbackPacket.parse(packetReader);
      var errorCode = rollbackPacket.errorCode;
      var errorMsg = rollbackPacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      }
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_ROLLBACK_COMPLETED);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err);
      }
    }
  });
};

/**
 * Commit transaction
 * @param callback
 */
CUBRIDConnection.prototype.commit = function (callback) {
  var self = this;
  var err = self._NO_ERROR;
  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  if (self.autoCommitMode === false) {
    var packetWriter = new PacketWriter();
    var commitPacket = new CommitPacket(
      {
        casInfo    : self._CASInfo,
        db_version : self._DB_ENGINE_VER
      }
    );
    commitPacket.write(packetWriter);
    self._socket.write(packetWriter._buffer);
  } else {
    self._socket.removeAllListeners('data');
    err = new Error(ErrorMessages.ERROR_NO_COMMIT);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  self._socket.on('data', function (data) {
    responseData = Helpers._combineData(responseData, data);
    if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
      responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
      self._socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(responseData);
      commitPacket.parse(packetReader);
      var errorCode = commitPacket.errorCode;
      var errorMsg = commitPacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      }
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_COMMIT_COMPLETED);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err);
      }
    }
  });
};

/**
 * Set Auto-commit mode
 * @param self
 * @param autoCommitMode
 * @param callback
 * @private
 */
function _toggleAutoCommitMode(self, autoCommitMode, callback) {
  var err = self._NO_ERROR;
  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  if (!Helpers._validateInputBoolean(autoCommitMode)) {
    Helpers._emitEvent(self, new Error(ErrorMessages.ERROR_INPUT_VALIDATION), self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  if (self.autoCommitMode === autoCommitMode) {
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
      return;
    }
  }

  self.autoCommitMode = autoCommitMode;
  if (callback && typeof(callback) === 'function') {
    callback.call(self, err);
  }
}

/**
 * Get database schema information
 * @param schemaType
 * @param tableNameFilter
 * @param callback
 */
CUBRIDConnection.prototype.getSchema = function (schemaType, tableNameFilter, callback) {
  var self = this;
  var err = self._NO_ERROR;

  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  ActionQueue.enqueue(
    [
      function (cb) {
        if (self.connectionOpened === false) {
          self.connect(cb);
        } else {
          cb();
        }
      },

      function (cb) {
        var packetWriter = new PacketWriter();
        var getSchemaPacket = new GetSchemaPacket(
          {
            casInfo          : self._CASInfo,
            schemaType       : schemaType,
            tableNamePattern : tableNameFilter,
            db_version       : self._DB_ENGINE_VER
          }
        );
        getSchemaPacket.writeRequestSchema(packetWriter);
        self._socket.write(packetWriter._buffer);

        self._socket.on('data', function (data) {
          responseData = Helpers._combineData(responseData, data);
          if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
            responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
            self._socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(responseData);
            getSchemaPacket.parseRequestSchema(packetReader);
            var errorCode = getSchemaPacket.errorCode;
            var errorMsg = getSchemaPacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            }
            if (cb && typeof(cb) === 'function') {
              cb.call(self, err, getSchemaPacket);
            }
          }
        });
      },

      function (getSchemaPacket, cb) {
        expectedResponseLength = -1;
        var responseData = new Buffer(0);
        var packetWriter = new PacketWriter();
        getSchemaPacket.writeFetchSchema(packetWriter);
        self._socket.write(packetWriter._buffer);

        self._socket.on('data', function (data) {
          responseData = Helpers._combineData(responseData, data);
          if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
            responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
            self._socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(responseData);
            var result = getSchemaPacket.parseFetchSchema(packetReader).schemaInfo;
            var errorCode = getSchemaPacket.errorCode;
            var errorMsg = getSchemaPacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            }
            if (cb && typeof(cb) === 'function') {
              cb.call(self, err, result);
            }
          }
        });
      }
    ],

    function (err, result) {
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_SCHEMA_DATA_AVAILABLE, result);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err, result);
      }
    }
  );
};

/**
 * Create a new LOB object
 * @param lobType
 * @param callback
 */
CUBRIDConnection.prototype.lobNew = function (lobType, callback) {
  var self = this;
  var err = self._NO_ERROR;

  var responseData = new Buffer(0);
  var expectedResponseLength = this._INVALID_RESPONSE_LENGTH;

  ActionQueue.enqueue(
    [
      function (cb) {
        if (self.connectionOpened === false) {
          self.connect(cb);
        } else {
          cb();
        }
      },

      function (cb) {
        var packetWriter = new PacketWriter();
        var lobNewPacket = new LOBNewPacket(
          {
            casInfo    : self._CASInfo,
            lobType    : lobType,
            db_version : self._DB_ENGINE_VER
          }
        );
        lobNewPacket.write(packetWriter);
        self._socket.write(packetWriter._buffer);

        self._socket.on('data', function (data) {
          responseData = Helpers._combineData(responseData, data);
          if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
            responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
            self._socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(responseData);
            lobNewPacket.parse(packetReader);
            var lobObject = lobNewPacket.result;
            var errorCode = lobNewPacket.errorCode;
            var errorMsg = lobNewPacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            }
            if (cb && typeof(cb) === 'function') {
              cb.call(self, err, lobObject);
            }
          }
        });
      }
    ],

    function (err, lobObject) {
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_LOB_NEW_COMPLETED, lobObject);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err, lobObject);
      }
    }
  );
};

/**
 * Write data to a LOB object
 * @param lobObject
 * @param position
 * @param dataBuffer
 * @param callback
 */
CUBRIDConnection.prototype.lobWrite = function (lobObject, position, dataBuffer, callback) {
  var self = this;
  var err = self._NO_ERROR;

  if (lobObject.lobLength + 1 !== position) {
    err = new Error(ErrorMessages.ERROR_INVALID_LOB_POSITION);
    Helpers.logError(ErrorMessages.ERROR_INVALID_LOB_POSITION);
    callback.call(null);
  }

  position--;
  var realWriteLen, writeLen;
  var totalWriteLen = 0;
  var len = dataBuffer.length;
  var offset = 0;

  ActionQueue.while(
    function () {
      return len > 0;
    },

    function (cb) {
      var responseData = new Buffer(0);
      var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;
      writeLen = Math.min(len, self._LOB_MAX_IO_LENGTH);
      var packetWriter = new PacketWriter();
      var dataToWrite = null;
      if (lobObject.lobType === CASConstants.CUBRIDDataType.CCI_U_TYPE_BLOB) {
        dataToWrite = dataBuffer.slice(position, position + writeLen);
      } else {
        if (lobObject.lobType === CASConstants.CUBRIDDataType.CCI_U_TYPE_CLOB) {
          dataToWrite = dataBuffer.substring(position, position + writeLen);
        }
      }
      var lobWritePacket = new LOBWritePacket(
        {
          casInfo    : self._CASInfo,
          lobObject  : lobObject,
          position   : position,
          data       : dataToWrite,
          writeLen   : writeLen,
          db_version : self._DB_ENGINE_VER
        }
      );
      lobWritePacket.write(packetWriter);
      self._socket.write(packetWriter._buffer);

      self._socket.on('data', function (data) {
        responseData = Helpers._combineData(responseData, data);
        if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
          responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
          expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
        }
        if (responseData.length === expectedResponseLength) {
          self._socket.removeAllListeners('data');
          var packetReader = new PacketReader();
          packetReader.write(responseData);
          responseData = new Buffer(0);
          lobWritePacket.parse(packetReader);
          realWriteLen = lobWritePacket.wroteLength;
          position = position + realWriteLen;
          len -= realWriteLen;
          offset += realWriteLen;
          totalWriteLen += realWriteLen;
          var errorCode = lobWritePacket.errorCode;
          var errorMsg = lobWritePacket.errorMsg;
          if (errorCode !== 0) {
            err = new Error(errorCode + ':' + errorMsg);
          }
          if (cb && typeof(cb) === 'function') {
            cb.call(self, err);
          }
        }
      });
    },

    function (err) {
      if (totalWriteLen > lobObject.lobLength) {
        lobObject.lobLength = totalWriteLen;
      }
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_LOB_WRITE_COMPLETED, lobObject, totalWriteLen);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err, lobObject, totalWriteLen);
      }
    });
};

/**
 * Read a LOB object from the database
 * @param lobObject
 * @param position
 * @param length
 * @param callback
 */
CUBRIDConnection.prototype.lobRead = function (lobObject, position, length, callback) {
  var self = this;
  var err = self._NO_ERROR;
  var buffer;

  if (lobObject.lobType === CASConstants.CUBRIDDataType.CCI_U_TYPE_CLOB) {
    buffer = '';
  } else {
    buffer = new Buffer(0);
  }

  position--;
  if (lobObject.lobLength < position + length) {
    err = new Error(ErrorMessages.ERROR_INVALID_LOB_POSITION);
    Helpers.logError(ErrorMessages.ERROR_INVALID_LOB_POSITION);
    callback.call(null);
  }

  var realReadLen;
  var readLen;
  var totalReadLen = 0;

  ActionQueue.while(
    function () {
      return length > 0;
    },

    function (cb) {
      var responseData = new Buffer(0);
      var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;
      readLen = Math.min(length, self._LOB_MAX_IO_LENGTH);
      var packetWriter = new PacketWriter();
      var lobReadPacket = new LOBReadPacket(
        {
          casInfo      : self._CASInfo,
          lobObject    : lobObject,
          position     : position,
          lengthToRead : length,
          db_version   : self._DB_ENGINE_VER
        }
      );
      lobReadPacket.write(packetWriter);
      self._socket.write(packetWriter._buffer);

      self._socket.on('data', function (data) {
        responseData = Helpers._combineData(responseData, data);
        if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
          responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
          expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
        }
        if (responseData.length === expectedResponseLength) {
          self._socket.removeAllListeners('data');
          var packetReader = new PacketReader();
          packetReader.write(responseData);
          lobReadPacket.parse(packetReader);
          realReadLen = lobReadPacket.readLength;
          position += realReadLen;
          length -= realReadLen;
          totalReadLen += realReadLen;
          if (realReadLen === 0) {
            length = 0;
          }
          if (lobObject.lobType === CASConstants.CUBRIDDataType.CCI_U_TYPE_CLOB) {
            buffer += lobReadPacket.lobBuffer;
          } else {
            buffer = Helpers._combineData(buffer, lobReadPacket.lobBuffer);
          }
          var errorCode = lobReadPacket.errorCode;
          var errorMsg = lobReadPacket.errorMsg;
          if (errorCode !== 0) {
            err = new Error(errorCode + ':' + errorMsg);
          }
          if (cb && typeof(cb) === 'function') {
            cb.call(self, err);
          }
        }
      });
    },

    function (err) {
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_LOB_READ_COMPLETED, buffer, totalReadLen);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err, buffer, totalReadLen);
      }
    });
};

/**
 * Set connection timeout value. If set to 0, the timeout is reset to none.
 * @param timeout (.msec)
 */
CUBRIDConnection.prototype.setConnectionTimeout = function (timeout) {
  if (timeout >= 0 && this._CONNECTION_TIMEOUT !== timeout) {
    this._CONNECTION_TIMEOUT = timeout;
  } else {
    this._CONNECTION_TIMEOUT = 0;
  }
};

/**
 * Returns the connection timeout
 * @return {Number} (.msec)
 */
CUBRIDConnection.prototype.getConnectionTimeout = function () {
  return this._CONNECTION_TIMEOUT;
};

/**
 * Set a database parameter
 * @param parameter id
 * @param value
 * @param callback
 */
CUBRIDConnection.prototype.setDatabaseParameter = function (parameter, value, callback) {
  var self = this;
  var err = self._NO_ERROR;
  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  if (parameter === CASConstants.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH) {
    var errorCode = -1011;
    var errorMsg = Helpers._resolveErrorCode(errorCode);
    err = new Error(errorCode + ':' + errorMsg);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  var packetWriter = new PacketWriter();
  var setDbParameterPacket = new SetDbParameterPacket(
    {
      casInfo   : self._CASInfo,
      parameter : parameter,
      value     : value
    }
  );

  setDbParameterPacket.write(packetWriter);
  self._socket.write(packetWriter._buffer);

  self._socket.on('data', function (data) {
    responseData = Helpers._combineData(responseData, data);
    if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
      responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
      self._socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(responseData);
      setDbParameterPacket.parse(packetReader);
      var errorCode = setDbParameterPacket.errorCode;
      var errorMsg = setDbParameterPacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      }
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_SET_DB_PARAMETER_COMPLETED, null);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err);
      }
    }
  });
};

/**
 * Get a database parameter
 * @param parameter id
 * @param callback
 */
CUBRIDConnection.prototype.getDatabaseParameter = function (parameter, callback) {
  var self = this;
  var err = self._NO_ERROR;
  var responseData = new Buffer(0);
  var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

  if (parameter === CASConstants.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH) {
    var errorCode = -1011;
    var errorMsg = Helpers._resolveErrorCode(errorCode);
    err = new Error(errorCode + ':' + errorMsg);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (callback && typeof(callback) === 'function') {
      callback.call(self, err);
    }
    return;
  }

  var packetWriter = new PacketWriter();
  var getDbParameterPacket = new GetDbParameterPacket(
    {
      casInfo   : self._CASInfo,
      parameter : parameter
    }
  );

  getDbParameterPacket.write(packetWriter);
  self._socket.write(packetWriter._buffer);

  self._socket.on('data', function (data) {
    responseData = Helpers._combineData(responseData, data);
    if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
      responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers._getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
      self._socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(responseData);
      getDbParameterPacket.parse(packetReader);
      var errorCode = getDbParameterPacket.errorCode;
      var errorMsg = getDbParameterPacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      }
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_GET_DB_PARAMETER_COMPLETED, getDbParameterPacket.value);
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err, getDbParameterPacket.value);
      }
    }
  });
};

/**
 * Set the protocol to be used for queries execution.
 * If set to true, the driver will use the (old) 8.4.x protocol.
 * If set to false, the driver will use the newer 9.x protocol.
 * @param enforceOldProtocol
 */
CUBRIDConnection.prototype.setEnforceOldQueryProtocol = function (enforceOldProtocol) {
  if (this._ENFORCE_OLD_QUERY_PROTOCOL !== enforceOldProtocol) {
    this._ENFORCE_OLD_QUERY_PROTOCOL = enforceOldProtocol;
  }
};

/**
 * Returns the protocol used for queries execution.
 * If true, the driver uses the (old) 8.4.x protocol.
 * If false, the driver uses the newer 9.x protocol.
 * @private
 */
CUBRIDConnection.prototype.getEnforceOldQueryProtocol = function () {
  return this._ENFORCE_OLD_QUERY_PROTOCOL;
};

/**
 * Add a query to the queries queue
 * @param sql SQL query to execute
 * @param callback
 */
CUBRIDConnection.prototype.addQuery = function (sql, callback) {
  var self = this;

  // -1: No valid handle for the query yet, as the query is pending execution start
  self._queriesQueue.push([-1, sql, self._QUERY_STATUS.NOT_STARTED, callback, self._SQL_TYPE.IS_QUERY]);

  if (self._QUERIES_QUEUE_PROCESSOR_STARTED === false) {
    self._QUERIES_QUEUE_PROCESSOR_STARTED = true;
    self._enableQueriesBackgroundProcessor();
  }
};

//TODO Add support for non queries in the queue:
/**
 * Add a non-query (direct SQL execute statement) to the queries queue
 * @param sql SQL command to execute
 * @param callback
 */
CUBRIDConnection.prototype.addNonQuery = function (sql, callback) {
  var self = this;

  // -1: No valid handle for the command yet, as the command is pending execution start
  self._queriesQueue.push([-1, sql, self._QUERY_STATUS.NOT_STARTED, callback, self._SQL_TYPE.IS_NON_QUERY]);

  if (self._QUERIES_QUEUE_PROCESSOR_STARTED === false) {
    self._QUERIES_QUEUE_PROCESSOR_STARTED = true;
    self._enableQueriesBackgroundProcessor();
  }
};

/**
 * Execute a query from the queries queue
 * @param idx
 */
CUBRIDConnection.prototype._executeQuery = function (idx) {
  var self = this;

  if (self._queriesQueue[idx][self._QUERY_INFO.SQL_TYPE] === self._SQL_TYPE.IS_QUERY) {
    self.query(self._queriesQueue[idx][self._QUERY_INFO.SQL], function (err, result, queryHandle) {
      self._queriesQueue[idx][self._QUERY_INFO.STATUS] = self._QUERY_STATUS.CLOSED;
      self._queriesQueue[idx][self._QUERY_INFO.HANDLE] = queryHandle;

      if (self._queriesQueue[idx][self._QUERY_INFO.CALLBACK] &&
        typeof(self._queriesQueue[idx][self._QUERY_INFO.CALLBACK]) === 'function') {
        self._queriesQueue[idx][self._QUERY_INFO.CALLBACK].call(self, err, result, queryHandle);
      }

      if (err) {
        self._queriesQueue.splice(idx, 1);
      }
    });
  } else {
    self.execute(self._queriesQueue[idx][self._QUERY_INFO.SQL], function (err) {
      self._queriesQueue[idx][self._QUERY_INFO.STATUS] = self._QUERY_STATUS.CLOSED;

      if (self._queriesQueue[idx][self._QUERY_INFO.CALLBACK] &&
        typeof(self._queriesQueue[idx][self._QUERY_INFO.CALLBACK]) === 'function') {
        self._queriesQueue[idx][self._QUERY_INFO.CALLBACK].call(self, err);
      }

      // Remove the statement from the queue
      self._queriesQueue.splice(idx, 1);
    });
  }
};

/**
 * Queries queue background processor
 * @private
 */
CUBRIDConnection.prototype._enableQueriesBackgroundProcessor = function () {
  var self = this;
  var i;

  if (self._queriesQueue.length === 0) {
    self._QUERIES_QUEUE_PROCESSOR_STARTED = false;
    return;
  }

  // Check if some query is still in execution
  for (i = 0; i < self._queriesQueue.length; i++) {
    if (self._queriesQueue[i][self._QUERY_INFO.STATUS] === self._QUERY_STATUS.IN_EXECUTION) {
      // Retry queue processing after a while
      setTimeout(function () {
        self._enableQueriesBackgroundProcessor();
      }, self._QUERIES_QUEUE_CHECK_INTERVAL);
      return;
    }
  }

  // Find the first query not started
  for (i = 0; i < self._queriesQueue.length; i++) {
    if (self._queriesQueue[i][self._QUERY_INFO.STATUS] === self._QUERY_STATUS.NOT_STARTED) {
      self._queriesQueue[i][self._QUERY_INFO.STATUS] = self._QUERY_STATUS.IN_EXECUTION;
      self._executeQuery(i);
      break;
    }
  }

  // Re-execute queries processor
  setTimeout(function () {
    self._enableQueriesBackgroundProcessor();
  }, self._QUERIES_QUEUE_CHECK_INTERVAL);
};

/**
 * Return true if there are pending queries in the queries queue
 * @return {Boolean}
 */
CUBRIDConnection.prototype.queriesQueueIsEmpty = function () {
  if (this._queriesQueue.length === 0) {
    return true;
  } else {
    var noQueriesPending = true;

    for (var i = 0; i < this._queriesQueue.length; i++) {
      if (this._queriesQueue[i][this._QUERY_INFO.STATUS] !== this._QUERY_STATUS.CLOSED) {
        noQueriesPending = false;
        break;
      }
    }

    return noQueriesPending;
  }
};
