var path = require('path');

exports[path.basename(__filename)] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			srcDir = '../src' + codeCoveragePath,
			GetResultsArray = require(srcDir + '/resultset/Result2Array').RowsArray,
			GetResultsColumnNamesArray = require(srcDir + '/resultset/Result2Array').ColumnNamesArray,
			GetResultsColumnTypesArray = require(srcDir + '/resultset/Result2Array').ColumnTypesArray,
			GetResultsCount = require(srcDir + '/resultset/Result2Array').TotalRowsCount,
			GetResultsObjectsArrays = require(srcDir + '/resultset/Result2Array').ObjectsArray;

	test.expect(10);

	var json_str = '{"ColumnNames":["s_name","f_name"],' +
			'"ColumnDataTypes":["char","string"],' +
			'"RowsCount":99,' +
			'"ColumnValues":[["X","Mixed"],["W","Woman"],["M","Man"]]}';

	test.equal(GetResultsArray(json_str).toString(), 'X,Mixed,W,Woman,M,Man');
	test.equal(GetResultsColumnNamesArray(json_str).toString(), 's_name,f_name');
	test.equal(GetResultsColumnTypesArray(json_str).toString(), 'char,string');
	test.equal(GetResultsCount(json_str), 99);

	var objectsArray = GetResultsObjectsArrays(json_str);
	test.equal(objectsArray[0].s_name, 'X');
	test.equal(objectsArray[0].f_name, 'Mixed');
	test.equal(objectsArray[1].s_name, 'W');
	test.equal(objectsArray[1].f_name, 'Woman');
	test.equal(objectsArray[2].s_name, 'M');
	test.equal(objectsArray[2].f_name, 'Man');

	test.done();
};
