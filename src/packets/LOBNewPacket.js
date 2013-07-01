var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

module.exports = LOBNewPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function LOBNewPacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.lobType = options.lobType;
  this.dbVersion = options.dbVersion;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
  this.packedLobHandle = '';
  this.fileLocator = '';
  this.result = null;
}

/**
 * Write data
 * @param writer
 */
LOBNewPacket.prototype.write = function (writer) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_LOB_NEW);
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.lobType); // LOB type

  return writer;
};

/**
 * Read data
 * @param parser
 */
LOBNewPacket.prototype.parse = function (parser) {
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
    this.packedLobHandle = parser._parseBytes(responseLength - DATA_TYPES.INT_SIZEOF); // LOB handle
    this.fileLocator = this.packedLobHandle.slice(16, this.packedLobHandle.length - 1).toString();
  }
  this.result =  {
    lobType         : this.lobType,
    packedLobHandle : this.packedLobHandle,
    fileLocator     : this.fileLocator,
    lobLength       : 0
  };

  return this;
};

