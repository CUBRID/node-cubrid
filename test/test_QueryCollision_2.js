var Result2Array = require('../src/resultset/Result2Array'),
  events = require('events'),
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert'),
  CUBRIDclient = require('./test_Setup.js').createDefaultCUBRIDDemodbConnection;

Helpers.logInfo(module.filename.toString() + ' started...');

var getSingleValue = function (sql, client) {
  var ret = null;
  var self = this;

  client.query(sql, function (err, result, queryHandle) {
    if (err) {
      self.emit('error', err);
    } else {
      ret = Result2Array.RowsArray(result)[0][0];
      client.closeQuery(queryHandle, function (err) {
        if (err) {
          self.emit('error', err);
        } else {
          self.emit('done');
        }
      });
      self.emit('return', ret);
    }
  });
};

getSingleValue.prototype = new events.EventEmitter();

try {
  var getMyValue = new getSingleValue('select count(*) from game', CUBRIDclient);
} catch (ex) {
  Helpers.logInfo(ex.message);
  throw 'We should not get here!';
}

getMyValue.on('return', function (result) {
  assert(result === 8653);
  setTimeout(function(){
    CUBRIDclient.close(function () {
    });
  }, 100);
});

getMyValue.on('error', function (err) {
  Helpers.logInfo(err.message);
  throw err;
});

getMyValue.on('done', function () {
  Helpers.logInfo('Test 1 passed.');
});

try {
  var getMyValue2 = new getSingleValue('select wrong_count(*) from game', CUBRIDclient);

  getMyValue2.on('return', function () {
    throw 'We should not get here!';
  });
} catch (ex) {
  assert(ex.message === "Another query is already in progress! - denying current query request.");
  Helpers.logInfo('Test 2 passed.');
}
