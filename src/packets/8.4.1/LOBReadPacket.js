var DATA_TYPES = require('../../constants/DataTypes'),
  Helpers = require('../../utils/Helpers'),
  ErrorMessages = require('../../constants/ErrorMessages'),
  CAS = require('../../constants/CASConstants');

module.exports = LOBReadPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function LOBReadPacket(options) {
  this.casInfo = options.casInfo;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
  this.lobBuffer = '';
  this.lobHandle = '';
}

/**
 * Write data
 * @param writer
 * @param lobHandle
 * @param offset
 * @param len
 */
LOBReadPacket.prototype.write = function (writer, lobHandle, offset, len) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + lobHandle.packedLobHandle.length +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.LONG_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

  this.lobHandle = lobHandle;
  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_LOB_READ);
  writer._writeInt(lobHandle.packedLobHandle.length); //LOB handle size
  writer._writeBytes(lobHandle.packedLobHandle.length, lobHandle.packedLobHandle); //LOB handle
  writer._writeInt(DATA_TYPES.LONG_SIZEOF);
  writer._writeLong(offset); //ofset
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(len); //number of bytes to read

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
    if (this.errorMsg.length == 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  } else {
    if (this.lobHandle.lobType == CAS.CUBRIDDataType.CCI_U_TYPE_BLOB) {
      this.lobBuffer = parser._parseBytes(this.responseCode);
    } else {
      this.lobBuffer = parser._parseString(this.responseCode);
    }
    return this.responseCode;
  }
};


