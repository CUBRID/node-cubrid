var assert = require('assert'),
  Helpers = require('../Helpers');

console.log('Unit test ' + module.filename.toString() + ' started...');

var buffer = new Buffer(5);
buffer.write('12345');
var value1 = ['6', '7', '8'];
var comb1 = Helpers._combineData(buffer, value1);

assert.equal(comb1.toString(), '12345678');

var value2 = new Buffer('678');
var comb2 = Helpers._combineData(buffer, value2);

assert.equal(comb2.toString(), '12345678');

var value3 = new Buffer(3);
value3[0] = '6'.charCodeAt(0);
value3[1] = '7'.charCodeAt(0);
value3[2] = '8'.charCodeAt(0);

var comb3 = Helpers._combineData(buffer, value3);

assert.equal(comb3.toString(), '12345678');

var sql = 'insert into a values(?, ?, ?)';
var newsql = Helpers._sqlFormat(sql, ['1', 2, null], ['\'', '', '']);

assert.equal(newsql, "insert into a values('1', 2, NULL)");

var unescaped = 'insert into "a values(\b)';
var escaped = Helpers._escapeString(unescaped);

assert.equal(escaped, "insert into \"\"a values(\\b)");

//Test Input validation functions
assert(Helpers._validateInputBoolean(null) === false);
assert(Helpers._validateInputBoolean(4) === false);
assert(Helpers._validateInputBoolean(3.14) === false);
assert(Helpers._validateInputBoolean('qwerty') === false);
assert(Helpers._validateInputBoolean(true) === true);
assert(Helpers._validateInputBoolean(1) === true);

assert(Helpers._validateInputPositive(null) === false);
assert(Helpers._validateInputPositive(3.14) === true);
assert(Helpers._validateInputPositive(-1) === false);
assert(Helpers._validateInputPositive(0) === true);
assert(Helpers._validateInputPositive(14) === true);

assert(Helpers._validateInputTimeout(null) === false);
assert(Helpers._validateInputTimeout(3.14) === false);
assert(Helpers._validateInputTimeout(-1) === false);
assert(Helpers._validateInputTimeout(0) === true);
assert(Helpers._validateInputTimeout(14) === true);

assert(Helpers._validateInputString(null) === false);
assert(Helpers._validateInputString(3) === false);
assert(Helpers._validateInputString(true) === false);
assert(Helpers._validateInputString('') === false);
assert(Helpers._validateInputString('querty') === true);

assert(Helpers._validateInputSQLString(null) === false);
assert(Helpers._validateInputSQLString(3) === false);
assert(Helpers._validateInputSQLString(true) === false);
assert(Helpers._validateInputSQLString('') === false);
assert(Helpers._validateInputSQLString('a') === false);
assert(Helpers._validateInputSQLString('qwerty') === true);

console.log('Unit test ended OK.');


