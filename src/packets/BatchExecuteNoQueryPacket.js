var DATA_TYPES = require('../constants/DataTypes'),
  ErrorMessages = require('../constants/ErrorMessages'),
  CAS = require('../constants/CASConstants');

module.exports = BatchExecuteNoQueryPacket;

function BatchExecuteNoQueryPacket(options) {
  options = options || {};

  this.SQLs = options.SQLs;
  this.casInfo = options.casInfo;
  this.autoCommit = options.autoCommitMode;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';
}

BatchExecuteNoQueryPacket.prototype.write = function (writer) {
  var statementsLength = 0;
  for (var i = 0; i < this.SQLs.length; i++) {
    statementsLength += DATA_TYPES.INT_SIZEOF;
    statementsLength += (this.SQLs[i].length + 1);
  }
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF + statementsLength;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(4, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_EXECUTE_BATCH);
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(this.autoCommit ? 1 : 0); //Autocommit
  for (var j = 0; j < this.SQLs.length; j++) {
    writer._writeNullTerminatedString(this.SQLs[j]);
  }

  return writer;
};

BatchExecuteNoQueryPacket.prototype.parse = function (parser) {
  var reponseLength = parser._parseInt();
  this.casInfo = parser._parseBuffer(4);

  var responseBuffer = parser._parseBuffer(reponseLength);
  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(responseBuffer.length - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length == 0) {
      for (var iter = 0; iter < ErrorMessages.CASErrorMsgId.length; iter++) {
        if (this.errorCode == ErrorMessages.CASErrorMsgId[iter][1]) {
          this.errorMsg = ErrorMessages.CASErrorMsgId[iter][0];
          break;
        }
      }
    }
  }

  return this;
};

