var DEBUG_ENABLED = require('../config').DEBUG_ENABLED,
		DATA_TYPES = require('../constants/DataTypes'),
		ErrorMessages = require('../constants/ErrorMessages'),
		CAS = require('../constants/CASConstants'),
// Default delimiter to wrap character strings in SQL queries.
		DEFAULT_DELIMITER = "'";

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
	  // Emit the event only if somebody is listening.
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
	if (!Array.isArray(arrValues)) {
    arrValues = [arrValues];
	}

	if (!Array.isArray(arrDelimiters)) {
		arrDelimiters = [arrDelimiters];
	}

	var i = -1,
			valCount = arrValues.length,
			delimitersCount = arrDelimiters.length;

	return sql.replace(/\?/g, function (match) {
    if (++i == valCount) {
      return match;
    }

		// Get the value for the current placeholder.
		// We iterate via `i` instead of shifting from the front of the
		// array because we do not want to alter the original array
		// received from the application. The application may
		// choose to reuse it in the loop.
		var val = arrValues[i],
		// And its delimiter. If not defined, use single quotes.
				delimiter = (i >= delimitersCount ? DEFAULT_DELIMITER : arrDelimiters[i]);

		if (val === undefined || val === null) {
		  return 'NULL';
		}

		// Send numbers as real numbers. Numbers wrapped in strings
		// are not considered as numbers. They are sent as strings.
		if (typeof val === 'number') {
		  return val;
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

      return DEFAULT_DELIMITER +
			    // Month value in JavaScript is 0 based, i.e. 0-11,
			    // but CUBRID is 1-12. Also CUBRID doesn't care if
		      // dates are zero-padded or not.
		      (val.getMonth() + 1) + '/' + val.getDate() + '/' + val.getFullYear() +
		      ' ' + val.getHours() + ':' + val.getMinutes() + ':' + val.getSeconds() +
		      '.' + val.getMilliseconds() + DEFAULT_DELIMITER;
    }

		// Delimiters must be specified as strings.
		if (typeof delimiter !== 'string') {
			delimiter = DEFAULT_DELIMITER;
		}

	  // Otherwise, safely escape the string.
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
