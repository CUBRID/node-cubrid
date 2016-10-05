const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

module.exports = GetEngineVersionPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function GetEngineVersionPacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;

  this.engineVersion = '';

  this.responseCode = 0;
}

/**
 * Write data
 * @param writer
 */
GetEngineVersionPacket.prototype.write = function (writer) {
  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_GET_DB_VERSION);
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(1); // Auto-commit mode

  return writer;
};

/**
 * Read data
 * @param parser
 */
GetEngineVersionPacket.prototype.parse = function (parser) {
  const responseLength = parser._parseInt();

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);
  this.responseCode = parser._parseInt();

  if (this.responseCode < 0) {
    return parser.readError(responseLength);
  }

  this.engineVersion = parser._parseNullTerminatedString(responseLength - DATA_TYPES.INT_SIZEOF);
};

GetEngineVersionPacket.prototype.getBufferLength = function () {
	var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
			DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF;

	return bufferLength;
};
