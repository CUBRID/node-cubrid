'use strict';
/**
 * Define CUBRID Function codes constants
 */
exports.CASFunctionCode = {
  CAS_FC_END_TRAN            : 1,
  CAS_FC_PREPARE             : 2,
  CAS_FC_EXECUTE             : 3,
  CAS_FC_GET_DB_PARAMETER    : 4,
  CAS_FC_SET_DB_PARAMETER    : 5,
  CAS_FC_CLOSE_REQ_HANDLE    : 6,
  CAS_FC_CURSOR              : 7,
  CAS_FC_FETCH               : 8,
  CAS_FC_SCHEMA_INFO         : 9,
  CAS_FC_OID_GET             : 10,
  CAS_FC_OID_PUT             : 11,
  CAS_FC_DEPRECATED1         : 12,
  CAS_FC_DEPRECATED2         : 13,
  CAS_FC_DEPRECATED3         : 14,
  CAS_FC_GET_DB_VERSION      : 15,
  CAS_FC_GET_CLASS_NUM_OBJS  : 16,
  CAS_FC_OID_CMD             : 17,
  CAS_FC_COLLECTION          : 18,
  CAS_FC_NEXT_RESULT         : 19,
  CAS_FC_EXECUTE_BATCH       : 20,
  CAS_FC_EXECUTE_ARRAY       : 21,
  CAS_FC_CURSOR_UPDATE       : 22,
  CAS_FC_GET_ATTR_TYPE_STR   : 23,
  CAS_FC_GET_QUERY_INFO      : 24,
  CAS_FC_DEPRECATED4         : 25,
  CAS_FC_SAVEPOINT           : 26,
  CAS_FC_PARAMETER_INFO      : 27,
  CAS_FC_XA_PREPARE          : 28,
  CAS_FC_XA_RECOVER          : 29,
  CAS_FC_XA_END_TRAN         : 30,
  CAS_FC_CON_CLOSE           : 31,
  CAS_FC_CHECK_CAS           : 32,
  CAS_FC_MAKE_OUT_RS         : 33,
  CAS_FC_GET_GENERATED_KEYS  : 34,
  CAS_FC_LOB_NEW             : 35,
  CAS_FC_LOB_WRITE           : 36,
  CAS_FC_LOB_READ            : 37,
  CAS_FC_END_SESSION         : 38,
  CAS_FC_GET_ROW_COUNT       : 39,
  CAS_FC_GET_LAST_INSERT_ID  : 40,
  CAS_FC_PREPARE_AND_EXECUTE : 41
};

exports.CASFunctionCode900 = {
  CAS_FC_END_TRAN            : 1,
  CAS_FC_PREPARE             : 2,
  CAS_FC_EXECUTE             : 3,
  CAS_FC_GET_DB_PARAMETER    : 4,
  CAS_FC_SET_DB_PARAMETER    : 5,
  CAS_FC_CLOSE_REQ_HANDLE    : 6,
  CAS_FC_CURSOR              : 7,
  CAS_FC_FETCH               : 8,
  CAS_FC_SCHEMA_INFO         : 9,
  CAS_FC_OID_GET             : 10,
  CAS_FC_OID_PUT             : 11,
  CAS_FC_DEPRECATED1         : 12,
  CAS_FC_DEPRECATED2         : 13,
  CAS_FC_DEPRECATED3         : 14,
  CAS_FC_GET_DB_VERSION      : 15,
  CAS_FC_GET_CLASS_NUM_OBJS  : 16,
  CAS_FC_OID_CMD             : 17,
  CAS_FC_COLLECTION          : 18,
  CAS_FC_NEXT_RESULT         : 19,
  CAS_FC_EXECUTE_BATCH       : 20,
  CAS_FC_EXECUTE_ARRAY       : 21,
  CAS_FC_CURSOR_UPDATE       : 22,
  CAS_FC_GET_ATTR_TYPE_STR   : 23,
  CAS_FC_GET_QUERY_INFO      : 24,
  CAS_FC_DEPRECATED4         : 25,
  CAS_FC_SAVEPOINT           : 26,
  CAS_FC_PARAMETER_INFO      : 27,
  CAS_FC_XA_PREPARE          : 28,
  CAS_FC_XA_RECOVER          : 29,
  CAS_FC_XA_END_TRAN         : 30,
  CAS_FC_CON_CLOSE           : 31,
  CAS_FC_CHECK_CAS           : 32,
  CAS_FC_MAKE_OUT_RS         : 33,
  CAS_FC_GET_GENERATED_KEYS  : 34,
  CAS_FC_LOB_NEW             : 35,
  CAS_FC_LOB_WRITE           : 36,
  CAS_FC_LOB_READ            : 37,
  CAS_FC_END_SESSION         : 38,
  CAS_FC_GET_ROW_COUNT       : 39,
  CAS_FC_GET_LAST_INSERT_ID  : 40,
  CAS_FC_CURSOR_CLOSE        : 41,
  CAS_FC_PREPARE_AND_EXECUTE : 42
};

/**
 * Define CUBRID Statement types constants
 */
exports.CUBRIDStatementType = {
  CUBRID_STMT_ALTER_CLASS       : 0,
  CUBRID_STMT_ALTER_SERIAL      : 1,
  CUBRID_STMT_COMMIT_WORK       : 2,
  CUBRID_STMT_REGISTER_DATABASE : 3,
  CUBRID_STMT_CREATE_CLASS      : 4,
  CUBRID_STMT_CREATE_INDEX      : 5,
  CUBRID_STMT_CREATE_TRIGGER    : 6,
  CUBRID_STMT_CREATE_SERIAL     : 7,
  CUBRID_STMT_DROP_DATABASE     : 8,
  CUBRID_STMT_DROP_CLASS        : 9,
  CUBRID_STMT_DROP_INDEX        : 10,
  CUBRID_STMT_DROP_LABEL        : 11,
  CUBRID_STMT_DROP_TRIGGER      : 12,
  CUBRID_STMT_DROP_SERIAL       : 13,
  CUBRID_STMT_EVALUATE          : 14,
  CUBRID_STMT_RENAME_CLASS      : 15,
  CUBRID_STMT_ROLLBACK_WORK     : 16,
  CUBRID_STMT_GRANT             : 17,
  CUBRID_STMT_REVOKE            : 18,
  CUBRID_STMT_STATISTICS        : 19,
  CUBRID_STMT_INSERT            : 20,
  CUBRID_STMT_SELECT            : 21,
  CUBRID_STMT_UPDATE            : 22,
  CUBRID_STMT_DELETE            : 23,
  CUBRID_STMT_CALL              : 24,
  CUBRID_STMT_GET_ISO_LVL       : 25,
  CUBRID_STMT_GET_TIMEOUT       : 26,
  CUBRID_STMT_GET_OPT_LVL       : 27,
  CUBRID_STMT_SET_OPT_LVL       : 28,
  CUBRID_STMT_SCOPE             : 29,
  CUBRID_STMT_GET_TRIGGER       : 30,
  CUBRID_STMT_SET_TRIGGER       : 31,
  CUBRID_STMT_SAVEPOINT         : 32,
  CUBRID_STMT_PREPARE           : 33,
  CUBRID_STMT_ATTACH            : 34,
  CUBRID_STMT_USE               : 35,
  CUBRID_STMT_REMOVE_TRIGGER    : 36,
  CUBRID_STMT_RENAME_TRIGGER    : 37,
  CUBRID_STMT_ON_LDB            : 38,
  CUBRID_STMT_GET_LDB           : 39,
  CUBRID_STMT_SET_LDB           : 40,
  CUBRID_STMT_GET_STATS         : 41,
  CUBRID_STMT_CREATE_USER       : 42,
  CUBRID_STMT_DROP_USER         : 43,
  CUBRID_STMT_ALTER_USER        : 44,
  CUBRID_STMT_CALL_SP           : 0x7e,
  CUBRID_STMT_UNKNOWN           : 0x7f
};

/**
 * Define CUBRID Isolation levels constants
 */
exports.CUBRIDIsolationLevel = {
  TRAN_UNKNOWN_ISOLATION              : 0x00,
  TRAN_COMMIT_CLASS_UNCOMMIT_INSTANCE : 0x01,
  TRAN_COMMIT_CLASS_COMMIT_INSTANCE   : 0x02,
  TRAN_REP_CLASS_UNCOMMIT_INSTANCE    : 0x03,
  TRAN_REP_CLASS_COMMIT_INSTANCE      : 0x04,
  TRAN_REP_CLASS_REP_INSTANCE         : 0x05,
  TRAN_SERIALIZABLE                   : 0x06,
  TRAN_DEFAULT_ISOLATION              : 0x01
};

/**
 * Define CUBRID Data types constants
 */
exports.CUBRIDDataType = {
  CCI_U_TYPE_UNKNOWN   : 0,
  CCI_U_TYPE_NULL      : 0,
  CCI_U_TYPE_CHAR      : 1,
  CCI_U_TYPE_STRING    : 2,
  CCI_U_TYPE_NCHAR     : 3,
  CCI_U_TYPE_VARNCHAR  : 4,
  CCI_U_TYPE_BIT       : 5,
  CCI_U_TYPE_VARBIT    : 6,
  CCI_U_TYPE_NUMERIC   : 7,
  CCI_U_TYPE_INT       : 8,
  CCI_U_TYPE_SHORT     : 9,
  CCI_U_TYPE_MONETARY  : 10,
  CCI_U_TYPE_FLOAT     : 11,
  CCI_U_TYPE_DOUBLE    : 12,
  CCI_U_TYPE_DATE      : 13,
  CCI_U_TYPE_TIME      : 14,
  CCI_U_TYPE_TIMESTAMP : 15,
  CCI_U_TYPE_SET       : 16,
  CCI_U_TYPE_MULTISET  : 17,
  CCI_U_TYPE_SEQUENCE  : 18,
  CCI_U_TYPE_OBJECT    : 19,
  CCI_U_TYPE_RESULTSET : 20,
  CCI_U_TYPE_BIGINT    : 21,
  CCI_U_TYPE_DATETIME  : 22,
  CCI_U_TYPE_BLOB      : 23,
  CCI_U_TYPE_CLOB      : 24,
  CCI_U_TYPE_ENUM      : 25
};

/**
 * Convert data type number to data type name
 */
exports.getCUBRIDDataTypeName = function (type) {
  switch (type) {
    case this.CUBRIDDataType.CCI_U_TYPE_CHAR:
      return 'Char';
    case this.CUBRIDDataType.CCI_U_TYPE_NCHAR:
      return 'NChar';
    case this.CUBRIDDataType.CCI_U_TYPE_STRING:
      return 'String';
    case this.CUBRIDDataType.CCI_U_TYPE_VARNCHAR:
      return 'VarNchar';
    case this.CUBRIDDataType.CCI_U_TYPE_SHORT:
      return 'Short';
    case this.CUBRIDDataType.CCI_U_TYPE_INT:
      return 'Int';
    case this.CUBRIDDataType.CCI_U_TYPE_BIGINT:
      return 'Bigint';
    case this.CUBRIDDataType.CCI_U_TYPE_FLOAT:
      return 'Float';
    case this.CUBRIDDataType.CCI_U_TYPE_DOUBLE:
      return 'Double';
    case this.CUBRIDDataType.CCI_U_TYPE_MONETARY:
      return 'Monetary';
    case this.CUBRIDDataType.CCI_U_TYPE_NUMERIC:
      return 'Numeric';
    case this.CUBRIDDataType.CCI_U_TYPE_DATE:
      return 'Date';
    case this.CUBRIDDataType.CCI_U_TYPE_TIME:
      return 'Time';
    case this.CUBRIDDataType.CCI_U_TYPE_DATETIME:
      return 'DateTime';
    case this.CUBRIDDataType.CCI_U_TYPE_TIMESTAMP:
      return 'Timestamp';
    case this.CUBRIDDataType.CCI_U_TYPE_OBJECT:
      return 'Object';
    case this.CUBRIDDataType.CCI_U_TYPE_BIT:
      return 'Bit';
    case this.CUBRIDDataType.CCI_U_TYPE_VARBIT:
      return 'Varbit';
    case this.CUBRIDDataType.CCI_U_TYPE_SET:
      return 'Set';
    case this.CUBRIDDataType.CCI_U_TYPE_MULTISET:
      return 'Multiset';
    case this.CUBRIDDataType.CCI_U_TYPE_SEQUENCE:
      return 'Sequence';
    case this.CUBRIDDataType.CCI_U_TYPE_BLOB:
      return 'Blob';
    case this.CUBRIDDataType.CCI_U_TYPE_CLOB:
      return 'Clob';
    case this.CUBRIDDataType.CCI_U_TYPE_ENUM:
      return 'ENUM';
    case this.CUBRIDDataType.CCI_U_TYPE_RESULTSET:
      return 'Resultset';
    default:
      return 'UNKNOWN';
  }
};

/**
 * Convert data type name to data type number
 */
exports.getCUBRIDDataTypeNumber = function (type) {
  type = type.toLowerCase();
  switch (type) {
    case 'char':
      return this.CUBRIDDataType.CCI_U_TYPE_CHAR;
    case 'varchar':
      return this.CUBRIDDataType.CCI_U_TYPE_STRING;
    case 'nchar':
      return this.CUBRIDDataType.CCI_U_TYPE_NCHAR;
    case 'string':
      return this.CUBRIDDataType.CCI_U_TYPE_STRING;
    case 'varnchar':
      return this.CUBRIDDataType.CCI_U_TYPE_VARNCHAR;
    case 'short':
      return this.CUBRIDDataType.CCI_U_TYPE_SHORT;
    case 'int':
      return this.CUBRIDDataType.CCI_U_TYPE_INT;
    case 'bigint':
      return this.CUBRIDDataType.CCI_U_TYPE_BIGINT;
    case 'float':
      return this.CUBRIDDataType.CCI_U_TYPE_FLOAT;
    case 'double':
      return this.CUBRIDDataType.CCI_U_TYPE_DOUBLE;
    case 'monetary':
      return this.CUBRIDDataType.CCI_U_TYPE_MONETARY;
    case 'numeric':
      return this.CUBRIDDataType.CCI_U_TYPE_NUMERIC;
    case 'date':
      return this.CUBRIDDataType.CCI_U_TYPE_DATE;
    case 'time':
      return this.CUBRIDDataType.CCI_U_TYPE_TIME;
    case 'datetime':
      return this.CUBRIDDataType.CCI_U_TYPE_DATETIME;
    case 'timestamp':
      return this.CUBRIDDataType.CCI_U_TYPE_TIMESTAMP;
    case 'object':
      return this.CUBRIDDataType.CCI_U_TYPE_OBJECT;
    case 'bit':
      return this.CUBRIDDataType.CCI_U_TYPE_BIT;
    case 'varbit':
      return this.CUBRIDDataType.CCI_U_TYPE_VARBIT;
    case 'set':
      return this.CUBRIDDataType.CCI_U_TYPE_SET;
    case 'multiset':
      return this.CUBRIDDataType.CCI_U_TYPE_MULTISET;
    case 'sequence':
      return this.CUBRIDDataType.CCI_U_TYPE_SEQUENCE;
    case 'blob':
      return this.CUBRIDDataType.CCI_U_TYPE_BLOB;
    case 'clob':
      return this.CUBRIDDataType.CCI_U_TYPE_CLOB;
    case 'resultset':
      return this.CUBRIDDataType.CCI_U_TYPE_RESULTSET;
    default:
      return this.CUBRIDDataType.CCI_U_TYPE_UNKNOWN;
  }
};

/**
 * Define CUBRID Schema type constants
 */
exports.CUBRIDSchemaType = {
  CCI_SCH_CLASS              : 1,
  CCI_SCH_VCLASS             : 2,
  CCI_SCH_QUERY_SPEC         : 3,
  CCI_SCH_ATTRIBUTE          : 4,
  CCI_SCH_CLASS_ATTRIBUTE    : 5,
  CCI_SCH_METHOD             : 6,
  CCI_SCH_CLASS_METHOD       : 7,
  CCI_SCH_METHOD_FILE        : 8,
  CCI_SCH_SUPERCLASS         : 9,
  CCI_SCH_SUBCLASS           : 10,
  CCI_SCH_CONSTRAINT         : 11,
  CCI_SCH_TRIGGER            : 12,
  CCI_SCH_CLASS_PRIVILEGE    : 13,
  CCI_SCH_ATTR_PRIVILEGE     : 14,
  CCI_SCH_DIRECT_SUPER_CLASS : 15,
  CCI_SCH_PRIMARY_KEY        : 16,
  CCI_SCH_IMPORTED_KEYS      : 17,
  CCI_SCH_EXPORTED_KEYS      : 18,
  CCI_SCH_CROSS_REFERENCE    : 19
};

/**
 * Define CUBRID Prepare statement constants
 */
exports.CCIPrepareOption = {
  CCI_PREPARE_NORMAL      : 0x00,
  CCI_PREPARE_INCLUDE_OID : 0x01,
  CCI_PREPARE_UPDATABLE   : 0x02,
  CCI_PREPARE_QUERY_INFO  : 0x04,
  CCI_PREPARE_HOLDABLE    : 0x08,
  CCI_PREPARE_CALL        : 0x40
};

/**
 * Define CUBRID OID commands constants
 */
exports.OidCommand = {
  DROP_BY_OID           : 1,
  IS_INSTANCE           : 2,
  GET_READ_LOCK_BY_OID  : 3,
  GET_WRITE_LOCK_BY_OID : 4,
  GET_CLASS_NAME_BY_OID : 5
};

/**
 * Define CUBRID Transaction type constants
 */
exports.CCITransactionType = {
  CCI_TRAN_COMMIT   : 1,
  CCI_TRAN_ROLLBACK : 2
};

/**
 * Define CUBRID Database parameters constants
 */
exports.CCIDbParam = {
  CCI_PARAM_ISOLATION_LEVEL   : 1,
  CCI_PARAM_LOCK_TIMEOUT      : 2,
  CCI_PARAM_MAX_STRING_LENGTH : 3,
  CCI_PARAM_AUTO_COMMIT       : 4
};

/**
 * Define CUBRID Collection-related commands constants
 */
exports.CUBRIDCollectionCommand = {
  GET_COLLECTION_VALUE         : 1,
  GET_SIZE_OF_COLLECTION       : 2,
  DROP_ELEMENT_IN_SET          : 3,
  ADD_ELEMENT_TO_SET           : 4,
  DROP_ELEMENT_IN_SEQUENCE     : 5,
  INSERT_ELEMENT_INTO_SEQUENCE : 6,
  PUT_ELEMENT_ON_SEQUENCE      : 7
};

/**
 * Define CUBRID Connection status constants
 */
exports.ConnectionStatus = {
  CON_STATUS_OUT_TRAN          : 0,
  CON_STATUS_IN_TRAN           : 1,
  CON_STATUS_CLOSE             : 2,
  CON_STATUS_CLOSE_AND_CONNECT : 3
};

/**
 * Define CUBRID Cursor position constants
 */
exports.CCICursorPosition = {
  CCI_CURSOR_FIRST   : 0,
  CCI_CURSOR_CURRENT : 1,
  CCI_CURSOR_LAST    : 2
};

/**
 * Define CUBRID Statement execution type constants
 */
exports.StmtType = {
  NORMAL                 : 0,
  GET_BY_OID             : 1,
  GET_SCHEMA_INFO        : 2,
  GET_AUTOINCREMENT_KEYS : 3
};

/**
 * Define CUBRID Query execution constants
 */
exports.QueryExecutionMode = {
  SYNC_EXEC  : 0,
  ASYNC_EXEC : 1
};

/**
 * Define CUBRID Statement execution constants
 */
exports.CCIExecutionOption = {
  CCI_EXEC_NORMAL          : 0x00,
  CCI_EXEC_ASYNC           : 0x01,
  CCI_EXEC_QUERY_ALL       : 0x02,
  CCI_EXEC_QUERY_INFO      : 0x04,
  CCI_EXEC_ONLY_QUERY_PLAN : 0x08,
  CCI_EXEC_THREAD          : 0x10,
  CCI_EXEC_HOLDABLE        : 0x20
};

/**
 * Define CUBRID Schema pattern match flags
 */
exports.CCISchemaPatternMatchFlag = {
  CCI_CLASS_NAME_PATTERN_MATCH : 0X01,
  CCI_ATTR_NAME_PATTERN_MATCH  : 0X02
};

/**
 * Define CUBRID LOB types
 */
exports.CCILOBType = {
  CCI_LOB_TYPE_BLOB : 33,
  CCI_LOB_TYPE_CLOB  : 34
};


/* CAS Protocol constants */
/**
 * Define the supported protocol version
 * The protocol version is validated by the CUBRID broker,
 * to assess the compatibility level with the CUBRID engine.
 */
const CAS_PROTO_INDICATOR = 0x40;

exports.CAS_PROTOCOL_VERSION = (function getProtocolVersion() {
  // const CAS_PROTOCOL_VERSION_1 = /* since 8.4.1 */1;
  // const CAS_PROTOCOL_VERSION_2 = /* since 9.0.0 */2;
  // const CAS_PROTOCOL_VERSION_3 = /* since 8.4.3 */3;
  // const CAS_PROTOCOL_VERSION_4 = /* since 9.1.0 */4;
  // const CAS_PROTOCOL_VERSION_5 = /* since 9.2.0 */5;
  const CAS_PROTOCOL_VERSION_6 = /* since 9.2.26 */6;

  return CAS_PROTOCOL_VERSION_6;
})();

exports.CAS_VERSION = CAS_PROTO_INDICATOR | exports.CAS_PROTOCOL_VERSION;

// JDBC client type
exports.CAS_CLIENT_JDBC = 3;
// This value is defined in `broker/cas_protocol.h`.
exports.CAS_MAGIC_STRING = 'CUBRK';

exports.getProtocolVersion = function (version) {
  // At this moment `node-cubrid` supports at most protocol version 6.
  for (let protocolVersion = 0; protocolVersion < 7; ++protocolVersion) {
    if ((CAS_PROTO_INDICATOR | protocolVersion) === version) {
      return protocolVersion;
    }
  }

  // By default fall back to the latest version we support.
  return exports.CAS_PROTOCOL_VERSION;
};
