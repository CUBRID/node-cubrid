var assert = require('assert'),
  GetResultsArray = require('./../resultset/Result2Array').GetResultsArray,
  GetResultsColumnNamesArray = require('./../resultset/Result2Array').GetResultsColumnNamesArray,
  GetResultsColumnTypesArray = require('./../resultset/Result2Array').GetResultsColumnsTypeArray,
  GetResultsCount = require('./../resultset/Result2Array').GetResultsCount;

var json_str = '{"ColumnNames":["s_name","f_name"],' +
  '"ColumnDataTypes":["char","string"],' +
  '"RowsCount":99,' +
  '"ColumnValues":[["X","Mixed"],["W","Woman"],["M","Man"]]}';

console.log('Unit test ' + module.filename.toString() + ' started...');

assert.equal(GetResultsArray(json_str).toString(), 'X,Mixed,W,Woman,M,Man');
assert.equal(GetResultsColumnNamesArray(json_str).toString(), 's_name,f_name');
assert.equal(GetResultsColumnTypesArray(json_str).toString(), 'char,string');
assert.equal(GetResultsCount(json_str), 99);

console.log('Unit test ended OK.');
