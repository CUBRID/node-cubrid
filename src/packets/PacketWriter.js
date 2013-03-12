var DATA_TYPES = require('./../constants/DataTypes'),
  CAS = require('../constants/CASConstants');

module.exports = PacketWriter;

/**
 * Create a new instance
 * @constructor
 */
function PacketWriter() {
  this._buffer = new Buffer(0);
  this._offset = 0;
}

/**
 * Write the current buffer content
 * @return {*}
 */
PacketWriter.prototype._toBuffer = function () {
  return this._buffer.slice(0, this._offset);
};

/**
 * Write a byte value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeByte = function (value) {
  this._allocate(DATA_TYPES.BYTE_SIZEOF);

  this._buffer[this._offset++] = value & 0xFF;
};

/**
 * Write a char value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeChar = function (value) {
  this._allocate(DATA_TYPES.BYTE_SIZEOF);

  this._buffer[this._offset++] = value.charCodeAt(0);
};

/**
 * Write a bytes array to the internal buffer
 * @param bytesCount
 * @param value
 */
PacketWriter.prototype._writeBytes = function (bytesCount, value) {
  this._allocate(bytesCount);

  for (var i = 0; i < bytesCount; i++) {
    this._buffer[this._offset++] = value[i] & 0xFF;
  }
};

/**
 * Write a short value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeShort = function (value) {
  this._allocate(DATA_TYPES.SHORT_SIZEOF);

  this._writeByte((value >> 8) & 0xFF);
  this._writeByte((value >> 0) & 0xFF);
};

/**
 * Write a integer value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeInt = function (value) {
  this._allocate(DATA_TYPES.INT_SIZEOF);

  this._writeByte((value >> 24) & 0xFF);
  this._writeByte((value >> 16) & 0xFF);
  this._writeByte((value >> 8) & 0xFF);
  this._writeByte((value >> 0) & 0xFF);
};

/**
 * Write a Long value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeLong = function (value) {
  var reminder = value % Math.pow(2, 32);
  var quotient = (value - reminder) / Math.pow(2, 32);
  this._writeInt(quotient);
  this._writeInt(reminder);
};

/**
 * Write a Floating point value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeFloat = function (value) {
  this._allocate(DATA_TYPES.FLOAT_SIZEOF);
  this._buffer.writeFloatBE(value, this._offset);
  this._offset += DATA_TYPES.FLOAT_SIZEOF;
};

/**
 * Write a Double precision value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeDouble = function (value) {
  this._allocate(DATA_TYPES.DOUBLE_SIZEOF);
  this._buffer.writeDoubleBE(value, this._offset);
  this._offset += DATA_TYPES.DOUBLE_SIZEOF;
};

/**
 * Write a Numeric value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeNumeric = function (value) {
  this._writeNullTerminatedString(value.toString(10));
};

/**
 * Write the specified value to the internal buffer
 * @param bytesCount
 * @param fillerValue
 */
PacketWriter.prototype._writeFiller = function (bytesCount, fillerValue) {
  var fillerVal;
  this._allocate(bytesCount);

  fillerValue = typeof fillerValue !== 'undefined' ? fillerValue : 0x00;

  if (typeof fillerValue === 'string') {
    fillerVal = fillerValue.charCodeAt(0);
  } else {
    fillerVal = fillerValue & 0xFF;
  }

  for (var i = 0; i < bytesCount; i++) {
    this._buffer[this._offset++] = fillerVal;
  }
};

/**
 * Write a null-terminate string to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeNullTerminatedString = function (value) {
  //Typecast undefined into '' and numbers into strings
  value = value || '';
  value = value + '';

  var stringLengthInBytes = Buffer.byteLength(value);
  var count = DATA_TYPES.INT_SIZEOF + stringLengthInBytes + DATA_TYPES.BYTE_SIZEOF;
  this._allocate(count);

  //Write length
  this._writeInt(stringLengthInBytes + 1);

  this._buffer.write(value, this._offset, stringLengthInBytes);
  this._offset += stringLengthInBytes;

  //Write null-terminate
  this._buffer[this._offset++] = 0;
};

/**
 * Write a fixed-length string to the internal buffer
 * @param value
 * @param fillerValue
 * @param fixedLength
 */
PacketWriter.prototype._writeFixedLengthString = function (value, fillerValue, fixedLength) {
  var fillerVal;
  //Typecast undefined into '' and numbers into strings
  value = value || '';
  value = value + '';

  var count = value.length;
  if (count >= fixedLength) {
    count = fixedLength;
  }

  this._allocate(fixedLength);

  for (var i = 0; i < value.length; i++) {
    this._buffer[this._offset++] = value[i].charCodeAt(0);
  }

  if (typeof fillerValue === 'string') {
    fillerVal = fillerValue.charCodeAt(0);
  } else {
    fillerVal = fillerValue & 0xFF;
  }

  for (var j = 1; j <= fixedLength - count; j++) {
    this._buffer[this._offset++] = fillerVal;
  }
};

/**
 * Write a Date value to the internal buffer
 * @param year
 * @param month
 * @param day
 */
PacketWriter.prototype._writeDate = function (year, month, day) {
  this._allocate(DATA_TYPES.DATETIME_SIZEOF);

  this._writeShort(year);
  this._writeShort(month);
  this._writeShort(day);
  this._writeShort(0);
  this._writeShort(0);
  this._writeShort(0);
  this._writeShort(0);
};

/**
 * Write a DateTime value to the internal buffer
 * @param year
 * @param month
 * @param day
 * @param hour
 * @param min
 * @param sec
 * @param msec
 */
PacketWriter.prototype._writeDateTime = function (year, month, day, hour, min, sec, msec) {
  this._allocate(DATA_TYPES.DATETIME_SIZEOF);

  this._writeShort(year);
  this._writeShort(month);
  this._writeShort(day);
  this._writeShort(hour);
  this._writeShort(min);
  this._writeShort(sec);
  this._writeShort(msec);
};

/**
 * Write a Time value to the internal buffer
 * @param hour
 * @param min
 * @param sec
 */
PacketWriter.prototype._writeTime = function (hour, min, sec) {
  this._allocate(DATA_TYPES.DATETIME_SIZEOF);

  this._writeShort(0);
  this._writeShort(0);
  this._writeShort(0);
  this._writeShort(hour);
  this._writeShort(min);
  this._writeShort(sec);
  this._writeShort(0);
};

/**
 * Write a Timestamp value to the internal buffer
 * @param year
 * @param month
 * @param day
 * @param hour
 * @param min
 * @param sec
 */
PacketWriter.prototype._writeTimestamp = function (year, month, day, hour, min, sec) {
  this._allocate(DATA_TYPES.DATETIME_SIZEOF);

  this._writeShort(year);
  this._writeShort(month);
  this._writeShort(day);
  this._writeShort(hour);
  this._writeShort(min);
  this._writeShort(sec);
  this._writeShort(0);
};

/**
 * Write a Object value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeObject = function (value) {
  this._writeByte(0); //not supported
};

/**
 * Write a Sequence value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeSequence = function (value) {
  this._writeByte(0); //not supported
};

/**
 * Write a ResultSet value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeResultSet = function (value) {
  this._writeByte(0); //not supported
};


/**
 * Write a Blob object value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeBlob = function (value) {
  this._writeInt(value.packedLobHandle.length);
  this._writeInt(CAS.CCILOBType.CCI_LOB_TYPE_BLOB);
  this._writeLong(value.lobLength);
  this._writeNullTerminatedString(value.fileLocator);
};


/**
 * Write a Clob object value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeClob = function (value) {
  this._writeInt(value.packedLobHandle.length);
  this._writeInt(CAS.CCILOBType.CCI_LOB_TYPE_CLOB);
  this._writeLong(value.lobLength);
  this._writeNullTerminatedString(value.fileLocator);
};

/**
 * Write a generic object value to the internal buffer
 * @param value
 */
PacketWriter.prototype._writeBuffer = function (value) {
  var count = value.length;

  this._allocate(count);
  value.copy(this._buffer, this._offset);
  this._offset += count;
};

//TODO Optimize the performance of this function
/**
 * Allocate space to the internal buffer
 * @param count
 * @private
 */
PacketWriter.prototype._allocate = function (count) {
  if (!this._buffer) {
    this._buffer = new Buffer(count);
    return;
  }

  //Verify if we need to allocate more space
  var bytesRemaining = this._buffer.length - this._offset;
  if (bytesRemaining >= count) {
    return;
  }

  var oldBuffer = this._buffer;
  this._buffer = new Buffer(oldBuffer.length + count);
  oldBuffer.copy(this._buffer);
};
