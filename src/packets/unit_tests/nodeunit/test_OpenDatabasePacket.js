var PacketReader = require('../../PacketReader'),
  PacketWriter = require('../../PacketWriter'),
  OpenDatabasePacket = require('../../OpenDatabasePacket'),
  CAS = require('../../../constants/CASConstants'),
  assert = require('assert');

exports['test_OpenDatabasePacket'] = function (test) {
  test.expect(12);
  console.log('Unit test ' + module.filename.toString() + ' started...');
  var packetReader = new PacketReader();
  var packetWriter = new PacketWriter();
  var options = {database : 'demodb', user : 'public', password : ''};
  var openDatabasePacket = new OpenDatabasePacket(options);

  openDatabasePacket.write(packetWriter);
  test.equal(packetWriter._toBuffer().slice(0, 6).toString(), options.database);
  test.equal(packetWriter._toBuffer().slice(32, 38).toString(), options.user);
  test.equal(packetWriter._toBuffer().slice(64, 65)[0], 0);

  packetReader.write(new Buffer([0, 0, 0, 15,
                                 0, 255, 255, 255,
                                 0, 0, 0, 0,
                                 5, 5, 5, 5, 5, 5, 5, 5,
                                 0, 0, 0, 3]));
  openDatabasePacket.parse(packetReader);

  test.equal(openDatabasePacket.casInfo[0], 0); // Casinfo
  test.equal(openDatabasePacket.casInfo[1], 255); // Casinfo
  test.equal(openDatabasePacket.casInfo[2], 255); // Casinfo
  test.equal(openDatabasePacket.casInfo[3], 255); // Casinfo

  test.equal(openDatabasePacket.responseCode, 0);

  test.equal(openDatabasePacket.errorCode, 0);
  test.equal(openDatabasePacket.errorMsg, '');

  test.equal(openDatabasePacket.brokerInfo[0], 5);
  test.equal(openDatabasePacket.sessionId, 3);
  console.log('Unit test ended OK.');
  test.done();
};
