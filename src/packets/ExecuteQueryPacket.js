var DATA_TYPES = require('../constants/DataTypes'),
  Helpers = require('../utils/Helpers'),
  CAS = require('../constants/CASConstants'),
  ErrorMessages = require('../constants/ErrorMessages'),
  ColumnMetaData = require('../resultset/ColumnMetaData'),
  ResultInfo = require('../resultset/ResultInfo');

module.exports = ExecuteQueryPacket;

/**
 * Constructor
 * @param options
 * @constructor
 */
function ExecuteQueryPacket(options) {
  options = options || {};

  this.casInfo = options.casInfo;
  this.sql = options.sql;
  this.autoCommit = options.autoCommitMode;
  this.resultset = '';
  this.resultCacheLifetime = 0;
  this.statementType = null;
  this.bindCount = 0;
  this.isUpdatable = false;
  this.totalTupleCount = 0;
  this.cache_reusable = 0;
  this.resultCount = 0;
  this.resultInfos = null;
  this.columnCount = 0;
  this.infoArray = new ColumnMetaData();
  this.resultInfos = new ResultInfo();
  this.handle = 0;
  this.currentTupleCount = 0;
  this.tupleCount = 0;
  this.errorCode = 0;
  this.errorMsg = '';
}

/**
 * Write data
 * @param writer
 */
ExecuteQueryPacket.prototype.write = function (writer) {
  var bufferLength = DATA_TYPES.DATA_LENGTH_SIZEOF + DATA_TYPES.CAS_INFO_SIZE +
    DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    this.sql.length + 1 + DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.BYTE_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF +
    DATA_TYPES.INT_SIZEOF + DATA_TYPES.INT_SIZEOF;

  //Prepare info
  writer._writeInt(bufferLength - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
  writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);
  writer._writeByte(CAS.CASFunctionCode.CAS_FC_PREPARE_AND_EXECUTE);
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(3);// number of CAS args
  writer._writeNullTerminatedString(this.sql);//sql string
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(CAS.CCIPrepareOption.CCI_PREPARE_NORMAL); //prepare flag
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(this.autoCommit ? 1 : 0); //autocommit mode

  //Execute info
  writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
  writer._writeByte(CAS.CCIExecutionOption.CCI_EXEC_QUERY_ALL); //execute flag
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(0); //max col size;
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(0); //max row size;
  writer._writeInt(0);//NULL
  writer._writeInt(2 * DATA_TYPES.INT_SIZEOF); // write cache time
  writer._writeInt(0); //seconds
  writer._writeInt(0); //useconds
  writer._writeInt(DATA_TYPES.INT_SIZEOF);
  writer._writeInt(0);//query timeout

  return writer;
};

/**
 * Read data
 * @param parser
 */
ExecuteQueryPacket.prototype.parse = function (parser) {
  var reponseLength = parser._parseInt();
  this.casInfo = parser._parseBytes(DATA_TYPES.CAS_INFO_SIZE);

  //var responseBuffer = parser.parseBuffer(reponseLength);
  this.handle = parser._parseInt();
  if (this.handle < 0) {
    this.errorCode = parser._parseInt();
    this.errorMsg = parser._parseNullTerminatedString(reponseLength - 2 * DATA_TYPES.INT_SIZEOF);
    if (this.errorMsg.length == 0) {
      this.errorMsg = Helpers._resolveErrorCode(this.errorCode);
    }
    return -1; //TODO Document this
  } else {
    this.resultCacheLifetime = parser._parseInt();
    this.statementType = parser._parseByte();
    this.bindCount = parser._parseInt();
    this.isUpdatable = (parser._parseByte() === 0);
    this.columnCount = parser._parseInt();
    this.infoArray = new Array();
    for (i = 0; i < this.columnCount; i++) {
      var info = new ColumnMetaData();
      info.ColumnType = parser._parseByte();
      info.scale = parser._parseShort();
      info.precision = parser._parseInt();
      var len = parser._parseInt();
      info.Name = parser._parseNullTerminatedString(len);
      if (true) { //TODO Refactor this
        len = parser._parseInt();
        info.RealName = parser._parseNullTerminatedString(len);
        len = parser._parseInt();
        info.TableName = parser._parseNullTerminatedString(len);
        info.IsNullable = (parser._parseByte() === 1);
        len = parser._parseInt();
        info.DafaultValue = parser._parseNullTerminatedString(len);
        info.IsAutoIncrement = (parser._parseByte() === 1);
        info.IsUniqueKey = (parser._parseByte() === 1);
        info.IsPrimaryKey = (parser._parseByte() === 1);
        info.IsReverseIndex = (parser._parseByte() === 1);
        info.IsReverseUnique = (parser._parseByte() === 1);
        info.IsForeignKey = (parser._parseByte() === 1);
        info.IsShared = (parser._parseByte() === 1);
      }
      this.infoArray[i] = info;
    }

    this.totalTupleCount = parser._parseInt();
    this.cache_reusable = parser._parseByte();
    this.resultCount = parser._parseInt();
    //read result info
    for (i = 0; i < this.resultCount; i++) {
      var resultInfo = new ResultInfo();
      resultInfo.StmtType = parser._parseByte();
      resultInfo.ResultCount = parser._parseInt();
      resultInfo.Oid = parser._parseBytes(8);
      resultInfo.CacheTimeSec = parser._parseInt();
      resultInfo.CacheTimeUsec = parser._parseInt();
      this.resultInfos[i] = resultInfo;
    }
  }

  if (this.statementType === CAS.CUBRIDStatementType.CUBRID_STMT_SELECT) {
    var fetchCode = parser._parseInt();
    this.tupleCount = parser._parseInt();
    var columnNames = new Array(this.columnCount);
    var columnDataTypes = new Array(this.columnCount);
    var columnValues = new Array(this.tupleCount);
    for (var i = 0; i < this.columnCount; i++) {
      columnNames[i] = this.infoArray[i].Name;
      columnDataTypes[i] = CAS.getCUBRIDDataType(this.infoArray[i].ColumnType);
    }

    columnValues = this._getData(parser, this.tupleCount);

    return JSON.stringify(
      {
        ColumnNames     : columnNames,
        ColumnDataTypes : columnDataTypes,
        RowsCount       : this.totalTupleCount,
        ColumnValues    : columnValues
      }
    );
  }

  return parser;
};

/**
 * Get Data from stream
 * @param parser
 * @param tupleCount
 */
ExecuteQueryPacket.prototype._getData = function (parser, tupleCount) {
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
 * Read value from stream
 * @param index
 * @param type
 * @param size
 * @param parser
 */
ExecuteQueryPacket.prototype._readValue = function (index, type, size, parser) {
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
      return parser._parseBytes(size)[0]; //TODO: Refactor this

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
      return new Error('Invalid data type');
  }
};
