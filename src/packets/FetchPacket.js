var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

module.exports = FetchPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function FetchPacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.dbVersion = options.dbVersion;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
  this.resultSet = ''; // ResultSet of the fetch
}

/**
 * Write data
 * @param writer
 * @param queryPacket
 */
FetchPacket.prototype.write = function (writer, queryPacket) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_FETCH);
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(queryPacket.queryHandle); // Query handle
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(queryPacket.currentTupleCount + 1); // Start position (= current cursor position + 1)
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(100); // Fetch size; 0 = default; recommended = 100
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(0); // Is case sensitive
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(0); // Is the ResultSet index...?

  return writer;
};

/**
 * Read data
 * @param parser
 * @param queryPacket
 */
FetchPacket.prototype.parse = function (parser, queryPacket) {
  var responseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();
  if (this.responseCode !== 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(responseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length === 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  } else {
    this.tupleCount = parser._parseInt();
    this.resultSet = JSON.stringify({ColumnValues : queryPacket._getData(parser, this.tupleCount)});
  }

  return this;
};


