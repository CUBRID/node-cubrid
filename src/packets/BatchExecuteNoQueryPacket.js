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
  this.dbVersion = options.dbVersion;

  this.responseCode = 0;
  this.errorCode = 0;
  this.errorMsg = '';

  this.arrResultsCode = [];
  this.arrResultsMsg = [];
}

/**
 * Write data
 * @param writer
 */
BatchExecuteNoQueryPacket.prototype.write = function (writer) {
  var statementsLength = 0;
  for (var i = 0; i < this.SQLs.length; i++) {
    statementsLength += DATA_TYPES.INT_SIZEOF;
    statementsLength += (Buffer.byteLength(this.SQLs[i]) + 1);
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
  var errCode = 0;
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(reponseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length === 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  } else {
    this.executedCount = parser._parseInt();
    for (var i = 0; i < this.executedCount; i++) {
      parser._parseByte(); //not used
      var result = parser._parseInt();
      if (result < 0) {
        if (this.dbVersion.startsWith('8.4.3')) {
          errCode = parser._parseInt();
        }
        var errMsgLength = parser._parseInt();
        var errMsg = parser._parseNullTerminatedString(errMsgLength);
        if (this.dbVersion.startsWith('8.4.3')) {
          this.arrResultsCode.push(errCode);
        } else {
          this.arrResultsCode.push(result);
        }
        this.arrResultsMsg.push(errMsg);
      } else {
        this.arrResultsCode.push(result);
        this.arrResultsMsg.push('');
        parser._parseInt(); //not used
        parser._parseShort(); //not used
        parser._parseShort(); //not used
      }
    }
  }

  return this;
};

