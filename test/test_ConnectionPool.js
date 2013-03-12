var Helpers = require('../src/utils/Helpers'),
  EventEmitter = require('events').EventEmitter,
//pooling = require('connection_pool'),
  pooling = require('c:/Program Files (x86)/nodejs/node_modules/pooling'),
  CUBRIDConnection = require('../src/CUBRIDConnection'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

var conn_idx = 1;
var pool = pooling.createPool({
  checkInterval : 1 * 1000,
  max           : 2,
  maxIdleTime   : 30 * 1000,
  name          : 'my pool',
  create        : function create(callback) {
    var client = new EventEmitter();
    client.id = conn_idx++;
    Helpers.logInfo('Creating pool client id: ' + client.id);
    return callback(null, client);
  },
  destroy       : function destroy(client) {
    Helpers.logInfo('Destroyed pool client id: ' + client.id);
    client.was = client.id;
    client.id = -1;
  }
});

pool.acquire(function (err, client) {
  var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
  CUBRIDClient.connect(function (err) {
    if (err === null) {
      Helpers.logInfo('Database connection acquired for pool client id: ' + client.id);
      Helpers.logInfo('Executing query: select * from code');
      CUBRIDClient.query("select * from code", function (err, result, queryHandle) {
        if (err) {
          Helpers.logError(err);
        } else {
          Helpers.logInfo('Query results rows count for pool client id: ' + client.id + ' is: ' + Result2Array.TotalRowsCount(result));
          CUBRIDClient.closeQuery(queryHandle, function (err) {
            if (err) {
              Helpers.logError(err);
            } else {
              Helpers.logInfo('Query closed for pool client id: ' + client.id);
              CUBRIDClient.close(function (err) {
                if (err) {
                  Helpers.logError(err);
                } else {
                  Helpers.logInfo('Connection closed for pool client id: ' + client.id);
                  Helpers.logInfo('Waiting some time before releasing the pool client id: ' + client.id + '...');
                  setTimeout(function () {
                    Helpers.logInfo('Releasing pool client id: ' + client.id);
                    pool.release(client);
                  }, 10 * 1000);
                }
              });
            }
          });
        }
      });
    }
  });
});

pool.acquire(function (err, client) {
  var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
  CUBRIDClient.connect(function (err) {
    if (err === null) {
      Helpers.logInfo('Database connection acquired for pool client id: ' + client.id);
      Helpers.logInfo('Executing query: select * from game');
      CUBRIDClient.query("select * from game", function (err, result, queryHandle) {
        if (err) {
          Helpers.logError(err);
        } else {
          Helpers.logInfo('Query results rows count for pool client id: ' + client.id + ' is: ' + Result2Array.TotalRowsCount(result));
          CUBRIDClient.closeQuery(queryHandle, function (err) {
            if (err) {
              Helpers.logError(err);
            } else {
              Helpers.logInfo('Query closed for pool client id: ' + client.id);
              CUBRIDClient.close(function (err) {
                if (err) {
                  Helpers.logError(err);
                } else {
                  Helpers.logInfo('Connection closed for pool client id: ' + client.id);
                  Helpers.logInfo('Waiting some time before releasing the pool client id: ' + client.id + '...');
                  setTimeout(function () {
                    Helpers.logInfo('Releasing pool client id: ' + client.id);
                    pool.release(client);
                  }, 10 * 1000);
                }
              });
            }
          });
        }
      });
    }
  });
});

pool.acquire(function (err, client) {
  var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');
  CUBRIDClient.connect(function (err) {
    if (err === null) {
      Helpers.logInfo('Database connection acquired for pool client id: ' + client.id);
      Helpers.logInfo('Executing query: select * from nation');
      CUBRIDClient.query("select * from nation", function (err, result, queryHandle) {
        if (err) {
          Helpers.logError(err);
        } else {
          Helpers.logInfo('Query results rows count for pool client id: ' + client.id + ' is: ' + Result2Array.TotalRowsCount(result));
          CUBRIDClient.closeQuery(queryHandle, function (err) {
            if (err) {
              Helpers.logError(err);
            } else {
              Helpers.logInfo('Query closed for pool client id: ' + client.id);
              CUBRIDClient.close(function (err) {
                if (err) {
                  Helpers.logError(err);
                } else {
                  Helpers.logInfo('Connection closed for pool client id: ' + client.id);
                  Helpers.logInfo('Waiting some time before releasing the pool client id: ' + client.id + '...');
                  setTimeout(function () {
                    Helpers.logInfo('Releasing pool client id: ' + client.id);
                    pool.release(client);
                  }, 10 * 1000);
                }
              });
            }
          });
        }
      });
    }
  });
});

