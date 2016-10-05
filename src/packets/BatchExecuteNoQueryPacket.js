'use strict';

const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');

/**
 * Constructor
 * @constructor
 */
function BatchExecuteNoQueryPacket(options) {
  this.options = options;

  typeof options.timeout === 'undefined' && (options.timeout = 0);
}

/**
 * Write data
 * @param writer
 */
BatchExecuteNoQueryPacket.prototype.write = function (writer) {
  const options = this.options;
  const logger = options.logger;

  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(options.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_EXECUTE_BATCH);
  writer.addByte(options.autoCommit ? 1 : 0);

  logger.debug(`BatchExecuteNoQueryPacket.parse: autoCommit = ${options.autoCommit}.`);

  if (options.protocolVersion > 3) {
    writer.addInt(options.timeout);
  }

  // Write every sql statement in the batch.
  for (let i = 0, sqls = options.sqls, len = sqls.length; i < len; ++i) {
    writer._writeNullTerminatedString(sqls[i]);
  }

  return writer;
};

/**
 * Read data
 * @param parser
 */
BatchExecuteNoQueryPacket.prototype.parse = function (parser) {
  const options = this.options;
  const logger = options.logger;
  const responseLength = parser._parseInt();

  logger.debug(`BatchExecuteNoQueryPacket.parse: responseLength = ${responseLength}.`);

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();

  if (this.responseCode < 0) {
    // CUBRID Broker/CAS error has occurred, not an SQL error.
    // In such a case, CAS returns only the error code.
    // We have a mapping to the actual error message here.

    return parser.readError(responseLength);
  }

  this.executedCount = parser._parseInt();
  this.errors = [];
  this.results = [];

  for (let i = 0; i < this.executedCount; ++i) {
    // Statement Type: one of `CUBRIDStatementType`. Not used.
    parser._parseByte();
    let result = parser._parseInt();

    if (result < 0) {
      // An SQL error has occurred. CAS sends the actual
      // error message.
      let error = new Error();

      if (options.protocolVersion > 2) {
        error.code = parser._parseInt();
      } else {
        error.code = result;
      }

      error.message = parser._parseNullTerminatedString(/* error message length */ parser._parseInt());

      this.errors.push(error);
    } else {
      // The number of changes.
      this.results.push(result);

      parser._parseInt(); // Not used
      parser._parseShort(); // Not used
      parser._parseShort(); // Not used
    }
  }

  if (options.protocolVersion > 4) {
    this.lastShardId = parser._parseInt();
  }
};

BatchExecuteNoQueryPacket.prototype.getBufferLength = function () {
  const options = this.options;
  const sqls = options.sqls;
  const len = sqls.length;

  let bufferLength =
      DATA_TYPES.DATA_LENGTH_SIZEOF +
      DATA_TYPES.CAS_INFO_SIZE +
      DATA_TYPES.BYTE_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.BYTE_SIZEOF +
      (options.protocolVersion > 3 ? DATA_TYPES.INT_SIZEOF * 2 : 0) +
      // The length of all queries.
      DATA_TYPES.INT_SIZEOF * len +
      // The number of NULL terminating characters: one for each query.
      len;

  for (let i = 0; i < len; ++i) {
    bufferLength += Buffer.byteLength(sqls[i]);
  }

  return bufferLength;
};

module.exports = BatchExecuteNoQueryPacket;
