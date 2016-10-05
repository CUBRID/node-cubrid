const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

module.exports = LOBNewPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function LOBNewPacket(options) {
  this.options = options;
}

/**
 * Write data
 * @param writer
 */
LOBNewPacket.prototype.write = function (writer) {
  const options = this.options;

  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(options.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_LOB_NEW);
  writer.addInt(options.lobType);
};

/**
 * Read data
 * @param parser
 */
LOBNewPacket.prototype.parse = function (parser) {
  const responseLength = parser._parseInt();

  // CAS Info.
  parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);
  const responseCode = parser._parseInt();

  if (responseCode < 0) {
    return parser.readError(responseLength);
  }

  const packedLobHandle = parser._parseBytes(responseLength - DATA_TYPES.INT_SIZEOF);
  const fileLocator = packedLobHandle.slice(16, packedLobHandle.length - 1).toString();

  this.result = {
    lobType: this.options.lobType,
    packedLobHandle,
    fileLocator,
    lobLength: 0
  };
};

LOBNewPacket.prototype.getBufferLength = function () {
	const bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
			DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

	return bufferLength;
};
