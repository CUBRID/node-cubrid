var CUBRIDConnection = require('../src/CUBRIDConnection'),
  ActionQueue = require('../src/utils/ActionQueue'),
  Helpers = require('../src/utils/Helpers'),
  Result2Array = require('../src/resultset/Result2Array'),
  assert = require('assert');

var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');

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
      assert(Result2Array.GetResultsCount(result) === 6);
      Helpers.logInfo('Query result rows count: ' + Result2Array.GetResultsCount(result));
      Helpers.logInfo('Query results:');
      var arr = Result2Array.GetResultsArray(result);
      assert(arr.length === 6);
      assert(arr[0].toString() === 'X,Mixed');
      assert(arr[1].toString() === 'W,Woman');
      assert(arr[2].toString() === 'M,Man');
      assert(arr[3].toString() === 'B,Bronze');
      assert(arr[4].toString() === 'S,Silver');
      assert(arr[5].toString() === 'G,Gold');
      for (var k = 0; k < arr.length; k++) {
        Helpers.logInfo(arr[k].toString());
      }
      CUBRIDClient.closeRequest(queryHandle, cb);
      Helpers.logInfo('Query closed.');
    },
    function (cb) {
      CUBRIDClient.close(cb);
      Helpers.logInfo('Connection closed.');
    }
  ],
  function (err) {
    if (err == null) {
      Helpers.logInfo('Test passed.');
    } else {
      throw err.message;
    }
  }
);
