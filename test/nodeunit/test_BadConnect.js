var CUBRID = require('../../'),
		config = require('./testSetup/test_Setup').config,
		client = CUBRID.createCUBRIDConnection(config.host, config.port, config.user, 'xyz', 'demodb_xyz'),
		Helpers = CUBRID.Helpers;

exports['test_BadConnect'] = function (test) {
  Helpers.logInfo(module.filename.toString() + ' started...');

	test.expect(1);

  client.connect(function (err) {
    if (err) {
      // When CUBRID Server is installed in a VM which listens to host port,
      // and a client tries to connect to CUBRID via the host IP and port, the following
      // error is displayed on CUBRID 8.4.3:
      // '-985:The hostname on the database connection string should be specified when multihost is set in "databases.txt".'
      // instead of
      // '-677:Failed to connect to database server, \'demodb_xyz\', on the following host(s): ' + config.host + ':' + config.host
      // On CUBRID 9.1, '-985:No error message available.' is displayed.
      test.equal(err.message, '-677:Failed to connect to database server, \'demodb_xyz\', on the following host(s): localhost:localhost');
      Helpers.logInfo('Test passed.');
      test.done();
    } else {
      throw 'We should not get here!';
    }
  });
};

