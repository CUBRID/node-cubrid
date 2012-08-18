var DEBUG_ENABLED = require('../Config').DEBUG_ENABLED,
  DATA_TYPES = require('../constants/DataTypes'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

/**
 * String extension
 */
if (typeof String.prototype.startsWith != 'function') {
  // see below for better implementation!
  String.prototype.startsWith = function (str) {
    return this.indexOf(str) == 0;
  };
}

exports.combineData = function (buffer, value) {
  var newBuffer = new Buffer(buffer.length + value.length);

  buffer.copy(newBuffer, 0);
  if (Array.isArray(value)) {
    for (var i = 0; i < value.length; i++) {
      if (typeof  value[i] == 'string') {
        newBuffer[buffer.length + i] = value[i].charCodeAt(0);
      } else {
        newBuffer[buffer.length + i] = value[i];
      }
    }
  } else {
    if (typeof value == 'Buffer') {
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
        var names = ["log", "debug", "info", "warn", "logError", "assert", "dir", "dirxml", "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];
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
exports.getExpectedResponseLength = function (buffer) {
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
exports.resolveErrorCode = function (errorCode) {
  for (var iter = 0; iter < ErrorMessages.CASErrorMsgId.length; iter++) {
    if (errorCode == ErrorMessages.CASErrorMsgId[iter][1]) {
      return ErrorMessages.CASErrorMsgId[iter][0];
    }
  }
};


