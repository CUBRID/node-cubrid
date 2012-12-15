var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
  ActionQueue = require('../src/utils/ActionQueue'),
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

Helpers.logInfo(module.filename.toString() + ' started...');

ActionQueue.enqueue(
  [
    function (callback) {
      CUBRIDClient.brokerServer = 'localhost';
      CUBRIDClient.connect(callback);
    },

    function (callback) {
      CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_TABLE, callback);
    },

    function (result, callback) {
      Helpers.logInfo(JSON.stringify(result));
      assert(result.length === 32 || result.length === 33); //33 for 9.0
      callback();
    },

    function (callback) {
      CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_VIEW, callback);
    },

    function (result, callback) {
      Helpers.logInfo(JSON.stringify(result));
      assert(result.length === 16);
      callback();
    },

    function (callback) {
      CUBRIDClient.getSchema(CUBRIDClient.SCHEMA_ATTRIBUTE, callback);
    },

    function (result, callback) {
      Helpers.logInfo(JSON.stringify(result));
      assert(result.length === 0);
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
    }
  }
);
