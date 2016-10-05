'use strict';

const CAS = require('../constants/CASConstants');
const DATA_TYPES = require('../constants/DataTypes');
const ErrorMessages = require('../constants/ErrorMessages');
const ColumnMetaData = require('../resultset/ColumnMetaData');
const ResultInfo = require('../resultset/ResultInfo');

/**
 * Constructor
 * @param options
 * @constructor
 */
function PrepareExecutePacket(options) {
  this.options = options;
}

/**
 * Write prepare data
 * @param writer
 */
PrepareExecutePacket.prototype.writePrepare = function (writer) {
  const options = this.options;

  writer._writeInt(this.getPrepareBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(options.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_PREPARE);
  writer._writeNullTerminatedString(options.sql);
  writer.addByte(CAS.CCIPrepareOption.CCI_PREPARE_NORMAL);
  writer.addByte(options.autoCommit ? 1 : 0);

  return writer;
};

/**
 * Write execute data
 * @param writer
 */
PrepareExecutePacket.prototype.writeExecute = function (writer) {
  const bufferLength = this.getExecuteBufferLength();
  const options = this.options;

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(options.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_EXECUTE);

  writer.addInt(this.queryHandle);
  writer.addByte(CAS.CCIExecutionOption.CCI_EXEC_NORMAL); // Execute flag
  writer.addInt(0); // Max col size;
  writer.addInt(0); // Max row size;
  writer.addNull(); // NULL
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);

  // FetchFlag;
  if (this.statementType === CAS.CUBRIDStatementType.CUBRID_STMT_SELECT) {
    writer._writeByte(1);
  } else {
    writer._writeByte(0);
  }

  writer.addByte(options.autoCommit ? 1 : 0); // Autocommit mode
  writer.addByte(1); // Forward only cursor
  writer.addCacheTime(); // Write cache time

  writer.addInt(0); // Query timeout

  if (options.paramValues) {
    this._writeParamValue(writer);
  }

  return writer;
};

/**
 * Read prepare data
 * @param parser
 */
PrepareExecutePacket.prototype.parsePrepare = function (parser) {
  const responseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();

  if (this.responseCode < 0) {
    return parser.readError(responseLength);
  }

  this.queryHandle = this.responseCode; // Query handle
  this.resultCacheLifetime = parser._parseInt(); // Cache lifetime
  this.statementType = parser._parseByte(); // Statement type
  this.bindCount = parser._parseInt(); // Bind count
  this.isUpdatable = parser._parseByte() === 1; // Updatable?
  this.columnCount = parser._parseInt(); // Column count
  this.infoArray = [];

  for (let i = 0; i < this.columnCount; ++i) {
    let info = new ColumnMetaData();

    info.ColumnType = parser._parseByte(); // Column type
    info.scale = parser._parseShort(); // Scale
    info.precision = parser._parseInt(); // Precision

    let len = parser._parseInt();

    info.Name = parser._parseNullTerminatedString(len); // Column name
    len = parser._parseInt();
    info.RealName = parser._parseNullTerminatedString(len); // Column real name
    len = parser._parseInt();
    info.TableName = parser._parseNullTerminatedString(len); // Table name
    info.IsNullable = (parser._parseByte() === 1); // Nullable?
    len = parser._parseInt();
    info.DafaultValue = parser._parseNullTerminatedString(len); // Default value
    info.IsAutoIncrement = (parser._parseByte() === 1); // Auto-increment?
    info.IsUniqueKey = (parser._parseByte() === 1); // Unique key?
    info.IsPrimaryKey = (parser._parseByte() === 1); // Primary key?
    info.IsReverseIndex = (parser._parseByte() === 1); // Reserved key index
    info.IsReverseUnique = (parser._parseByte() === 1); // Reverse unique?
    info.IsForeignKey = (parser._parseByte() === 1); // Foreign key?
    info.IsShared = (parser._parseByte() === 1); // Shared?

    this.infoArray.push(info);
  }
};

/**
 * Read execute data
 * @param parser
 */
PrepareExecutePacket.prototype.parseExecute = function (parser) {
  const options = this.options;
  const responseLength = parser._parseInt();

  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();

  if (this.responseCode < 0) {
    return parser.readError(responseLength);
  }

  this.totalTupleCount = this.responseCode;
  // Cache reusable.
  parser._parseByte();
  // Number of results executed.
  this.resultCount = parser._parseInt();
  this.resultInfos = [];

  // Read result info.
  for (let i = 0; i < this.resultCount; i++) {
    let resultInfo = new ResultInfo();

    resultInfo.StmtType = parser._parseByte(); // Statement type
    resultInfo.ResultCount = parser._parseInt(); // Result count

    resultInfo.Oid = parser._parseBytes(DATA_TYPES.OID_SIZEOF); // OID

    resultInfo.CacheTimeSec = parser._parseInt(); // Cache time seconds
    resultInfo.CacheTimeUsec = parser._parseInt(); // Cache time milliseconds

    this.resultInfos.push(resultInfo);
  }

  if (options.protocolVersion > 1) {
    // include_column_info
    if (parser._parseByte() === 1) {
      // TODO: this part of the code should process a specific case that is not used in node-cubrid.
    }
  }

  if (options.protocolVersion > 4) {
    this.shardId = parser._parseInt();
  }

  if (this.statementType === CAS.CUBRIDStatementType.CUBRID_STMT_SELECT) {
    // Fetch code.
    parser._parseInt();
    this.tupleCount = parser._parseInt(); // Tuple count
    this.currentTupleCount = 0; // Current number of returned tuples

    let columnNames = new Array(this.columnCount);
    let columnDataTypes = new Array(this.columnCount);

    for (let i = 0; i < this.columnCount; i++) {
      columnNames[i] = this.infoArray[i].Name;
      columnDataTypes[i] = CAS.getCUBRIDDataTypeName(this.infoArray[i].ColumnType);
    }

    let columnValues = this.getValues(parser, this.tupleCount);

    this.resultSet = {
      ColumnNames     : columnNames,
      ColumnDataTypes : columnDataTypes,
      RowsCount       : this.totalTupleCount,
      ColumnValues    : columnValues
    };
  }
};

/**
 * Get records data from stream
 * @param parser
 * @param tupleCount
 */
PrepareExecutePacket.prototype.getValues = function (parser, tupleCount) {
  let columnValues = new Array(tupleCount);
  const columns = this.infoArray;
  const columnCount = this.columnCount;
  const statementType = this.statementType;

  const CUBRID_STMT_CALL = CAS.CUBRIDStatementType.CUBRID_STMT_CALL;
  const CUBRID_STMT_EVALUATE = CAS.CUBRIDStatementType.CUBRID_STMT_EVALUATE;
  const CUBRID_STMT_CALL_SP = CAS.CUBRIDStatementType.CUBRID_STMT_CALL_SP;

  for (let i = 0; i < tupleCount; i++) {
    // Index of the column.
    parser._parseInt();
    // OID
    parser._parseBytes(DATA_TYPES.OID_SIZEOF);

    let column = columnValues[i] = new Array(columnCount);

    for (let j = 0; j < columnCount; j++) {
      let size = parser._parseInt();

      if (size > 0) {
        let type;

        if (statementType === CUBRID_STMT_CALL ||
            statementType === CUBRID_STMT_EVALUATE ||
            statementType === CUBRID_STMT_CALL_SP ||
            columns[j].ColumnType === CAS.CUBRIDDataType.CCI_U_TYPE_NULL) {
          type = parser._parseByte();
          size--;
        } else {
          type = columns[j].ColumnType;
        }

        column[j] = this._readValue(j, type, size, parser);
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
 * @param index
 * @param type
 * @param size
 * @param parser
 */
PrepareExecutePacket.prototype._readValue = function (index, type, size, parser) {
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

    default:
      return new Error(`${type}: ${ErrorMessages.ERROR_INVALID_DATA_TYPE}`);
  }
};

/**
 * Write parameter value to stream
 * @param value
 * @param type
 * @param writer
 */
PrepareExecutePacket.prototype._writeParamValue = function (writer) {
  const options = this.options;

  for (let i = 0, l = options.paramValues.length; i < l; ++i) {
    const value = options.paramValues[i];
    const paramType = CAS.getCUBRIDDataTypeNumber(options.paramTypes[i]);

    writer.addByte(paramType);

    switch (paramType) {
      case CAS.CUBRIDDataType.CCI_U_TYPE_CHAR:
      case CAS.CUBRIDDataType.CCI_U_TYPE_NCHAR:
      case CAS.CUBRIDDataType.CCI_U_TYPE_STRING:
      case CAS.CUBRIDDataType.CCI_U_TYPE_VARNCHAR:
      case CAS.CUBRIDDataType.CCI_U_TYPE_ENUM:
        writer._writeNullTerminatedString(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_SHORT:
        writer.addShort(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_INT:
        writer.addInt(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_BIGINT:
        writer.addLong(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_FLOAT:
        writer.addFloat(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_DOUBLE:
      case CAS.CUBRIDDataType.CCI_U_TYPE_MONETARY:
        writer.addDouble(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_NUMERIC:
        writer._writeNumeric(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_DATE:
        writer.addDate(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_TIME:
        writer.addTime(value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds());
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_DATETIME:
        writer.addDateTime(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(),
            value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds(), value.getUTCMilliseconds());
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_TIMESTAMP:
        writer.addTimestamp(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(),
            value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds());
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_OBJECT:
        writer._writeInt(0);
        writer._writeObject(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_BIT:
      case CAS.CUBRIDDataType.CCI_U_TYPE_VARBIT:
        writer.addBytes(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_SET:
      case CAS.CUBRIDDataType.CCI_U_TYPE_MULTISET:
      case CAS.CUBRIDDataType.CCI_U_TYPE_SEQUENCE:
        writer._writeInt(0);
        writer._writeSequence(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_BLOB:
        writer._writeBlob(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_CLOB:
        writer._writeClob(value);
        break;

      case CAS.CUBRIDDataType.CCI_U_TYPE_RESULTSET:
        writer._writeInt(DATA_TYPES.RESULTSET_SIZEOF);
        writer._writeResultSet(value);
        break;

      default:
        return new Error(`${paramType}: ${ErrorMessages.ERROR_INVALID_DATA_TYPE}`);
    }
  }
};

PrepareExecutePacket.prototype.getPrepareBufferLength = function () {
  const bufferLength =
      DATA_TYPES.DATA_LENGTH_SIZEOF +
      DATA_TYPES.CAS_INFO_SIZE +
      DATA_TYPES.BYTE_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      Buffer.byteLength(this.options.sql) + 1 +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.BYTE_SIZEOF +
      DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.BYTE_SIZEOF;

  return bufferLength;
};

PrepareExecutePacket.prototype.getExecuteBufferLength = function () {
  const bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
      DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
      DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF +
      this._getParamValuesBufferLength();

  return bufferLength;
};

PrepareExecutePacket.prototype._getParamValuesBufferLength = function () {
  const options = this.options;

  let paramValuesBufferLength = 0;

  if (options.paramValues) {
    for (let i = options.paramValues.length - 1; i > -1; --i) {
      const value = options.paramValues[i];
      const paramType = CAS.getCUBRIDDataTypeNumber(options.paramTypes[i]);

      // First, determine the size of the param type.
      paramValuesBufferLength +=
          // The length of the data type.
          DATA_TYPES.INT_SIZEOF +
          // The size of the value.
          DATA_TYPES.BYTE_SIZEOF;

      switch (paramType) {
        case CAS.CUBRIDDataType.CCI_U_TYPE_CHAR:
        case CAS.CUBRIDDataType.CCI_U_TYPE_NCHAR:
        case CAS.CUBRIDDataType.CCI_U_TYPE_STRING:
        case CAS.CUBRIDDataType.CCI_U_TYPE_VARNCHAR:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The bytes length of the value.
              Buffer.byteLength(value) +
              // null character size.
              DATA_TYPES.BYTE_SIZEOF;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_SHORT:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The size of the value.
              DATA_TYPES.SHORT_SIZEOF;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_INT:
          paramValuesBufferLength +=
              // The length of this part +
              // the size of the value.
              DATA_TYPES.INT_SIZEOF * 2;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_BIGINT:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The size of the value.
              DATA_TYPES.LONG_SIZEOF;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_FLOAT:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The size of the value.
              DATA_TYPES.FLOAT_SIZEOF;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_DOUBLE:
        case CAS.CUBRIDDataType.CCI_U_TYPE_MONETARY:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The size of the value.
              DATA_TYPES.DOUBLE_SIZEOF;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_NUMERIC:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The bytes length of the numeric value.
              // See `_writeNumeric`.
              Buffer.byteLength(value.toString(10)) +
              // null character size.
              DATA_TYPES.BYTE_SIZEOF;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_DATE:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The size of the data type value.
              DATA_TYPES.DATE_SIZEOF;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_TIME:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The size of the value.
              DATA_TYPES.TIME_SIZEOF;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_DATETIME:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The size of the value.
              DATA_TYPES.DATETIME_SIZEOF;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_TIMESTAMP:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The size of the value.
              DATA_TYPES.TIMESTAMP_SIZEOF;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_OBJECT:
        case CAS.CUBRIDDataType.CCI_U_TYPE_SET:
        case CAS.CUBRIDDataType.CCI_U_TYPE_MULTISET:
        case CAS.CUBRIDDataType.CCI_U_TYPE_SEQUENCE:
        case CAS.CUBRIDDataType.CCI_U_TYPE_RESULTSET:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The size of the value.
              // `_writeObject`, `_writeSequence`, `_writeResultSet`
              // are not supported yet but still we send the
              // `0` byte.
              DATA_TYPES.BYTE_SIZEOF;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_BIT:
        case CAS.CUBRIDDataType.CCI_U_TYPE_VARBIT:
          paramValuesBufferLength +=
              // The length of this part.
              DATA_TYPES.INT_SIZEOF +
              // The size of the value.
              value.length;
          break;

        case CAS.CUBRIDDataType.CCI_U_TYPE_BLOB:
        case CAS.CUBRIDDataType.CCI_U_TYPE_CLOB:
          paramValuesBufferLength +=
              // The length of this part +
              // the type of the value.
              DATA_TYPES.INT_SIZEOF * 2 +
              // The length of the type of this CLOB.
              DATA_TYPES.LONG_SIZEOF +
              // The actual length.
              DATA_TYPES.INT_SIZEOF +
              // The length of the value in bytes.
              Buffer.byteLength(value.fileLocator) +
              // The null character size.
              DATA_TYPES.BYTE_SIZEOF;
          break;

        default:
          return new Error(ErrorMessages.ERROR_INVALID_DATA_TYPE);
      }

    }
  }

  return paramValuesBufferLength;
};

module.exports = PrepareExecutePacket;
