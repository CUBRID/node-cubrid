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
  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_EXECUTE_BATCH);
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(this.autoCommit ? 1 : 0); // Auto-commit mode value

  // For every sql statement in the batch
  for (var j = 0; j < this.SQLs.length; j++) {
    writer._writeNullTerminatedString(this.SQLs[j]); // SQL strings to be executed
  }

  return writer;
};

/**
 * Read data
 * @param parser
 */
BatchExecuteNoQueryPacket.prototype.parse = function (parser) {
  var responseLength = parser._parseInt(),
      errCode = 0;

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();

  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(responseLength - 2 * DATA_TYPES.INT_SIZEOF);

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
          this.arrResultsCode.push(errCode);
        } else {
          this.arrResultsCode.push(result);
        }

        var errMsgLength = parser._parseInt(),
            errMsg = parser._parseNullTerminatedString(errMsgLength);

        this.arrResultsMsg.push(errMsg);
      } else {
        this.arrResultsCode.push(result);
        this.arrResultsMsg.push('');

        parser._parseInt(); // Not used
        parser._parseShort(); // Not used
        parser._parseShort(); // Not used
      }
    }
  }

  return this;
};

BatchExecuteNoQueryPacket.prototype.getBufferLength = function () {
  var bufferLength =
      DATA_TYPES.DATA_LENGTH_SIZEOF +
      DATA_TYPES.CAS_INFO_SIZE +
      DATA_TYPES.BYTE_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.BYTE_SIZEOF +
      // The length of all queries.
      DATA_TYPES.INT_SIZEOF * this.SQLs.length +
      // The number of NULL terminating characters: one for each query.
      this.SQLs.length;

  for (var i = 0; i < this.SQLs.length; ++i) {
    bufferLength += Buffer.byteLength(this.SQLs[i]);
  }

  return bufferLength;
};
