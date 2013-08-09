exports['test_CommitPacket'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			CommitPacket = require('../src' + codeCoveragePath + '/packets/CommitPacket'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants'),
			packetReader = new PacketReader(),
			commitPacket = new CommitPacket({
				casInfo: [0, 255, 255, 255],
				dbVersion : '8.4.1'
			}),
			packetWriter = new PacketWriter(commitPacket.getBufferLength());

	test.expect(16);

	commitPacket.write(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 6); // Total length

	test.equal(packetWriter._toBuffer()[4], 0); // CasInfo
	test.equal(packetWriter._toBuffer()[5], 255); // CasInfo
	test.equal(packetWriter._toBuffer()[6], 255); // CasInfo
	test.equal(packetWriter._toBuffer()[7], 255); // CasInfo

	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_END_TRAN);
	test.equal(packetWriter._toBuffer()[12], 1);
	test.equal(packetWriter._toBuffer()[13], CAS.CCITransactionType.CCI_TRAN_COMMIT);

	packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));

	test.equal(packetReader._packetLength(), 12);

	commitPacket.parse(packetReader);

	test.equal(commitPacket.casInfo[0], 0); // CasInfo
	test.equal(commitPacket.casInfo[1], 255); // CasInfo
	test.equal(commitPacket.casInfo[2], 255); // CasInfo
	test.equal(commitPacket.casInfo[3], 255); // CasInfo

	test.equal(commitPacket.responseCode, 0);
	test.equal(commitPacket.errorCode, 0);
	test.equal(commitPacket.errorMsg, '');

	test.done();
};
