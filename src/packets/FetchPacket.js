var DATA_TYPES = require('../constants/DataTypes'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

module.exports = FetchPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function FetchPacket(options) {
  this.casInfo = options.casInfo;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
}

/**
 * Write data
 * @param writer
 */
FetchPacket.prototype.write = function (writer, queryHandle) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(4, this.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_FETCH);
  writer._writeInt(4); //int sizeof
  writer._writeInt(queryHandle.handle); //serverHandler
  writer._writeInt(4); //int sizeof
  writer._writeInt(queryHandle.currentTupleCount + 1); //Start position (= current cursor position + 1)
  writer._writeInt(4); //int sizeof
  writer._writeInt(100); //Fetch size; 0 = default; recommended = 100
  writer._writeInt(1); //byte sizeof
  writer._writeByte(0); //Is case sensitive
  writer._writeInt(4); //int sizeof
  writer._writeInt(0); //Is the ResultSet index...?

  return writer;
};

/**
 * Read data
 * @param parser
 * @param queryHandle
 */
FetchPacket.prototype.parse = function (parser, queryHandle) {
  var responseLength = parser._parseInt();
  this.casInfo = parser._parseBuffer(4);

  this.responseCode = parser._parseInt();
  if (this.responseCode !== 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(responseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length == 0) {
      for (var iter = 0; iter < ErrorMessages.CASErrorMsgId.length; iter++) {
        if (this.errorCode == ErrorMessages.CASErrorMsgId[iter][1]) {
          this.errorMsg = ErrorMessages.CASErrorMsgId[iter][0];
          break;
        }
      }
    }
  }
  else {
    this.tupleCount = parser._parseInt();
    return JSON.stringify({ColumnValues : queryHandle._getData(parser, this.tupleCount)});
  }
};


