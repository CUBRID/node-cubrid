var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
		PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
		PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
		CloseDatabasePacket = require('../src' + codeCoveragePath + '/packets/CloseDatabasePacket'),
		CAS = require('../src' + codeCoveragePath + '/constants/CASConstants');

exports['test_CloseConnectionPacket'] = function (test) {
	test.expect(14);
	var packetReader = new PacketReader();
	var packetWriter = new PacketWriter();
	var options = {casInfo : [0, 255, 255, 255]};
	var closeDatabasePacket = new CloseDatabasePacket(options);

	closeDatabasePacket.write(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 1); // Total length

	test.equal(packetWriter._toBuffer()[4], 0); // CasInfo
	test.equal(packetWriter._toBuffer()[5], 255); // CasInfo
	test.equal(packetWriter._toBuffer()[6], 255); // CasInfo
	test.equal(packetWriter._toBuffer()[7], 255); // CasInfo

	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_CON_CLOSE);

	packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

	test.equal(packetReader._packetLength(), 12);

	closeDatabasePacket.parse(packetReader);

	test.equal(closeDatabasePacket.casInfo[0], 0); // CasInfo
	test.equal(closeDatabasePacket.casInfo[1], 255); // CasInfo
	test.equal(closeDatabasePacket.casInfo[2], 255); // CasInfo
	test.equal(closeDatabasePacket.casInfo[3], 255); // CasInfo

	test.equal(closeDatabasePacket.responseCode, 0);

	test.equal(closeDatabasePacket.errorCode, 0);
	test.equal(closeDatabasePacket.errorMsg, '');
	test.done();
};
