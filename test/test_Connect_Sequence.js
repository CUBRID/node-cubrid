var CUBRIDConnection = require('../src/CUBRIDConnection'),
  ActionQueue = require('../src/utils/ActionQueue'),
  Helpers = require('../src/utils/Helpers');

var CUBRIDClient = new CUBRIDConnection('localhost', 33000, 'public', '', 'demodb');

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

