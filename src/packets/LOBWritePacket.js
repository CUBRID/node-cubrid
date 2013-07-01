var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

module.exports = LOBWritePacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function LOBWritePacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.lobObject = options.lobObject;
  this.position = options.position;
  this.data = options.data;
  this.writeLen = options.writeLen;
  this.dbVersion = options.dbVersion;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
  this.wroteLength = 0;
}

/**
 * Write data
 * @param writer
 */
LOBWritePacket.prototype.write = function (writer) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + this.lobObject.packedLobHandle.length +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.LONG_SIZEOF + DATA_TYPES.INT_SIZEOF + this.writeLen;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_LOB_WRITE);
  writer._writeInt(this.lobObject.packedLobHandle.length); // Length of the packedLobHandle
  writer._writeBytes(this.lobObject.packedLobHandle.length, this.lobObject.packedLobHandle); // LOB handle
  writer._writeInt(DATA_TYPES.LONG_SIZEOF);
  writer._writeLong(this.position); // Start position from witch to write data
  writer._writeInt(this.writeLen); // Length of data to be written
  if (this.lobObject.lobType === CAS.CUBRIDDataType.CCI_U_TYPE_BLOB) {
    writer._writeBytes(this.writeLen, this.data);
  } else {
    if (this.lobObject.lobType === CAS.CUBRIDDataType.CCI_U_TYPE_CLOB) {
      var dataInBytes = new Buffer(this.data, 'binary'); // Convert clob string to bytes
      writer._writeBytes(this.writeLen, dataInBytes);
    }
  }

  return writer;
};

/**
 * Read data
 * @param parser
 */
LOBWritePacket.prototype.parse = function (parser) {
  var responseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(responseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length === 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  } else {
    this.wroteLength = this.responseCode;
  }

  return this;
};


