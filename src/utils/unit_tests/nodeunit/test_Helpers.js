var Helpers = require('../../Helpers');

exports['test_Helpers'] = function (test) {
  test.expect(32);
  console.log('Unit test ' + module.filename.toString() + ' started...');

  var buffer = new Buffer(5);
  buffer.write('12345');
  var value1 = ['6', '7', '8'];
  var comb1 = Helpers._combineData(buffer, value1);

  test.equal(comb1.toString(), '12345678');

  var value2 = new Buffer('678');
  var comb2 = Helpers._combineData(buffer, value2);

  test.equal(comb2.toString(), '12345678');

  var value3 = new Buffer(3);
  value3[0] = '6'.charCodeAt(0);
  value3[1] = '7'.charCodeAt(0);
  value3[2] = '8'.charCodeAt(0);

  var comb3 = Helpers._combineData(buffer, value3);

  test.equal(comb3.toString(), '12345678');

  var sql = 'insert into a values(?, ?, ?)';
  var newsql = Helpers._sqlFormat(sql, ['1', 2, null], ['\'', '', '']);

  test.equal(newsql, "insert into a values('1', 2, NULL)");

  var unescaped = 'insert into "a values(\b)';
  var escaped = Helpers._escapeString(unescaped);

  test.equal(escaped, "insert into \"\"a values(\\b)");

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

  console.log('Unit test ended OK.');
  test.done();
};
