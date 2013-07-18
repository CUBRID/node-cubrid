exports['test_BatchExecute_Error'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers;

	function errorHandler(err) {
		throw err.message;
	}

	Helpers.logInfo(module.filename.toString() + ' started...');

	client.connect(function (err) {
		if (err) {
			errorHandler(err);
		} else {
			if (client.getEngineVersion().startsWith('8.4.1')) {
				test.expect(1);
			} else {
				test.expect(3);
			}

			Helpers.logInfo('Connected.');

			var sqlsArr = [];

			sqlsArr.push('drop table if exists node_test');
			sqlsArr.push('create table node_test(id xyz)');
			sqlsArr.push('create table node_test(id abc)');

			client.batchExecuteNoQuery(sqlsArr, function (err) {
				// Driver version >= 8.4.3 return an array of errors.
				if (err instanceof Array) {
					test.ok(err.length == 2);

					// CUBRID 8.4.x
					if (client.getEngineVersion().startsWith('8.4')) {
						test.ok(err[0].message === '-494:Semantic: xyz is not defined. create class node_test ( id xyz ) ');
						test.ok(err[1].message === '-494:Semantic: abc is not defined. create class node_test ( id abc ) ');
					} else {
						// CUBRID 9.0+
						test.ok(err[0].message === "-494:Semantic: before '  xyz)'\nxyz is not defined. create class node_test ( id xyz ) ");
						test.ok(err[1].message === "-494:Semantic: before '  abc)'\nabc is not defined. create class node_test ( id abc ) ");
					}
				} else {
					// Driver version in 8.4.1 returns a single error.
					test.ok(err.message === '-494:Semantic: xyz is not defined. create class node_test ( id xyz ) ');
				}

				client.close(function (err) {
					if (err) {
						errorHandler(err);
					} else {
						Helpers.logInfo('Connection closed.');
						Helpers.logInfo('Test passed.');
						test.done();
					}
				});
			});
		}
	});
};
