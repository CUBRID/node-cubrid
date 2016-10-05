const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

/**
 * Constructor
 * @param options
 * @constructor
 */
function LOBReadPacket(options) {
  this.options = options;
}

/**
 * Write data
 * @param writer
 */
LOBReadPacket.prototype.write = function (writer) {
  const options = this.options;
  const lobObject = options.lobObject;
  
  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(options.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_LOB_READ);
  writer.addBytes(lobObject.packedLobHandle); // LOB handle
  writer.addLong(options.offset); // Start offset from witch to read
  writer.addInt(options.bytesToRead); // Number of bytes to read
};

/**
 * Read data
 * @param parser
 */
LOBReadPacket.prototype.parse = function (parser) {
  const responseLength = parser._parseInt();

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);
  const responseCode = parser._parseInt();

  if (responseCode < 0) {
    return parser.readError(responseLength);
  }

  this.readLength = responseCode;

  this.lobBuffer = parser._parseBytes(this.readLength);
};

LOBReadPacket.prototype.getBufferLength = function () {
	const bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
			DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + this.options.lobObject.packedLobHandle.length +
			DATA_TYPES.INT_SIZEOF + DATA_TYPES.LONG_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

	return bufferLength;
};

module.exports = LOBReadPacket;
