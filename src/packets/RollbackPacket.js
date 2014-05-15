var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

module.exports = RollbackPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function RollbackPacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.dbVersion = options.dbVersion;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
}

/**
 * Write data
 * @param writer
 */
RollbackPacket.prototype.write = function (writer) {
  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_END_TRAN);
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(CAS.CCITransactionType.CCI_TRAN_ROLLBACK); // Rollback transaction

  return writer;
};

/**
 * Read data
 * @param parser
 */
RollbackPacket.prototype.parse = function (parser) {
  var responseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(responseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length === 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  }

  return this;
};

RollbackPacket.prototype.getBufferLength = function () {
	var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
			DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF;

	return bufferLength;
};
