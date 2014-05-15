exports['test_DataTypes'] = function (test) {
	var CUBRID = require('../'),
			client = require('./testSetup/test_Setup').createDefaultCUBRIDDemodbConnection(),
			Helpers = CUBRID.Helpers,
			Result2Array = CUBRID.Result2Array;

	function errorHandler(err) {
		throw err.message;
	}


	Helpers.logInfo(module.filename.toString() + ' started...');

	client.connect(function (err) {
		if (err) {
			errorHandler(err);
		} else {
			var isCUBRID9 = client.getEngineVersion().startsWith('9');

			test.expect(21 + (isCUBRID9 ? 1 : 0));

			Helpers.logInfo('Connected.');
			Helpers.logInfo('Creating the test table...');

			client.batchExecuteNoQuery([
				'DROP TABLE IF EXISTS test_data_types',
						'CREATE TABLE test_data_types(' +
						'a BIGINT,' +
						'b BIT(1),' +
						'c BIT VARYING(1),' +
						'd BLOB,' +
						'e CHARACTER(1),' +
						'f CLOB,' +
						'g DATE,' +
						'h DATETIME,' +
						'i DOUBLE,' +
						'j FLOAT,' +
						'k INTEGER,' +
						'l MONETARY,' +
						'm NATIONAL CHARACTER(1),' +
						'o NATIONAL CHARACTER VARYING(100),' +
						'p NUMERIC(15,0),' +
						'r CHARACTER VARYING(100),' +
						's TIME,' +
						't TIMESTAMP,' +
						(isCUBRID9 ? "z ENUM('red', 'blue', 'yellow') DEFAULT 'red'," : '') +
						'u VARCHAR(4096))',
						"INSERT INTO test_data_types VALUES(15, B'0', B'0', 'qwerty', 'a', 'qwerty', '2012-10-02', '2012-10-02 13:25:45', 1.5, 2.5, 14, 3.14, N'9', N'95', 16, 'varchar', '1899-12-31 13:25:45', '2012-10-02 13:25:45', " + (isCUBRID9 ? "'blue', " : '') + "'varchar')"
				], function (err) {
					if (err) {
						errorHandler(err);
					} else {
						Helpers.logInfo('Connected.');
						Helpers.logInfo('Querying: select * from test_data_types');

						client.query('SELECT * FROM test_data_types', function (err, result, queryHandle) {
							if (err) {
								errorHandler(err);
							} else {
								test.ok(Result2Array.TotalRowsCount(result) === 1);

								Helpers.logInfo('Query result rows count: ' + Result2Array.TotalRowsCount(result));

								var arr = Result2Array.RowsArray(result);

								test.ok(arr.length === 1);
								test.ok(arr[0][0] === 15);
								test.ok(arr[0][1][0] === 0);
								test.ok(arr[0][2][0] === 0);
								test.ok(typeof(arr[0][3]) === 'object');
								test.ok(arr[0][4] === 'a');
								test.ok(typeof(arr[0][5]) === 'object');
								test.ok(arr[0][6].toString().startsWith('2012-10-02') === true);
								test.ok(arr[0][7].toString().startsWith('2012-10-02') === true);
								test.ok(arr[0][8] === 1.5);
								test.ok(arr[0][9] === 2.5);
								test.ok(arr[0][10] === 14);
								test.ok(arr[0][11] === 3.14);
								test.ok(arr[0][12] === '9');
								test.ok(arr[0][13] === '95');
								test.ok(arr[0][14] === 16);
								test.ok(arr[0][15] === 'varchar');
								test.ok(arr[0][16].toString().startsWith('1899-12-31') === true);
								test.ok(arr[0][17].toString().startsWith('2012-10-02') === true);

								if (isCUBRID9) {
									// ENUM was defined, check it.
									console.log(arr[0][18]);
									test.ok(arr[0][18] === 'blue');
									test.ok(arr[0][19] === 'varchar');
								} else {
									test.ok(arr[0][18] === 'varchar');
								}

								for (var j = 0; j < arr.length; ++j) {
									Helpers.logInfo(arr[j].toString());
								}

								client.closeQuery(queryHandle, function (err) {
									if (err) {
										errorHandler(err);
									} else {
										Helpers.logInfo('Query closed.');

										client.batchExecuteNoQuery('DROP TABLE test_data_types', function (err) {
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
							}
						});
					}
			});
		}
	});
};
