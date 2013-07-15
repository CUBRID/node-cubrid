exports['test_BadConnect'] = function (test) {
	var CUBRID = require('../'),
			config = require('./testSetup/test_Setup').config,
			client = CUBRID.createCUBRIDConnection(config.host, config.port, config.user, 'xyz', 'demodb_xyz'),
			Helpers = CUBRID.Helpers;

	Helpers.logInfo(module.filename.toString() + ' started...');

	test.expect(1);

  client.connect(function (err) {
    if (err) {
      test.ok([
	      // This is the correct message, CUBRID should return when a database is not found.
	      "-677:Failed to connect to database server, 'demodb_xyz', on the following host(s): localhost:localhost",
	      // When CUBRID is installed and started as a root, the following error is returned.
	      // This may be a CUBRID bug or a spec. Need to keep these until we figure out
		    // whether this is a bug or not.
	      '-985:The hostname on the database connection string should be specified when multihost is set in "databases.txt".',
		    // On CUBRID 9.1 and 8.4.1 the following error is returned.
	      "-985:No error message available."].indexOf(err.message));
      Helpers.logInfo('Test passed.');
      test.done();
    } else {
      throw 'We should not get here!';
    }
  });
};

