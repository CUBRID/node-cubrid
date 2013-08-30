/**
 * Define standard CUBRID data types size (in bytes)
 */

exports.UNSPECIFIED_SIZEOF = 0;
exports.BYTE_SIZEOF = 1;
exports.BOOL_SIZEOF = 1;
exports.INT_SIZEOF = 4;
exports.LONG_SIZEOF = 8;
exports.OBJECT_SIZEOF = 8;
exports.SHORT_SIZEOF = 2;
exports.FLOAT_SIZEOF = 4;
exports.DOUBLE_SIZEOF = 8;
exports.DATE_SIZEOF = 14;
exports.TIME_SIZEOF = 14;
exports.DATETIME_SIZEOF = 14;
exports.TIMESTAMP_SIZEOF = 14;

exports.RESULTSET_SIZEOF = 4;
exports.OID_SIZEOF = 8;
exports.BROKER_INFO_SIZEOF = 8;

// `DATA_LENGTH_SIZEOF` represents the length of the current
// server response in bytes. This means that the first four
// bytes of the response buffer indicates on the length of
// this response.
exports.DATA_LENGTH_SIZEOF = 4;
// Next four bytes (`CAS_INFO_SIZE`) of the response buffer
// represent the information about CAS (CUBRID Application
// Server) which was assigned to this request by CUBRID
// Broker.
exports.CAS_INFO_SIZE = 4;



