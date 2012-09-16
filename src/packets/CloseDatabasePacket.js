var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

module.exports = CloseDatabasePacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function CloseDatabasePacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
}

/**
 * Write data
 * @param writer
 */
CloseDatabasePacket.prototype.write = function (writer) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_CON_CLOSE);

  return writer;
};

/**
 * Read data
 * @param parser
 */
CloseDatabasePacket.prototype.parse = function (parser) {
  var reponseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  var responseBuffer = parser._parseBuffer(reponseLength);
  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(responseBuffer.length - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length == 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  }

  return this;
};

