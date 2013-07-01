var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  CAS = require('../constants/CASConstants'),
  ErrorMessages = require('../constants/ErrorMessages'),
  ColumnMetaData = require('../resultset/ColumnMetaData'),
  PacketWriter = require('../packets/PacketWriter'),
  ResultInfo = require('../resultset/ResultInfo');

module.exports = PrepareAndExecutePacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function PrepareAndExecutePacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.sql = options.sql;
  this.autoCommit = options.autoCommitMode;
  this.dbVersion = options.dbVersion;
  this.paramValues = options.paramValues;
  this.paramTypes = options.paramTypes;

  this.resultSet = '';
  this.resultCacheLifetime = 0; // Cache lifetime
  this.statementType = null; // Statement type
  this.bindCount = 0; // Bind count
  this.isUpdatable = false; // Is updatable
  this.totalTupleCount = 0; // Total nomber of tuples
  this.cache_reusable = 0; // Cache reusable
  this.resultCount = 0; // Number of results
  this.columnCount = 0; // Number of columns
  this.infoArray = new ColumnMetaData(); // Column meta data
  this.resultInfos = new ResultInfo(); // Result info
  this.queryHandle = 0; // Query handle
  this.currentTupleCount = 0; // Current number of returned tuples
  this.tupleCount = 0; // Number of tuples
  this.bindCount = 0; // Number of parameters to bind
  this.isUpdatable = false;
  this.resultCacheLifetime = 0;

  this.responseCode = 0; // Response code
  this.errorCode = 0; // Error code
  this.errorMsg = ''; // Error message
}

/**
 * Write prepare data
 * @param writer
 */
PrepareAndExecutePacket.prototype.writePrepare = function (writer) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + Buffer.byteLength(this.sql) + 1 +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF;

  // Prepare info
  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);

  writer._writeByte(CAS.CASFunctionCode.CAS_FC_PREPARE);
  writer._writeNullTerminatedString(this.sql); // Sql string
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(CAS.CCIPrepareOption.CCI_PREPARE_NORMAL); // Prepare flag
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(this.autoCommit ? 1 : 0); // Autocommit mode

  return writer;
};

/**
 * Write execute data
 * @param writer
 */
PrepareAndExecutePacket.prototype.writeExecute = function (writer) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF;

  var paramsWriter = new PacketWriter();
  if (this.paramValues !== null) {
    for (var i = 0; i < this.paramValues.length; i++) {
      this._writeParamValue(this.paramValues[i], this.paramTypes[i], paramsWriter);
    }
    bufferLength = bufferLength + paramsWriter._buffer.length;
  }

  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_EXECUTE);

  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(this.queryHandle);
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(CAS.CCIExecutionOption.CCI_EXEC_NORMAL); // Execute flag
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(0); // Max col size;
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(0); // Max row size;
  writer._writeInt(0); // NULL
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  if (this.statementType !== CAS.CUBRIDStatementType.CUBRID_STMT_SELECT) {
    writer._writeByte(0); // FetchFlag;
  } else {
    writer._writeByte(1); // FetchFlag;
  }
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(this.autoCommit ? 1 : 0); // Autocommit mode
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(1); // Forrward only cursor
  writer._writeInt(2 * DATA_TYPES.INT_SIZEOF); // Write cache time
  writer._writeInt(0); // Seconds
  writer._writeInt(0); // Useconds
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(0); // Query timeout
  writer._writeBuffer(paramsWriter._buffer);

  return writer;
};

/**
 * Read prepare data
 * @param parser
 */
PrepareAndExecutePacket.prototype.parsePrepare = function (parser) {
  var reponseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(reponseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length === 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  } else {
    this.queryHandle = this.responseCode; // Query handle
    this.resultCacheLifetime = parser._parseInt(); // Cache lifetime
    this.statementType = parser._parseByte(); // Statement type
    this.bindCount = parser._parseInt(); // Bind count
    this.isUpdatable = (parser._parseByte() === 1); // Updatable?
    this.columnCount = parser._parseInt(); // Column count
    this.infoArray = [];
    for (var i = 0; i < this.columnCount; i++) {
      var info = new ColumnMetaData();
      info.ColumnType = parser._parseByte(); // Column type
      info.scale = parser._parseShort(); // Scale
      info.precision = parser._parseInt(); // Precision
      var len = parser._parseInt();
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
      this.infoArray[i] = info;
    }
  }
  return this;
};

/**
 * Read execute data
 * @param parser
 */
PrepareAndExecutePacket.prototype.parseExecute = function (parser) {
  var reponseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  this.responseCode = parser._parseInt();
  if (this.responseCode < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(reponseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length === 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
  } else {
    this.totalTupleCount = this.responseCode;
    this.cache_reusable = parser._parseByte();
    this.resultCount = parser._parseInt();
    // Read result info
    for (i = 0; i < this.resultCount; i++) {
      var resultInfo = new ResultInfo();
      resultInfo.StmtType = parser._parseByte(); // Statement type
      resultInfo.ResultCount = parser._parseInt(); // Result count
      resultInfo.Oid = parser._parseBytes(DATA_TYPES.OID_SIZEOF); // OID
      resultInfo.CacheTimeSec = parser._parseInt(); // Cache time seconds
      resultInfo.CacheTimeUsec = parser._parseInt(); // Cache time milliseconds
      this.resultInfos[i] = resultInfo;
    }

    if (this.statementType === CAS.CUBRIDStatementType.CUBRID_STMT_SELECT) {
      var fetchCode = parser._parseInt(); // Fetch code
      this.tupleCount = parser._parseInt(); // Tuple count
      var columnNames = new Array(this.columnCount);
      var columnDataTypes = new Array(this.columnCount);
      var columnValues = new Array(this.tupleCount);
      for (var i = 0; i < this.columnCount; i++) {
        columnNames[i] = this.infoArray[i].Name;
        columnDataTypes[i] = CAS.getCUBRIDDataTypeName(this.infoArray[i].ColumnType);
      }

      columnValues = this._getData(parser, this.tupleCount);

      this.resultSet = JSON.stringify(
        {
          ColumnNames     : columnNames,
          ColumnDataTypes : columnDataTypes,
          RowsCount       : this.totalTupleCount,
          ColumnValues    : columnValues
        }
      );
    }
  }

  return this;
};

/**
 * Get records data from stream
 * @param parser
 * @param tupleCount
 */
PrepareAndExecutePacket.prototype._getData = function (parser, tupleCount) {
  var columnValues = new Array(tupleCount);
  for (var i = 0; i < tupleCount; i++) {
    columnValues[i] = new Array(this.columnCount);
    var index = parser._parseInt();
    var Oid = parser._parseBytes(DATA_TYPES.OID_SIZEOF);
    for (var j = 0; j < this.columnCount; j++) {
      var size = parser._parseInt();
      var val;
      if (size <= 0) {
        val = null;
      } else {
        var type = CAS.CUBRIDDataType.CCI_U_TYPE_NULL;

        if (this.statementType === CAS.CUBRIDStatementType.CUBRID_STMT_CALL ||
          this.statementType === CAS.CUBRIDStatementType.CUBRID_STMT_EVALUATE ||
          this.statementType === CAS.CUBRIDStatementType.CUBRID_STMT_CALL_SP ||
          this.infoArray[j].ColumnType === CAS.CUBRIDDataType.CCI_U_TYPE_NULL) {
          type = parser._parseByte();
          size--;
        } else {
          type = this.infoArray[j].ColumnType;
        }

        val = this._readValue(j, type, size, parser);
        columnValues[i][j] = val;
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
PrepareAndExecutePacket.prototype._readValue = function (index, type, size, parser) {
  switch (type) {
    case CAS.CUBRIDDataType.CCI_U_TYPE_CHAR:
    case CAS.CUBRIDDataType.CCI_U_TYPE_NCHAR:
    case CAS.CUBRIDDataType.CCI_U_TYPE_STRING:
    case CAS.CUBRIDDataType.CCI_U_TYPE_VARNCHAR:
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
      return parser._parseBlob(size);

    case CAS.CUBRIDDataType.CCI_U_TYPE_CLOB:
      return parser._parseClob(size);

    case CAS.CUBRIDDataType.CCI_U_TYPE_RESULTSET:
      return parser._parseResultSet();

    default:
      return new Error(ErrorMessages.ERROR_INVALID_DATA_TYPE);
  }
};

/**
 * Write parameter value to stream
 * @param value
 * @param type
 * @param writer
 */
PrepareAndExecutePacket.prototype._writeParamValue = function (value, type, writer) {
  var paramType = CAS.getCUBRIDDataTypeNumber(type);
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(paramType);
  switch (paramType) {
    case CAS.CUBRIDDataType.CCI_U_TYPE_CHAR:
    case CAS.CUBRIDDataType.CCI_U_TYPE_NCHAR:
    case CAS.CUBRIDDataType.CCI_U_TYPE_STRING:
    case CAS.CUBRIDDataType.CCI_U_TYPE_VARNCHAR:
      writer._writeNullTerminatedString(value);
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_SHORT:
      writer._writeInt(DATA_TYPES.SHORT_SIZEOF);
      writer._writeShort(value);
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_INT:
      writer._writeInt(DATA_TYPES.INT_SIZEOF);
      writer._writeInt(value);
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_BIGINT:
      writer._writeInt(DATA_TYPES.LONG_SIZEOF);
      writer._writeLong(value);
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_FLOAT:
      writer._writeInt(DATA_TYPES.FLOAT_SIZEOF);
      writer._writeFloat(value);
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_DOUBLE:
    case CAS.CUBRIDDataType.CCI_U_TYPE_MONETARY:
      writer._writeInt(DATA_TYPES.DOUBLE_SIZEOF);
      writer._writeDouble(value);
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_NUMERIC:
      writer._writeNumeric(value);
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_DATE:
      writer._writeInt(DATA_TYPES.DATE_SIZEOF);
      writer._writeDate(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_TIME:
      writer._writeInt(DATA_TYPES.TIME_SIZEOF);
      writer._writeTime(value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds());
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_DATETIME:
      writer._writeInt(DATA_TYPES.DATETIME_SIZEOF);
      writer._writeDateTime(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(),
        value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds(), value.getUTCMilliseconds());
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_TIMESTAMP:
      writer._writeInt(DATA_TYPES.TIMESTAMP_SIZEOF);
      writer._writeTimestamp(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(),
        value.getUTCHours(), value.getUTCMinutes(), value.getUTCSeconds());
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_OBJECT:
      writer._writeInt(0);
      writer._writeObject(value);
      break;

    case CAS.CUBRIDDataType.CCI_U_TYPE_BIT:
    case CAS.CUBRIDDataType.CCI_U_TYPE_VARBIT:
      writer._writeInt(value.length);
      writer._writeBytes(value.length, value);
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
      return new Error(ErrorMessages.ERROR_INVALID_DATA_TYPE);
  }
};
