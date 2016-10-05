const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

/**
 * Constructor
 * @param options
 * @constructor
 */
function SetAutoCommitModePacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.autoCommitMode = options.autoCommitMode;
  
  this.responseCode = 0;
}

/**
 * Write data
 * @param writer
 */
SetAutoCommitModePacket.prototype.write = function (writer) {
  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(this.casInfo);
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
  const responseLength = parser._parseInt();
  
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);
  this.responseCode = parser._parseInt();
  
  if (this.responseCode < 0) {
    return parser.readError(responseLength);
  }
};

SetAutoCommitModePacket.prototype.getBufferLength = function () {
	const bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
			DATA_TYPES.BYTE_SIZEOF + 2 * DATA_TYPES.INT_SIZEOF + 2 * DATA_TYPES.INT_SIZEOF;

	return bufferLength;
};

module.exports = SetAutoCommitModePacket;
