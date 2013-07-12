var CUBRID = require('../'),
		client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
		Helpers = CUBRID.Helpers;

exports['test_SetAutoCommit'] = function (test) {
  test.expect(2);
  Helpers.logInfo(module.filename.toString() + ' started...');

  function errorHandler(err) {
    throw err.message;
  }

  client.connect(function (err) {
    if (err) {
      errorHandler(err);
    } else {
      Helpers.logInfo('Connected...');

      client.setAutoCommitMode(false, function (err) {
        if (err) {
          errorHandler(err);
        } else {
          test.ok(client.autoCommitMode === false, 'AutoCommitMode not set correctly!');

	        client.setAutoCommitMode(true, function (err) {
            if (err) {
              errorHandler(err);
            } else {
              test.ok(client.autoCommitMode === true, 'AutoCommitMode not set correctly!');

              client.close(function (err) {
                if (err) {
                  errorHandler(err);
                } else {
                  Helpers.logInfo('Connection closed...');
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

