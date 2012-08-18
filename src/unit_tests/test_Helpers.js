var assert = require('assert'),
  Helpers = require('../utils/Helpers');

console.log('Unit test ' + module.filename.toString() + ' started...');

var buffer = new Buffer(5);
buffer.write('12345');
var value1 = ['6', '7', '8'];
var comb1 = Helpers.combineData(buffer, value1);

assert.equal(comb1.toString(), '12345678');

var value2 = new Buffer('678');
var comb2 = Helpers.combineData(buffer, value2);

assert.equal(comb2.toString(), '12345678');

var value3 = new Buffer(3);
value3[0] = '6'.charCodeAt(0);
value3[1] = '7'.charCodeAt(0);
value3[2] = '8'.charCodeAt(0);

var comb3 = Helpers.combineData(buffer, value3);

assert.equal(comb3.toString(), '12345678');

console.log('Unit test ended OK.');


