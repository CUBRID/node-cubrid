var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  SetDbParameterPacket = require('../SetDbParameterPacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testSetDbParameter() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options =
  {
    casInfo   : [0, 255, 255, 255],
    parameter : CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH,
    value     : 99
  };
  var setDbParameterPacket = new SetDbParameterPacket(options);

  setDbParameterPacket.write(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 17); //total length
  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_SET_DB_PARAMETER);
  assert.equal(packetWriter._toBuffer()[12], 4);
  assert.equal(packetWriter._toBuffer()[16], CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH);
  assert.equal(packetWriter._toBuffer()[20], 4);
  assert.equal(packetWriter._toBuffer()[24], 99);

  packetReader.write(new Buffer([0, 0, 0, 0,
                                 0, 255, 255, 255,
                                 0, 0, 0, 0]));
  setDbParameterPacket.parse(packetReader);

  assert.equal(setDbParameterPacket.casInfo[0], 0); //casInfo
  assert.equal(setDbParameterPacket.casInfo[1], 255); //casInfo
  assert.equal(setDbParameterPacket.casInfo[2], 255); //casInfo
  assert.equal(setDbParameterPacket.casInfo[3], 255); //casInfo

  assert.equal(setDbParameterPacket.responseCode, 0);
  assert.equal(setDbParameterPacket.errorCode, 0);
  assert.equal(setDbParameterPacket.errorMsg, '');
}

console.log('Unit test ' + module.filename.toString() + ' started...');
testSetDbParameter();
console.log('Unit test ended OK.');
