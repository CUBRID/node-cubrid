var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

module.exports = SetAutoCommitMode;

/**
 * Constructor
 * @param options
 * @constructor
 */
function SetAutoCommitMode(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.autoCommitMode = options.autoCommitMode;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
}

/**
 * Write data
 * @param writer
 */
SetAutoCommitMode.prototype.write = function (writer) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + 2 * DATA_TYPES.INT_SIZEOF + 2 * DATA_TYPES.INT_SIZEOF;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_SET_DB_PARAMETER);
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(CAS.CCIDbParam.CCI_PARAM_AUTO_COMMIT);
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.autoCommitMode ? 1 : 0);

  return writer;
};

/**
 * Read data
 * @param parser
 */
SetAutoCommitMode.prototype.parse = function (parser) {
  var reponseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(reponseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length == 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  }

  return this;
};

