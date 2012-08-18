/**
 * Define the supported protocol version
 * The protocol version is validated by the CUBRID broker,
 * to assess the compatibility level with the CUBRID engine.
 */
var CAS_PROTO_INDICATOR = 0x40;
var CAS_PROTOCOL_VERSION = 0x01;

exports.CAS_VER = CAS_PROTO_INDICATOR | CAS_PROTOCOL_VERSION;

/**
 * Current driver version
 * @type {String}
 */
exports.DRIVER_VER = '0.1';

