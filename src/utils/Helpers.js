var DEBUG_ENABLED = require('../Config').DEBUG_ENABLED,
  DATA_TYPES = require('../constants/DataTypes'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

/**
 * Emit event only if there are registered listeners for the event
 * @param obj
 * @param successEvent
 * @param arg1
 * @param arg2
 * @param arg3
 * @private
 */
function _emitSafeEvent(obj, successEvent, arg1, arg2, arg3) {
  if (obj.listeners(successEvent).length > 0) {
    if (typeof arg1 !== 'undefined' && typeof arg2 !== 'undefined' && typeof arg3 !== 'undefined') {
      obj.emit(successEvent, arg1, arg2, arg3);
    } else {
      if (typeof arg1 !== 'undefined' && typeof arg2 !== 'undefined') {
        obj.emit(successEvent, arg1, arg2);
      } else {
        if (typeof arg1 !== 'undefined') {
          obj.emit(successEvent, arg1);
        } else {
          obj.emit(successEvent);
        }
      }
    }
  }
}

/**
 * Emit ERROR event or success event
 * @param obj
 * @param err
 * @param errorEvent
 * @param successEvent
 * @param arg1
 * @param arg2
 * @param arg3
 * @private
 */
exports._emitEvent = function (obj, err, errorEvent, successEvent, arg1, arg2, arg3) {
  if (typeof err !== 'undefined' && err !== null) {
    if (obj.listeners(errorEvent).length > 0) {
      obj.emit(errorEvent, err);
    }
  } else {
    _emitSafeEvent(obj, successEvent, arg1, arg2, arg3);
  }
};

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
 * Validate if the value is a strict positive "number" input
 * @param val
 * @return {Boolean}
 */
exports._validateInputStrictPositive = function (val) {
  if (typeof val === 'undefined' || val === null || !(typeof val === 'number' && val > 0)) {
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
var _escapeString = function (val) {
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
      case "\'":
        return "''";
      case "\"":
        return '""';
      default:
        return "\\" + s;
    }
  });

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
  arrValues = [].concat(arrValues);
  if (arrDelimiters.length !== 0) {
    arrDelimiters = [].concat(arrDelimiters);
  } else {
    arrDelimiters = [];

    for (var i = arrValues.length; i > 0; --i) {
      arrDelimiters.push("'");
    }
  }

  return sql.replace(/\?/g, function (match) {
    if (!arrValues.length) {
      return match;
    }

    var val = arrValues.shift();
    var delimiter = arrDelimiters.shift();

    if (val === undefined || val === null) {
      return 'NULL';
    }

    if (!isNaN(parseFloat(val)) && isFinite(val) && delimiter !== "'" && delimiter !== '"') {
      return val + '';
    }

    return delimiter + _escapeString(val) + delimiter;
  });
};

/**
 * Verifies if a string starts with the specified value
 */
if (typeof String.prototype.startsWith !== 'function') {
  String.prototype.startsWith = function (str) {
    return this.indexOf(str) === 0;
  };
}

/**
 * Appends two buffers data into a new buffer
 * @param buffer
 * @param value
 * @return {Buffer}
 * @private
 */
exports._combineData = function (buffer, value) {
  var newBuffer = new Buffer(buffer.length + value.length);

  buffer.copy(newBuffer, 0);
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      if (typeof  value[i] === 'string') {
        newBuffer[buffer.length + i] = value[i].charCodeAt(0);
      } else {
        newBuffer[buffer.length + i] = value[i];
      }
    }
  } else {
    if (typeof value === 'Buffer') {
      value.copy(newBuffer, buffer.length);
    } else {
      new Buffer(value).copy(newBuffer, buffer.length);
    }
  }

  return newBuffer;
};

/**
 * Overrides the console output
 * Logs data to the standard console output
 * @param data
 */
exports.logInfo = function logInfo(data) {
  if (DEBUG_ENABLED) {
    if (typeof window !== 'undefined') {
      if (!("console" in window) || !("firebug" in console)) {
        var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml", "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
        window.console = {};
        for (var i = 0, len = names.length; i < len; ++i) {
          window.console[names[i]] = function () {
          };
        }
      }
    }

    console.warn(data);
  }
};

/**
 * Overrides the console output
 * Logs data to the standard console output
 * @param data
 */
exports.logError = function logError(data) {
  if (DEBUG_ENABLED) {
    if (typeof window != 'undefined') {
      if (!("console" in window) || !("firebug" in console)) {
        var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml", "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
        window.console = {};
        for (var i = 0, len = names.length; i < len; ++i) {
          window.console[names[i]] = function () {
          };
        }
      }
    }

    console.error(data);
  }
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

/**
 * Try to resolve the error code to a CUBRID error message
 * @param errorCode
 * @return {*}
 */
exports._resolveErrorCode = function (errorCode) {
  for (var i = 0; i < ErrorMessages.CASErrorMsgId.length; i++) {
    if (errorCode === ErrorMessages.CASErrorMsgId[i][1]) {
      return ErrorMessages.CASErrorMsgId[i][0];
    }
  }
};
