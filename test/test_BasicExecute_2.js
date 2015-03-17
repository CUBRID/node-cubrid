exports['test_BasicExecute_2'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers;

	function errorHandler(err) {
		throw err.message;
	}

	test.expect(0);
	Helpers.logInfo(module.filename.toString() + ' started...');

	client.connect(function (err) {
		if (err) {
			errorHandler(err);
		} else {
			var sqlsArr = [];

			Helpers.logInfo('Connected.');

			sqlsArr.push('DROP TABLE IF EXISTS node_test');
			sqlsArr.push('CREATE TABLE node_test(id INT)');
			sqlsArr.push('INSERT INTO node_test VALUES(2)');
			sqlsArr.push('DROP TABLE IF EXISTS node_test');

			client.batchExecuteNoQuery(sqlsArr, function (err) {
				if (err) {
					errorHandler(err);
				} else {
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
