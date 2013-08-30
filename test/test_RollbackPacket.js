exports['test_RollbackPacket'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			RollbackPacket = require('../src' + codeCoveragePath + '/packets/RollbackPacket'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants');

	test.expect(16);
	var packetReader = new PacketReader(),
			rollbackPacket = new RollbackPacket({casInfo : [0, 255, 255, 255], dbVersion : '8.4.1'}),
			packetWriter = new PacketWriter(rollbackPacket.getBufferLength());

	rollbackPacket.write(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 6); // Total length

	test.equal(packetWriter._toBuffer()[4], 0); // Casinfo
	test.equal(packetWriter._toBuffer()[5], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[6], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[7], 255); // Casinfo

	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_END_TRAN);
	test.equal(packetWriter._toBuffer()[12], 1);
	test.equal(packetWriter._toBuffer()[13], CAS.CCITransactionType.CCI_TRAN_ROLLBACK);

	packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

	test.equal(packetReader._packetLength(), 12);

	rollbackPacket.parse(packetReader);

	test.equal(rollbackPacket.casInfo[0], 0); // Casinfo
	test.equal(rollbackPacket.casInfo[1], 255); // Casinfo
	test.equal(rollbackPacket.casInfo[2], 255); // Casinfo
	test.equal(rollbackPacket.casInfo[3], 255); // Casinfo

	test.equal(rollbackPacket.responseCode, 0);

	test.equal(rollbackPacket.errorCode, 0);
	test.equal(rollbackPacket.errorMsg, '');
	test.done();
};

