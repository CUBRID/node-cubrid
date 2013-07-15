exports['test_BatchExecuteNoQueryPacket'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			BatchExecuteNoQueryPacket = require('../src' + codeCoveragePath + '/packets/BatchExecuteNoQueryPacket'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants'),
			packetReader = new PacketReader(),
			packetWriter = new PacketWriter(),
			options = {
				SQLs: ['create table t1(id int)', 'drop table t1'],
				casInfo: [0, 255, 255, 255],
				autoCommitMode: 1,
				dbVersion: '8.4.1'
			},
			batchExecuteNoQueryPacket = new BatchExecuteNoQueryPacket(options);

	test.expect(16);

	batchExecuteNoQueryPacket.write(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 52); // Total length

	test.equal(packetWriter._toBuffer()[4], 0); // CasInfo
	test.equal(packetWriter._toBuffer()[5], 255); // CasInfo
	test.equal(packetWriter._toBuffer()[6], 255); // CasInfo
	test.equal(packetWriter._toBuffer()[7], 255); // CasInfo

	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_EXECUTE_BATCH);
	test.equal(packetWriter._toBuffer()[13], 1);
	test.equal(packetWriter._toBuffer().slice(18, 41).toString(), 'create table t1(id int)');
	test.equal(packetWriter._toBuffer().slice(41 + 1 + 4, 59).toString(), 'drop table t1');

	packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 0]));
	batchExecuteNoQueryPacket.parse(packetReader);

	test.equal(batchExecuteNoQueryPacket.casInfo[0], 0); // CasInfo
	test.equal(batchExecuteNoQueryPacket.casInfo[1], 255); // CasInfo
	test.equal(batchExecuteNoQueryPacket.casInfo[2], 255); // CasInfo
	test.equal(batchExecuteNoQueryPacket.casInfo[3], 255); // CasInfo

	test.equal(batchExecuteNoQueryPacket.responseCode, 0);

	test.equal(batchExecuteNoQueryPacket.errorCode, 0);
	test.equal(batchExecuteNoQueryPacket.errorMsg, '');
	test.done();
};
