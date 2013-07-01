var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  CloseQueryPacket = require('../CloseQueryPacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testCloseQueryPacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {casInfo : [0, 255, 255, 255], dbVersion : '8.4.1'};
  var closeQueryPacket = new CloseQueryPacket(options);

  closeQueryPacket.write(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 14); // Total length

  assert.equal(packetWriter._toBuffer()[4], 0); // CasInfo
  assert.equal(packetWriter._toBuffer()[5], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[6], 255); // CasInfo
  assert.equal(packetWriter._toBuffer()[7], 255); // CasInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_CLOSE_REQ_HANDLE);
  assert.equal(packetWriter._toBuffer()[12], 4);
  assert.equal(packetWriter._toBuffer()[16], 0);
  assert.equal(packetWriter._toBuffer()[20], 1);
  assert.equal(packetWriter._toBuffer()[21], 0);

  packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

  assert.equal(packetReader._packetLength(), 12);

  closeQueryPacket.parse(packetReader);

  assert.equal(closeQueryPacket.casInfo[0], 0); // CasInfo
  assert.equal(closeQueryPacket.casInfo[1], 255); // CasInfo
  assert.equal(closeQueryPacket.casInfo[2], 255); // CasInfo
  assert.equal(closeQueryPacket.casInfo[3], 255); // CasInfo

  assert.equal(closeQueryPacket.responseCode, 0);

  assert.equal(closeQueryPacket.errorCode, 0);
  assert.equal(closeQueryPacket.errorMsg, '');
}

console.log('Unit test ' + module.filename.toString() + ' started...');

testCloseQueryPacket_01();

console.log('Unit test ended OK.');

