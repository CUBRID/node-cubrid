var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  GetDbParameterPacket = require('../GetDbParameterPacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testGetDbParameter() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options =
  {
    casInfo   : [0, 255, 255, 255],
    parameter : CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH
  };
  var getDbParameterPacket = new GetDbParameterPacket(options);

  getDbParameterPacket.write(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 9); // Total length
  assert.equal(packetWriter._toBuffer()[8], 4);
  assert.equal(packetWriter._toBuffer()[12], CAS.CASFunctionCode.CAS_FC_GET_DB_PARAMETER);
  assert.equal(packetWriter._toBuffer()[16], CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH);

  packetReader.write(new Buffer([0, 0, 0, 0,
                                 0, 255, 255, 255,
                                 0, 0, 0, 0,
                                 0, 0, 0, 99]));
  getDbParameterPacket.parse(packetReader);

  assert.equal(getDbParameterPacket.casInfo[0], 0); // CasInfo
  assert.equal(getDbParameterPacket.casInfo[1], 255); // CasInfo
  assert.equal(getDbParameterPacket.casInfo[2], 255); // CasInfo
  assert.equal(getDbParameterPacket.casInfo[3], 255); // CasInfo

  assert.equal(getDbParameterPacket.responseCode, 0);
  assert.equal(getDbParameterPacket.errorCode, 0);
  assert.equal(getDbParameterPacket.errorMsg, '');

  assert.equal(getDbParameterPacket.value, 99);
}

console.log('Unit test ' + module.filename.toString() + ' started...');
testGetDbParameter();
console.log('Unit test ended OK.');
