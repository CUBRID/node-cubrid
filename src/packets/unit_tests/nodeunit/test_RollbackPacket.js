var PacketReader = require('../../PacketReader'),
  PacketWriter = require('../../PacketWriter'),
  RollbackPacket = require('../../RollbackPacket'),
  CAS = require('../../../constants/CASConstants');

exports['test_RollbackPacket'] = function (test) {
  test.expect(16);
  console.log('Unit test ' + module.filename.toString() + ' started...');
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {casInfo : [0, 255, 255, 255], dbVersion : '8.4.1'};
  var rollbackPacket = new RollbackPacket(options);

  rollbackPacket.write(packetWriter);
  test.equal(packetWriter._toBuffer()[3], 6); //total length

  test.equal(packetWriter._toBuffer()[4], 0); //casInfo
  test.equal(packetWriter._toBuffer()[5], 255); //casInfo
  test.equal(packetWriter._toBuffer()[6], 255); //casInfo
  test.equal(packetWriter._toBuffer()[7], 255); //casInfo

  test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_END_TRAN);
  test.equal(packetWriter._toBuffer()[12], 1);
  test.equal(packetWriter._toBuffer()[13], CAS.CCITransactionType.CCI_TRAN_ROLLBACK);

  packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

  test.equal(packetReader._packetLength(), 12);

  rollbackPacket.parse(packetReader);

  test.equal(rollbackPacket.casInfo[0], 0); //casInfo
  test.equal(rollbackPacket.casInfo[1], 255); //casInfo
  test.equal(rollbackPacket.casInfo[2], 255); //casInfo
  test.equal(rollbackPacket.casInfo[3], 255); //casInfo

  test.equal(rollbackPacket.responseCode, 0);

  test.equal(rollbackPacket.errorCode, 0);
  test.equal(rollbackPacket.errorMsg, '');
  console.log('Unit test ended OK.');
  test.done();
};

