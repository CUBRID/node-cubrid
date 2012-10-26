var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_BasicExtendedSelect_Sequence'] = function (test) {
  test.expect(8);
  Helpers.logInfo(module.filename.toString() + ' started...');

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
        test.equal(Result2Array.TotalRowsCount(result), 6);
        Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
        Helpers.logInfo('Query results:');
        var arr = Result2Array.RowsArray(result);
        test.equal(arr.length, 6);
        test.equal(arr[0].toString(), 'X,Mixed');
        test.equal(arr[1].toString(), 'W,Woman');
        test.equal(arr[2].toString(), 'M,Man');
        test.equal(arr[3].toString(), 'B,Bronze');
        test.equal(arr[4].toString(), 'S,Silver');
        test.equal(arr[5].toString(), 'G,Gold');
        for (var k = 0; k < arr.length; k++) {
          Helpers.logInfo(arr[k].toString());
        }
        CUBRIDClient.closeQuery(queryHandle, cb);
        Helpers.logInfo('Query closed.');
      },

      function (queryHandle, cb) {
        CUBRIDClient.close(cb);
        Helpers.logInfo('Connection closed.');
      }
    ],

    function (err) {
      if (err == null) {
        Helpers.logInfo('Test passed.');
        test.done();
      } else {
        throw err.message;
      }
    }
  );
};
