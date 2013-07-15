exports['test_ConnectionTimeout'] = function (test) {
	var CUBRID = require('../'),
			Helpers = CUBRID.Helpers,
			ErrorMessages = require('../src' + (process.env.CODE_COV ? '-cov' : '') + '/constants/ErrorMessages'),
			client = new CUBRID.createCUBRIDConnection('www.google.com', 33000, 'public', '', 'demodb');

	test.expect(1);
  Helpers.logInfo(module.filename.toString() + ' started...');

  client.setConnectionTimeout(2000);

  client.connect(function (err) {
    if (err) {
      test.ok(err.message === ErrorMessages.ERROR_CONNECTION_TIMEOUT);
      Helpers.logInfo('Test passed.');
      test.done();
    } else {
      throw 'We should not get here!';
    }
  });
};
