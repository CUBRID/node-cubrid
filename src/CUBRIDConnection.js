var Net = require('net'),
  EventEmitter = require('events').EventEmitter,
  DATA_TYPES = require('./constants/DataTypes'),
  PacketReader = require('./packets/PacketReader'),
  PacketWriter = require('./packets/PacketWriter'),
  ActionQueue = require('./utils/ActionQueue'),
  Helpers = require('../src/utils/Helpers'),
  Cache = require('../src/utils/Cache'),
  ClientInfoExchangePacket = require('./packets/ClientInfoExchangePacket'),
  OpenDatabasePacket = require('./packets/OpenDatabasePacket'),
  GetEngineVersionPacket = require('./packets/GetEngineVersionPacket'),
  ExecuteQueryPacket = require('./packets/ExecuteQueryPacket'),
  CloseQueryPacket = require('./packets/CloseQueryPacket'),
  BatchExecuteNoQueryPacket = require('./packets/BatchExecuteNoQueryPacket'),
  CloseDatabasePacket = require('./packets/CloseDatabasePacket'),
  FetchPacket = require('./packets/FetchPacket');

module.exports = CUBRIDConnection;

//TODO Add Utils.inherit for EventEmitter

function CUBRIDConnection(brokerServer, brokerPort, user, password, database, cacheTimeout) {
  // Using EventEmitter.call on an object will do the setup of instance methods / properties
  // (not inherited) of an EventEmitter.
  // It is similar in purpose to super(...) in Java or base(...) in C#, but it is not implicit in Javascript.
  // Because of this, we must manually call it ourselves:
  //EventEmitter.call(this);

  this.queryCache = null;
  if (typeof cacheTimeout !== 'undefined' && cacheTimeout > 0) {
    this.queryCache = new Cache();
  }

  this.brokerServer = brokerServer || 'localhost';
  this.initialBrokerPort = brokerPort || 33000;
  this.connectionBrokerPort = 0;
  this.user = user || 'public';
  this.password = password || '';
  this.database = database || 'demodb';
  this.socket = new Net.Socket();
  this.CASInfo = [0, 0xFF, 0xFF, 0xFF];
  this.connectionOpened = false;
  this.autoCommitMode = 0;
  this.sessionId = 0;
  this.queriesHandleList = new Array();
}

CUBRIDConnection.prototype._doGetBrokerPort = function (self, callback) {
  self.socket = Net.createConnection(self.initialBrokerPort, self.brokerServer);
  self.socket.setNoDelay(true);

  self.socket.on('error', function (err) {
    this.connectionOpened = false;
    delete this.queriesHandleList;
    //throw err;
    callback.call(err);
  });
  self.socket.once('data', function (data) {
    var packetReader = new PacketReader();
    packetReader.write(data);
    clientInfoExchangePacket.parse(packetReader);
    var newPort = clientInfoExchangePacket.newConnectionPort;
    self.connectionBrokerPort = newPort;
    self.socket.end();
    if (callback && typeof(callback) === 'function') {
      if (newPort > 0) {
        callback.call(null);
      } else {
        var err = new Error('Error receiving a new connection port!');
        callback.call(err);
      }
    }
  });

  var packetWriter = new PacketWriter();
  var clientInfoExchangePacket = new ClientInfoExchangePacket();
  clientInfoExchangePacket.write(packetWriter);
  self.socket.write(packetWriter._buffer);
};

CUBRIDConnection.prototype._doDatabaseLogin = function (self, callback) {
  var err = null;
  var responseData = new Buffer(0);
  var expectedResponseLength = -1;

  self.socket = Net.createConnection(self.connectionBrokerPort, self.brokerServer);
  self.socket.setNoDelay(true);
  self.socket.on('error', function (err) {
    this.connectionOpened = false;
    delete this.queriesHandleList;
    callback.call(self, err);
  });

  self.socket.on('data', function (data) {
    responseData = Helpers.combineData(responseData, data);

    if (expectedResponseLength === -1 && responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers.getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
//			self.socket.listeners('data').splice(0).forEach(function (listener) {
//				self.socket.removeListener('data', listener);
//			});
      self.socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(responseData);
      openDatabasePacket.parse(packetReader);
      self.CASInfo = openDatabasePacket.casInfo;
      var errorCode = openDatabasePacket.errorCode;
      var errorMsg = openDatabasePacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      } else {
        self.sessionId = openDatabasePacket.sessionId;
        self.autoCommitMode = (self.CASInfo[3] & 0x01) ? true : false;
      }
      if (callback && typeof(callback) === 'function') {
        callback.call(self, err);
      }
    }
  });

  var packetWriter = new PacketWriter();
  var openDatabasePacket = new OpenDatabasePacket(
    {
      database : self.database,
      user     : self.user,
      password : self.password,
      casInfo  : self.CASInfo
    }
  );
  openDatabasePacket.write(packetWriter);
  self.socket.write(packetWriter._buffer);
};

CUBRIDConnection.prototype.connect = function (callback) {
  var self = this;

  ActionQueue.enqueue(
    [
      function (cb) {
        self._doGetBrokerPort(self, cb);
      },
      function (cb) {
        self._doDatabaseLogin(self, cb);
      }
    ],
    function (err) {
      if (callback && typeof(callback) === 'function') {
        if (typeof err != undefined && err != null) {
          //self.emit('error', err);
        }
        if (typeof err === undefined || err === null) {
          self.connectionOpened = true;
        }
        callback.call(self, err);
      }
    }
  );
};

CUBRIDConnection.prototype.getEngineVersion = function (callback) {
  var err = null;
  var engineVersion = '';
  var self = this;
  var responseData = new Buffer(0);
  var expectedResponseLength = -1;

  ActionQueue.enqueue(
    [
      function (cb) {
        if (self.connectionOpened === false) {
          self.connect(cb);
        }
        else {
          cb();
        }
      },
      function (cb) {
        self.socket.on('data', function (data) {
          responseData = Helpers.combineData(responseData, data);

          if (expectedResponseLength === -1 && responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers.getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
//            self.socket.listeners('data').splice(0).forEach(function (listener) {
//              self.socket.removeListener('data', listener);
//            });
            self.socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(data);
            getEngineVersionPacket.parse(packetReader);
            var errorCode = getEngineVersionPacket.errorCode;
            var errorMsg = getEngineVersionPacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            } else {
              engineVersion = getEngineVersionPacket.engineVersion;
            }
            if (cb && typeof(cb) === 'function') {
              if (typeof err != undefined && err != null) {
                //self.emit('error', err);
              }
              cb.call(self, err, engineVersion);
            }
          }
        });

        var packetWriter = new PacketWriter();
        var getEngineVersionPacket = new GetEngineVersionPacket({casInfo : self.CASInfo});
        getEngineVersionPacket.write(packetWriter);
        self.socket.write(packetWriter._buffer);
      }
    ],
    function (err, engineVersion) {
      if (callback && typeof(callback) === 'function') {
        if (typeof err != undefined && err != null) {
          //self.emit('error', err);
        }
        callback.call(self, err, engineVersion);
      }
    }
  );
};

CUBRIDConnection.prototype.batchExecuteNoQuery = function (sqls, callback) {
  var sqlsArr;

  if (Array.isArray(sqls)) {
    if (sqls.length == 0) {
      callback.call(this, null);
      return;
    }
    sqlsArr = sqls;
  } else {
    sqlsArr = new Array(sqls);
  }

  var err = null;
  var self = this;
  var responseData = new Buffer(0);
  var expectedResponseLength = -1;

  ActionQueue.enqueue(
    [
      function (cb) {
        if (self.connectionOpened === false) {
          self.connect(cb);
        }
        else {
          cb();
        }
      },
      function (cb) {
        self.socket.on('data', function (data) {
          responseData = Helpers.combineData(responseData, data);

          if (expectedResponseLength === -1 && responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers.getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
//            self.socket.listeners('data').splice(0).forEach(function (listener) {
//              self.socket.removeListener('data', listener);
//            });
            self.socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(data);
            batchExecuteNoQueryPacket.parse(packetReader);
            var errorCode = batchExecuteNoQueryPacket.errorCode;
            var errorMsg = batchExecuteNoQueryPacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            }
            if (cb && typeof(cb) === 'function') {
              if (typeof err != undefined && err != null) {
                //self.emit('error', err);
              }
              cb.call(self, err);
            }
          }
        });

        var packetWriter = new PacketWriter();
        var batchExecuteNoQueryPacket = new BatchExecuteNoQueryPacket(
          {
            SQLs           : sqlsArr,
            casInfo        : self.CASInfo,
            autoCommitMode : self.autoCommitMode
          }
        );
        batchExecuteNoQueryPacket.write(packetWriter);
        self.socket.write(packetWriter._buffer);
      }
    ],
    function (err) {
      if (callback && typeof(callback) === 'function') {
        if (typeof err != undefined && err != null) {
          //self.emit('error', err);
        }
        callback.call(self, err);
      }
    }
  );
};

CUBRIDConnection.prototype.query = function (sql, callback) {
  var err = null;
  var self = this;
  var responseData = new Buffer(0);
  var expectedResponseLength = -1;

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
        if (self.queryCache != null) {
          if (self.queryCache.contains(sql)) {
            callback(err, self.queryCache.get(sql), null); //null: to prevent fetch (cache is intended for small data)
            return;
          }
        }

        self.socket.on('data', function (data) {
          responseData = Helpers.combineData(responseData, data);

          if (expectedResponseLength === -1 && responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
            expectedResponseLength = Helpers.getExpectedResponseLength(responseData);
          }
          if (responseData.length === expectedResponseLength) {
//            self.socket.listeners('data').splice(0).forEach(function (listener) {
//              self.socket.removeListener('data', listener);
//            });
            self.socket.removeAllListeners('data');
            var packetReader = new PacketReader();
            packetReader.write(responseData);
            var result = executeQueryPacket.parse(packetReader);
            var errorCode = executeQueryPacket.errorCode;
            var errorMsg = executeQueryPacket.errorMsg;
            if (errorCode !== 0) {
              err = new Error(errorCode + ':' + errorMsg);
            } else {
              self.queriesHandleList.push(executeQueryPacket);
            }
            if (cb && typeof(cb) === 'function') {
              if (typeof err != undefined && err != null) {
                //self.emit('error', err);
              } else {
                if (self.queryCache !== null) {
                  self.queryCache.getSet(sql, result);
                }
              }
              cb.call(self, err, result, executeQueryPacket.handle);
            }
          }
        });

        var packetWriter = new PacketWriter();
        var executeQueryPacket = new ExecuteQueryPacket(
          {
            sql            : sql,
            casInfo        : self.CASInfo,
            autoCommitMode : self.autoCommitMode
          }
        );
        executeQueryPacket.write(packetWriter);
        self.socket.write(packetWriter._buffer);
      }
    ],
    function (err, result, handle) {
      if (callback && typeof(callback) === 'function') {
        if (typeof err != undefined && err != null) {
          //self.emit('error', err);
        }
        callback.call(self, err, result, handle);
      }
    }
  );
};

CUBRIDConnection.prototype.fetch = function (queryHandle, callback) {
  var err = null;
  var self = this;
  var responseData = new Buffer(0);
  var expectedResponseLength = -1;

  self.socket.on('data', function (data) {
    responseData = Helpers.combineData(responseData, data);

    if (expectedResponseLength === -1 && responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers.getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
      self.socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(responseData);
      var result = fetchPacket.parse(packetReader, self.queriesHandleList[i]);
      var errorCode = fetchPacket.errorCode;
      var errorMsg = fetchPacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      }
      if (callback && typeof(callback) === 'function') {
        if (typeof err != undefined && err != null) {
          //self.emit('error', err);
        }
        callback.call(self, err, result);
      }
    }
  });

  var foundQueryHandle = false;
  for (var i = 0; i < this.queriesHandleList.length; i++) {
    if (this.queriesHandleList[i].handle === queryHandle) {
      foundQueryHandle = true;
      break;
    }
  }
  if (!foundQueryHandle) {
    err = new Error('No active query with this handle!');
    self.socket.removeAllListeners('data');
    callback.call(self, err, null);
  } else {
    if (this.queriesHandleList[i].currentTupleCount === this.queriesHandleList[i].totalTupleCount) {
      self.socket.removeAllListeners('data');
      callback.call(self, err, null);
    } else {
      var packetWriter = new PacketWriter();
      var fetchPacket = new FetchPacket({casInfo : self.CASInfo});
      fetchPacket.write(packetWriter, this.queriesHandleList[i]); //TODO Verify this
      self.socket.write(packetWriter._buffer);
    }
  }
};

CUBRIDConnection.prototype.closeRequest = function (requestHandle, callback) {
  var err = null;
  var self = this;
  var responseData = new Buffer(0);
  var expectedResponseLength = -1;

  self.socket.on('data', function (data) {
    responseData = Helpers.combineData(responseData, data);

    if (expectedResponseLength === -1 && responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers.getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
//      self.socket.listeners('data').splice(0).forEach(function (listener) {
//        self.socket.removeListener('data', listener);
//      });
      self.socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(data);
      closeQueryPacket.parse(packetReader);
      var errorCode = closeQueryPacket.errorCode;
      var errorMsg = closeQueryPacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      }
      if (callback && typeof(callback) === 'function') {
        if (typeof err != undefined && err != null) {
          //self.emit('error', err);
        }
        callback.call(self, err);
      }
    }
  });

  var packetWriter = new PacketWriter();
  var closeQueryPacket = new CloseQueryPacket(
    {
      casInfo   : self.CASInfo,
      reqHandle : requestHandle
    }
  );
  for (var i = 0; i < this.queriesHandleList.length; i++) {
    if (this.queriesHandleList[i].handle === requestHandle) {
      this.queriesHandleList.splice(i, 1);
    }
  }
  closeQueryPacket.write(packetWriter);
  self.socket.write(packetWriter._buffer);
};

CUBRIDConnection.prototype.close = function (callback) {
  var err = null;
  var self = this;
  var responseData = new Buffer(0);
  var expectedResponseLength = -1;

  self.socket.on('data', function (data) {
    responseData = Helpers.combineData(responseData, data);

    if (expectedResponseLength === -1 && responseData.length >= DATA_TYPES.DATA_LENGTH_SIZEOF) {
      expectedResponseLength = Helpers.getExpectedResponseLength(responseData);
    }
    if (responseData.length === expectedResponseLength) {
//			self.socket.listeners('data').splice(0).forEach(function (listener) {
//				self.socket.removeListener('data', listener);
//			});
      self.socket.removeAllListeners('data');
      var packetReader = new PacketReader();
      packetReader.write(data);
      closeDatabasePacket.parse(packetReader);
      // Close socket connection
      self.socket.destroy();
      var errorCode = closeDatabasePacket.errorCode;
      var errorMsg = closeDatabasePacket.errorMsg;
      if (errorCode !== 0) {
        err = new Error(errorCode + ':' + errorMsg);
      }

      if (callback && typeof(callback) === 'function') {
        if (typeof err != undefined && err != null) {
          //self.emit('error', err);
        }
        callback.call(self, err);
      }
    }
  });

  var packetWriter = new PacketWriter();
  var closeDatabasePacket = new CloseDatabasePacket({casInfo : self.CASInfo});
  closeDatabasePacket.write(packetWriter);
  self.socket.write(packetWriter._buffer);
};




