const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

module.exports = CloseQueryPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function CloseQueryPacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.reqHandle = options.reqHandle;

  this.responseCode = 0;
}

/**
 * Write data
 * @param writer
 */
CloseQueryPacket.prototype.write = function (writer) {
  var bufferLength = this.getBufferLength();

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_CLOSE_REQ_HANDLE);
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.reqHandle); // Query handle
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(0); // Autocommit mode

  return writer;
};

/**
 * Read data
 * @param parser
 */
CloseQueryPacket.prototype.parse = function (parser) {
  const responseLength = parser._parseInt();

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);
  this.responseCode = parser._parseInt();

  if (this.responseCode < 0) {
    return parser.readError(responseLength);
  }
};

CloseQueryPacket.prototype.getBufferLength = function () {
  const bufferLength =
      // The size of the data to be sent (4-byte integer).
      DATA_TYPES.DATA_LENGTH_SIZEOF +
      // The size of the CAS_INFO data (also 4-byte integer).
      DATA_TYPES.CAS_INFO_SIZE +
      // The code of the CAS function to execute (1-byte integer value).
      // "Close Query" function must be executed, i.e. the function code = `6`.
      DATA_TYPES.BYTE_SIZEOF +
      // The size of the next piece of data which is the ID
      // of the request handler.
      DATA_TYPES.INT_SIZEOF +
      // The actual request handler ID as 4-byte integer.
      DATA_TYPES.INT_SIZEOF +
      // The size of the next piece of data.
      DATA_TYPES.INT_SIZEOF +
      // The value of the autocommit.
      DATA_TYPES.BYTE_SIZEOF;

  return bufferLength;
};
