var CUBRIDClient = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection,
  Helpers = require('../../src/utils/Helpers'),
  Result2Array = require('../../src/resultset/Result2Array');

function errorHandler(err) {
  throw err.message;
}

exports['test_QueryOldProtocol'] = function (test) {
  test.expect(4);
  Helpers.logInfo(module.filename.toString() + ' started...');

  CUBRIDClient.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected.');
      CUBRIDClient.setEnforceOldQueryProtocol(true);
      Helpers.logInfo('Querying: select * from nation');
      CUBRIDClient.query('select * from nation', function (err, result, queryHandle) {
        if (err) {
          errorHandler(err);
        } else {
          test.ok(Result2Array.TotalRowsCount(result) === 215);
          Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));
          var arr = Result2Array.RowsArray(result);
          test.ok(arr.length === 215);
          test.ok(arr[0].toString() === 'SRB,Serbia,Europe,Beograd');
          test.ok(arr[arr.length - 1].toString() === 'AFG,Afghanistan,Asia,Kabul');
          for (var j = 0; j < 1; j++) {
            Helpers.logInfo(arr[j].toString());
          }
          CUBRIDClient.closeQuery(queryHandle, function (err) {
            if (err) {
              errorHandler(err);
            } else {
              Helpers.logInfo('Query closed.');
              CUBRIDClient.close(function (err) {
                if (err) {
                  errorHandler(err);
                } else {
                  CUBRIDClient.setEnforceOldQueryProtocol(false);
                  Helpers.logInfo('Connection closed.');
                  Helpers.logInfo('Test passed.');
                  test.done();
                }
              });
            }
          });
        }
      });
    }
  });
};
