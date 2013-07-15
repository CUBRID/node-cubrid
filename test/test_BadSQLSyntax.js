exports['test_BadSQLSyntax'] = function (test) {
	var CUBRID = require('../'),
			Helpers = CUBRID.Helpers,
			testSetup = require('./testSetup/test_Setup'),
			client = testSetup.createDefaultCUBRIDDemodbConnection();

	Helpers.logInfo(module.filename.toString() + ' started...');

	test.expect(1);

	function errorHandler(err) {
		Helpers.logError(err.message);
		test.equal(err.message, '-493:Syntax: Unknown class "game_xyz". select * from game_xyz');
	}

	client.connect(function (err) {
		if (err) {
			errorHandler(err);
		} else {
			Helpers.logInfo('Connected.');
			Helpers.logInfo('Querying: select * from game_xyz');

			client.query('select * from game_xyz', function (err) {
				if (err) {
					errorHandler(err);

					client.close(function (err) {
						if (err) {
							errorHandler(err);
						} else {
							Helpers.logInfo('Connection closed.');
							Helpers.logInfo('Test passed.');
							test.done();
						}
					});
				} else {
					throw 'We should never get here!';
				}
			});
		}
	});
};
