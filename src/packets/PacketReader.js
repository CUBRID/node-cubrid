'use strict';

const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');
const ErrorMessages = require('../constants/ErrorMessages');

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
 * Read an error code and message from the internal buffer.
 * @param responseLength
 */
PacketReader.prototype.readError = function (responseLength) {
  let error = new Error();

  error.code = this._parseInt();
  error.message = this._parseNullTerminatedString(responseLength - 2 * DATA_TYPES.INT_SIZEOF);

  if (!error.message.length) {
    error.message = ErrorMessages.resolveErrorCode(error.code);
  }

  return error;
};

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
  let oldBuffer = this._buffer;

  if (!oldBuffer) {
    this._buffer = newBuffer;
    return;
  }

  let bytesRemaining = this._bytesRemaining();
  let newLength = bytesRemaining + newBuffer.length;

  let combinedBuffer = (this._offset > newLength) ? oldBuffer.slice(0, newLength) : new Buffer(newLength);

  oldBuffer.copy(combinedBuffer, 0, this._offset);
  newBuffer.copy(combinedBuffer, bytesRemaining);

  this._buffer = combinedBuffer;
  this._offset = 0;
};

function parseNum(length) {
  let value = 0;
  let i = this._offset;
  const b = this._buffer;
  const endIndex = i + length;

  for (; i < endIndex; ++i) {
    value <<= 8;
    value |= (b[i] & 0xff);
  }

  this._offset = endIndex;

  return value;
}

/**
 * Returns an short value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseShort = function () {
  return parseNum.call(this, DATA_TYPES.SHORT_SIZEOF);
};

/**
 * Returns an integer value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseInt = function () {
  return parseNum.call(this, DATA_TYPES.INT_SIZEOF);
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
  const buffer = this._buffer.slice(this._offset, this._offset + bytesCount);

  this._offset += bytesCount;

  return buffer;
};

/**
 * Returns a buffer object from the internal buffer
 * @param bytesCount
 * @return {*}
 */
PacketReader.prototype._parseBuffer = function (bytesCount) {
  let buffer = this._buffer.slice(this._offset, this._offset + bytesCount);

  this._offset += bytesCount;

  return buffer;
};

/**
 * Returns a string value from the internal buffer
 * @return {String}
 */
PacketReader.prototype._parseNullTerminatedString = function (length) {
  if (length <= 0) {
    return '';
  }

  let valueLen = length - 1; // Get the actual null-terminated string length
  let buffer = this._buffer.slice(this._offset, this._offset + valueLen);
  let value = buffer.toString();

  this._offset += valueLen;
  this._parseByte(); // Read also the null-terminate

  return value;
};

/**
 * Returns a date value from the internal buffer
 * @return {Date}
 */
PacketReader.prototype._parseDate = function () {
  const year = this._parseShort();
  // `month` in `Date` is zero based where `0` represents January.
  const month = this._parseShort() - 1;
  const day = this._parseShort();
  const hour = 0;
  const min = 0;
  const sec = 0;
  const msec = 0;

  let date = new Date();

  date.setUTCFullYear(year, month, day);
  date.setUTCHours(hour, min, sec, msec);

  return date;
};

/**
 * Returns a datetime value from the internal buffer
 * @return {Date}
 */
PacketReader.prototype._parseDateTime = function () {
  const year = this._parseShort();
  // `month` in `Date` is zero based where `0` represents January.
  const month = this._parseShort() - 1;
  const day = this._parseShort();
  const hour = this._parseShort();
  const min = this._parseShort();
  const sec = this._parseShort();
  const msec = this._parseShort();

  let date = new Date();

  date.setUTCFullYear(year, month, day);
  date.setUTCHours(hour, min, sec, msec);

  return date;
};

/**
 * Returns a time value from the internal buffer
 * @return {Date}
 */
PacketReader.prototype._parseTime = function () {
  const hour = this._parseShort();
  const min = this._parseShort();
  const sec = this._parseShort();

  let date = new Date();

  // `January 1, 1970` is the beginning of the Unix Epoch.
  // When `TIME` data is returned by CUBRID, we receive
  // only the time part of the date, so, the date is set
  // to the beginning of the epoch.
  date.setUTCFullYear(1970, 0, 1);
  date.setUTCHours(hour, min, sec, 0);

  return date;
};

/**
 * Returns a timestamp value from the internal buffer
 * @return {Date}
 */
PacketReader.prototype._parseTimeStamp = function () {
  const year = this._parseShort();
  const month = this._parseShort() - 1;
  const day = this._parseShort();
  const hour = this._parseShort();
  const min = this._parseShort();
  const sec = this._parseShort();
  const msec = 0;

  let date = new Date();

  date.setUTCFullYear(year, month, day);
  date.setUTCHours(hour, min, sec, msec);

  return date;
};

/**
 * Returns a char value from the internal buffer
 * @return {String}
 */
PacketReader.prototype._parseChar = function () {
  return String.fromCharCode(this._parseByte());
};

/**
 * Returns a Long value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseLong = function () {
  return parseNum.call(this, DATA_TYPES.LONG_SIZEOF);
};

/**
 * Returns a double value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseDouble = function () {
  let value = this._buffer.readDoubleBE(this._offset);

  this._offset += DATA_TYPES.DOUBLE_SIZEOF;

  return value;
};

/**
 * Returns a floating point value from the internal buffer
 * @return {Number}
 */
PacketReader.prototype._parseFloat = function () {
  let value = this._buffer.readFloatBE(this._offset);

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
 * Returns a LOB object from the internal buffer
 * @return {Object}
 */
function readLob(size) {
  /*
  * |----4 bytes----|----8 bytes----|----4 bytes----|---------------------locator size bytes-------------------|
  * |    db_type    |   LOB size   | locator size  | the absolute file path on the server where LOB is stored |
  * |---------------|---------------|---------------|----------------------------------------------------------|
  *
  * */
  const packedLobHandle = this._parseBytes(size);
  let lobLength = 0;
  let locatorSize = 0;
  // Skip the first 4 bytes which are the `db_type`.
  let start = DATA_TYPES.INT_SIZEOF;
  // BLOB size is represented as a long 64bit integer.
  let end = DATA_TYPES.INT_SIZEOF + DATA_TYPES.LONG_SIZEOF;

  for (; start < end; ++start) {
    lobLength <<= 8;
    lobLength |= (packedLobHandle[start] & 0xff);
  }

  for (end += DATA_TYPES.INT_SIZEOF; start < end; ++start) {
    locatorSize <<= 8;
    locatorSize |= (packedLobHandle[start] & 0xff);
  }

  let fileLocator = packedLobHandle.toString('utf8', start, start + locatorSize - 1);

  return {
    fileLocator,
    lobLength,
    packedLobHandle,
  };
}

/**
 * Returns a BLOB object from the internal buffer
 * @return {Object}
 */
PacketReader.prototype.readBlob = function (size) {
  let lob = readLob.call(this, size);
  lob.lobType = CAS.CUBRIDDataType.CCI_U_TYPE_BLOB;

  return lob;
};

/**
 * Returns a CLOB object from the internal buffer
 * @return {Object}
 */
PacketReader.prototype.readClob = function (size) {
  let lob = readLob.call(this, size);
  lob.lobType = CAS.CUBRIDDataType.CCI_U_TYPE_CLOB;

  return lob;
};

/**
 * Returns a sequence of values from the internal buffer
 * @return {Array}
 */
PacketReader.prototype._parseSequence = function () {
  let count = this._parseInt();
  let size = this._parseInt();
  this._offset += count * size;

  return null; // Not supported
};

/**
 * Returns a ResultSet from the internal buffer
 * @return {String}
 */
PacketReader.prototype._parseResultSet = function () {
  this._offset += DATA_TYPES.RESULTSET_SIZEOF;

  return null; // Not supported
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

