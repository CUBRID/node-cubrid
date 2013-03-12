var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  RollbackPacket = require('../RollbackPacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testRollbackPacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {casInfo : [0, 255, 255, 255]};
  var rollbackPacket = new RollbackPacket(options);

  rollbackPacket.write(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 6); //total length

  assert.equal(packetWriter._toBuffer()[4], 0); //casInfo
  assert.equal(packetWriter._toBuffer()[5], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[6], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[7], 255); //casInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_END_TRAN);
  assert.equal(packetWriter._toBuffer()[12], 1);
  assert.equal(packetWriter._toBuffer()[13], CAS.CCITransactionType.CCI_TRAN_ROLLBACK);

  packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

  assert.equal(packetReader._packetLength(), 12);

  rollbackPacket.parse(packetReader);

  assert.equal(rollbackPacket.casInfo[0], 0); //casInfo
  assert.equal(rollbackPacket.casInfo[1], 255); //casInfo
  assert.equal(rollbackPacket.casInfo[2], 255); //casInfo
  assert.equal(rollbackPacket.casInfo[3], 255); //casInfo

  assert.equal(rollbackPacket.responseCode, 0);

  assert.equal(rollbackPacket.errorCode, 0);
  assert.equal(rollbackPacket.errorMsg, '');
}

console.log('Unit test ' + module.filename.toString() + ' started...');

testRollbackPacket_01();

console.log('Unit test ended OK.');

