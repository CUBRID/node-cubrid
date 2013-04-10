/**
 * Returns an array with the query results
 * @param jsonData
 * @return {*}
 * @constructor
 */
exports.RowsArray = function (jsonData) {
  if (typeof  jsonData === 'undefined' || jsonData === null || jsonData.length === 0) {
    return new Array(0);
  }

  try {
    var fullArray = JSON.parse(jsonData);
    var arr = [];

    var rowsCount = fullArray.ColumnValues.length;
    if (rowsCount <= 0) {
      return new Array(0);
    } else {
      for (var i = 0; i < rowsCount; i++) {
        arr[i] = fullArray.ColumnValues[i];
      }
    }
    return arr;
  }
  catch (ignored) {
    return new Array(0);
  }
};

/**
 * Returns an array with the query results column names
 * @param jsonData
 * @return {*}
 * @constructor
 */
exports.ColumnNamesArray = function (jsonData) {
  if (typeof  jsonData === 'undefined' || jsonData === null || jsonData.length === 0) {
    return new Array(0);
  }

  var fullArray = '';

  try {
    fullArray = JSON.parse(jsonData);

    var rowsCount = fullArray.ColumnNames.length;
    if (rowsCount <= 0) {
      return new Array(0);
    } else {
      return fullArray.ColumnNames;
    }
  }
  catch (ignored) {
    return new Array(0);
  }
};

/**
 * Returns an array with the query results columns data types
 * @param jsonData
 * @return {*}
 * @constructor
 */
exports.ColumnTypesArray = function (jsonData) {
  if (typeof  jsonData === 'undefined' || jsonData === null || jsonData.length === 0) {
    return new Array(0);
  }

  var fullArray = '';

  try {
    fullArray = JSON.parse(jsonData);

    var rowsCount = fullArray.ColumnDataTypes.length;
    if (rowsCount <= 0) {
      return new Array(0);
    } else {
      return fullArray.ColumnDataTypes;
    }
  }
  catch (ignored) {
    return new Array(0);
  }
};

/**
 * Returns the query results rows count
 * Please note that this is the total query rows count and not the current "batch of data" rows count.
 * @param jsonData
 * @return {*}
 * @constructor
 */
exports.TotalRowsCount = function (jsonData) {
  if (typeof  jsonData === 'undefined' || jsonData === null || jsonData.length === 0) {
    return 0;
  }

  var fullArray = '';

  try {
    fullArray = JSON.parse(jsonData);

    var rowsCount = fullArray.RowsCount;
    if (rowsCount <= 0) {
      return 0;
    } else {
      return fullArray.RowsCount;
    }
  }
  catch (ignored) {
    return 0;
  }
};

/**
 * Returns an array of objects where column names are keys
 * @param jsonData
 * @return {*}
 * @constructor
 */
exports.ObjectsArray = function(jsonData) {
  if (typeof  jsonData === 'undefined' || jsonData === null || jsonData.length === 0) {
    return new Array(0);
  }

  try {
    var fullArray = JSON.parse(jsonData);
    var arr = [];

    var rowsCount = fullArray.ColumnValues.length;
    var colCount = fullArray.ColumnNames.length;
    if (rowsCount <= 0) {
      return new Array(0);
    } else {
      for (var i = 0; i < rowsCount; i++) {
        arr[i] = {};
        for(var j = 0; j < colCount; j++) {
          arr[i][fullArray.ColumnNames[j]] = fullArray.ColumnValues[i][j];
        }
      }
    }
    return arr;
  }
  catch (ignored) {
    return new Array(0);
  }
};
