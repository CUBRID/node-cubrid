var DATA_TYPES = require('./../constants/DataTypes'),
  CAS = require('../constants/CASConstants');

module.exports = PacketReader;

/**
 * PacketReader
 * @constructor
 */
function PacketReader() {
  this._buffer = null;
  this._offset = 0;
}

/**
 * Write a buffer value to the internal buffer
 * @param buffer
 */
PacketReader.prototype.write = function (buffer) {
  this._append(buffer);
};

//TODO Optimize the performance of this function
/**
 * Append a buffer value to the internal buffer
 * @param newBuffer
 */
PacketReader.prototype._append = function (newBuffer) {
  var oldBuffer = this._buffer;

  if (!oldBuffer) {
    this._buffer = newBuffer;
    return;
  }

  var bytesRemaining = this._bytesRemaining();
  var newLength = bytesRemaining + newBuffer.length;

  var combinedBuffer = (this._offset > newLength) ? oldBuffer.slice(0, newLength) : new Buffer(newLength);

  oldBuffer.copy(combinedBuffer, 0, this._offset);
  newBuffer.copy(combinedBuffer, bytesRemaining);

  this._buffer = combinedBuffer;
  this._offset = 0;
};

/**
 * Returns an short value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseShort = function () {
  var value = 0;

  for (var i = DATA_TYPES.SHORT_SIZEOF - 1; i >= 0; i--) {
    value += this._buffer[this._offset++] * Math.pow(256, i);
  }

  if (value & 0x8000) {
    return value - 0xFFFF - 1;
  } else {
    return value;
  }
};

/**
 * Returns an integer value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseInt = function () {
  var value = 0;

  for (var i = DATA_TYPES.INT_SIZEOF - 1; i >= 0; i--) {
    value += this._buffer[this._offset++] * Math.pow(256, i);
  }

  if (value & 0x80000000) {
    return value - 0xFFFFFFFF - 1;
  } else {
    return value;
  }
};

/**
 * Returns a byte value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseByte = function () {
  return this._buffer[this._offset++];
};

/**
 * Returns a bytes array from the internal buffer
 * @param bytesCount
 * @return {Array}
 */
PacketReader.prototype._parseBytes = function (bytesCount) {
  var buffer = this._buffer.slice(this._offset, this._offset + bytesCount);

  this._offset += bytesCount;

  return buffer;
};

/**
 * Returns a buffer object from the internal buffer
 * @param bytesCount
 * @return {*}
 */
PacketReader.prototype._parseBuffer = function (bytesCount) {
  var buffer = this._buffer.slice(this._offset, this._offset + bytesCount);

  this._offset += bytesCount;

  return buffer;
};

/**
 * Returns a string value from the internal buffer
 * @param bytesCount
 * @return {Buffer}
 */
PacketReader.prototype._parseString = function (bytesCount) {
  if (bytesCount <= 0) {
    return '';
  }

  var start = this._offset;
  var end = start + bytesCount;
  var buffer = this._buffer.slice(start, end);

  var value = '';
  for (var i = 0; i < buffer.length; i++) {
    value += String.fromCharCode(buffer[i]);
  }

  this._offset = end;

  return value;
};

/**
 * Returns a string value from the internal buffer
 * @return {String}
 */
PacketReader.prototype._parseNullTerminatedString = function (length) {
  if (length <= 0) {
    return '';
  }

  var valueLen = length - 1; //get the actual null-terminated string length
  var buffer = this._buffer.slice(this._offset, this._offset + valueLen);
  var value = buffer.toString();

  this._offset += valueLen;
  this._parseByte(); //read also the null-terminate

  return value;
};

/**
 * Returns a date value from the internal buffer
 * @return {Date}
 */
PacketReader.prototype._parseDate = function () {
  var year = this._parseShort();
  var month = this._parseShort() - 1;
  var day = this._parseShort();
  var hour = 0;
  var min = 0;
  var sec = 0;
  var msec = 0;

  var date = new Date();
  date.setUTCFullYear(year, month, day);
  date.setUTCHours(hour, min, sec, msec);
  return date;
};

/**
 * Returns a datetime value from the internal buffer
 * @return {Date}
 */
PacketReader.prototype._parseDateTime = function () {
  var year = this._parseShort();
  var month = this._parseShort() - 1;
  var day = this._parseShort();
  var hour = this._parseShort();
  var min = this._parseShort();
  var sec = this._parseShort();
  var msec = this._parseShort();

  var date = new Date();
  date.setUTCFullYear(year, month, day);
  date.setUTCHours(hour, min, sec, msec);
  return date;
};

/**
 * Returns a time value from the internal buffer
 * @return {Date}
 */
PacketReader.prototype._parseTime = function () {
  var year = 0;
  var month = 0;
  var day = 0;
  var hour = this._parseShort();
  var min = this._parseShort();
  var sec = this._parseShort();
  var msec = 0;

  var date = new Date(year, month, day, hour, min, sec, msec);
  date.setUTCHours(hour, min, sec, msec);
  return date;
};

/**
 * Returns a timestamp value from the internal buffer
 * @return {Date}
 */
PacketReader.prototype._parseTimeStamp = function () {
  var year = this._parseShort();
  var month = this._parseShort() - 1;
  var day = this._parseShort();
  var hour = this._parseShort();
  var min = this._parseShort();
  var sec = this._parseShort();
  var msec = 0;

  var date = new Date();
  date.setUTCFullYear(year, month, day);
  date.setUTCHours(hour, min, sec, msec);
  return date;
};

/**
 * Returns a char value from the internal buffer
 * @return {String}
 */
PacketReader.prototype._parseChar = function () {
  var val = this._parseByte();

  return String.fromCharCode(val);
};

/**
 * Returns a Long value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseLong = function () {
  var value = 0;

  for (var i = DATA_TYPES.LONG_SIZEOF - 1; i >= 0; i--) {
    value += this._buffer[this._offset++] * Math.pow(256, i);
  }

  if (value & 0x8000000000000000) {
    return value - 0xFFFFFFFFFFFFFFFF - 1;
  } else {
    return value;
  }
};

/**
 * Returns a double value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseDouble = function () {
  var value = this._buffer.readDoubleBE(this._offset);
  this._offset += DATA_TYPES.DOUBLE_SIZEOF;
  return value;
};

/**
 * Returns a floating point value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseFloat = function () {
  var value = this._buffer.readFloatBE(this._offset);
  this._offset += DATA_TYPES.FLOAT_SIZEOF;
  return value;
};

/**
 * Returns a Numeric value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseNumeric = function (size) {
  return parseFloat(this._parseNullTerminatedString(size));
};

/**
 * Returns a Object value from the internal buffer
 * @return {String}
 */
PacketReader.prototype._parseObject = function () {
  return 'OID:@' + this._parseInt() + '|' + this._parseShort() + '|' + this._parseShort();
};

/**
 * Returns a BLOB object from the internal buffer
 * @return {Object}
 */
PacketReader.prototype._parseBlob = function (size) {
  var packedLobHandle = this._parseBytes(size);
  var lobSizeBuffer = packedLobHandle.slice(DATA_TYPES.INT_SIZEOF, DATA_TYPES.INT_SIZEOF + DATA_TYPES.LONG_SIZEOF);
  var lobSize = 0;

  for (var i = DATA_TYPES.LONG_SIZEOF - 1; i >= 0; i--) {
    lobSize += lobSizeBuffer[DATA_TYPES.LONG_SIZEOF - i - 1] * Math.pow(256, i);
  }
  var fileLocator = packedLobHandle.slice(16, packedLobHandle.length - 1).toString();

  return {
    lobType         : CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, //BLOB type
    packedLobHandle : packedLobHandle,
    fileLocator     : fileLocator,
    lobLength       : lobSize
  };
};

/**
 * Returns a CLOB object from the internal buffer
 * @return {Object}
 */
PacketReader.prototype._parseClob = function (size) {
  var packedLobHandle = this._parseBytes(size);
  var lobSizeBuffer = packedLobHandle.slice(DATA_TYPES.INT_SIZEOF, DATA_TYPES.INT_SIZEOF + DATA_TYPES.LONG_SIZEOF);
  var lobSize = 0;

  for (var i = DATA_TYPES.LONG_SIZEOF - 1; i >= 0; i--) {
    lobSize += lobSizeBuffer[DATA_TYPES.LONG_SIZEOF - i - 1] * Math.pow(256, i);
  }
  var fileLocator = packedLobHandle.slice(16, packedLobHandle.length - 1).toString();

  return {
    lobType         : CAS.CUBRIDDataType.CCI_U_TYPE_CLOB, //CLOB type
    packedLobHandle : packedLobHandle,
    fileLocator     : fileLocator,
    lobLength       : lobSize
  };
};

/**
 * Returns a sequence of values from the internal buffer
 * @return {Array}
 */
PacketReader.prototype._parseSequence = function () {
  var count = this._parseInt();
  var size = this._parseInt();
  this._offset += count * size;

  return null; //Not supported
};

/**
 * Returns a ResultSet from the internal buffer
 * @return {String}
 */
PacketReader.prototype._parseResultSet = function () {
  this._offset += DATA_TYPES.RESULTSET_SIZEOF;

  return null; //Not supported
};

/**
 * Return the number of bytes remaining unparsed/unread in the buffer
 * @return {Number}
 */
PacketReader.prototype._bytesRemaining = function () {
  return this._buffer.length - this._offset;
};

/**
 * Return the internal buffer length
 * @return {Number}
 */
PacketReader.prototype._packetLength = function () {
  return this._buffer.length;
};

