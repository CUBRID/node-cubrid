'use strict';

const DATA_TYPES = require('../constants/DataTypes');
// Default delimiter to wrap character strings in SQL queries.
const DEFAULT_DELIMITER = "'";

/**
 * Validate if the value is an accepted "boolean"-compatible input
 * @param val
 * @return {Boolean}
 */
exports._validateInputBoolean = function (val) {
  if (typeof val === 'boolean') {
    return true;
  } else {
    if (typeof val === 'number' && val % 1 === 0 && (val === 0 || val === 1)) {
      return true;
    }
  }

  return false;
};

/**
 * Validate if the value is an accepted "timeout" input
 * @param val
 * @return {Boolean}
 */
exports._validateInputTimeout = function (val) {
  if (typeof val === 'undefined' || val === null || !(typeof val === 'number' && val % 1 === 0 && val >= 0)) {
    return false;
  }

  return true;
};

/**
 * Validate if the value is a positive "number" input
 * @param val
 * @return {Boolean}
 */
exports._validateInputPositive = function (val) {
  if (typeof val === 'undefined' || val === null || !(typeof val === 'number' && val >= 0)) {
    return false;
  }

  return true;
};

/**
 * Validate if the value is an accepted function input string
 * @param str
 * @return {Boolean}
 */
exports._validateInputString = function (str) {
  if (typeof str === 'undefined' || str === null || typeof str !== 'string' || str.length === 0) {
    return false;
  }

  return true;
};

/**
 * Validate if the value is accepted as a SQL statement string
 * @param sql
 * @return {Boolean}
 */
exports._validateInputSQLString = function (sql) {
  if (typeof sql === 'undefined' || sql === null || typeof sql !== 'string' || sql.length <= 5) {
    return false;
  }

  return true;
};

/**
 * Format number values as 'money'
 * http://stackoverflow.com/questions/149055/how-can-i-format-numbers-as-money-in-javascript/149099#149099
 * @param decimals
 * @param decimal_sep
 * @param thousands_sep
 * @return {String}
 */
Number.prototype.formatAsMoney = function (decimals, decimal_sep, thousands_sep) {
  var n = this,
      c = isNaN(decimals) ? 2 : Math.abs(decimals), // If decimal is zero we must take it, it means user does not want to show any decimal
      d = decimal_sep || '.', // If no decimal separator is passed we use the dot as default decimal separator (we MUST use a decimal separator)
      t = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep, // If you don't want to use a thousands separator you can pass empty string as thousands_sep value
      sign = (n < 0) ? '-' : '',
      i = parseInt(n = Math.abs(n).toFixed(c)) + '',
      j;

  j = ((j = i.length) > 3) ? j % 3 : 0;

  return sign + (j ? i.substr(0, j) + t : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
};

/**
 * Escapes a string
 * @param val
 * @return {*}
 * @private
 */
var _escapeString = function (val, delimiter) {
  /* eslint-disable no-control-regex */
  val = val.replace(/[\0\n\r\b\t\\'"\x1a]/g, function (s) {
    switch (s) {
      case "\0":
        return "\\0";
      case "\n":
        return "\\n";
      case "\r":
        return "\\r";
      case "\b":
        return "\\b";
      case "\t":
        return "\\t";
      case "\x1a":
        return "\\Z";
      case "'":
        // If the string includes a single quote and we are wrapping
        // the string with single quotes, then we need to escape these single quotes.
        if (!delimiter || s == delimiter) {
          return "''";
        }

        // Otherwise, no need to escape single quotes if the string is
        // wrapped by double quotes.
        return s;
      case '"':
        // If the string includes a double quote and we are wrapping
        // the string with double quotes, then we need to escape these double quotes.
        if (!delimiter || s == delimiter) {
          return '""';
        }

        // Otherwise, no need to escape double quotes if the string is
        // wrapped by single quotes.
        return s;
      default:
        return "\\" + s;
    }
  });
  /* eslint-enable no-control-regex */

  return val;
};

exports._escapeString = _escapeString;

/**
 * Replaces '?' with values from an array; also, it performs string escaping.
 * @param sql
 * @param arrValues
 * @param arrDelimiters
 * @return {*}
 * @private
 */
exports._sqlFormat = function (sql, arrValues, arrDelimiters) {
  if (!Array.isArray(arrValues)) {
    arrValues = [arrValues];
  }

  if (!Array.isArray(arrDelimiters)) {
    arrDelimiters = [arrDelimiters];
  }

  const valCount = arrValues.length;
  const delimitersCount = arrDelimiters.length;

  let i = -1;

  return sql.replace(/\?/g, function (match) {
    if (++i == valCount) {
      return match;
    }

    // Get the value for the current placeholder.
    // We iterate via `i` instead of shifting from the front of the
    // array because we do not want to alter the original array
    // received from the application. The application may
    // choose to reuse it in the loop.
    const val = arrValues[i];
    // And its delimiter. If not defined, use single quotes.
    let delimiter = (i >= delimitersCount ? DEFAULT_DELIMITER : arrDelimiters[i]);

    if (val === undefined || val === null) {
      return 'NULL';
    }

    // Send numbers as real numbers. Numbers wrapped in strings
    // are not considered as numbers. They are sent as strings.
    if (typeof val === 'number') {
      return val;
    }

    // Delimiters must be specified as strings.
    if (typeof delimiter !== 'string') {
      delimiter = DEFAULT_DELIMITER;
    }

    // If the value is of Date type, convert it into
    // CUBRID compatible DATETIME format strings.
    if (val instanceof Date) {
      // CUBRID 8.4.1+ supports many formats of DATETIME value.
      // Refer to http://www.cubrid.org/manual/841/en/DATETIME
      // for more information.
      // In the communication between node-cubrid and CUBRID
      // Broker we choose the
      // `'mm/dd[/yyyy] hh:mi[:ss[.ff]] [am|pm]'` format.

      // Month value in JavaScript is 0 based, i.e. 0-11,
      // but CUBRID is 1-12. Also CUBRID doesn't care if
      // dates are zero-padded or not.
      return `${delimiter}${val.getUTCMonth() + 1}/${val.getUTCDate()}/${val.getUTCFullYear()} ${val.getUTCHours()}:${val.getUTCMinutes()}:${val.getUTCSeconds()}.${val.getUTCMilliseconds()}${delimiter}`;
    }

    // Otherwise, safely escape the string.
    return delimiter + _escapeString(val, delimiter) + delimiter;
  });
};

/**
 * Get expected response length from the server
 * @param buffer
 * @return {Number}
 */
exports._getExpectedResponseLength = function (buffer) {
  var value = 0;

  for (var i = 0; i < DATA_TYPES.INT_SIZEOF; i++) {
    value += buffer[i] * Math.pow(256, DATA_TYPES.INT_SIZEOF - i - 1);
  }

  return value + DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE;
};

exports.getBufferFromString = function (str, encoding) {
  if (process.version >= 'v4.5.0') {
    return Buffer.from(str, encoding);
  }
  
  // Older Node versions.
  return new Buffer(str, encoding);
};
