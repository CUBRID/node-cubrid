var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  CommitPacket = require('../CommitPacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testCommitPacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {casInfo : [0, 255, 255, 255], dbVersion : '8.4.1'};
  var commitPacket = new CommitPacket(options);

  commitPacket.write(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 6); // Total length

  assert.equal(packetWriter._toBuffer()[4], 0); // CasInfo
  assert.equal(packetWriter._toBuffer()[5], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[6], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[7], 255); // CasInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_END_TRAN);
  assert.equal(packetWriter._toBuffer()[12], 1);
  assert.equal(packetWriter._toBuffer()[13], CAS.CCITransactionType.CCI_TRAN_COMMIT);

  packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

  assert.equal(packetReader._packetLength(), 12);

  commitPacket.parse(packetReader);

  assert.equal(commitPacket.casInfo[0], 0); // CasInfo
  assert.equal(commitPacket.casInfo[1], 255); // CasInfo
  assert.equal(commitPacket.casInfo[2], 255); // CasInfo
  assert.equal(commitPacket.casInfo[3], 255); // CasInfo

  assert.equal(commitPacket.responseCode, 0);

  assert.equal(commitPacket.errorCode, 0);
  assert.equal(commitPacket.errorMsg, '');
}

console.log('Unit test ' + module.filename.toString() + ' started...');

testCommitPacket_01();

console.log('Unit test ended OK.');

