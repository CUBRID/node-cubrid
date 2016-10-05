const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

/**
 * Constructor
 * @param options
 * @constructor
 */
function CommitPacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  
  this.responseCode = 0;
}

/**
 * Write data
 * @param writer
 */
CommitPacket.prototype.write = function (writer) {
  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_END_TRAN);
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(CAS.CCITransactionType.CCI_TRAN_COMMIT); // Commit transaction

  return writer;
};

/**
 * Read data
 * @param parser
 */
CommitPacket.prototype.parse = function (parser) {
  const responseLength = parser._parseInt();

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);
  this.responseCode = parser._parseInt();

  if (this.responseCode < 0) {
    return parser.readError(responseLength);
  }
};

CommitPacket.prototype.getBufferLength = function () {
	const bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
			DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF;

	return bufferLength;
};

module.exports = CommitPacket;
