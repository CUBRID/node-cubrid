var CUBRIDClient = require('./test_Setup').createDefaultCUBRIDDemodbConnection,
		Helpers = require('../../src/utils/Helpers'),
		Result2Array = require('../../src/resultset/Result2Array'),
		assert = require('assert');

function errorHandler(err) {
	throw err.message;
}

Helpers.logInfo(module.filename.toString() + ' started...');

CUBRIDClient.connect(function (err) {
	if (err) {
		errorHandler(err);
	} else {
		Helpers.logInfo('Connected.');
		CUBRIDClient.batchExecuteNoQuery(
				[
					'drop table if exists test_params',
					'CREATE TABLE test_params(' +
					'a bigint,' +
					'b bit(8),' +
					'c bit varying(8),' +
					'd character(1),' +
					'e date,' +
					'f datetime,' +
					'g double,' +
					'h float,' +
					'i integer,' +
					'j monetary,' +
					'k national character(1),' +
					'l national character varying(100),' +
					'm numeric(15,0),' +
					'n character varying(100),' +
					'o time,' +
					'p timestamp,' +
					'q character varying(4096))'
				],
				function (err) {
					if (err) {
						errorHandler(err);
					} else {
						var bitValue = new Buffer(1),
								date = new Date(),
								varBitValue = new Buffer(1),
								values;

						bitValue[0] = 0;
						varBitValue[0] = 128;

						date.setUTCFullYear(2012, 10, 2);
						date.setUTCHours(13);
						date.setUTCMinutes(25);
						date.setUTCSeconds(45);
						date.setUTCMilliseconds(0);

						values = [15, bitValue, varBitValue, 'a', date, date, 1.5, 2.5, 14, 3.14, '9' , '95', 16, 'varnchar', date, date, 'varcharWithDouble"Quote'];
						
						CUBRIDClient.executeWithTypedParams(
								'INSERT INTO test_params VALUES( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
								values,
								['bigint', 'bit', 'varbit', 'char', 'date', 'datetime', 'double', 'float', 'int', 'monetary',
									'nchar', 'varnchar', 'numeric', 'varchar', 'time', 'timestamp', 'varchar'],
								function (err) {
									if (err) {
										errorHandler(err);
									} else {
										CUBRIDClient.query('SELECT * FROM test_params', function (err, result, queryHandle) {
											if (err) {
												errorHandler(err);
											} else {
												var arr = Result2Array.RowsArray(result);
												
												assert(Result2Array.TotalRowsCount(result) === 1);
												
												Helpers.logInfo('Query result rows count: ' + arr.length);
												
												assert(arr.length === 1);

												arr = arr[0];
												
												assert(arr[0] === values[0]);
												assert(arr[1][0] === values[1][0]);
												assert(arr[2][0] === values[2][0]);
												assert(arr[3] === values[3]);
												assert(arr[4].toString() === '2012-10-02T00:00:00.000Z');
												assert(arr[5].toString() === '2012-10-02T13:25:45.000Z');
												assert(arr[6] === values[6]);
												assert(arr[7] === values[7]);
												assert(arr[8] === values[8]);
												assert(arr[9] === values[9]);
												assert(arr[10] === values[10]);
												assert(arr[11] === values[11]);
												assert(arr[12] === values[12]);
												assert(arr[13] === values[13]);
												assert(arr[14].toString() === '1899-12-31T13:25:45.000Z');
												assert(arr[15].toString() === '2012-10-02T13:25:45.000Z');
												assert(arr[16] === values[16]);

												CUBRIDClient.execute('DROP TABLE test_params', function (err) {
													if (err) {
														errorHandler(err);
													} else {
														CUBRIDClient.close(function (err) {
															if (err) {
																errorHandler(err);
															} else {
																Helpers.logInfo('Connection closed.');
																Helpers.logInfo('Test passed.');
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
