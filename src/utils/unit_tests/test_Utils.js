var assert = require('assert'),
  GetResultsArray = require('./../../resultset/Result2Array').RowsArray,
  GetResultsColumnNamesArray = require('./../../resultset/Result2Array').ColumnNamesArray,
  GetResultsColumnTypesArray = require('./../../resultset/Result2Array').ColumnTypesArray,
  GetResultsCount = require('./../../resultset/Result2Array').TotalRowsCount,
  GetResultsObjectsArrays = require('./../../resultset/Result2Array').ObjectsArray;


var json_str = '{"ColumnNames":["s_name","f_name"],' +
  '"ColumnDataTypes":["char","string"],' +
  '"RowsCount":99,' +
  '"ColumnValues":[["X","Mixed"],["W","Woman"],["M","Man"]]}';

console.log('Unit test ' + module.filename.toString() + ' started...');

assert.equal(GetResultsArray(json_str).toString(), 'X,Mixed,W,Woman,M,Man');
assert.equal(GetResultsColumnNamesArray(json_str).toString(), 's_name,f_name');
assert.equal(GetResultsColumnTypesArray(json_str).toString(), 'char,string');
assert.equal(GetResultsCount(json_str), 99);

var objectsArray = GetResultsObjectsArrays(json_str);
assert.equal(objectsArray[0].s_name, 'X');
assert.equal(objectsArray[0].f_name, 'Mixed');
assert.equal(objectsArray[1].s_name, 'W');
assert.equal(objectsArray[1].f_name, 'Woman');
assert.equal(objectsArray[2].s_name, 'M');
assert.equal(objectsArray[2].f_name, 'Man');

console.log('Unit test ended OK.');
