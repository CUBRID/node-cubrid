var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  CAS = require('../constants/CASConstants');

module.exports = BatchExecuteNoQueryPacket;

/**
 * Constructor
 * @constructor
 */
function BatchExecuteNoQueryPacket(options) {
  options = options || {};

  this.SQLs = options.SQLs;
  this.casInfo = options.casInfo;
  this.autoCommit = options.autoCommitMode;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
}

/**
 * Write data
 * @param writer
 */
BatchExecuteNoQueryPacket.prototype.write = function (writer) {
  var statementsLength = 0;
  for (var i = 0; i < this.SQLs.length; i++) {
    statementsLength += DATA_TYPES.INT_SIZEOF;
    statementsLength += (this.SQLs[i].length + 1);
  }
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF + statementsLength;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_EXECUTE_BATCH);
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(this.autoCommit ? 1 : 0); //Autocommit
  for (var j = 0; j < this.SQLs.length; j++) {
    writer._writeNullTerminatedString(this.SQLs[j]);
  }

  return writer;
};

/**
 * Read data
 * @param parser
 */
BatchExecuteNoQueryPacket.prototype.parse = function (parser) {
  var reponseLength = parser._parseInt();
  this.casInfo = parser._parseBuffer(DATA_TYPES.CAS_INFO_SIZE);

  var responseBuffer = parser._parseBuffer(reponseLength);
  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(responseBuffer.length - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length == 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  }

  return this;
};

