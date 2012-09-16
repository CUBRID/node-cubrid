var CUBRIDClient = require('./test_Setup').testClient,
  Helpers = require('../src/utils/Helpers'),
  assert = require('assert');

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect(function () {
  Helpers.logInfo('Connected.');
  Helpers.logInfo('Executing query...');
  CUBRIDClient.query('select * from nation', function (err, result, queryHandle) {
    var foundQueryHandle = false;
    for (var i = 0; i < CUBRIDClient._queriesHandleList.length; i++) {
      if (CUBRIDClient._queriesHandleList[i].handle === queryHandle) {
        foundQueryHandle = true;
        break;
      }
    }

    assert(foundQueryHandle == true);

    CUBRIDClient.close(function () {
      Helpers.logInfo('Connection closed.');
      foundQueryHandle = false;
      for (var i = 0; i < CUBRIDClient._queriesHandleList.length; i++) {
        if (CUBRIDClient._queriesHandleList[i].handle === queryHandle) {
          foundQueryHandle = true;
          break;
        }
      }

      assert(foundQueryHandle == false);

      Helpers.logInfo('Test passed.');
    });
  });
});


