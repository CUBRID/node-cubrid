var CUBRID = require('../'),
		Helpers = CUBRID.Helpers,
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection();

function errorHandler(err) {
  throw err.message;
}

exports['test_BasicConnect'] = function (test) {
  test.expect(0);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected OK.');
      client.getEngineVersion(function (err, result) {
        if (err) {
          errorHandler(err);
        } else {
          Helpers.logInfo('CUBRID engine version: ' + result);
          client.close(function (err) {
            if (err) {
              errorHandler(err);
            } else {
              Helpers.logInfo('Connection closed.');
              Helpers.logInfo('Test passed.');
              test.done();
            }
          });
        }
      });
    }
  });
};

