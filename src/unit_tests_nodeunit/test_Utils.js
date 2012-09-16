var GetResultsArray = require('./../resultset/Result2Array').RowsArray,
  GetResultsColumnNamesArray = require('./../resultset/Result2Array').ColumnNamesArray,
  GetResultsColumnTypesArray = require('./../resultset/Result2Array').ColumnTypesArray,
  GetResultsCount = require('./../resultset/Result2Array').TotalRowsCount;

var json_str = '{"ColumnNames":["s_name","f_name"],' +
  '"ColumnDataTypes":["char","string"],' +
  '"RowsCount":99,' +
  '"ColumnValues":[["X","Mixed"],["W","Woman"],["M","Man"]]}';

exports['test_Utils'] = function (test) {
  test.expect(4);
  console.log('Unit test ' + module.filename.toString() + ' started...');

  test.equal(GetResultsArray(json_str).toString(), 'X,Mixed,W,Woman,M,Man');
  test.equal(GetResultsColumnNamesArray(json_str).toString(), 's_name,f_name');
  test.equal(GetResultsColumnTypesArray(json_str).toString(), 'char,string');
  test.equal(GetResultsCount(json_str), 99);

  console.log('Unit test ended OK.');
  test.done();
};
