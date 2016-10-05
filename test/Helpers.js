'use strict';

let expect = require('chai').expect;

const codeCoveragePath = process.env.CODE_COV ? '-cov' : '';
const Helpers = require('../src' + codeCoveragePath + '/utils/Helpers');

it('should succeed to validate the input', function () {
  let sql = 'INSERT INTO a VALUES(?, ?, ?)';
  let newSQL = Helpers._sqlFormat(sql, ['1', 2, null], ["'", '', '']);

  expect(newSQL).to.equal("INSERT INTO a VALUES('1', 2, NULL)");

  expect(Helpers._escapeString('INSERT INTO "a VALUES(\b)')).to.equal('INSERT INTO ""a VALUES(\\b)');

  sql = 'stringWithDouble"Quote';

  // Should not escape the double quote if the delimiter is a single quote.
  expect(Helpers._escapeString(sql, "'")).to.equal(sql);

  sql = "stringWithSingle'Quote";

  // Should not escape the single quote if the delimiter is a double quote.
  expect(Helpers._escapeString(sql, '"')).to.equal(sql);

  sql = 'INSERT INTO a VALUES(?, ?, ?)';
  newSQL = Helpers._sqlFormat(sql, ['stringWithDouble"Quote', 2, null]);

  expect(newSQL).to.equal("INSERT INTO a VALUES('stringWithDouble\"Quote', 2, NULL)");

  // Test Input validation functions
  expect(Helpers._validateInputBoolean(null)).to.be.false;
  expect(Helpers._validateInputBoolean(4)).to.be.false;
  expect(Helpers._validateInputBoolean(3.14)).to.be.false;
  expect(Helpers._validateInputBoolean('qwerty')).to.be.false;
  expect(Helpers._validateInputBoolean(true)).to.be.true;
  expect(Helpers._validateInputBoolean(1)).to.be.true;

  expect(Helpers._validateInputPositive(null)).to.be.false;
  expect(Helpers._validateInputPositive(3.14)).to.be.true;
  expect(Helpers._validateInputPositive(-1)).to.be.false;
  expect(Helpers._validateInputPositive(0)).to.be.true;
  expect(Helpers._validateInputPositive(14)).to.be.true;

  expect(Helpers._validateInputTimeout(null)).to.be.false;
  expect(Helpers._validateInputTimeout(3.14)).to.be.false;
  expect(Helpers._validateInputTimeout(-1)).to.be.false;
  expect(Helpers._validateInputTimeout(0)).to.be.true;
  expect(Helpers._validateInputTimeout(14)).to.be.true;

  expect(Helpers._validateInputString(null)).to.be.false;
  expect(Helpers._validateInputString(3)).to.be.false;
  expect(Helpers._validateInputString(true)).to.be.false;
  expect(Helpers._validateInputString('')).to.be.false;
  expect(Helpers._validateInputString('querty')).to.be.true;

  expect(Helpers._validateInputSQLString(null)).to.be.false;
  expect(Helpers._validateInputSQLString(3)).to.be.false;
  expect(Helpers._validateInputSQLString(true)).to.be.false;
  expect(Helpers._validateInputSQLString('')).to.be.false;
  expect(Helpers._validateInputSQLString('a')).to.be.false;
  expect(Helpers._validateInputSQLString('qwerty')).to.be.true;
});

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
