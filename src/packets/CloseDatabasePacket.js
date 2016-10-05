const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

module.exports = CloseDatabasePacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function CloseDatabasePacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;

  this.responseCode = 0;
}

/**
 * Write data
 * @param writer
 */
CloseDatabasePacket.prototype.write = function (writer) {
  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_CON_CLOSE);

  return writer;
};

/**
 * Read data
 * @param parser
 */
CloseDatabasePacket.prototype.parse = function (parser) {
  const responseLength = parser._parseInt();

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);
  this.responseCode = parser._parseInt();

  if (this.responseCode < 0) {
    return parser.readError(responseLength);
  }
};

CloseDatabasePacket.prototype.getBufferLength = function () {
  const bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
      DATA_TYPES.BYTE_SIZEOF;

  return bufferLength;
};
