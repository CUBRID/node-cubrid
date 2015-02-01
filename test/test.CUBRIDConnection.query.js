var async = require('async'),
		test_Setup = require('./testSetup/test_Setup');

exports['single query(sql, callback)'] = function (test) {
	var client = test_Setup.createDefaultCUBRIDDemodbConnection();

	test.expect(4);

	async.waterfall([
		function (cb) {
			client.connect(cb);
		},
		function (cb) {
			client.query('SHOW TABLES', cb);
		},
		function (result, queryHandle, cb) {
			test.ok(result);
			test.ok(queryHandle > 0);
			result = JSON.parse(result);
			test.ok(result.RowsCount == 10);

			client.closeQuery(queryHandle, cb);
		}
	], function (err) {
		if (err) {
			throw err;
		} else {
			test.ok(client._queriesPacketList.length == 0);

			client.close(function (err) {
				test.done(err);
			});
		}
	});
};

exports['multiple query(sql, callback) in the queue with closeQuery()'] = function (test) {
	var client = test_Setup.createDefaultCUBRIDDemodbConnection();

	var arr = [1, 2, 3, 4, 5];

	test.expect(arr.length * 4 + 1);

	async.each(arr, function (ix, done) {
		client.query('SHOW TABLES', function (err, result, queryHandle) {
			test.ok(!err);
			test.ok(result);
			test.ok(queryHandle > 0);
			result = JSON.parse(result);
			test.ok(result.RowsCount == 10);

			client.closeQuery(queryHandle, done);
		});
	}, function (err) {
		if (err) {
			throw err;
		} else {
			test.ok(client._queriesPacketList.length == 0);

			client.close(function (err) {
				test.done(err);
			});
		}
	});
};

exports['multiple query(sql, callback) in the queue without closeQuery()'] = function (test) {
	var client = test_Setup.createDefaultCUBRIDDemodbConnection();

	var arr = [1, 2, 3, 4, 5];

	test.expect(arr.length * 4 + 1);

	async.each(arr, function (ix, done) {
		client.query('SHOW TABLES', function (err, result, queryHandle) {
			test.ok(!err);
			test.ok(result);
			test.ok(queryHandle > 0);
			result = JSON.parse(result);
			test.ok(result.RowsCount == 10);

			done();
		});
	}, function (err) {
		if (err) {
			throw err;
		} else {
			test.ok(client._queriesPacketList.length > 0);

			client.close(function (err) {
				test.done(err);
			});
		}
	});

//	ActionQueue.enqueue([
//		function (cb) {
//			client.connect(cb);
//		},
//		function (cb) {
//			function handleResults(err, results, queryHandle) {
//				if (err)
//			}
//
//			for (var i = 0; i < max; ++i) {
//				client.genericQuery('SHOW TABLES', handleResults);
//			}
//		},
//		function (results, queryHandle, cb) {
//			console.log(++i, results);
//
//			client.closeQuery(queryHandle, cb);

////			client.genericQuery('SELECT 1; SELECT 1;', function (err, results) {
////				if (err) {
////					cb(err);
////				} else {
////					console.log(results);
////					test.deepEqual(results, ['SELECT 1', 'SELECT 1']);
////					cb();
////				}
////			});
////		},
////		function (cb) {
////			client.genericQuery(['SELECT 1;', 'SELECT 1;'], function (err, results) {
////				if (err) {
////					cb(err);
////				} else {
////					console.log(results);
////					test.deepEqual(results, ['SELECT 1;', 'SELECT 1;']);
////					cb();
////				}
////			});
////		},
////		function (cb) {
////			client.genericQuery(['SELECT 1', 'SELECT 1'], function (err, results) {
////				if (err) {
////					cb(err);
////				} else {
////					console.log(results);
////					test.deepEqual(results, ['SELECT 1', 'SELECT 1']);
////					cb();
////				}
////			});
////		},
//		function (cb) {
//			client.genericQuery(['SELECT 1'], function (err, results) {
//				if (err) {
//					cb(err);
//				} else {
//					console.log(results);
//					test.deepEqual(results, ['SELECT 1']);
//					cb();
//				}
//			});
////		},
////		function (cb) {
////			client.genericQuery(['  SELECT 1;  '], function (err, results) {
////				if (err) {
////					cb(err);
////				} else {
////					console.log(results);
////					test.deepEqual(results, ['SELECT 1;']);
////					cb();
////				}
////			});
////		},
////		function (cb) {
////			client.genericQuery('SELECT * FROM game WHERE id = ?', [1], function (err, results) {
////				if (err) {
////					cb(err);
////				} else {
////					console.log(results);
////					test.deepEqual(results, ['SELECT * FROM game WHERE id = 1']);
////					cb();
////				}
////			});
////		},
////		function (cb) {
////			client.genericQuery('SELECT * FROM game WHERE id = ? AND name = ?', [1, 'soccer'], function (err, results) {
////				if (err) {
////					cb(err);
////				} else {
////					console.log(results);
////					test.deepEqual(results, ["SELECT * FROM game WHERE id = 1 AND name = 'soccer'"]);
////					cb();
////				}
////			});
//		}
//	], function (err) {
//
//	});
};

exports['single query(sql, params, callback)'] = function (test) {
	var client = test_Setup.createDefaultCUBRIDDemodbConnection();

	test.expect(4);

	async.waterfall([
		function (cb) {
			client.connect(cb);
		},
		function (cb) {
			client.query('SELECT * FROM nation WHERE continent = ?', ['Asia'], cb);
		},
		function (result, queryHandle, cb) {
			test.ok(result);
			test.ok(queryHandle > 0);
			result = JSON.parse(result);
			test.ok(result.RowsCount == 47);

			client.closeQuery(queryHandle, cb);
		}
	], function (err) {
		if (err) {
			throw err;
		} else {
			test.ok(client._queriesPacketList.length == 0);

			client.close(function (err) {
				test.done(err);
			});
		}
	});
};

exports['multiple query(sql, params, callback) in the queue without closeQuery()'] = function (test) {
	var client = test_Setup.createDefaultCUBRIDDemodbConnection();

	var arr = [
		{
			sql: "SHOW TABLES",
			params: null,
			rowsCount: 10
		},
		{
			sql: "SELECT * FROM nation",
			params: [],
			rowsCount: 215
		},
		{
			sql: "SELECT * FROM nation WHERE continent = ?",
			params: ['Asia'],
			rowsCount: 47
		},
		{
			sql: "SELECT * FROM nation WHERE continent = ?",
			params: 'Asia',
			rowsCount: 47
		},
		{
			sql: "SELECT * FROM history WHERE host_year = ?",
			params: [2004],
			rowsCount: 64
		},
		{
			sql: "SELECT * FROM history WHERE host_year = ?",
			params: 2004,
			rowsCount: 64
		},
		{
			sql: "SELECT * FROM history WHERE host_year = ?",
			params: ['2004'],
			rowsCount: 64
		},
		{
			sql: "SELECT * FROM history WHERE host_year = ?",
			params: '2004',
			rowsCount: 64
		},
		{
			sql: "SELECT * FROM game WHERE game_date = ?",
			params: ['08/28/2004'],
			rowsCount: 311
		},
		{
			sql: "SELECT * FROM game WHERE game_date = ?",
			params: '08/28/2004',
			rowsCount: 311
		},
		{
			sql: "SELECT * FROM game WHERE game_date = ?",
			params: [new Date('8/28/2004')],
			rowsCount: 311
		},
		{
			sql: "SELECT * FROM game WHERE game_date = ?",
			params: new Date('8/28/2004'),
			rowsCount: 311
		},
		{
			sql: "SELECT * FROM game WHERE game_date = ?",
			params: [new Date()],
			rowsCount: 0
		},
		{
			sql: "SELECT * FROM game WHERE game_date = ?",
			params: new Date(),
			rowsCount: 0
		}
	];

	test.expect(arr.length * 4 + 1);

	async.each(arr, function (query, done) {
		client.query(query.sql, query.params, function (err, result, queryHandle) {
			test.ok(!err);
			test.ok(result);
			test.ok(queryHandle > 0);
			result = JSON.parse(result);
			test.ok(result.RowsCount == query.rowsCount);

			done();
		});
	}, function (err) {
		if (err) {
			throw err;
		} else {
			test.ok(client._queriesPacketList.length > 0);

			client.close(function (err) {
				test.done(err);
			});
		}
	});
};

exports['single execute(sql, callback)'] = function (test) {
	var client = test_Setup.createDefaultCUBRIDDemodbConnection();

	test.expect(1);

	async.waterfall([
		function (cb) {
			client.connect(cb);
		},
		function (cb) {
			client.setAutoCommitMode(false, cb);
		},
		function (cb) {
			client.execute("DELETE FROM code WHERE s_name = 'ZZZZ'", cb);
		}
	], function (err) {
		if (err) {
			throw err;
		} else {
			test.ok(client._queriesPacketList.length == 0);

			client.close(function (err) {
				test.done(err);
			});
		}
	});
};

exports['multiple execute(sql, callback) in the queue'] = function (test) {
	var client = test_Setup.createDefaultCUBRIDDemodbConnection();

	var arr = [
		{
			sql: "CREATE TABLE tbl_test(id INT)"
		},
		{
			sql: "INSERT INTO tbl_test (id) VALUES (1), (2), (3)"
		},
		{
			sql: "DROP TABLE tbl_test"
		}
	];

	test.expect(arr.length * 2 + 1 + 4 + 1);

	async.waterfall([
		function (cb) {
			async.each(arr, function (query, done) {
				client.execute(query.sql, function (err) {
					test.ok(!err);
					test.ok(client._queriesPacketList.length == 0);

					done();
				});
			}, cb);
		},
		function (cb) {
			test.ok(client._queriesPacketList.length == 0);

			client.query('SHOW TABLES', function (err, result, queryHandle) {
				test.ok(!err);
				test.ok(result);
				test.ok(queryHandle > 0);
				result = JSON.parse(result);
				test.ok(result.RowsCount == 10);

				cb();
			});
		}
	], function (err) {
		if (err) {
			throw err;
		} else {
			test.ok(client._queriesPacketList.length == 1);

			client.close(function (err) {
				test.done(err);
			});
		}
	});
};
