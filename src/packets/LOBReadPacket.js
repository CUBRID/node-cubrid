var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

module.exports = LOBReadPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function LOBReadPacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.lobObject = options.lobObject;
  this.position = options.position;
  this.lengthToRead = options.lengthToRead;
  this.dbVersion = options.dbVersion;

  this.lobBuffer = null;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
  this.readLength = 0;
}

/**
 * Write data
 * @param writer
 */
LOBReadPacket.prototype.write = function (writer) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + this.lobObject.packedLobHandle.length +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.LONG_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_LOB_READ);
  writer._writeInt(this.lobObject.packedLobHandle.length); // LOB handle size
  writer._writeBytes(this.lobObject.packedLobHandle.length, this.lobObject.packedLobHandle); // LOB handle
  writer._writeInt(DATA_TYPES.LONG_SIZEOF);
  writer._writeLong(this.position); // Start position from witch to read
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.lengthToRead); // Number of bytes to read

  return writer;
};

/**
 * Read data
 * @param parser
 */
LOBReadPacket.prototype.parse = function (parser) {
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
    if (this.lobObject.lobType === CAS.CUBRIDDataType.CCI_U_TYPE_BLOB) {
      this.lobBuffer = new Buffer(this.responseCode);
      this.lobBuffer = parser._parseBytes(this.responseCode);
    } else {
      if (this.lobObject.lobType === CAS.CUBRIDDataType.CCI_U_TYPE_CLOB) {
        this.lobBuffer = parser._parseString(this.responseCode);
      } else {
        Helpers.logInfo(ErrorMessages.ERROR_INVALID_LOB_TYPE); // Log non-blocking error
      }
    }
    this.readLength = this.responseCode;
  }

  return this;
};


