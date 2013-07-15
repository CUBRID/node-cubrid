exports['test_PacketWriter_PachetReader'] = function (test) {
	var codeCoveragePath = process.env.CODE_COV ? '-cov' : '',
			PacketReader = require('../src' + codeCoveragePath + '/packets/PacketReader'),
			PacketWriter = require('../src' + codeCoveragePath + '/packets/PacketWriter');

	var bValue = 0xEF; //=239
	var cValue = 'x';
	var shortValue = 0x70;
	var iValue = 0x7ABC;
	var shortValueSigned = 0x8001;
	var iValueSigned = 0x80000001;
	var sValue = '0987654321';
	var dValue = new Date(2012, 1, 2, 0, 0, 0, 0);

	function createPacketReader(bytes) {
		var buffer = new Buffer(bytes);
		var parser = new PacketReader();

		parser._append(buffer);

		return parser;
	}

	function testByte(value) {
		var packetWriter = new PacketWriter();
		packetWriter._writeByte(value);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseByte();
		test.equal(newValue, value);
	}

	function testChar(value) {
		var packetWriter = new PacketWriter();
		packetWriter._writeChar(value);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseChar();
		test.equal(newValue, value);
	}

	function testShort(value) {
		var packetWriter = new PacketWriter();
		packetWriter._writeShort(value);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseShort();
		test.equal(newValue, value);
	}

	function testShortSigned(value, expectedValue) {
		var packetWriter = new PacketWriter();
		packetWriter._writeShort(value);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseShort();
		test.equal(newValue, expectedValue);
	}

	function testInt(value) {
		var packetWriter = new PacketWriter();
		packetWriter._writeInt(value);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseInt();
		test.equal(newValue, value);
	}

	function testIntSigned(value, expectedValue) {
		var packetWriter = new PacketWriter();
		packetWriter._writeInt(value);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseInt();
		test.equal(newValue, expectedValue);
	}

	function testDate(year, month, day) {
		var packetWriter = new PacketWriter();
		packetWriter._writeDate(year, month, day);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseDate();
		test.equal(newValue.getUTCFullYear(), year);
		test.equal(newValue.getUTCMonth(), month - 1);
		test.equal(newValue.getUTCDate(), day);
	}

	function testTime(hour, min, sec) {
		var packetWriter = new PacketWriter();
		packetWriter._writeTime(hour, min, sec);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseTime();
		test.equal(newValue.getUTCHours(), hour);
		test.equal(newValue.getUTCMinutes(), min);
		test.equal(newValue.getUTCSeconds(), sec);
	}

	function testDateTime(year, month, day, hour, min, sec, msec) {
		var packetWriter = new PacketWriter();
		packetWriter._writeDateTime(year, month, day, hour, min, sec, msec);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseDateTime();
		test.equal(newValue.getUTCFullYear(), year);
		test.equal(newValue.getUTCMonth(), month - 1);
		test.equal(newValue.getUTCDate(), day);
		test.equal(newValue.getUTCHours(), hour);
		test.equal(newValue.getUTCMinutes(), min);
		test.equal(newValue.getUTCSeconds(), sec);
		test.equal(newValue.getUTCMilliseconds(), msec);
	}

	function testTimestamp(year, month, day, hour, min, sec) {
		var packetWriter = new PacketWriter();
		packetWriter._writeTimestamp(year, month, day, hour, min, sec);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseTimeStamp();
		test.equal(newValue.getUTCFullYear(), year);
		test.equal(newValue.getUTCMonth(), month - 1);
		test.equal(newValue.getUTCDate(), day);
		test.equal(newValue.getUTCHours(), hour);
		test.equal(newValue.getUTCMinutes(), min);
		test.equal(newValue.getUTCSeconds(), sec);
	}

	function testString(value) {
		var packetWriter = new PacketWriter();
		packetWriter._writeNullTerminatedString(value);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var len = packetReader._parseInt();
		var newValue = packetReader._parseNullTerminatedString(len);
		test.equal(newValue, value);
	}

	function testFixedLengthString(value) {
		var packetWriter = new PacketWriter();
		packetWriter._writeFixedLengthString(value, 'x', 15);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseString(15);
		test.equal(newValue, value + 'xxxxx');
	}

	function testFiller() {
		var packetWriter = new PacketWriter();
		packetWriter._writeFiller(5, 'x');
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue = packetReader._parseString(5);
		test.equal(newValue, 'xxxxx');

		packetWriter = new PacketWriter();
		packetWriter._writeFiller(5, 120);
		packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		newValue = packetReader._parseString(5);
		test.equal(newValue, 'xxxxx');
	}

	function testAllTypes(value1, value2, value3) {
		var packetWriter = new PacketWriter();
		packetWriter._writeByte(value1);
		packetWriter._writeInt(value2);
		packetWriter._writeNullTerminatedString(value3);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());

		var newValue1 = packetReader._parseByte();
		test.equal(newValue1, value1);

		var newValue2 = packetReader._parseInt();
		test.equal(newValue2, value2);

		var len = packetReader._parseInt();
		var newValue3 = packetReader._parseNullTerminatedString(len);
		test.equal(newValue3, value3);
	}

	function testPacketReaderBytes() {
		var packetReader = createPacketReader([1, 2]);

		var newValue = packetReader._parseBytes(2);
		test.equal(newValue[0], 1);
		test.equal(newValue[1], 2);
	}

	function testPacketReaderBuffer() {
		var packetWriter = new PacketWriter();
		packetWriter._writeBuffer(new Buffer([1, 2]));

		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());
		var newValue = packetReader._parseBuffer(2);
		test.equal(newValue[0], 1);
		test.equal(newValue[1], 2);
	}

	function testLong(value) {
		var packetWriter = new PacketWriter();
		packetWriter._writeLong(value);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());
		var newValue = packetReader._parseLong();
		test.equal(newValue, value);
	}

	function testFloat(value) {
		var packetWriter = new PacketWriter();
		packetWriter._writeFloat(value);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());
		var newValue = packetReader._parseFloat();
		test.equal(newValue, value);
	}

	function testDouble(value) {
		var packetWriter = new PacketWriter();
		packetWriter._writeDouble(value);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());
		var newValue = packetReader._parseDouble();
		test.equal(newValue, value);
	}

	function testNumeric(value) {
		var packetWriter = new PacketWriter();
		packetWriter._writeNumeric(value);
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());
		var length = packetReader._parseInt();
		var newValue = packetReader._parseNumeric(length);
		test.equal(newValue, value);
	}

	function testObject() {
		var packetWriter = new PacketWriter();
		packetWriter._writeBuffer(new Buffer([0, 0, 0, 0, 0, 1, 0, 2]));
		var packetReader = new PacketReader();
		packetReader.write(packetWriter._toBuffer());
		var newValue = packetReader._parseObject();
		test.equal(newValue, 'OID:@0|1|2');
	}

	test.expect(42);

	// Test integer-types
	testByte(bValue);
	testShort(shortValue);
	testInt(iValue);

	// Test signed integer-types
	testShortSigned(shortValueSigned, -32767);
	//testShortSigned(shortValueSigned, -1);
	testIntSigned(iValueSigned, -2147483647);
	//testIntSigned(iValueSigned, -1);

	// Test strings
	testChar(cValue);
	testString(sValue);
	testFixedLengthString(sValue);

	// Test dates
	testDate(dValue.getFullYear(), dValue.getMonth(), dValue.getDate());
	testTime(dValue.getHours(), dValue.getMinutes(), dValue.getSeconds());
	testDateTime(dValue.getFullYear(), dValue.getMonth(), dValue.getDate(),
			dValue.getHours(), dValue.getMinutes(), dValue.getSeconds(), dValue.getMilliseconds());
	testTimestamp(dValue.getFullYear(), dValue.getMonth(), dValue.getDate(),
			dValue.getHours(), dValue.getMinutes(), dValue.getSeconds());

	// Other tests
	testAllTypes(bValue, iValue, sValue);
	testPacketReaderBytes();
	testPacketReaderBuffer();
	testFiller();

	testLong(Math.pow(2, 53) - 152156);
	testLong(Math.pow(2, 53) + 100);//overflow
	testFloat(4.5);
	testDouble(3.14);
	testNumeric(1.5);
	testObject();

	test.done();
};
