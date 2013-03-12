var PacketReader = require('../../PacketReader'),
  PacketWriter = require('../../PacketWriter'),
  GetDbParameterPacket = require('../../GetDbParameterPacket'),
  CAS = require('../../../constants/CASConstants');

exports['test_GetDbPatameterPacket'] = function (test) {
  test.expect(12);
  console.log('Unit test ' + module.filename.toString() + ' started...');
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options =
  {
    casInfo   : [0, 255, 255, 255],
    parameter : CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH
  };
  var getDbParameterPacket = new GetDbParameterPacket(options);

  getDbParameterPacket.write(packetWriter);
  test.equal(packetWriter._toBuffer()[3], 9); //total length
  test.equal(packetWriter._toBuffer()[8], 4);
  test.equal(packetWriter._toBuffer()[12], CAS.CASFunctionCode.CAS_FC_GET_DB_PARAMETER);
  test.equal(packetWriter._toBuffer()[16], CAS.CCIDbParam.CCI_PARAM_MAX_STRING_LENGTH);

  packetReader.write(new Buffer([0, 0, 0, 0,
                                 0, 255, 255, 255,
                                 0, 0, 0, 0,
                                 0, 0, 0, 99]));
  getDbParameterPacket.parse(packetReader);

  test.equal(getDbParameterPacket.casInfo[0], 0); //casInfo
  test.equal(getDbParameterPacket.casInfo[1], 255); //casInfo
  test.equal(getDbParameterPacket.casInfo[2], 255); //casInfo
  test.equal(getDbParameterPacket.casInfo[3], 255); //casInfo

  test.equal(getDbParameterPacket.responseCode, 0);
  test.equal(getDbParameterPacket.errorCode, 0);
  test.equal(getDbParameterPacket.errorMsg, '');

  test.equal(getDbParameterPacket.value, 99);
  console.log('Unit test ended OK.');
  test.done();
};
