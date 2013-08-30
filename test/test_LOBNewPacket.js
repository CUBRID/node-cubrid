exports['test_LOBNewPacket'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			LOBNewPacket = require('../src' + codeCoveragePath + '/packets/LOBNewPacket'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants'),
			packetReader = new PacketReader(),
			lobnewPacket = new LOBNewPacket({
				casInfo: [0, 255, 255, 255],
				lobType: CAS.CUBRIDDataType.CCI_U_TYPE_BLOB,
				dbVersion: '8.4.1'
			}),
			packetWriter = new PacketWriter(lobnewPacket.getBufferLength());

	test.expect(18);

	lobnewPacket.write(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 9); // Total length

	test.equal(packetWriter._toBuffer()[4], 0); // Casinfo
	test.equal(packetWriter._toBuffer()[5], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[6], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[7], 255); // Casinfo

	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_LOB_NEW);
	test.equal(packetWriter._toBuffer()[12], 4);
	test.equal(packetWriter._toBuffer()[16], CAS.CUBRIDDataType.CCI_U_TYPE_BLOB);

	packetReader.write(new Buffer([0, 0, 0, 99, 1, 255, 255, 255, 0, 0, 0, 95, 0, 0, 0, 33, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 79, 102, 105, 108, 101, 58, 67, 58, 92, 67, 85, 66, 82, 73, 68, 92, 100, 97, 116,
		97, 98, 97, 115, 101, 115, 92, 100, 101, 109, 111, 100, 98, 47, 108, 111, 98, 47, 99,
		101, 115, 95, 50, 49, 50, 47, 99, 101, 115, 95, 116, 101, 109, 112, 46, 48, 48, 48, 48,
		49, 51, 54, 50, 49, 51, 54, 54, 49, 51, 53, 52, 54, 48, 48, 48, 95, 48, 48, 52, 49, 0,
		0, 0, 0, 30, 0, 255, 255, 255, 0, 0, 0, 1, 0, 0, 0, 0, 1, 20, 0, 0, 0, 1, 0, 0, 22, 128,
		11, 15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
	var lobHandle = lobnewPacket.parse(packetReader).result;

	test.equal(lobnewPacket.casInfo[0], 1); // Casinfo
	test.equal(lobnewPacket.casInfo[1], 255); // Casinfo
	test.equal(lobnewPacket.casInfo[2], 255); // Casinfo
	test.equal(lobnewPacket.casInfo[3], 255); // Casinfo

	test.equal(lobnewPacket.responseCode, 95);
	test.equal(lobnewPacket.errorCode, 0);
	test.equal(lobnewPacket.errorMsg, '');
	test.equal(lobHandle.lobType, CAS.CUBRIDDataType.CCI_U_TYPE_BLOB);
	test.equal(lobHandle.fileLocator, "file:C:\\CUBRID\\databases\\demodb/lob/ces_212/ces_temp.00001362136613546000_0041");
	test.equal(lobHandle.lobLength, 0);

	test.done();
};
