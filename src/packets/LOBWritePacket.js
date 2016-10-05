const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

module.exports = LOBWritePacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function LOBWritePacket(options) {
  this.options = options;
}

/**
 * Write data
 * @param writer
 */
LOBWritePacket.prototype.write = function (writer) {
  const options = this.options;
  const lobObject = options.lobObject;

  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(options.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_LOB_WRITE);
  writer.addBytes(lobObject.packedLobHandle);
  // Offset from which to write data.
  writer.addLong(options.offset);

  // `data` is always a buffer. The `client` already converts
  // CLOB into a Buffer object.
  writer.addBytes(options.data);

  return writer;
};

/**
 * Read data
 * @param parser
 */
LOBWritePacket.prototype.parse = function (parser) {
  const responseLength = parser._parseInt();

  // CAS Info.
  parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);
  const responseCode = parser._parseInt();
  
  if (responseCode < 0) {
    return parser.readError(responseLength);
  } 

  this.bytesWritten = responseCode;
};

LOBWritePacket.prototype.getBufferLength = function () {
  const options = this.options;

	const bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
			DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + options.lobObject.packedLobHandle.length +
			DATA_TYPES.INT_SIZEOF + DATA_TYPES.LONG_SIZEOF + DATA_TYPES.INT_SIZEOF + options.data.length;

	return bufferLength;
};
