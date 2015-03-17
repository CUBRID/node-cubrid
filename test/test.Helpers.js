var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
		Helpers = require('../src' + codeCoveragePath + '/utils/Helpers');

exports['validate input'] = function (test) {
	test.expect(35);

	var buffer = new Buffer(5),
			value1 = ['6', '7', '8'];
	
	buffer.write('12345');
	
	var comb1 = Helpers._combineData(buffer, value1);

	test.equal(comb1.toString(), '12345678');

	var value2 = new Buffer('678'),
			comb2 = Helpers._combineData(buffer, value2);

	test.equal(comb2.toString(), '12345678');

	var value3 = new Buffer(3);
	value3[0] = '6'.charCodeAt(0);
	value3[1] = '7'.charCodeAt(0);
	value3[2] = '8'.charCodeAt(0);

	var comb3 = Helpers._combineData(buffer, value3);

	test.equal(comb3.toString(), '12345678');

	var sql = 'INSERT INTO a VALUES(?, ?, ?)',
			newsql = Helpers._sqlFormat(sql, ['1', 2, null], ["'", '', '']);

	test.equal(newsql, "INSERT INTO a VALUES('1', 2, NULL)");

	test.equal(Helpers._escapeString('INSERT INTO "a VALUES(\b)'), 'INSERT INTO ""a VALUES(\\b)');

	sql = 'stringWithDouble"Quote';

	// Should not escape the double quote if the delimiter is a single quote.
	test.equal(Helpers._escapeString(sql, "'"), sql);

	sql = "stringWithSingle'Quote";

	// Should not escape the single quote if the delimiter is a double quote.
	test.equal(Helpers._escapeString(sql, '"'), sql);

	sql = 'INSERT INTO a VALUES(?, ?, ?)';
	newsql = Helpers._sqlFormat(sql, ['stringWithDouble"Quote', 2, null]);

	test.equal(newsql, "INSERT INTO a VALUES('stringWithDouble\"Quote', 2, NULL)");
	
	// Test Input validation functions
	test.ok(Helpers._validateInputBoolean(null) === false);
	test.ok(Helpers._validateInputBoolean(4) === false);
	test.ok(Helpers._validateInputBoolean(3.14) === false);
	test.ok(Helpers._validateInputBoolean('qwerty') === false);
	test.ok(Helpers._validateInputBoolean(true) === true);
	test.ok(Helpers._validateInputBoolean(1) === true);

	test.ok(Helpers._validateInputPositive(null) === false);
	test.ok(Helpers._validateInputPositive(3.14) === true);
	test.ok(Helpers._validateInputPositive(-1) === false);
	test.ok(Helpers._validateInputPositive(0) === true);
	test.ok(Helpers._validateInputPositive(14) === true);

	test.ok(Helpers._validateInputTimeout(null) === false);
	test.ok(Helpers._validateInputTimeout(3.14) === false);
	test.ok(Helpers._validateInputTimeout(-1) === false);
	test.ok(Helpers._validateInputTimeout(0) === true);
	test.ok(Helpers._validateInputTimeout(14) === true);

	test.ok(Helpers._validateInputString(null) === false);
	test.ok(Helpers._validateInputString(3) === false);
	test.ok(Helpers._validateInputString(true) === false);
	test.ok(Helpers._validateInputString('') === false);
	test.ok(Helpers._validateInputString('querty') === true);

	test.ok(Helpers._validateInputSQLString(null) === false);
	test.ok(Helpers._validateInputSQLString(3) === false);
	test.ok(Helpers._validateInputSQLString(true) === false);
	test.ok(Helpers._validateInputSQLString('') === false);
	test.ok(Helpers._validateInputSQLString('a') === false);
	test.ok(Helpers._validateInputSQLString('qwerty') === true);

	test.done();
};

//exports['_sqlFormat()'] = function (test) {
//	var arr = [
//		{
//			sql: 'INSERT INTO project (projectname, team, creator, description, log_limit, esm_code, sink_config, createtime, lastmodified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
//			values: ['qqqesen', 'qa', 60136, '1234123412', 20000000, '123456', JSON.stringify({
//				type: "hdfs",
//				server: [
//					{
//						ip: "1.1.1.1",
//						port: 2222
//					}
//				],
//				user: "hadoop",
//				path:"/data"
//			}), '2013-09-25 17:00:52', '2013-09-25 17:00:52'],
//			outputSQL: "INSERT INTO project (projectname, team, creator, description, log_limit, esm_code, sink_config, createtime, lastmodified) VALUES ('qqqesen', 'qa', 60136, '1234123412', 20000000, '123456', '{\"type\":\"hdfs\",\"server\":[{\"ip\":\"1.1.1.1\",\"port\":2222}],\"user\":\"hadoop\",\"path\":\"/data\"}', '2013-09-25 17:00:52', '2013-09-25 17:00:52')"
//		}
//	];
//
//	test.expect(arr.length);
//
//	async.each(arr, function(obj, done) {
//		Helpers._sqlFormat(obj.sql, obj.values);
//	}, function (err) {
//
//	});
//
//};
