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
	this.dbVersion = options.dbVersion;

	this.resultSet = ''; // Resultset of the query
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

	this.responseCode = 0; // Response code
	this.errorCode = 0; // Error code
	this.errorMsg = ''; // Error message
}

/**
 * Write data
 * @param writer
 */
ExecuteQueryPacket.prototype.write = function (writer) {
	// Set the length of this request. Don't include the first eight bytes
	// (`DATA_LENGTH_SIZEOF` and `CAS_INFO_SIZE`) because they are not
	// part of the query data.
	writer._writeInt(this.getBufferLength() - DATA_TYPES.DATA_LENGTH_SIZEOF - DATA_TYPES.CAS_INFO_SIZE);
	// `this.casInfo` is already a buffer. Just write them as bytes.
	writer._writeBytes(DATA_TYPES.CAS_INFO_SIZE, this.casInfo);

	// Then tell which CAS function should CAS execute.
	// TODO: Shouldn't CAS function by an integer of four bytes?
	// Why write only one byte?
	writer._writeByte(this.dbVersion.startsWith('9.0.0') ? CAS.CASFunctionCode900.CAS_FC_PREPARE_AND_EXECUTE : CAS.CASFunctionCode.CAS_FC_PREPARE_AND_EXECUTE);

	// The length of the next piece of data, i.e. CAS function.
	// The length of any piece of data should be represented by an
	// integer value.
	writer._writeInt(DATA_TYPES.INT_SIZEOF);

	// Next, write how many arguments (integer value, thus 4 bytes)
	// should the CAS function accept. `CAS_FC_PREPARE_AND_EXECUTE`
	// accepts `3` arguments.
	writer._writeInt(3);

	// Now goes the SQL query.
	writer._writeNullTerminatedString(this.sql);

	// The size of the next piece, also in 4-byte integer.
	writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
	// The type of prepare CAS has to execute.
	writer._writeByte(CAS.CCIPrepareOption.CCI_PREPARE_NORMAL);

	// The size of the next piece.
	writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
	// Autocommit mode.
	writer._writeByte(this.autoCommit ? 1 : 0);

	// Execute info.

	// The size of the next piece.
	writer._writeInt(DATA_TYPES.BYTE_SIZEOF);
	// Execute flag.
	writer._writeByte(CAS.CCIExecutionOption.CCI_EXEC_QUERY_ALL);

	// The size of the next piece.
	writer._writeInt(DATA_TYPES.INT_SIZEOF);
	// `max_col_size`: The maximum length of a column in bytes to be fetched
	// when it is a string data type. If this value is 0, full length is fetched.
	writer._writeInt(0);

	// The size of the next piece.
	writer._writeInt(DATA_TYPES.INT_SIZEOF);
	// Max row size.
	writer._writeInt(0);

	// NULL.
	writer._writeInt(0);

	// Write cache time
	writer._writeInt(2 * DATA_TYPES.INT_SIZEOF);
	// Seconds.
	writer._writeInt(0);
	// Milliseconds.
	writer._writeInt(0);

	// The size of the next piece.
	writer._writeInt(DATA_TYPES.INT_SIZEOF);
	// Query timeout.
	writer._writeInt(0);

	return writer;
};

/**
 * Read data
 * @param parser
 */
ExecuteQueryPacket.prototype.parse = function (parser) {
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
		this.queryHandle = this.responseCode;
		this.resultCacheLifetime = parser._parseInt(); // Cache lifetime
		this.statementType = parser._parseByte(); // Statement type
		this.bindCount = parser._parseInt(); // Bind count
		this.isUpdatable = (parser._parseByte() === 0); // Is updatable?
		this.columnCount = parser._parseInt(); // Query result columns count
		this.infoArray = [];
		for (i = 0; i < this.columnCount; i++) {
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

		this.totalTupleCount = parser._parseInt(); // Tuples count
		this.cache_reusable = parser._parseByte(); // Cache reusable
		this.resultCount = parser._parseInt(); // Result count
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

		this.resultSet =  JSON.stringify(
				{
					ColumnNames     : columnNames,
					ColumnDataTypes : columnDataTypes,
					RowsCount       : this.totalTupleCount,
					ColumnValues    : columnValues
				}
		);
	}

	return this;
};

/**
 * Get records data from stream
 * @param parser
 * @param tupleCount
 */
ExecuteQueryPacket.prototype._getData = function (parser, tupleCount) {
	var columnValues = new Array(tupleCount);
	for (var i = 0; i < tupleCount; i++) {
		columnValues[i] = new Array(this.columnCount);
		var index = parser._parseInt(); // Column index
		var Oid = parser._parseBytes(DATA_TYPES.OID_SIZEOF); // OID
		for (var j = 0; j < this.columnCount; j++) {
			var size = parser._parseInt(); // Value size
			var val;
			if (size <= 0) {
				val = null;
			} else {
				var type = CAS.CUBRIDDataType.CCI_U_TYPE_NULL;

				if (this.statementType === CAS.CUBRIDStatementType.CUBRID_STMT_CALL ||
						this.statementType === CAS.CUBRIDStatementType.CUBRID_STMT_EVALUATE ||
						this.statementType === CAS.CUBRIDStatementType.CUBRID_STMT_CALL_SP ||
						this.infoArray[j].ColumnType === CAS.CUBRIDDataType.CCI_U_TYPE_NULL) {
					type = parser._parseByte(); // Column data type
					size--;
				} else {
					type = this.infoArray[j].ColumnType;
				}

				val = this._readValue(j, type, size, parser); // Read value
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

ExecuteQueryPacket.prototype.getBufferLength = function () {
	var bufferLength = // Total length of the request without itself and CAS info.
			DATA_TYPES.DATA_LENGTH_SIZEOF +
				// CAS info.
					DATA_TYPES.CAS_INFO_SIZE +
				// CAS function.
					DATA_TYPES.BYTE_SIZEOF +
				// TODO: what are these four bytes for?
					DATA_TYPES.INT_SIZEOF +
				// CAS arguments.
					DATA_TYPES.INT_SIZEOF +
				// TODO: These four bytes are absent below. Why?
					DATA_TYPES.INT_SIZEOF +
				// A NULL terminated SQL query string.
					Buffer.byteLength(this.sql) + 1 +
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
