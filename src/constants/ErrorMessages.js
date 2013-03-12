/**
 * Define CUBRID internal error messages and custom driver error messages
 */

exports.ERROR_NEW_BROKER_PORT = 'Error receiving a new connection port!';
exports.ERROR_CONNECTION_ALREADY_OPENED = 'The connection is already opened! - denying a second connection request.';
exports.ERROR_CONNECTION_ALREADY_PENDING = 'A connection is already in progress! - denying current connection request.';
exports.ERROR_CONNECTION_ALREADY_CLOSED = 'The connection is already closed!';
exports.ERROR_QUERY_ALREADY_PENDING = 'Another query is already in progress! - denying current query request.';
exports.ERROR_NO_ACTIVE_QUERY = 'No active query with this handle!';
exports.ERROR_NO_ROLLBACK = 'AutoCommitMode is enabled! - denying rollback request.';
exports.ERROR_NO_COMMIT = 'AutoCommitMode is enabled! - denying commit request.';
exports.ERROR_ON_CLOSE_QUERY_HANDLE = 'Error closing request: ';
exports.ERROR_INPUT_VALIDATION = 'Error validating input parameters.';
exports.ERROR_INVALID_DATA_TYPE = 'Error:Invalid data type.';
exports.ERROR_INVALID_SCHEMA_TYPE = 'Error:Invalid schema type.';
exports.ERROR_INVALID_LOB_POSITION = 'Error: Invalid LOB position';
exports.ERROR_INVALID_LOB_TYPE = 'Error: Invalid LOB type';
exports.ERROR_CONNECTION_TIMEOUT = 'Connection timeout!';
exports.ERROR_CONNECTION_CLOSED = 'Connection not opened!';
exports.ERROR_QUERIES_IN_PROGRESS = 'Can\'t close the connection - there are queries in execution!';
exports.ERROR_QUERY_NOT_FOUND = 'Query not found in queue!';

exports.CASErrorMsgId = [
  ['CAS_ER_DBMS' , -1000],
  ['CAS_ER_INTERNAL' , -1001],
  ['CAS_ER_NO_MORE_MEMORY' , -1002],
  ['CAS_ER_COMMUNICATION' , -1003],
  ['CAS_ER_ARGS' , -1004],
  ['CAS_ER_TRAN_TYPE' , -1005],
  ['CAS_ER_SRV_HANDLE' , -1006],
  ['CAS_ER_NUM_BIND' , -1007],
  ['CAS_ER_UNKNOWN_U_TYPE' , -1008],
  ['CAS_ER_DB_VALUE' , -1009],
  ['CAS_ER_TYPE_CONVERSION' , -1010],
  ['CAS_ER_PARAM_NAME' , -1011],
  ['CAS_ER_NO_MORE_DATA' , -1012],
  ['CAS_ER_OBJECT' , -1013],
  ['CAS_ER_OPEN_FILE' , -1014],
  ['CAS_ER_SCHEMA_TYPE' , -1015],
  ['CAS_ER_VERSION' , -1016],
  ['CAS_ER_FREE_SERVER' , -1017],
  ['CAS_ER_NOT_AUTHORIZED_CLIENT' , -1018],
  ['CAS_ER_QUERY_CANCEL' , -1019],
  ['CAS_ER_NOT_COLLECTION' , -1020],
  ['CAS_ER_COLLECTION_DOMAIN' , -1021],
  ['CAS_ER_NO_MORE_RESULT_SET' , -1022],
  ['CAS_ER_INVALID_CALL_STMT' , -1023],
  ['CAS_ER_STMT_POOLING' , -1024],
  ['CAS_ER_DBSERVER_DISCONNECTED' , -1025],
  ['CAS_ER_MAX_PREPARED_STMT_COUNT_EXCEEDED' , -1026],
  ['CAS_ER_HOLDABLE_NOT_ALLOWED' , -1027],
  ['CAS_ER_NOT_IMPLEMENTED' , -1100],
  ['CAS_ER_IS' , -1200]
];
