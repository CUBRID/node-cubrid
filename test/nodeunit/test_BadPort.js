var CUBRID = require('../../'),
		config = require('./testSetup/test_Setup').config,
		client = CUBRID.createCUBRIDConnection(config.host, 80, config.user, config.password, config.database),
		Helpers = CUBRID.Helpers;

exports['test_BadPort'] = function (test) {
  test.expect(1);

  Helpers.logInfo(module.filename.toString() + ' started...');

  client.connect(function (err) {
    if (err) {
      test.ok(['connect ECONNREFUSED', 'connect ETIMEDOUT', 'read ECONNRESET'].indexOf(err.message) > -1);
      Helpers.logInfo('Test passed.');
      test.done();
    } else {
      throw 'We should not get here!';
    }
  });
};
