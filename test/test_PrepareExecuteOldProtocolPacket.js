exports['test_PrepareExecuteOldProtocolPacket'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter'),
			PrepareExecutePacket = require('../src' + codeCoveragePath + '/packets/PrepareExecutePacket'),
			CAS = require('../src' + codeCoveragePath + '/constants/CASConstants');

	test.expect(48);

	var options = {sql : 'select * from code',
		casInfo          : [0, 255, 255, 255],
		autoCommitMode   : 1,
		dbVersion        : '8.4.1',
		paramValues      : {},
		paramTypes       : {}
	},
			prepareExecutePacket = new PrepareExecutePacket(options),
			packetReader = new PacketReader(),
			packetWriter = new PacketWriter(prepareExecutePacket.getPrepareBufferLength());

	prepareExecutePacket.writePrepare(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 34); // Total length

	test.equal(packetWriter._toBuffer()[4], 0); // Casinfo
	test.equal(packetWriter._toBuffer()[5], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[6], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[7], 255); // Casinfo

	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_PREPARE);
	test.equal(packetWriter._toBuffer()[12], 19);
	test.equal(packetWriter._toBuffer().slice(13, 31).toString(), 'select * from code');
	test.equal(packetWriter._toBuffer()[35], 1);
	test.equal(packetWriter._toBuffer()[36], CAS.CCIPrepareOption.CCI_PREPARE_NORMAL);
	test.equal(packetWriter._toBuffer()[40], 1);
	test.equal(packetWriter._toBuffer()[41], 1);

	packetReader.write(new Buffer([0, 0, 0, 108, 1, 255, 255, 255, 0, 0, 0, 1, 255, 255, 255, 255, 21, 0, 0, 0, 0, 0, 0, 0,
		0, 2, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 7, 115, 95, 110, 97, 109, 101, 0, 0, 0, 0, 1, 0, 0,
		0, 0, 5, 99, 111, 100, 101, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0,
		6, 0, 0, 0, 7, 102, 95, 110, 97, 109, 101, 0, 0, 0, 0, 1, 0, 0, 0, 0, 5, 99, 111, 100,
		101, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0]));

	prepareExecutePacket.parsePrepare(packetReader);
	test.equal(prepareExecutePacket.queryHandle, 1);
	test.equal(prepareExecutePacket.resultCacheLifetime, -1);
	test.equal(prepareExecutePacket.statementType, 21);
	test.equal(prepareExecutePacket.bindCount, 0);
	test.equal(prepareExecutePacket.isUpdatable, false);
	test.equal(prepareExecutePacket.infoArray[0].ColumnType, 1);
	test.equal(prepareExecutePacket.infoArray[0].Scale, -1);
	test.equal(prepareExecutePacket.infoArray[0].Name, "s_name");
	test.equal(prepareExecutePacket.infoArray[0].RealName, "");
	test.equal(prepareExecutePacket.infoArray[0].TableName, "code");
	test.equal(prepareExecutePacket.infoArray[0].IsNullable, false);
	test.equal(prepareExecutePacket.infoArray[0].DafaultValue, "");
	test.equal(prepareExecutePacket.infoArray[0].IsAutoIncrement, false);
	test.equal(prepareExecutePacket.infoArray[0].IsUniqueKey, false);
	test.equal(prepareExecutePacket.infoArray[0].IsPrimaryKey, false);
	test.equal(prepareExecutePacket.infoArray[0].IsReverseIndex, false);
	test.equal(prepareExecutePacket.infoArray[0].IsReverseUnique, false);
	test.equal(prepareExecutePacket.infoArray[0].IsForeignKey, false);
	test.equal(prepareExecutePacket.infoArray[0].IsShared, false);

	packetReader = new PacketReader();
	packetWriter = new PacketWriter(prepareExecutePacket.getExecuteBufferLength());
	prepareExecutePacket.writeExecute(packetWriter);
	test.equal(packetWriter._toBuffer()[3], 69); // Total length

	test.equal(packetWriter._toBuffer()[4], 1); // Casinfo
	test.equal(packetWriter._toBuffer()[5], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[6], 255); // Casinfo
	test.equal(packetWriter._toBuffer()[7], 255); // Casinfo

	test.equal(packetWriter._toBuffer()[8], CAS.CASFunctionCode.CAS_FC_EXECUTE);
	test.equal(packetWriter._toBuffer()[16], 1);
	test.equal(packetWriter._toBuffer()[21], CAS.CCIExecutionOption.CCI_EXEC_NORMAL);
	test.equal(packetWriter._toBuffer()[29], 0);
	test.equal(packetWriter._toBuffer()[37], 0);
	test.equal(packetWriter._toBuffer()[41], 0);
	test.equal(packetWriter._toBuffer()[46], 1);
	test.equal(packetWriter._toBuffer()[51], 1);
	test.equal(packetWriter._toBuffer()[56], 1);
	test.equal(packetWriter._toBuffer()[68], 0);
	test.equal(packetWriter._toBuffer()[76], 0);

	packetReader.write(new Buffer([0, 0, 0, 205, 0, 255, 255, 255, 0, 0, 0, 6, 0, 0, 0, 0, 1, 21, 0, 0, 0, 6, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 1, 0, 0, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 2, 88, 0, 0, 0, 0, 6, 77, 105, 120, 101, 100, 0, 0, 0, 0, 2, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 2, 87, 0, 0, 0, 0, 6, 87, 111, 109, 97, 110, 0, 0, 0, 0, 3, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 77, 0, 0, 0, 0, 4, 77, 97, 110, 0, 0, 0, 0, 4, 0, 0, 0,
		0, 0, 0, 0, 0, 0, 0, 0, 2, 66, 0, 0, 0, 0, 7, 66, 114, 111, 110, 122, 101, 0, 0, 0, 0,
		5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 83, 0, 0, 0, 0, 7, 83, 105, 108, 118, 101, 114,
		0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 71, 0, 0, 0, 0, 5, 71, 111, 108, 100, 0]));

	var resultSet = prepareExecutePacket.parseExecute(packetReader).resultSet;

	test.equal(resultSet, '{"ColumnNames":["s_name","f_name"],"ColumnDataTypes":["Char","String"],"RowsCount":6,"ColumnValues":[["X","Mixed"],["W","Woman"],["M","Man"],["B","Bronze"],["S","Silver"],["G","Gold"]]}');
	test.done();
};

