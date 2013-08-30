var Net = require('net'),
		EventEmitter = require('events').EventEmitter,
		Util = require('util'),

		ErrorMessages = require('./constants/ErrorMessages'),
		DATA_TYPES = require('./constants/DataTypes'),
		CASConstants = require('./constants/CASConstants'),

		ActionQueue = require('./utils/ActionQueue'),
		Helpers = require('./utils/Helpers'),
		Cache = require('./utils/Cache'),

		Query = require('./query/Query'),
		Queue = require('./query/Queue'),

		PacketReader = require('./packets/PacketReader'),
		PacketWriter = require('./packets/PacketWriter'),
		ClientInfoExchangePacket = require('./packets/ClientInfoExchangePacket'),
		OpenDatabasePacket = require('./packets/OpenDatabasePacket'),
		GetEngineVersionPacket = require('./packets/GetEngineVersionPacket'),
		ExecuteQueryPacket = require('./packets/ExecuteQueryPacket'),
		GetSchemaPacket = require('./packets/GetSchemaPacket.js'),
		CloseQueryPacket = require('./packets/CloseQueryPacket'),
		BatchExecuteNoQueryPacket = require('./packets/BatchExecuteNoQueryPacket'),
		CloseDatabasePacket = require('./packets/CloseDatabasePacket'),
		FetchPacket = require('./packets/FetchPacket'),
		SetAutoCommitModePacket = require('./packets/SetAutoCommitModePacket'),
		RollbackPacket = require('./packets/RollbackPacket'),
		CommitPacket = require('./packets/CommitPacket'),
		LOBReadPacket = require('./packets/LOBReadPacket'),
		LOBNewPacket = require('./packets/LOBNewPacket'),
		LOBWritePacket = require('./packets/LOBWritePacket'),
		SetDbParameterPacket = require('./packets/SetDbParameterPacket'),
		GetDbParameterPacket = require('./packets/GetDbParameterPacket'),
		PrepareExecuteOldProtocolPacket = require('./packets/PrepareExecuteOldProtocolPacket');

if (typeof Buffer.concat !== 'function') {
	// `Buffer.concat` is available since node 0.8.x.
	// If it's not available, define it. This source code is taken
	// from node's core source.
	Buffer.concat = function(list, length) {
		if (!Array.isArray(list)) {
			throw new TypeError('Usage: Buffer.concat(list, [length])');
		}

		if (list.length === 0) {
			return new Buffer(0);
		} else if (list.length === 1) {
			return list[0];
		}

		if (typeof length !== 'number') {
			length = 0;
			for (var i = 0; i < list.length; i++) {
				var buf = list[i];
				length += buf.length;
			}
		}

		var buffer = new Buffer(length);
		var pos = 0;
		for (var i = 0; i < list.length; i++) {
			var buf = list[i];
			buf.copy(buffer, pos);
			pos += buf.length;
		}
		return buffer;
	};
}

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
function CUBRIDConnection(brokerServer, brokerPort, user, password, database, cacheTimeout, connectionTimeout) {
  // Using EventEmitter.call on an object will do the setup of instance methods / properties
  // (not inherited) of an EventEmitter.
  // It is similar in purpose to super(...) in Java or base(...) in C#, but it is not implicit in Javascript.
  // Because of this, we must manually call it ourselves:
  EventEmitter.call(this);

	// Allow to pass connection parameters as an object.
	if (typeof brokerServer === 'object') {
		brokerPort = brokerServer.port;
		user = brokerServer.user;
		password = brokerServer.password;
		database = brokerServer.database;
		cacheTimeout = brokerServer.cacheTimeout;
		connectionTimeout = brokerServer.connectionTimeout;
		brokerServer = brokerServer.host;
	}

	// `cacheTimeout` is provided in milliseconds, but the `Cache` class requires seconds.
  this._queryCache = cacheTimeout && cacheTimeout > 0 ? new Cache(cacheTimeout / 1000) : null;

  // Connection parameters
  this.brokerServer = brokerServer || 'localhost';
  this.initialBrokerPort = brokerPort || 33000;
  this.connectionBrokerPort = -1;
  this.user = user || 'public';
  this.password = password || '';
  this.database = database || 'demodb';
	// Connection timeout in milliseconds.
	this._CONNECTION_TIMEOUT = connectionTimeout || 0;

  // Session public variables
  this.autoCommitMode = null; // Will be initialized on connect
  this.sessionId = 0;

  // Execution semaphore variables; prevent double-connect-attempts, overlapping-queries etc.
  this.connectionOpened = false;
  this.connectionPending = false;

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

  // Enforce query execution using the old protocol.
	// One would enforce the old protocol when trying to connect
	// to CUBRID SHARD Broker version 8.4.3 and 9.1.0.
	// On later versions of CUBRID SHARD Broker (8.4.4+, 9.2.0+)
	// users can use the default newer protocol.
  this._ENFORCE_OLD_QUERY_PROTOCOL = false;

	this._queue = new Queue();

  // Used for standard callbacks 'err' parameter
  this._NO_ERROR = null;
}

/**
 * Get broker connection port
 * @param self
 * @param callback
 * @private
 */
CUBRIDConnection.prototype._doGetBrokerPort = function (callback) {
  var self = this;

  self._socket = Net.createConnection(self.initialBrokerPort, self.brokerServer);
  self._socket.setNoDelay(true);
  self._socket.setTimeout(this._CONNECTION_TIMEOUT);

  var clientInfoExchangePacket = new ClientInfoExchangePacket(),
		  packetWriter = new PacketWriter(clientInfoExchangePacket.getBufferLength());

  clientInfoExchangePacket.write(packetWriter);
  self._socket.write(packetWriter._buffer);

  self._socket.on('timeout', function () {
	  // `timeout` is emitted (without an error message), if the socket
	  // times out from inactivity. This is only to notify that the
	  // socket has been idle. That's why we must manually close the
	  // connection.
	  // We need to force disconnection using `destroy()` function
	  // which will ensure that no more I/O activity happens on this
	  // socket. In contrast, `end()` function doesn't close the
	  // connection immediately; the server may still send some data,
	  // which we don't want.
	  self._socket.destroy();

    this.connectionOpened = false;

	  callback(new Error(ErrorMessages.ERROR_CONNECTION_TIMEOUT));
  });

  self._socket.on('error', function (err) {
	  // When `error` event is emitted, the socket client gets automatically
	  // closed. So, no need to close it manually.
    this.connectionOpened = false;
	  callback(err);
  });

  self._socket.once('data', function (data) {
	  // Clear connection timeout
	  self._socket.setTimeout(0);
    var packetReader = new PacketReader();
    packetReader.write(data);
    clientInfoExchangePacket.parse(packetReader);

	  var newPort = clientInfoExchangePacket.newConnectionPort;

    self.connectionBrokerPort = newPort;

	  if (newPort > 0) {
      self._socket.end();
    }

	  if (newPort >= 0) {
      callback();
    } else {
      callback(new Error(ErrorMessages.ERROR_NEW_BROKER_PORT));
    }
  });
};

/**
 * Login to a database
 * @param callback
 * @private
 */
CUBRIDConnection.prototype._doDatabaseLogin = function (callback) {
	var self = this;

  if (self.connectionBrokerPort > 0) {
    self._socket = Net.createConnection(self.connectionBrokerPort, self.brokerServer);
    self._socket.setNoDelay(true);
    self._socket.setTimeout(self._CONNECTION_TIMEOUT);
  }

  var openDatabasePacket = new OpenDatabasePacket({
		    database : self.database,
		    user     : self.user,
		    password : self.password,
		    casInfo  : self._CASInfo
		  }),
		  packetWriter = new PacketWriter(openDatabasePacket.getBufferLength());

  openDatabasePacket.write(packetWriter);

	self._socket.write(packetWriter._buffer);

  self._socket.on('timeout', function () {
    self._socket.destroy();
    this.connectionOpened = false;
    callback(new Error(ErrorMessages.ERROR_CONNECTION_TIMEOUT));
  });

  self._socket.on('error', function (err) {
	  self._socket.removeAllListeners('data');
    self.connectionOpened = false;
    callback(err);
  });

  self._socket.on('data', self._receiveBytes({
	  parserFunction: self._parseDatabaseLoginBuffer,
	  dataPacket: openDatabasePacket
  }, callback));
};

/**
 * Get the server database engine version
 * @param self
 * @param callback
 */
CUBRIDConnection.prototype._getEngineVersion = function (callback) {
  var self = this,
		  getEngineVersionPacket = new GetEngineVersionPacket({
	      casInfo : self._CASInfo
	    }),
		  packetWriter = new PacketWriter(getEngineVersionPacket.getBufferLength());

  getEngineVersionPacket.write(packetWriter);

  self._socket.write(packetWriter._buffer);

  self._socket.on('data', self._receiveBytes({
	  parserFunction: self._parseEngineVersionBuffer,
	  dataPacket: getEngineVersionPacket
  }, callback));
};

/**
 * Connect to database
 * @param callback
 */
CUBRIDConnection.prototype.connect = function (callback) {
  var self = this,
		  err = self._NO_ERROR;

  if (self.connectionOpened === true) {
    err = new Error(ErrorMessages.ERROR_CONNECTION_ALREADY_OPENED);
    Helpers._emitEvent(self, err, self.EVENT_ERROR);

	  if (typeof(callback) === 'function') {
      callback(err);
    }

    return;
  }

  if (self.connectionPending === true) {
    err = new Error(ErrorMessages.ERROR_CONNECTION_ALREADY_PENDING);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);

	  if (typeof(callback) === 'function') {
      callback(err);
    }

	  return;
  }

  self.connectionPending = true;

  ActionQueue.enqueue([
    function (cb) {
      self._doGetBrokerPort(cb);
    },

    function (cb) {
      self._doDatabaseLogin(cb);
    },

    function (cb) {
      self._getEngineVersion(cb);
    }
  ], function (err) {
      // Reset query execution status
      self.connectionPending = false;
      self.connectionOpened = !(typeof err !== 'undefined' && err !== null);
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_CONNECTED);

		  if (typeof(callback) === 'function') {
        callback(err);
      }
    }
  );
};

CUBRIDConnection.prototype._implyConnect = function(cb) {
	if (this.connectionOpened) {
		process.nextTick(cb);
	} else {
		this.connect(cb);
	}
};

/**
 * Get the server database engine version
 * @param callback
 */
CUBRIDConnection.prototype.getEngineVersion = function (callback) {
	Helpers._emitEvent(this, this._NO_ERROR, this.EVENT_ERROR, this.EVENT_ENGINE_VERSION_AVAILABLE, this._DB_ENGINE_VER);

	if (typeof(callback) === 'function') {
		var self = this;

		// Support asynchronous call for backward compatibility.
		process.nextTick(function () {
			callback(self._NO_ERROR, self._DB_ENGINE_VER);
		});
	}

	// Support synchronous call.
	return this._DB_ENGINE_VER;
};

/**
 * Execute SQL statements in batch mode
 * @param sqls
 * @param callback
 */
CUBRIDConnection.prototype.batchExecuteNoQuery = function (sqls, callback) {
	var self = this,
			query = new Query(null, callback);

	this._queue.push(function (done) {
		self._batchExecuteNoQuery(sqls, function (err) {
			query.callback(err);
			done();
		});
	});
};

CUBRIDConnection.prototype._batchExecuteNoQuery = function (sqls, callback) {
  var self = this,
		  sqlsArr,
		  err = self._NO_ERROR;

  if (Array.isArray(sqls)) {
    if (sqls.length === 0) {
      // No commands to execute
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_BATCH_COMMANDS_COMPLETED);

      if (typeof(callback) === 'function') {
        callback(err);
      }

      return;
    }

    sqlsArr = sqls;
  } else {
    sqlsArr = [sqls];
  }

  ActionQueue.enqueue([
    function (cb) {
	    self._implyConnect(cb);
    },
    function (cb) {
      var batchExecuteNoQueryPacket = new BatchExecuteNoQueryPacket({
	          SQLs           : sqlsArr,
	          casInfo        : self._CASInfo,
	          autoCommitMode : self.autoCommitMode,
	          dbVersion      : self._DB_ENGINE_VER
	        }),
		      packetWriter = new PacketWriter(batchExecuteNoQueryPacket.getBufferLength());

      batchExecuteNoQueryPacket.write(packetWriter);
      self._socket.write(packetWriter._buffer);

      self._socket.on('data', self._receiveBytes({
	      parserFunction: self._parseBatchExecuteBuffer,
	      dataPacket: batchExecuteNoQueryPacket
      }, cb));
    }
  ], function (err) {
    Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_BATCH_COMMANDS_COMPLETED);

    if (typeof(callback) === 'function') {
      callback(err);
    }
  });
};

// ## client.execute(sql, callback);
// `sql` is a string which represents a WRITE query or an array of strings
// for batch processing.
// `callback(err)` function accepts one argument: an error object if any.
CUBRIDConnection.prototype.execute = function (sql, callback) {
  var self = this;

  if(this._ENFORCE_OLD_QUERY_PROTOCOL === true){
    return self.executeWithTypedParams(sql, null, null, callback);
  } else {
    return self.batchExecuteNoQuery(sql, callback);
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
	var self = this,
			query = new Query(null, callback);

	this._queue.push(function (done) {
		self._executeWithTypedParams(sql, arrParamsValues, arrParamsDataTypes, function (err) {
			query.callback(err);
			done();
		});
	});
};

CUBRIDConnection.prototype._executeWithTypedParams = function (sql, arrParamsValues, arrParamsDataTypes, callback) {
  var self = this;

  ActionQueue.enqueue([
    function (cb) {
      self._implyConnect(cb);
    },
    function (cb) {
      var prepareExecuteOldProtocolPacket = new PrepareExecuteOldProtocolPacket({
	          sql            : sql,
	          casInfo        : self._CASInfo,
	          autoCommitMode : self.autoCommitMode,
	          dbVersion      : self._DB_ENGINE_VER,
	          paramValues    : arrParamsValues,
	          paramTypes     : arrParamsDataTypes
	        }),
		      packetWriter = new PacketWriter(prepareExecuteOldProtocolPacket.getPrepareBufferLength());
	    
      prepareExecuteOldProtocolPacket.writePrepare(packetWriter);
      self._socket.write(packetWriter._buffer);

      self._socket.on('data', self._receiveBytes({
	      parserFunction: self._parsePrepareBufferForOldProtocol,
	      dropDataPacket: true,
	      dataPacket: prepareExecuteOldProtocolPacket
      }, cb));
    }
  ], function (err) {
    Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_BATCH_COMMANDS_COMPLETED);
    if (typeof(callback) === 'function') {
      callback(err);
    }
  });
};

CUBRIDConnection.prototype._receiveBytes = function (options, cb) {
	this._callback = cb;
	this._parserOptions = options;
	this._parserFunction = options.parserFunction;
	this._totalBuffLength = 0;
	this._buffArr = [];
	this._expectedResponseLength = this._INVALID_RESPONSE_LENGTH;

	return this._receiveFirstBytes.bind(this);
};

CUBRIDConnection.prototype._receiveFirstBytes = function (data) {
	// Clear timeout if any.
	this._socket.setTimeout(0);

	this._totalBuffLength += data.length;
	this._buffArr.push(data);

	if (this._expectedResponseLength === this._INVALID_RESPONSE_LENGTH &&
			this._totalBuffLength >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
		var l = this._buffArr.length,
				buff;

		this._socket.pause();
		this._socket.removeAllListeners('data');

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
			this._socket.on('data', this._receiveRemainingBytes.bind(this));
			this._socket.resume();
		} else {
			this._socket.resume();
			this._parseBuffer();
		}
	}
};

CUBRIDConnection.prototype._receiveRemainingBytes = function (data) {
	this._totalBuffLength += data.length;
	this._buffArr.push(data);

	// If we have received all the expected data, start parsing it.
	if (this._totalBuffLength === this._expectedResponseLength) {
		this._socket.removeAllListeners('data');
		this._parseBuffer();
	}
};

CUBRIDConnection.prototype._parseBuffer = function () {
	var packetReader = new PacketReader();
	packetReader.write(Buffer.concat(this._buffArr, this._totalBuffLength));

	this._parserFunction(packetReader);
};

CUBRIDConnection.prototype._parseBufferForNewProtocol = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket,
			result = dataPacket.parse(packetReader).resultSet,
			errorCode = dataPacket.errorCode,
			err;

	if (errorCode !== 0) {
		err = new Error(errorCode + ':' + dataPacket.errorMsg);
	} else {
		this._queriesPacketList.push(dataPacket);

		if (this._queryCache !== null) {
			this._queryCache.getSet(this._parserOptions.sql, result);
		}
	}

	this._callback(err, result, dataPacket.queryHandle);
};

CUBRIDConnection.prototype._parsePrepareBufferForOldProtocol = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket;

	dataPacket.parsePrepare(packetReader);

	var errorCode = dataPacket.errorCode;

	if (errorCode !== 0) {
		cb(new Error(errorCode + ':' + dataPacket.errorMsg), dataPacket);
	} else {
		this._parseExecuteForOldProtocol();
	}
};

CUBRIDConnection.prototype._parseExecuteForOldProtocol = function () {
	var dataPacket = this._parserOptions.dataPacket,
			packetWriter = new PacketWriter(dataPacket.getExecuteBufferLength());

	dataPacket.writeExecute(packetWriter);
	this._socket.write(packetWriter._buffer);

	this._socket.on('data', this._receiveBytes({
		parserFunction: this._parseExecuteBufferForOldProtocol,
		dropDataPacket: this._parserOptions.dropDataPacket,
		dataPacket: dataPacket
	}, this._callback));
};

CUBRIDConnection.prototype._parseExecuteBufferForOldProtocol = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket,
			result = dataPacket.parseExecute(packetReader).resultSet,
			errorCode = dataPacket.errorCode;

	if (errorCode !== 0) {
		this._callback(new Error(errorCode + ':' + dataPacket.errorMsg));
	} else {
		if (!this._parserOptions.dropDataPacket) {
			this._queriesPacketList.push(dataPacket);
		}

		this._callback(null, result, dataPacket.queryHandle);
	}
};

CUBRIDConnection.prototype._parseFetchBuffer = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket,
			result = dataPacket.parse(packetReader, this._queriesPacketList[this._parserOptions.i]).resultSet,
			errorCode = dataPacket.errorCode,
			err;

	if (errorCode !== 0) {
		err = new Error(errorCode + ':' + dataPacket.errorMsg);
	}

	this._callback(err, result);
};

CUBRIDConnection.prototype._parseBatchExecuteBuffer = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket;

	dataPacket.parse(packetReader);

	var errorCode = dataPacket.errorCode,
			err;

	if (!this._DB_ENGINE_VER.startsWith('8.4.1')) {
		err = [];

		for (var i = 0; i < dataPacket.arrResultsCode.length; ++i) {
			if (dataPacket.arrResultsCode[i] < 0) {
				err.push(new Error(dataPacket.arrResultsCode[i] + ':' + dataPacket.arrResultsMsg[i]));
			}
		}

		if (!err.length) {
			err = null;
		}
	} else {
		if (errorCode !== 0) {
			err = new Error(errorCode + ':' + dataPacket.errorMsg);
		}
	}

	this._callback(err);
};

CUBRIDConnection.prototype._parseDatabaseLoginBuffer = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket;

	dataPacket.parse(packetReader);
	this._CASInfo = dataPacket.casInfo;

	var errorCode = dataPacket.errorCode,
			err;

	if (errorCode !== 0) {
		err = new Error(errorCode + ':' + dataPacket.errorMsg);
	} else {
		this.sessionId = dataPacket.sessionId;
		this.autoCommitMode = this.AUTOCOMMIT_ON;
	}

	this._callback(err);
};

CUBRIDConnection.prototype._parseEngineVersionBuffer = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket;

	dataPacket.parse(packetReader);

	var errorCode = dataPacket.errorCode,
			err;

	if (errorCode !== 0) {
		err = new Error(errorCode + ':' + dataPacket.errorMsg);
	} else {
		this._DB_ENGINE_VER = dataPacket.engineVersion;
	}

	this._callback(err);
};

CUBRIDConnection.prototype._parseCloseQueryBuffer = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket;

	dataPacket.parse(packetReader);

	var errorCode = dataPacket.errorCode,
			err;

	if (errorCode !== 0) {
		err = new Error(errorCode + ':' + dataPacket.errorMsg);
	} else {
		for (var i = 0; i < this._queriesPacketList.length; ++i) {
			if (this._queriesPacketList[i].queryHandle === this._parserOptions.queryHandle) {
				this._queriesPacketList.splice(i, 1);
				break;
			}
		}
	}

	this._callback(err);
};

CUBRIDConnection.prototype._parseCloseBuffer = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket;

	dataPacket.parse(packetReader);
	// Close internal socket connection.
	this._socket.destroy();

	var errorCode = dataPacket.errorCode,
			err;

	if (errorCode !== 0) {
		err = new Error(errorCode + ':' + dataPacket.errorMsg);
	}

	this._callback(err);
};

CUBRIDConnection.prototype._parseCommitBuffer =
		CUBRIDConnection.prototype._parseRollbackBuffer =
				CUBRIDConnection.prototype._parseSetDatabaseParameterBuffer =

CUBRIDConnection.prototype._parseGetDatabaseParameterBuffer = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket;

	dataPacket.parse(packetReader);

	var errorCode = dataPacket.errorCode,
			err;

	if (errorCode !== 0) {
		err = new Error(errorCode + ':' + dataPacket.errorMsg);
	}

	this._callback(err);
};

CUBRIDConnection.prototype._parseGetSchemaBuffer = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket;

	dataPacket.parseRequestSchema(packetReader);

	var errorCode = dataPacket.errorCode;

	if (errorCode !== 0) {
		this._callback(new Error(errorCode + ':' + dataPacket.errorMsg), dataPacket);
	} else {
		this._parseWriteFetchSchema();
	}
};

CUBRIDConnection.prototype._parseWriteFetchSchema = function () {
	var dataPacket = this._parserOptions.dataPacket,
			packetWriter = new PacketWriter(dataPacket.getFetchSchemaBufferLength());

	dataPacket.writeFetchSchema(packetWriter);
	this._socket.write(packetWriter._buffer);

	this._socket.on('data', this._receiveBytes({
		parserFunction: this._parseFetchSchemaBuffer,
		dataPacket: dataPacket
	}, this._callback));
};

CUBRIDConnection.prototype._parseFetchSchemaBuffer = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket,
			result = dataPacket.parseFetchSchema(packetReader).schemaInfo,
			errorCode = dataPacket.errorCode,
			err;

	if (errorCode !== 0) {
		err = new Error(errorCode + ':' + dataPacket.errorMsg);
	}

	this._callback(err, result);
};

CUBRIDConnection.prototype._parseLobNewBuffer = function (packetReader) {
	var dataPacket = this._parserOptions.dataPacket,
			logObject = dataPacket.parse(packetReader).result,
			errorCode = dataPacket.errorCode,
			err;

	if (errorCode !== 0) {
		err = new Error(errorCode + ':' + dataPacket.errorMsg);
	}

	this._callback(err, logObject);
};

CUBRIDConnection.prototype.query = function (sql, params, callback) {
	var self = this,
			query = new Query(sql, params, callback);

	this._queue.push(function (done) {
		self._query(query.sql, function (err, result, queryHandle) {
			query.callback(err, result, queryHandle);
			done();
		});
	});
};

/**
 * Execute query and retrieve rows results
 * @param sql
 * @param callback
 */
CUBRIDConnection.prototype._query = function (sql, callback) {
  if (this._ENFORCE_OLD_QUERY_PROTOCOL) {
    return this._queryOldProtocol(sql, null, null, callback);
  } else {
    return this._queryNewProtocol(sql, callback);
  }
};

CUBRIDConnection.prototype._queryNewProtocol = function (sql, callback) {
  var self = this,
		  err = self._NO_ERROR;

  ActionQueue.enqueue([
    function (cb) {
	    self._implyConnect(cb);
    },
    function (cb) {
      // Check if data is already in cache
      if (self._queryCache !== null && self._queryCache.contains(sql)) {
	      cb(null, self._queryCache.get(sql));
      } else {
	      var executeQueryPacket = new ExecuteQueryPacket({
				      sql            : sql,
				      casInfo        : self._CASInfo,
				      autoCommitMode : self.autoCommitMode,
				      dbVersion      : self._DB_ENGINE_VER
			      }),
			      packetWriter = new PacketWriter(executeQueryPacket.getBufferLength());

	      executeQueryPacket.write(packetWriter);
	      self._socket.write(packetWriter._buffer);

	      // `_receiveBytes()` will return a function which will process the
	      // incoming data.
				self._socket.on('data', self._receiveBytes({
					sql: sql,
					parserFunction: self._parseBufferForNewProtocol,
					dataPacket: executeQueryPacket
				}, cb));
	    }
    }
  ], function (err, result, handle) {
    Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_QUERY_DATA_AVAILABLE, result, handle, sql);

	  if (typeof(callback) === 'function') {
      callback(err, result, handle);
    }
  });
};

/**
 * Execute query and retrieve rows results, using the older 8.4.x query protocol
 * @param sql
 * @param arrParamsValues
 * @param arrParamsDataTypes
 * @param callback
 */
CUBRIDConnection.prototype._queryOldProtocol = function (sql, arrParamsValues, arrParamsDataTypes, callback) {
  var self = this,
		  err = self._NO_ERROR;

  ActionQueue.enqueue([
    function (cb) {
      self._implyConnect(cb);
    },
    function (cb) {
      var prepareExecuteOldProtocolPacket = new PrepareExecuteOldProtocolPacket({
            sql            : sql,
            casInfo        : self._CASInfo,
            autoCommitMode : self.autoCommitMode,
            dbVersion      : self._DB_ENGINE_VER,
            paramValues    : arrParamsValues,
            paramTypes     : arrParamsDataTypes
          }),
		      packetWriter = new PacketWriter(prepareExecuteOldProtocolPacket.getPrepareBufferLength());

      prepareExecuteOldProtocolPacket.writePrepare(packetWriter);
      self._socket.write(packetWriter._buffer);

      self._socket.on('data', self._receiveBytes({
	      parserFunction: self._parsePrepareBufferForOldProtocol,
	      dataPacket: prepareExecuteOldProtocolPacket
      }, cb));
    }
  ], function (err, result, handle) {
    Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_QUERY_DATA_AVAILABLE, result, handle, sql);

	  if (typeof(callback) === 'function') {
      callback(err, result, handle);
    }
  });
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
	var self = this,
			query = new Query(null, callback);

	this._queue.unshift(function (done) {
		self._fetch(queryHandle, function (err, result, queryHandle) {
			query.callback(err, result, queryHandle);
			done();
		});
	});
};

CUBRIDConnection.prototype._fetch = function (queryHandle, callback) {
  var self = this,
		  err = self._NO_ERROR,
		  foundQueryHandle = false;

  for (var i = 0; i < self._queriesPacketList.length; i++) {
    if (self._queriesPacketList[i].queryHandle === queryHandle) {
      foundQueryHandle = true;
      break;
    }
  }

  if (!foundQueryHandle) {
    err = new Error(ErrorMessages.ERROR_NO_ACTIVE_QUERY);

    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);

	  if (typeof(callback) === 'function') {
      callback(err, null, null);
    }
  } else {
    if (self._queriesPacketList[i].currentTupleCount === self._queriesPacketList[i].totalTupleCount) {
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_FETCH_NO_MORE_DATA_AVAILABLE, queryHandle);

      if (typeof(callback) === 'function') {
        callback(err, null, queryHandle);
      }
    } else {
      var fetchPacket = new FetchPacket({
		        casInfo    : self._CASInfo,
		        db_version : self._DB_ENGINE_VER
		      }),
		      packetWriter = new PacketWriter(fetchPacket.getBufferLength());

      fetchPacket.write(packetWriter, self._queriesPacketList[i]);
      self._socket.write(packetWriter._buffer);

	    self._socket.on('data', self._receiveBytes({
		    i: i,
		    parserFunction: self._parseFetchBuffer,
		    dataPacket: fetchPacket
	    }, function (err, result) {
		    Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_FETCH_DATA_AVAILABLE, result, queryHandle);

		    if (typeof(callback) === 'function') {
			    callback(err, result, queryHandle);
		    }
	    }));
    }
  }
};

/**
 * Close query
 * @param queryHandle
 * @param callback
 */
CUBRIDConnection.prototype.closeQuery = function (queryHandle, callback) {
	var self = this,
			query = new Query(queryHandle, callback);

	this._queue.unshift(function (done) {
		self._closeQuery(queryHandle, function (err) {
			query.callback(err, queryHandle);
			done();
		});
	});
};

CUBRIDConnection.prototype._closeQuery = function (queryHandle, callback) {
  var self = this,
		  err = self._NO_ERROR,
		  foundQueryHandle = false;

  for (var i = 0; i < self._queriesPacketList.length; i++) {
    if (self._queriesPacketList[i].queryHandle === queryHandle) {
      foundQueryHandle = true;
      break;
    }
  }

  if (!foundQueryHandle) {
	  err = new Error(ErrorMessages.ERROR_NO_ACTIVE_QUERY + ": " + queryHandle);

    if (typeof(callback) === 'function') {
      callback(err);
    }

	  Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
  } else {
    var closeQueryPacket = new CloseQueryPacket({
		      casInfo    : self._CASInfo,
		      reqHandle  : queryHandle,
		      db_version : self._DB_ENGINE_VER
		    }),
		    packetWriter = new PacketWriter(closeQueryPacket.getBufferLength());

	  closeQueryPacket.write(packetWriter);

	  self._socket.write(packetWriter._buffer);

	  self._socket.on('data', self._receiveBytes({
		  queryHandle: queryHandle,
		  parserFunction: self._parseCloseQueryBuffer,
		  dataPacket: closeQueryPacket
	  }, function (err) {
		  if (typeof(callback) === 'function') {
			  callback(err, queryHandle);
		  }

		  Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_QUERY_CLOSED, queryHandle);
	  }));
  }
};

/**
 * Closes the active connection.
 * @alias end()
 * @param callback
 */
CUBRIDConnection.prototype.close = close;
CUBRIDConnection.prototype.end = close;

function close(callback) {
	var self = this,
			err = self._NO_ERROR;

	if (self.connectionOpened === false) {
		err = new Error(ErrorMessages.ERROR_CONNECTION_ALREADY_CLOSED);

		Helpers._emitEvent(self, err, self.EVENT_ERROR, null);

		if (typeof(callback) === 'function') {
			callback(err);
		}

		return;
	}

	// Reset connection status
	self.connectionPending = false;
	self.connectionOpened = false;
	// Remove all pending requests.
	this._queue.empty();

	ActionQueue.enqueue([
		function (cb) {
			ActionQueue.while(
				function () {
					return (self._queriesPacketList[0] !== null && self._queriesPacketList[0] !== undefined);
				},
				function (cb) {
					self.closeQuery(self._queriesPacketList[0].queryHandle, cb);
				},
				function (err) {
					// Log non-blocking error
					if (typeof err !== 'undefined' && err !== null) {
						Helpers.logError(ErrorMessages.ERROR_ON_CLOSE_QUERY_HANDLE + err);
					}

					cb();
				}
			);
		},
		function (cb) {
			var closeDatabasePacket = new CloseDatabasePacket({
						casInfo    : self._CASInfo,
						db_version : self._DB_ENGINE_VER
					}),
					packetWriter = new PacketWriter(closeDatabasePacket.getBufferLength());

			closeDatabasePacket.write(packetWriter);
			self._socket.write(packetWriter._buffer);

			self._socket.on('data', self._receiveBytes({
				parserFunction: self._parseCloseBuffer,
				dataPacket: closeDatabasePacket
			}, cb));
		}
	], function (err) {
		Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_CONNECTION_CLOSED);

		if (typeof(callback) === 'function') {
			callback(err);
		}
	});
}
/**
 * Start transaction
 * @param callback
 */
CUBRIDConnection.prototype.beginTransaction = function (callback) {
  var self = this;

  _toggleAutoCommitMode(self, self.AUTOCOMMIT_OFF, function (err) {
    Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_BEGIN_TRANSACTION);

    if (typeof(callback) === 'function') {
      callback(err);
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
    if (typeof(callback) === 'function') {
      callback(err);
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
	var self = this,
			query = new Query(null, callback);

	this._queue.unshift(function (done) {
		self._rollback(function (err) {
			query.callback(err);
			done();
		});
	});
};

CUBRIDConnection.prototype._rollback = function (callback) {
  var self = this,
		  err = self._NO_ERROR;

  if (self.autoCommitMode === false) {
    var rollbackPacket = new RollbackPacket({
	        casInfo    : self._CASInfo,
	        db_version : self._DB_ENGINE_VER
	      }),
		    packetWriter = new PacketWriter(rollbackPacket.getBufferLength());

    rollbackPacket.write(packetWriter);
    self._socket.write(packetWriter._buffer);

	  self._socket.on('data', self._receiveBytes({
		  parserFunction: self._parseRollbackBuffer,
		  dataPacket: rollbackPacket
	  }, function (err) {
		  self._socket.removeAllListeners('data');

		  Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_ROLLBACK_COMPLETED);

		  if (typeof(callback) === 'function') {
			  callback(err);
		  }
	  }));
  } else {
    err = new Error(ErrorMessages.ERROR_NO_ROLLBACK);

	  Helpers._emitEvent(self, err, self.EVENT_ERROR, null);

	  if (typeof(callback) === 'function') {
      callback(err);
    }
  }
};

/**
 * Commit transaction
 * @param callback
 */
CUBRIDConnection.prototype.commit = function (callback) {
	var self = this,
			query = new Query(null, callback);

	this._queue.unshift(function (done) {
		self._commit(function (err) {
			query.callback(err);
			done();
		});
	});
};

CUBRIDConnection.prototype._commit = function (callback) {
  var self = this;
  var err = self._NO_ERROR;

  if (self.autoCommitMode === false) {
    var commitPacket = new CommitPacket({
	        casInfo    : self._CASInfo,
	        db_version : self._DB_ENGINE_VER
	      }),
		    packetWriter = new PacketWriter(commitPacket.getBufferLength());

    commitPacket.write(packetWriter);
    self._socket.write(packetWriter._buffer);

	  self._socket.on('data', self._receiveBytes({
		  parserFunction: self._parseCommitBuffer,
		  dataPacket: commitPacket
	  }, function (err) {
		  self._socket.removeAllListeners('data');

		  Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_COMMIT_COMPLETED);

		  if (typeof(callback) === 'function') {
			  callback(err);
		  }
	  }));
  } else {
    err = new Error(ErrorMessages.ERROR_NO_COMMIT);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (typeof(callback) === 'function') {
      callback(err);
    }
    return;
  }
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

  if (!Helpers._validateInputBoolean(autoCommitMode)) {
    Helpers._emitEvent(self, new Error(ErrorMessages.ERROR_INPUT_VALIDATION), self.EVENT_ERROR, null);
    if (typeof(callback) === 'function') {
      callback(err);
    }
    return;
  }

  self.autoCommitMode = autoCommitMode;

  if (typeof(callback) === 'function') {
    callback(err);
  }
}

/**
 * Get database schema information
 * @param schemaType
 * @param tableNameFilter
 * @param callback
 */
CUBRIDConnection.prototype.getSchema = function (schemaType, tableNameFilter, callback) {
	var self = this,
			query = new Query(null, callback);

	this._queue.push(function (done) {
		self._getSchema(schemaType, tableNameFilter, function (err, result) {
			query.callback(err, result);
			done();
		});
	});
};

CUBRIDConnection.prototype._getSchema = function (schemaType, tableNameFilter, callback) {
  var self = this;

  ActionQueue.enqueue([
      function (cb) {
        if (self.connectionOpened === false) {
          self.connect(cb);
        } else {
          cb();
        }
      },
      function (cb) {
        var getSchemaPacket = new GetSchemaPacket({
	            casInfo          : self._CASInfo,
	            schemaType       : schemaType,
	            tableNamePattern : tableNameFilter,
	            db_version       : self._DB_ENGINE_VER
	          }),
		        packetWriter = new PacketWriter(getSchemaPacket.getRequestSchemaBufferLength());

        getSchemaPacket.writeRequestSchema(packetWriter);
        self._socket.write(packetWriter._buffer);

        self._socket.on('data', self._receiveBytes({
	        parserFunction: self._parseGetSchemaBuffer,
	        dataPacket: getSchemaPacket
        }, cb));
      }
    ], function (err, result) {
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_SCHEMA_DATA_AVAILABLE, result);

		  if (typeof(callback) === 'function') {
        callback(err, result);
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
	var self = this,
			query = new Query(null, callback);

	this._queue.push(function (done) {
		self._lobNew(lobType, function (err, lobObject) {
			query.callback(err, lobObject);
			done();
		});
	});
};

CUBRIDConnection.prototype._lobNew = function (lobType, callback) {
  var self = this;

  ActionQueue.enqueue([
    function (cb) {
      if (self.connectionOpened === false) {
        self.connect(cb);
      } else {
        cb();
      }
    },
    function (cb) {
      var lobNewPacket = new LOBNewPacket({
	          casInfo    : self._CASInfo,
	          lobType    : lobType,
	          db_version : self._DB_ENGINE_VER
	        }),
		      packetWriter = new PacketWriter(lobNewPacket.getBufferLength());

      lobNewPacket.write(packetWriter);
      self._socket.write(packetWriter._buffer);

      self._socket.on('data', self._receiveBytes({
        parserFunction: self._parseLobNewBuffer,
	      dataPacket: lobNewPacket
      }, cb));
    }
  ],
  function (err, lobObject) {
    Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_LOB_NEW_COMPLETED, lobObject);
    if (typeof(callback) === 'function') {
      callback(err, lobObject);
    }
  });
};

/**
 * Write data to a LOB object
 * @param lobObject
 * @param position
 * @param dataBuffer
 * @param callback
 */
CUBRIDConnection.prototype.lobWrite = function (lobObject, position, dataBuffer, callback) {
	var self = this,
			query = new Query(null, callback);

	this._queue.push(function (done) {
		self._lobWrite(lobObject, position, dataBuffer, function (err, lobObject, totalWriteLen) {
			query.callback(err, lobObject, totalWriteLen);
			done();
		});
	});
};

CUBRIDConnection.prototype._lobWrite = function (lobObject, position, dataBuffer, callback) {
  var self = this,
		  err = self._NO_ERROR;

  if (lobObject.lobLength + 1 !== position) {
    err = new Error(ErrorMessages.ERROR_INVALID_LOB_POSITION);
    Helpers.logError(ErrorMessages.ERROR_INVALID_LOB_POSITION);
    return callback(err);
  }

  --position;

  var realWriteLen, writeLen,
		  totalWriteLen = 0,
		  len = dataBuffer.length,
		  offset = 0;

  ActionQueue.while(
    function () {
      return len > 0;
    },
    function (cb) {
      var expectedResponseLength = self._INVALID_RESPONSE_LENGTH;

      writeLen = Math.min(len, self._LOB_MAX_IO_LENGTH);

	    var dataToWrite = null;

      if (lobObject.lobType === CASConstants.CUBRIDDataType.CCI_U_TYPE_BLOB) {
        dataToWrite = dataBuffer.slice(position, position + writeLen);
      } else {
        if (lobObject.lobType === CASConstants.CUBRIDDataType.CCI_U_TYPE_CLOB) {
          dataToWrite = dataBuffer.substring(position, position + writeLen);
        }
      }

      var lobWritePacket = new LOBWritePacket({
		        casInfo    : self._CASInfo,
		        lobObject  : lobObject,
		        position   : position,
		        data       : dataToWrite,
		        writeLen   : writeLen,
		        db_version : self._DB_ENGINE_VER
		      }),
		      packetWriter = new PacketWriter(lobWritePacket.getBufferLength()),
		      totalBuffLength = 0,
		      buffArr = [];

      lobWritePacket.write(packetWriter);
      self._socket.write(packetWriter._buffer);

      self._socket.on('data', function (data) {
	      totalBuffLength += data.length;
	      buffArr.push(data);

	      if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
			      totalBuffLength >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
		      var l = buffArr.length,
				      buff;

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
          self._socket.removeAllListeners('data');

	        var packetReader = new PacketReader();
	        packetReader.write(Buffer.concat(buffArr, totalBuffLength));

          lobWritePacket.parse(packetReader);
          realWriteLen = lobWritePacket.wroteLength;
          position = position + realWriteLen;
          len -= realWriteLen;
          offset += realWriteLen;
          totalWriteLen += realWriteLen;

	        var errorCode = lobWritePacket.errorCode,
		          errorMsg = lobWritePacket.errorMsg;

          if (errorCode !== 0) {
            err = new Error(errorCode + ':' + errorMsg);
          }

	        cb(err);
        }
      });
    },

    function (err) {
      if (totalWriteLen > lobObject.lobLength) {
        lobObject.lobLength = totalWriteLen;
      }
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_LOB_WRITE_COMPLETED, lobObject, totalWriteLen);

      if (typeof(callback) === 'function') {
        callback(err, lobObject, totalWriteLen);
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
	var self = this,
			query = new Query(null, callback);

	this._queue.push(function (done) {
		self._lobRead(lobObject, position, length, function (err, buffer, totalReadLen) {
			query.callback(err, buffer, totalReadLen);
			done();
		});
	});
};

CUBRIDConnection.prototype._lobRead = function (lobObject, position, length, callback) {
  var self = this,
		  err = self._NO_ERROR,
		  buffer;

  if (lobObject.lobType === CASConstants.CUBRIDDataType.CCI_U_TYPE_CLOB) {
    buffer = '';
  } else {
    buffer = new Buffer(0);
  }

  --position;

  if (lobObject.lobLength < position + length) {
    err = new Error(ErrorMessages.ERROR_INVALID_LOB_POSITION);
    Helpers.logError(ErrorMessages.ERROR_INVALID_LOB_POSITION);
    return callback(err);
  }

  var realReadLen,
		  readLen,
		  totalReadLen = 0;

  ActionQueue.while(
    function () {
      return length > 0;
    },
    function (cb) {
      var expectedResponseLength = self._INVALID_RESPONSE_LENGTH,
		      lobReadPacket = new LOBReadPacket({
	          casInfo      : self._CASInfo,
	          lobObject    : lobObject,
	          position     : position,
	          lengthToRead : length,
	          db_version   : self._DB_ENGINE_VER
	        }),
		      packetWriter = new PacketWriter(lobReadPacket.getBufferLength()),
		      totalBuffLength = 0,
		      buffArr = [];

	    readLen = Math.min(length, self._LOB_MAX_IO_LENGTH);

	    lobReadPacket.write(packetWriter);
      self._socket.write(packetWriter._buffer);

      self._socket.on('data', function (data) {
	      totalBuffLength += data.length;
	      buffArr.push(data);

	      if (expectedResponseLength === self._INVALID_RESPONSE_LENGTH &&
			      totalBuffLength >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
		      var l = buffArr.length,
				      buff;

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
          self._socket.removeAllListeners('data');

          var packetReader = new PacketReader();
	        packetReader.write(Buffer.concat(buffArr, totalBuffLength));

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

          if (errorCode !== 0) {
            err = new Error(errorCode + ':' + lobReadPacket.errorMsg);
          }

	        cb(err);
        }
      });
    },
    function (err) {
      Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_LOB_READ_COMPLETED, buffer, totalReadLen);
      if (typeof(callback) === 'function') {
        callback(err, buffer, totalReadLen);
      }
    });
};

/**
 * Set connection timeout value in milliseconds.
 * 1. If the value is <= 0, the timeout is reset to none. In this case,
 * according to our observations, the underlying Node.js network socket
 * times out in about 75 seconds (1 minute 15 seconds).
 * @param timeout (msec)
 */
CUBRIDConnection.prototype.setConnectionTimeout = function (timeout) {
  this._CONNECTION_TIMEOUT = timeout >= 0 ? timeout : 0;
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
	var self = this,
			query = new Query(null, callback);

	this._queue.push(function (done) {
		self._setDatabaseParameter(parameter, value, function (err) {
			query.callback(err);
			done();
		});
	});
};

CUBRIDConnection.prototype._setDatabaseParameter = function (parameter, value, callback) {
  var self = this,
		  err = self._NO_ERROR;

  if (parameter === CASConstants.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH) {
    var errorCode = -1011;
    var errorMsg = Helpers._resolveErrorCode(errorCode);
    err = new Error(errorCode + ':' + errorMsg);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (typeof(callback) === 'function') {
      callback(err);
    }
    return;
  }

  var setDbParameterPacket = new SetDbParameterPacket({
	      casInfo   : self._CASInfo,
	      parameter : parameter,
	      value     : value
	    }),
		  packetWriter = new PacketWriter(setDbParameterPacket.getBufferLength());

  setDbParameterPacket.write(packetWriter);
  self._socket.write(packetWriter._buffer);

  self._socket.on('data', self._receiveBytes({
	  parserFunction: self._parseSetDatabaseParameterBuffer,
	  dataPacket: setDbParameterPacket
  }, function (err) {
	  Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_SET_DB_PARAMETER_COMPLETED, null);

	  if (typeof(callback) === 'function') {
		  callback(err);
	  }
  }));
};

/**
 * Get a database parameter
 * @param parameter id
 * @param callback
 */
CUBRIDConnection.prototype.getDatabaseParameter = function (parameter, callback) {
	var self = this,
			query = new Query(null, callback);

	this._queue.push(function (done) {
		self._getDatabaseParameter(parameter, function (err, value) {
			query.callback(err, value);
			done();
		});
	});
};

CUBRIDConnection.prototype._getDatabaseParameter = function (parameter, callback) {
  var self = this,
		  err = self._NO_ERROR;

  if (parameter === CASConstants.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH) {
    var errorCode = -1011;
    var errorMsg = Helpers._resolveErrorCode(errorCode);
    err = new Error(errorCode + ':' + errorMsg);
    Helpers._emitEvent(self, err, self.EVENT_ERROR, null);
    if (typeof(callback) === 'function') {
      callback(err);
    }
    return;
  }

  var getDbParameterPacket = new GetDbParameterPacket({
	      casInfo   : self._CASInfo,
	      parameter : parameter
	    }),
		  packetWriter = new PacketWriter(getDbParameterPacket.getBufferLength());

  getDbParameterPacket.write(packetWriter);
  self._socket.write(packetWriter._buffer);

	self._socket.on('data', self._receiveBytes({
		parserFunction: self._parseGetDatabaseParameterBuffer,
		dataPacket: getDbParameterPacket
	}, function (err) {
		Helpers._emitEvent(self, err, self.EVENT_ERROR, self.EVENT_GET_DB_PARAMETER_COMPLETED, getDbParameterPacket.value);

		if (typeof(callback) === 'function') {
			callback(err, getDbParameterPacket.value);
		}
	}));
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
	this.query(sql, callback);
};

/**
 * Add a non-query (direct SQL execute statement) to the queries queue
 * @param sql SQL command to execute
 * @param callback
 */
CUBRIDConnection.prototype.addNonQuery = function (sql, callback) {
  this.execute(sql, callback);
};

/**
 * Return true if there are pending queries in the queries queue
 * @return {Boolean}
 */
CUBRIDConnection.prototype.queriesQueueIsEmpty = isQueueEmpty;
CUBRIDConnection.prototype.isQueueEmpty = isQueueEmpty;

function isQueueEmpty() {
  return this._queue.isEmpty();
};

CUBRIDConnection.prototype.getQueueDepth = function () {
	return this._queue.getDepth();
};
