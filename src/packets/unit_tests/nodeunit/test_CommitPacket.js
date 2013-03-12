var PacketReader = require('../../PacketReader'),
  PacketWriter = require('../../PacketWriter'),
  CommitPacket = require('../../CommitPacket'),
  CAS = require('../../../constants/CASConstants');

exports['test_CommitPacket'] = function (test) {
  test.expect(16);
  console.log('Unit test ' + module.filename.toString() + ' started...');
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {casInfo : [0, 255, 255, 255], dbVersion : '8.4.1'};
  var commitPacket = new CommitPacket(options);

  commitPacket.write(packetWriter);
  test.equal(packetWriter._toBuffer()[3], 6); //total length

  test.equal(packetWriter._toBuffer()[4], 0); //casInfo
  test.equal(packetWriter._toBuffer()[5], 255); //casInfo
  test.equal(packetWriter._toBuffer()[6], 255); //casInfo
  test.equal(packetWriter._toBuffer()[7], 255); //casInfo

  test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_END_TRAN);
  test.equal(packetWriter._toBuffer()[12], 1);
  test.equal(packetWriter._toBuffer()[13], CAS.CCITransactionType.CCI_TRAN_COMMIT);

  packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

  test.equal(packetReader._packetLength(), 12);

  commitPacket.parse(packetReader);

  test.equal(commitPacket.casInfo[0], 0); //casInfo
  test.equal(commitPacket.casInfo[1], 255); //casInfo
  test.equal(commitPacket.casInfo[2], 255); //casInfo
  test.equal(commitPacket.casInfo[3], 255); //casInfo

  test.equal(commitPacket.responseCode, 0);
  test.equal(commitPacket.errorCode, 0);
  test.equal(commitPacket.errorMsg, '');

  console.log('Unit test ended OK.');
  test.done();
};


