const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

/**
 * Constructor
 * @param options
 * @constructor
 */
function SetDbParameterPacket(options) {
  this.parameter = options.parameter;
  this.value = options.value;

  this.casInfo = options.casInfo;

  this.responseCode = 0;
}

/**
 * Write data
 * @param writer
 */
SetDbParameterPacket.prototype.write = function (writer) {
  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_SET_DB_PARAMETER);
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.parameter); // Parameter type
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.value); // Parameter value

  return writer;
};

/**
 * Read data
 * @param parser
 */
SetDbParameterPacket.prototype.parse = function (parser) {
  const responseLength = parser._parseInt();

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);
  this.responseCode = parser._parseInt();

  if (this.responseCode < 0) {
    return parser.readError(responseLength);
  }
};

SetDbParameterPacket.prototype.getBufferLength = function () {
  const bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
			DATA_TYPES.BYTE_SIZEOF +
			DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
			DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

	return bufferLength;
};

module.exports = SetDbParameterPacket;
