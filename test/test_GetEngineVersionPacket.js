exports['test_GetEngineVersionPacket'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			GetEngineVersionPacket = require('../src' + codeCoveragePath + '/packets/GetEngineVersionPacket'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants'),
			packetReader = new PacketReader(),
			getEngineVersionPacket = new GetEngineVersionPacket({casInfo : [0, 255, 255, 255]}),
			packetWriter = new PacketWriter(getEngineVersionPacket.getBufferLength());

	test.expect(16);

	getEngineVersionPacket.write(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 6); // Total length

	test.equal(packetWriter._toBuffer()[4], 0); // Casinfo
	test.equal(packetWriter._toBuffer()[5], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[6], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[7], 255); // Casinfo

	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_GET_DB_VERSION);
	test.equal(packetWriter._toBuffer()[12], 1);
	test.equal(packetWriter._toBuffer()[13], 1);

	packetReader.write(new Buffer([0, 0, 0, 15,
		0, 255, 255, 255,
		0, 0, 0, 0]));
	packetReader._append(new Buffer('8.4.1.0056'));
	packetReader._append(new Buffer([0]));
	getEngineVersionPacket.parse(packetReader);

	test.equal(getEngineVersionPacket.casInfo[0], 0); // Casinfo
	test.equal(getEngineVersionPacket.casInfo[1], 255); // Casinfo
	test.equal(getEngineVersionPacket.casInfo[2], 255); // Casinfo
	test.equal(getEngineVersionPacket.casInfo[3], 255); // Casinfo

	test.equal(getEngineVersionPacket.responseCode, 0);

	test.equal(getEngineVersionPacket.errorCode, 0);
	test.equal(getEngineVersionPacket.errorMsg, '');

	test.equal(getEngineVersionPacket.engineVersion, '8.4.1.0056');
	test.done();
};

