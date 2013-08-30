exports['test_GetSchemaPacket'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			GetSchemaPacket = require('../src' + codeCoveragePath + '/packets/GetSchemaPacket.js'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants'),
			packetReader = new PacketReader(),
			getSchemaPacket = new GetSchemaPacket({
				casInfo: [0, 255, 255, 255],
				tableNamePattern: null,
				schemaType: CAS.CUBRIDSchemaType.CCI_SCH_CLASS,
				dbVersion: '8.4.1'
			}),
			packetWriter = new PacketWriter(getSchemaPacket.getRequestSchemaBufferLength());

	test.expect(29);

	getSchemaPacket.writeRequestSchema(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 1 + 5 * 4 + 1); // Total length

	test.equal(packetWriter._toBuffer()[4], 0); // Casinfo
	test.equal(packetWriter._toBuffer()[5], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[6], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[7], 255); // Casinfo

	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_SCHEMA_INFO);
	test.equal(packetWriter._toBuffer()[16], CAS.CUBRIDSchemaType.CCI_SCH_CLASS);
	test.equal(packetWriter._toBuffer()[21], 0);
	test.equal(packetWriter._toBuffer()[28], 1);
	test.equal(packetWriter._toBuffer()[29], 3);

	packetReader.write(new Buffer([0, 0, 0, 0, 0, 255, 255, 255, 0, 0, 0, 1]));

	test.equal(packetReader._packetLength(), 12);

	getSchemaPacket.parseRequestSchema(packetReader);

	test.equal(getSchemaPacket.casInfo[0], 0); // Casinfo
	test.equal(getSchemaPacket.casInfo[1], 255); // Casinfo
	test.equal(getSchemaPacket.casInfo[2], 255); // Casinfo
	test.equal(getSchemaPacket.casInfo[3], 255); // Casinfo

	test.equal(getSchemaPacket.responseCode, 1);

	test.equal(getSchemaPacket.errorCode, 0);
	test.equal(getSchemaPacket.errorMsg, '');

	packetWriter = new PacketWriter(getSchemaPacket.getFetchSchemaBufferLength());
	getSchemaPacket.writeFetchSchema(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 38); //total length

	test.equal(packetWriter._toBuffer()[4], 0); // Casinfo
	test.equal(packetWriter._toBuffer()[5], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[6], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[7], 255); // Casinfo

	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_FETCH);
	test.equal(packetWriter._toBuffer()[16], 1);
	test.equal(packetWriter._toBuffer()[24], 1);
	test.equal(packetWriter._toBuffer()[32], 0);
	test.equal(packetWriter._toBuffer()[37], 0);
	test.equal(packetWriter._toBuffer()[45], 0);
	test.done();
};
