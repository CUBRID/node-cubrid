var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
  Helpers = require('../../src/utils/Helpers');

exports['test_CloseDefault'] = function (test) {
  test.expect(2);
  Helpers.logInfo(module.filename.toString() + ' started...');

  function errorHandler(err) {
    throw err.message;
  }

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      Helpers.logInfo('Executing query...');
      CUBRIDClient.query('select * from nation', function (err, result, queryHandle) {
        if (err) {
          errorHandler(err);
        } else {
          var foundQueryHandle = false;
          for (var i = 0; i < CUBRIDClient._queriesPacketList.length; i++) {
            if (CUBRIDClient._queriesPacketList[i].queryHandle === queryHandle) {
              foundQueryHandle = true;
              break;
            }
          }

          test.ok(foundQueryHandle === true);

          CUBRIDClient.close(function (err) {
            if (err) {
              errorHandler(err);
            } else {
              Helpers.logInfo('Connection closed.');
              foundQueryHandle = false;
              for (var i = 0; i < CUBRIDClient._queriesPacketList.length; i++) {
                if (CUBRIDClient._queriesPacketList[i].handle === queryHandle) {
                  foundQueryHandle = true;
                  break;
                }
              }

              test.ok(foundQueryHandle === false);

              Helpers.logInfo('Test passed.');
              test.done();
            }
          });
        }
      });
    }
  });
};

