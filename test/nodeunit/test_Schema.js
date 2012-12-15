var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../../src/utils/ActionQueue'),
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

exports['test_Schema'] = function (test) {
  test.expect(3);
  Helpers.logInfo(module.filename.toString() + ' started...');
  ActionQueue.enqueue(
    [
      function (callback) {
//        CUBRIDClient.brokerServer = 'localhost';
        CUBRIDClient.connect(callback);
      },

      function (callback) {
        CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_TABLE, callback);
      },

      function (result, callback) {
        Helpers.logInfo(JSON.stringify(result));
        test.ok(result.length === 32 || result.length === 33); //33 for 9.0
        callback();
      },

      function (callback) {
        CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_VIEW, callback);
      },

      function (result, callback) {
        Helpers.logInfo(JSON.stringify(result));
        test.ok(result.length === 16 || result.length === 17); //17 for 9.0
        callback();
      },

      function (callback) {
        CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_ATTRIBUTE, callback);
      },

      function (result, callback) {
        Helpers.logInfo(JSON.stringify(result));
        test.equal(result.length, 0);
        callback();
      },

      function (callback) {
        CUBRIDClient.close(callback);
      }
    ],

    function (err) {
      if (err) {
        throw err.message;
      } else {
        Helpers.logInfo('Test passed.');
        test.done();
      }
    }
  );
};
