var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

module.exports = SetAutoCommitModePacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function SetAutoCommitModePacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.autoCommitMode = options.autoCommitMode;
  this.dbVersion = options.dbVersion;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
}

/**
 * Write data
 * @param writer
 */
SetAutoCommitModePacket.prototype.write = function (writer) {
  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_SET_DB_PARAMETER);
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(CAS.CCIDbParam.CCI_PARAM_AUTO_COMMIT); // Parameter type auto-commit mode
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.autoCommitMode ? 1 : 0); // Parameter value

  return writer;
};

/**
 * Read data
 * @param parser
 */
SetAutoCommitModePacket.prototype.parse = function (parser) {
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

SetAutoCommitModePacket.prototype.getBufferLength = function () {
	var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
			DATA_TYPES.BYTE_SIZEOF + 2 * DATA_TYPES.INT_SIZEOF + 2 * DATA_TYPES.INT_SIZEOF;

	return bufferLength;
};
