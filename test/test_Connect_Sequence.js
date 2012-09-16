var CUBRIDClient = require('./test_Setup').testClient,
  ActionQueue = require('../src/utils/ActionQueue'),
  Helpers = require('../src/utils/Helpers');

Helpers.logInfo(module.filename.toString() + ' started...');

ActionQueue.enqueue(
  [
    function (callback) {
      CUBRIDClient.connect(callback);
    },

    function (callback) {
      CUBRIDClient.getEngineVersion(callback);
    },

    function (version, callback) {
      Helpers.logInfo('Engine version: ' + version);
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

