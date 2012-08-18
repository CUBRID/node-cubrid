var CUBRIDConnection = require('../CUBRIDConnection'),
  ActionQueue = require('../utils/ActionQueue'),
  Helpers = require('../utils/Helpers'),
  Result2Array = require('../resultset/Result2Array');

exports.getSingleValue = function (sql, brokerServer, brokerPort, user, password, database) {
  var client = new CUBRIDConnection(brokerServer, brokerPort, user, password, database);
  var ret = null;

  client.connect(function (err) {
    if (err) {
      throw err.message;
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Querying: ' + sql);
      client.query(sql, function (err, result, queryHandle) {
        if (err) {
          throw err.message;
        } else {
          ret = Result2Array.GetResultsArray(result)[0];
          client.closeRequest(queryHandle, function (err) {
            if (err) {
              throw err.message;
            } else {
              Helpers.logInfo('Query closed.');
              client.close(function (err) {
                if (err) {
                  throw err.message;
                } else {
                  Helpers.logInfo('Connection closed.');
                  Helpers.logInfo('Result: ' + ret);
                  return ret;
                }
              })
            }
          })
        }
      })
    }
  });
};

exports.getSingleValue2 = function (sql, brokerServer, brokerPort, user, password, database) {
  var client = new CUBRIDConnection(brokerServer, brokerPort, user, password, database);
  var ret = null;

  ActionQueue.enqueue(
    [
      function (cb) {
        client.connect(cb);
      },
      function (cb) {
        client.query(sql, cb);
      },
      function (result, queryHandle, cb) {
        ret = Result2Array.GetResultsArray(result)[0][0];
        client.closeRequest(queryHandle, cb);
      },
      function (cb) {
        client.close(cb);
      }
    ],
    function (err) {
      if (err == null) {
        Helpers.logInfo('Value: ' + ret);
        setTimeout(function () {
          return ret;
        }, 0);
        //return ret;
      } else {
        throw err.message;
      }
    }
  );
};

