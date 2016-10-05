/**
 * Define CUBRID internal error messages and custom driver error messages
 */

exports.ERROR_NEW_BROKER_PORT = 'Error receiving a new connection port.';
exports.ERROR_CONNECTION_ALREADY_OPENED = 'The connection is already opened: denying a second connection request.';
exports.ERROR_CONNECTION_ALREADY_PENDING = 'A connection is already in progress: denying current connection request.';
exports.ERROR_CONNECTION_ALREADY_CLOSED = 'The connection is already closed.';
exports.ERROR_MULTIPLE_QUERIES = 'Multiple queries are not supported when using the old prepare-execute protocol.';
exports.ERROR_NO_ACTIVE_QUERY = 'No active query with this handle.';
exports.ERROR_NO_ROLLBACK = 'AutoCommitMode is enabled: denying rollback request.';
exports.ERROR_AUTO_COMMIT_ENABLED_COMMIT = 'AutoCommitMode is enabled: denying commit request.';
exports.ERROR_ON_CLOSE_QUERY_HANDLE = 'Error closing request: ';
exports.ERROR_INPUT_VALIDATION = 'Error validating input parameters.';
exports.ERROR_INVALID_DATA_TYPE = 'Invalid data type.';
exports.ERROR_INVALID_SCHEMA_TYPE = 'Invalid schema type.';
exports.ERROR_INVALID_LOB_POSITION = 'Invalid LOB position.';
exports.ERROR_INVALID_LOB_TYPE = 'Invalid LOB type.';
exports.ERROR_INVALID_LOB_DATA = 'Invalid LOB data: must be a string or Buffer.';
// Set the same timeout error message as emitted by Node.js socket client.
exports.ERROR_CONNECTION_TIMEOUT = 'connect ETIMEDOUT';
exports.ERROR_CLOSED_CONNECTION_COMMIT = 'Cannot commit on a closed/offline connection.';
exports.ERROR_QUERIES_IN_PROGRESS = "Cannot close the connection: there are queries in execution.";

exports.CASErrorMsgId = {
  '-1000': 'CAS_ER_DBMS',
  '-1001': 'CAS_ER_INTERNAL',
  '-1002': 'CAS_ER_NO_MORE_MEMORY',
  '-1003': 'CAS_ER_COMMUNICATION',
  '-1004': 'CAS_ER_ARGS',
  '-1005': 'CAS_ER_TRAN_TYPE',
  '-1006': 'CAS_ER_SRV_HANDLE',
  /* CUBRID 9.0.0 returns a different error code for the same error. */
  '-10007': 'CAS_ER_NUM_BIND',
  '-1007': 'CAS_ER_NUM_BIND',
  '-1008': 'CAS_ER_UNKNOWN_U_TYPE',
  '-1009': 'CAS_ER_DB_VALUE',
  '-1010': 'CAS_ER_TYPE_CONVERSION',
  '-1011': 'CAS_ER_PARAM_NAME',
  '-1012': 'CAS_ER_NO_MORE_DATA',
  '-1013': 'CAS_ER_OBJECT',
  '-1014': 'CAS_ER_OPEN_FILE',
  '-1015': 'CAS_ER_SCHEMA_TYPE',
  '-1016': 'CAS_ER_VERSION',
  '-1017': 'CAS_ER_FREE_SERVER',
  '-1018': 'CAS_ER_NOT_AUTHORIZED_CLIENT',
  '-1019': 'CAS_ER_QUERY_CANCEL',
  '-1020': 'CAS_ER_NOT_COLLECTION',
  '-1021': 'CAS_ER_COLLECTION_DOMAIN',
  '-1022': 'CAS_ER_NO_MORE_RESULT_SET',
  '-1023': 'CAS_ER_INVALID_CALL_STMT',
  '-1024': 'CAS_ER_STMT_POOLING',
  '-1025': 'CAS_ER_DBSERVER_DISCONNECTED',
  '-1026': 'CAS_ER_MAX_PREPARED_STMT_COUNT_EXCEEDED',
  '-1027': 'CAS_ER_HOLDABLE_NOT_ALLOWED',
  '-1100': 'CAS_ER_NOT_IMPLEMENTED',
  '-1200': 'CAS_ER_IS',
};

exports.resolveErrorCode = function (errorCode) {
  return exports.CASErrorMsgId['' + errorCode];
};
