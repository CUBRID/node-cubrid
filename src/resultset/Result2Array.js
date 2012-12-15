/**
 * Returns an array with the query results
 * @param jsonData
 * @return {*}
 * @constructor
 */
exports.RowsArray = function (jsonData) {
  if (typeof  jsonData === 'undefined' || jsonData === null || jsonData.length === 0) {
    return null;
  }

  try {
    var fullArray = JSON.parse(jsonData);
    var arr = [];

    var rowsCount = fullArray.ColumnValues.length;
    if (rowsCount <= 0) {
      return null;
    } else {
      for (var i = 0; i < rowsCount; i++) {
        arr[i] = fullArray.ColumnValues[i];
      }
    }
    return arr;
  }
  catch (ignored) {
    return null;
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
    return null;
  }

  var fullArray = '';

  try {
    fullArray = JSON.parse(jsonData);

    var rowsCount = fullArray.ColumnNames.length;
    if (rowsCount <= 0) {
      return null;
    } else {
      return fullArray.ColumnNames;
    }
  }
  catch (ignored) {
    return null;
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
    return null;
  }

  var fullArray = '';

  try {
    fullArray = JSON.parse(jsonData);

    var rowsCount = fullArray.ColumnDataTypes.length;
    if (rowsCount <= 0) {
      return null;
    } else {
      return fullArray.ColumnDataTypes;
    }
  }
  catch (ignored) {
    return null;
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
    return null;
  }

  var fullArray = '';

  try {
    fullArray = JSON.parse(jsonData);

    var rowsCount = fullArray.RowsCount;
    if (rowsCount <= 0) {
      return null;
    } else {
      return fullArray.RowsCount;
    }
  }
  catch (ignored) {
    return null;
  }
};

