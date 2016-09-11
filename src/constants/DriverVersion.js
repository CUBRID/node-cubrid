/**
 * Define the supported protocol version
 * The protocol version is validated by the CUBRID broker,
 * to assess the compatibility level with the CUBRID engine.
 */
const CAS_PROTO_INDICATOR = 0x40;
const CAS_PROTOCOL_VERSION = 0x01;

exports.CAS_VER = CAS_PROTO_INDICATOR | CAS_PROTOCOL_VERSION;
