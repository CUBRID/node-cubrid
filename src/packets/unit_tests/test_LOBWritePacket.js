var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  LOBWritePacket = require('../LOBWritePacket'),
  CAS = require('../../constants/CASConstants'),
  assert = require('assert');

function testLOBReadPacket_01() {
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var packedLobHandle = new Buffer([0, 0, 0, 33, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 79, 102, 105, 108, 101, 58,
                                    67, 58, 92, 67, 85, 66, 82, 73, 68, 92, 100, 97, 116, 97, 98, 97, 115, 101, 115, 92, 100, 101, 109, 111, 100,
                                    98, 47, 108, 111, 98, 47, 99, 101, 115, 95, 48, 56, 50, 47, 116, 101, 115, 116, 95, 108, 111, 98, 46, 48, 48,
                                    48, 48, 49, 51, 54, 49, 57, 55, 54, 53, 52, 50, 48, 48, 48, 48, 48, 48, 95, 56, 49, 52, 53, 0
  ]);
  var lobHandle =
  {
    lobType         : CAS.CUBRIDDataType.CCI_U_TYPE_BLOB, //BLOB type
    packedLobHandle : packedLobHandle,
    fileLocator     : 'file:C:\\CUBRID\\databases\\demodb/lob/ces_670/test_lob.00001361976357078000_1538',
    lobLength       : 4
  };
  var value = new Buffer([1, 2, 3, 4]);

  var options = {
    casInfo   : [0, 255, 255, 255],
    lobObject : lobHandle,
    position  : 0,
    data      : value,
    writeLen  : 4,
    dbVersion : '8.4.1'
  };
  var lobWritePacket = new LOBWritePacket(options);

  lobWritePacket.write(packetWriter);
  assert.equal(packetWriter._toBuffer()[3], 120); //total length

  assert.equal(packetWriter._toBuffer()[4], 0); //casInfo
  assert.equal(packetWriter._toBuffer()[5], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[6], 255); //casInfo
  assert.equal(packetWriter._toBuffer()[7], 255); //casInfo

  assert.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_LOB_WRITE);
  assert.equal(packetWriter._toBuffer()[12], 95);
  for (var i = 0; i < packedLobHandle.length; i++) {
    assert.equal(packetWriter._toBuffer().slice(13, 110)[i], packedLobHandle[i]);
  }
  assert.equal(packetWriter._toBuffer()[111], 8);
  assert.equal(packetWriter._toBuffer()[119], 0);
  assert.equal(packetWriter._toBuffer()[123], 4);
  assert.equal(packetWriter._toBuffer()[124], 1);
  assert.equal(packetWriter._toBuffer()[125], 2);
  assert.equal(packetWriter._toBuffer()[126], 3);
  assert.equal(packetWriter._toBuffer()[127], 4);

  packetReader.write(new Buffer([0, 0, 0, 4,
                                 0, 255, 255, 255,
                                 0, 0, 0, 4,
                                 1, 2, 3, 4]));
  lobWritePacket.parse(packetReader);

  assert.equal(lobWritePacket.casInfo[0], 0); //casInfo
  assert.equal(lobWritePacket.casInfo[1], 255); //casInfo
  assert.equal(lobWritePacket.casInfo[2], 255); //casInfo
  assert.equal(lobWritePacket.casInfo[3], 255); //casInfo

  assert.equal(lobWritePacket.responseCode, 4);

  assert.equal(lobWritePacket.errorCode, 0);
  assert.equal(lobWritePacket.errorMsg, '');
}

console.log('Unit test ' + module.filename.toString() + ' started...');

testLOBReadPacket_01();

console.log('Unit test ended OK.');

