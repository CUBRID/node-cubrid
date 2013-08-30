exports['test_FetchPacket'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			ExecuteQueryPacket = require('../src' + codeCoveragePath + '/packets/ExecuteQueryPacket'),
			FetchPacket = require('../src' + codeCoveragePath + '/packets/FetchPacket'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants'),
			packetReader = new PacketReader(),
			options = {
				sql: 'select * from code',
				casInfo: [0, 255, 255, 255],
				autoCommitMode: 1,
				dbVersion : '8.4.1'
			},
			executeQueryPacket = new ExecuteQueryPacket(options),
			packetWriter = new PacketWriter(executeQueryPacket.getBufferLength());

	test.expect(16);

	executeQueryPacket.write(packetWriter);
	packetReader.write(new Buffer([0, 0, 1, 57, 0, 255, 255, 255, 0, 0, 0, 4, 255, 255, 255, 255, 21, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 7, 115, 95, 110, 97, 109, 101, 0,
		0, 0, 0, 1, 0, 0, 0, 0, 5, 99, 111, 100, 101, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 6, 0, 0, 0, 7, 102,
		95, 110, 97, 109, 101, 0, 0, 0, 0, 1, 0, 0, 0, 0, 5, 99, 111, 100, 101, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6,
		0, 0, 0, 0, 1, 21, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 2, 88, 0, 0, 0, 0, 6, 77, 105, 120, 101, 100, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 87, 0, 0,
		0, 0, 6, 87, 111, 109, 97, 110, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 77, 0, 0, 0, 0, 4, 77, 97, 110, 0, 0, 0, 0,
		4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 66, 0, 0, 0, 0, 7, 66, 114, 111, 110, 122, 101, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0,
		0, 0, 2, 83, 0, 0, 0, 0, 7, 83, 105, 108, 118, 101, 114, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 71, 0, 0, 0, 0, 5,
		71, 111, 108, 100, 0]));
	var resultSet = executeQueryPacket.parse(packetReader).resultSet;
	test.equal(resultSet, '{"ColumnNames":["s_name","f_name"],"ColumnDataTypes":["Char","String"],"RowsCount":6,"ColumnValues":[["X","Mixed"],["W","Woman"],["M","Man"],["B","Bronze"],["S","Silver"],["G","Gold"]]}');

	var fetchPacket = new FetchPacket(options);
	packetReader = new PacketReader();
	packetWriter = new PacketWriter(fetchPacket.getBufferLength());
	fetchPacket.write(packetWriter, executeQueryPacket);
	test.equal(packetWriter._toBuffer()[3], 38); // Total length
	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_FETCH);
	test.equal(packetWriter._toBuffer()[16], 4);
	test.equal(packetWriter._toBuffer()[24], 7);
	test.equal(packetWriter._toBuffer()[32], 100);
	test.equal(packetWriter._toBuffer()[37], 0);
	test.equal(packetWriter._toBuffer()[45], 0);

	packetReader.write(new Buffer([0, 0, 0, 0,
		0, 255, 255, 255,
		0, 0, 0, 0,
		0, 0, 0, 0]));
	fetchPacket.parse(packetReader, executeQueryPacket);

	test.equal(fetchPacket.casInfo[0], 0); // Casinfo
	test.equal(fetchPacket.casInfo[1], 255); // Casinfo
	test.equal(fetchPacket.casInfo[2], 255); // Casinfo
	test.equal(fetchPacket.casInfo[3], 255); // Casinfo

	test.equal(fetchPacket.responseCode, 0);
	test.equal(fetchPacket.errorCode, 0);
	test.equal(fetchPacket.errorMsg, '');

	test.equal(fetchPacket.tupleCount, 0);
	test.done();
};
