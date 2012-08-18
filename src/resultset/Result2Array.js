/**
 * Returns an array with the query results
 * @param data
 * @return {*}
 * @constructor
 */
exports.GetResultsArray = function GetResultsArray(data) {
  var fullArray = JSON.parse(data);
  var arr = new Array();

  var rowsCount = fullArray['ColumnValues'].length;
  if (rowsCount <= 0) {
    return null;
  } else {
    for (var i = 0; i < rowsCount; i++) {
      arr[i] = fullArray['ColumnValues'][i];
    }
  }

  return arr;
};

/**
 * Returns an array with the query results column names
 * @param data
 * @return {*}
 * @constructor
 */
exports.GetResultsColumnNamesArray = function GetResultsColumnNamesArray(data) {
  var fullArray = '';

  try {
    fullArray = JSON.parse(data);

    var rowsCount = fullArray['ColumnNames'].length;
    if (rowsCount <= 0) {
      return null;
    } else {
      return fullArray['ColumnNames'];
    }
  }
  catch (ex) {
    return 'error';
  }
};

/**
 * Returns an array with the query results columns data types
 * @param data
 * @return {*}
 * @constructor
 */
exports.GetResultsColumnsTypeArray = function GetResultsColumnsTypeArray(data) {
  var fullArray = '';

  try {
    fullArray = JSON.parse(data);

    var rowsCount = fullArray['ColumnDataTypes'].length;
    if (rowsCount <= 0) {
      return null;
    } else {
      return fullArray['ColumnDataTypes'];
    }
  }
  catch (ex) {
    return 'error';
  }
};

/**
 * Returns the query results rows count
 * Please note that this is the total query rows count and not the current "batch of data" rows count
 * @param data
 * @return {*}
 * @constructor
 */
exports.GetResultsCount = function GetResultsCount(data) {
  var fullArray = '';

  try {
    fullArray = JSON.parse(data);

    var rowsCount = fullArray['RowsCount'];
    if (rowsCount <= 0) {
      return null;
    } else {
      return fullArray['RowsCount'];
    }
  }
  catch (ex) {
    return -1;
  }
};


