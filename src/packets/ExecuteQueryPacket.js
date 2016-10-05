'use strict';

const CAS = require('../constants/CASConstants');
const ColumnMetaData = require('../resultset/ColumnMetaData');
const DATA_TYPES = require('../constants/DataTypes');
const ErrorMessages = require('../constants/ErrorMessages');
const ResultInfo = require('../resultset/ResultInfo');

module.exports = ExecuteQueryPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function ExecuteQueryPacket(options) {
  this.options = options;
}

/**
 * Write data
 * @param writer
 */
ExecuteQueryPacket.prototype.write = function (writer) {
  const options = this.options;
  // Set the length of this request. Don't include the first eight bytes
  // (`DATA_LENGTH_SIZEOF` and `CAS_INFO_SIZE`) because they are not
  // part of the query data.
  writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  // `this.casInfo` is already a buffer. Just write them as bytes.
  writer._writeBytes(options.casInfo);

  // Then tell which CAS function should CAS execute.
  // TODO: Shouldn't CAS function by an integer of four bytes?
  // Why write only one byte?
  writer._writeByte(options.protocolVersion === /* CUBRID v9.0.0 */2 ? CAS.CASFunctionCode900.CAS_FC_PREPARE_AND_EXECUTE : CAS.CASFunctionCode.CAS_FC_PREPARE_AND_EXECUTE);

  // Next, write how many arguments should the CAS
  // function accept. `CAS_FC_PREPARE_AND_EXECUTE`
  // accepts `3` arguments.
  writer.addInt(3);

  // Now goes the SQL query.
  writer._writeNullTerminatedString(options.sql);

  // The type of prepare CAS has to execute.
  writer.addByte(CAS.CCIPrepareOption.CCI_PREPARE_NORMAL);

  // Autocommit mode.
  writer.addByte(options.autoCommit ? 1 : 0);

  // Execute info.

  // Execute flag.
  writer.addByte(CAS.CCIExecutionOption.CCI_EXEC_QUERY_ALL);

  // `max_col_size`: The maximum length of a column in bytes to be fetched
  // when it is a string data type. If this value is 0, full length is fetched.
  writer.addInt(0);

  // Max row size.
  writer.addInt(0);

  // NULL.
  writer._writeInt(0);

  // Write cache time
  writer._writeInt(2 * DATA_TYPES.INT_SIZEOF);
  // Seconds.
  writer._writeInt(0);
  // Milliseconds.
  writer._writeInt(0);

  // Query timeout.
  writer.addInt(0);

  return writer;
};

/**
 * Read data
 * @param parser
 */
ExecuteQueryPacket.prototype.parse = function (parser) {
  const options = this.options;
  const responseLength = parser._parseInt();
  const logger = options.logger;

  logger.debug(`ExecuteQueryPacket.parse: responseLength = ${responseLength}.`);

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();

  if (this.responseCode < 0) {
    return parser.readError(responseLength);
  }

  this.queryHandle = this.responseCode;
  this.resultCacheLifetime = parser._parseInt(); // Cache lifetime
  this.statementType = parser._parseByte(); // Statement type

  logger.debug(`ExecuteQueryPacket.parse: statementType = ${this.statementType}`);

  this.bindCount = parser._parseInt(); // Bind count
  this.isUpdatable = (parser._parseByte() === 0); // Is updatable?
  this.columnCount = parser._parseInt(); // Query result columns count
  this.infoArray = [];

  let i;
  let info;
  let len;

  for (i = 0; i < this.columnCount; i++) {
    info = new ColumnMetaData();
    info.ColumnType = parser._parseByte(); // Column type
    info.scale = parser._parseShort(); // Scale
    info.precision = parser._parseInt(); // Precision
    len = parser._parseInt();
    info.Name = parser._parseNullTerminatedString(len); // Column name
    len = parser._parseInt();
    info.RealName = parser._parseNullTerminatedString(len); // Column real name
    len = parser._parseInt();
    info.TableName = parser._parseNullTerminatedString(len); // Table name
    info.IsNullable = (parser._parseByte() === 1); // Is nullable?
    len = parser._parseInt();
    info.DafaultValue = parser._parseNullTerminatedString(len); // Default value
    info.IsAutoIncrement = (parser._parseByte() === 1); // Is auto increment?
    info.IsUniqueKey = (parser._parseByte() === 1); // Is unuque key?
    info.IsPrimaryKey = (parser._parseByte() === 1); // Is primary key?
    info.IsReverseIndex = (parser._parseByte() === 1); // Reserve index?
    info.IsReverseUnique = (parser._parseByte() === 1); // Reserve unique?
    info.IsForeignKey = (parser._parseByte() === 1); // Is foreign key?
    info.IsShared = (parser._parseByte() === 1); // Shared?
    this.infoArray[i] = info;
  }

  logger.debug('ExecuteQueryPacket.parse: infoArray =', this.infoArray);

  // Tuples count.
  this.totalTupleCount = parser._parseInt();
  // Is cache reusable.
  parser._parseByte();
  // Results count.
  this.resultCount = parser._parseInt();

  logger.debug('ExecuteQueryPacket.parse: totalTupleCount =', this.totalTupleCount);
  logger.debug('ExecuteQueryPacket.parse: resultCount =', this.resultCount);

  // Read result info.
  let resultInfo;

  this.resultInfos = [];

  for (i = 0; i < this.resultCount; ++i) {
    resultInfo = new ResultInfo();
    resultInfo.StmtType = parser._parseByte(); // Statement type
    resultInfo.ResultCount = parser._parseInt(); // Result count
    resultInfo.Oid = parser._parseBytes(DATA_TYPES.OID_SIZEOF); // OID
    resultInfo.CacheTimeSec = parser._parseInt(); // Cache time seconds
    resultInfo.CacheTimeUsec = parser._parseInt(); // Cache time milliseconds

    logger.debug(`ExecuteQueryPacket.parse: resultInfo (${i}) =`, resultInfo);

    this.resultInfos.push(resultInfo);
  }

  if (options.protocolVersion > 1) {
    let includesColumnInfo = parser._parseByte();

    logger.debug(`ExecuteQueryPacket.parse: include_column_info = ${includesColumnInfo}`);

    if (options.protocolVersion > 4) {
      let shardID = parser._parseInt();

      logger.debug(`ExecuteQueryPacket.parse: shardID = ${shardID}`);
    }
  }

  if (this.statementType === CAS.CUBRIDStatementType.CUBRID_STMT_SELECT) {
    const fetchCode = parser._parseInt(); // Fetch code
    this.tupleCount = parser._parseInt(); // Tuple count
    this.currentTupleCount = 0;

    logger.debug(`ExecuteQueryPacket.parse: fetchCode = ${fetchCode}; tupleCount = ${this.tupleCount}`);

    let columnNames = new Array(this.columnCount);
    let columnDataTypes = new Array(this.columnCount);

    for (let i = 0; i < this.columnCount; i++) {
      columnNames[i] = this.infoArray[i].Name;
      columnDataTypes[i] = CAS.getCUBRIDDataTypeName(this.infoArray[i].ColumnType);
    }

    logger.debug('ExecuteQueryPacket.parse: columnNames =', columnNames);
    logger.debug('ExecuteQueryPacket.parse: columnDataTypes =', columnDataTypes);

    let columnValues = this.getValues(parser, this.tupleCount);

    logger.debug('ExecuteQueryPacket.parse: columnValues =', columnValues);

    this.resultSet = {
      ColumnDataTypes: columnDataTypes,
      ColumnNames: columnNames,
      ColumnValues: columnValues,
      RowsCount: this.totalTupleCount,
    };
  }
};

/**
 * Get records data from stream
 * @param parser
 * @param tupleCount
 */
ExecuteQueryPacket.prototype.getValues = function (parser, tupleCount) {
  let columnValues = new Array(tupleCount);

  const columns = this.infoArray;
  const columnCount = this.columnCount;
  const statementType = this.statementType;

  const CUBRID_STMT_CALL = CAS.CUBRIDStatementType.CUBRID_STMT_CALL;
  const CUBRID_STMT_EVALUATE = CAS.CUBRIDStatementType.CUBRID_STMT_EVALUATE;
  const CUBRID_STMT_CALL_SP = CAS.CUBRIDStatementType.CUBRID_STMT_CALL_SP;

  // Loop through rows.
  for (let i = 0; i < tupleCount; ++i) {
    // Column index. We don't need it at this moment.
    parser._parseInt();

    // OID. We don't need it now.
    parser._parseBytes(DATA_TYPES.OID_SIZEOF);

    let column = columnValues[i] = new Array(columnCount);

    // Loop through columns in this row.
    for (let j = 0; j < columnCount; ++j) {
      // Value size.
      let size = parser._parseInt();

      if (size > 0) {
        let type;

        if (statementType === CUBRID_STMT_CALL ||
            statementType === CUBRID_STMT_EVALUATE ||
            statementType === CUBRID_STMT_CALL_SP ||
            columns[j].ColumnType === CAS.CUBRIDDataType.CCI_U_TYPE_NULL) {
          // Column data type
          type = parser._parseByte();
          --size;
        } else {
          type = columns[j].ColumnType;
        }

        // Read the actual value depending on its type and size.
        column[j] = _readValue.call(this, parser, type, size);
      } else {
        column[j] = null;
      }
    }
  }

  this.currentTupleCount += tupleCount;

  return columnValues;
};

/**
 * Read column value from stream
 * @param parser
 * @param type
 * @param size
 */
function _readValue(parser, type, size) {
  switch (type) {
    case CAS.CUBRIDDataType.CCI_U_TYPE_CHAR:
    case CAS.CUBRIDDataType.CCI_U_TYPE_NCHAR:
    case CAS.CUBRIDDataType.CCI_U_TYPE_STRING:
    case CAS.CUBRIDDataType.CCI_U_TYPE_VARNCHAR:
    case CAS.CUBRIDDataType.CCI_U_TYPE_ENUM:
      return parser._parseNullTerminatedString(size);

    case CAS.CUBRIDDataType.CCI_U_TYPE_SHORT:
      return parser._parseShort();

    case CAS.CUBRIDDataType.CCI_U_TYPE_INT:
      return parser._parseInt();

    case CAS.CUBRIDDataType.CCI_U_TYPE_BIGINT:
      return parser._parseLong();

    case CAS.CUBRIDDataType.CCI_U_TYPE_FLOAT:
      return parser._parseFloat();

    case CAS.CUBRIDDataType.CCI_U_TYPE_DOUBLE:
    case CAS.CUBRIDDataType.CCI_U_TYPE_MONETARY:
      return parser._parseDouble();

    case CAS.CUBRIDDataType.CCI_U_TYPE_NUMERIC:
      return parser._parseNumeric(size);

    case CAS.CUBRIDDataType.CCI_U_TYPE_DATE:
      return parser._parseDate();

    case CAS.CUBRIDDataType.CCI_U_TYPE_TIME:
      return parser._parseTime();

    case CAS.CUBRIDDataType.CCI_U_TYPE_DATETIME:
      return parser._parseDateTime();

    case CAS.CUBRIDDataType.CCI_U_TYPE_TIMESTAMP:
      return parser._parseTimeStamp();

    case CAS.CUBRIDDataType.CCI_U_TYPE_OBJECT:
      return parser._parseObject();

    case CAS.CUBRIDDataType.CCI_U_TYPE_BIT:
    case CAS.CUBRIDDataType.CCI_U_TYPE_VARBIT:
      return parser._parseBytes(size);

    case CAS.CUBRIDDataType.CCI_U_TYPE_SET:
    case CAS.CUBRIDDataType.CCI_U_TYPE_MULTISET:
    case CAS.CUBRIDDataType.CCI_U_TYPE_SEQUENCE:
      return parser._parseSequence();

    case CAS.CUBRIDDataType.CCI_U_TYPE_BLOB:
      return parser.readBlob(size);

    case CAS.CUBRIDDataType.CCI_U_TYPE_CLOB:
      return parser.readClob(size);

    case CAS.CUBRIDDataType.CCI_U_TYPE_RESULTSET:
      return parser._parseResultSet();

    case CAS.CUBRIDDataType.CCI_U_TYPE_NULL:
      return null;

    default:
      return new Error(`${type}: ${ErrorMessages.ERROR_INVALID_DATA_TYPE}`);
  }
}

ExecuteQueryPacket.prototype.getBufferLength = function () {
  let bufferLength = // Total length of the request without itself and CAS info.
      DATA_TYPES.DATA_LENGTH_SIZEOF +
      // CAS info.
      DATA_TYPES.CAS_INFO_SIZE +
      // CAS function.
      DATA_TYPES.BYTE_SIZEOF +
      // The length of the next part.
      DATA_TYPES.INT_SIZEOF +
      // CAS arguments.
      DATA_TYPES.INT_SIZEOF +
      // The length of the next part.
      DATA_TYPES.INT_SIZEOF +
      // A NULL terminated SQL query string.
      Buffer.byteLength(this.options.sql) + 1 +
      // The length of the next part.
      DATA_TYPES.INT_SIZEOF +
      // The type of CCI prepare.
      DATA_TYPES.BYTE_SIZEOF +
      // The length of the next part.
      DATA_TYPES.INT_SIZEOF +
      // Autocommit mode
      DATA_TYPES.BYTE_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.BYTE_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF;

  return bufferLength;
};
