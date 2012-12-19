var DATA_TYPES = require('../constants/DataTypes'),
  ErrorMessages = require('../constants/ErrorMessages'),
  Helpers = require('../utils/Helpers.js'),
  CAS = require('../constants/CASConstants');

module.exports = CloseQueryPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function CloseQueryPacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.reqHandle = options.reqHandle;
  this.dbVersion = options.dbVersion;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
}

/**
 * Write data
 * @param writer
 */
CloseQueryPacket.prototype.write = function (writer) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_CLOSE_REQ_HANDLE);
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.reqHandle);
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(0); //autocommit mode

  return writer;
};

/**
 * Read data
 * @param parser
 */
CloseQueryPacket.prototype.parse = function (parser) {
  var reponseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(reponseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length === 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  }

  return this;
};

