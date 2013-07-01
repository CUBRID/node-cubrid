var PacketReader = require('../../PacketReader'),
  PacketWriter = require('../../PacketWriter'),
  CloseQueryPacket = require('../../CloseQueryPacket'),
  CAS = require('../../../constants/CASConstants');

exports['test_CloseQueryPacket'] = function (test) {
  test.expect(18);
  console.log('Unit test ' + module.filename.toString() + ' started...');
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {casInfo : [0, 255, 255, 255], dbVersion : '8.4.1'};
  var closeQueryPacket = new CloseQueryPacket(options);

  closeQueryPacket.write(packetWriter);
  test.equal(packetWriter._toBuffer()[3], 14); // Total length

  test.equal(packetWriter._toBuffer()[4], 0); // CasInfo
  test.equal(packetWriter._toBuffer()[5], 255); // CasInfo
  test.equal(packetWriter._toBuffer()[6], 255); // CasInfo
  test.equal(packetWriter._toBuffer()[7], 255); // CasInfo

  test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_CLOSE_REQ_HANDLE);
  test.equal(packetWriter._toBuffer()[12], 4);
  test.equal(packetWriter._toBuffer()[16], 0);
  test.equal(packetWriter._toBuffer()[20], 1);
  test.equal(packetWriter._toBuffer()[21], 0);

  packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

  test.equal(packetReader._packetLength(), 12);

  closeQueryPacket.parse(packetReader);

  test.equal(closeQueryPacket.casInfo[0], 0); // CasInfo
  test.equal(closeQueryPacket.casInfo[1], 255); // CasInfo
  test.equal(closeQueryPacket.casInfo[2], 255); // CasInfo
  test.equal(closeQueryPacket.casInfo[3], 255); // CasInfo

  test.equal(closeQueryPacket.responseCode, 0);

  test.equal(closeQueryPacket.errorCode, 0);
  test.equal(closeQueryPacket.errorMsg, '');
  console.log('Unit test ended OK.');
  test.done();
};
