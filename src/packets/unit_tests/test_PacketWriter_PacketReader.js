var PacketReader = require('../PacketReader'),
  PacketWriter = require('../PacketWriter'),
  assert = require('assert');

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
  assert.equal(newValue, value);
}

function testChar(value) {
  var packetWriter = new PacketWriter();
  packetWriter._writeChar(value);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue = packetReader._parseChar();
  assert.equal(newValue, value);
}

function testShort(value) {
  var packetWriter = new PacketWriter();
  packetWriter._writeShort(value);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue = packetReader._parseShort();
  assert.equal(newValue, value);
}

function testShortSigned(value, expectedValue) {
  var packetWriter = new PacketWriter();
  packetWriter._writeShort(value);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue = packetReader._parseShort();
  assert.equal(newValue, expectedValue);
}

function testInt(value) {
  var packetWriter = new PacketWriter();
  packetWriter._writeInt(value);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue = packetReader._parseInt();
  assert.equal(newValue, value);
}

function testIntSigned(value, expectedValue) {
  var packetWriter = new PacketWriter();
  packetWriter._writeInt(value);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue = packetReader._parseInt();
  assert.equal(newValue, expectedValue);
}

function testDate(year, month, day) {
  var packetWriter = new PacketWriter();
  packetWriter._writeDate(year, month, day);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue = packetReader._parseDate();
  assert.equal(newValue.getUTCFullYear(), year);
  assert.equal(newValue.getUTCMonth(), month - 1);
  assert.equal(newValue.getUTCDate(), day);
}

function testTime(hour, min, sec) {
  var packetWriter = new PacketWriter();
  packetWriter._writeTime(hour, min, sec);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue = packetReader._parseTime();
  assert.equal(newValue.getUTCHours(), hour);
  assert.equal(newValue.getUTCMinutes(), min);
  assert.equal(newValue.getUTCSeconds(), sec);
}

function testDateTime(year, month, day, hour, min, sec, msec) {
  var packetWriter = new PacketWriter();
  packetWriter._writeDateTime(year, month, day, hour, min, sec, msec);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue = packetReader._parseDateTime();
  assert.equal(newValue.getUTCFullYear(), year);
  assert.equal(newValue.getUTCMonth(), month - 1);
  assert.equal(newValue.getUTCDate(), day);
  assert.equal(newValue.getUTCHours(), hour);
  assert.equal(newValue.getUTCMinutes(), min);
  assert.equal(newValue.getUTCSeconds(), sec);
  assert.equal(newValue.getUTCMilliseconds(), msec);
}

function testTimestamp(year, month, day, hour, min, sec) {
  var packetWriter = new PacketWriter();
  packetWriter._writeTimestamp(year, month, day, hour, min, sec);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue = packetReader._parseTimeStamp();
  assert.equal(newValue.getUTCFullYear(), year);
  assert.equal(newValue.getUTCMonth(), month - 1);
  assert.equal(newValue.getUTCDate(), day);
  assert.equal(newValue.getUTCHours(), hour);
  assert.equal(newValue.getUTCMinutes(), min);
  assert.equal(newValue.getUTCSeconds(), sec);
}

function testString(value) {
  var packetWriter = new PacketWriter();
  packetWriter._writeNullTerminatedString(value);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var len = packetReader._parseInt();
  var newValue = packetReader._parseNullTerminatedString(len);
  assert.equal(newValue, value);
}

function testFixedLengthString(value) {
  var packetWriter = new PacketWriter();
  packetWriter._writeFixedLengthString(value, 'x', 15);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue = packetReader._parseString(15);
  assert.equal(newValue, value + 'xxxxx');
}

function testFiller() {
  var packetWriter = new PacketWriter();
  packetWriter._writeFiller(5, 'x');
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue = packetReader._parseString(5);
  assert.equal(newValue, 'xxxxx');

  packetWriter = new PacketWriter();
  packetWriter._writeFiller(5, 120);
  packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  newValue = packetReader._parseString(5);
  assert.equal(newValue, 'xxxxx');
}

function testAllTypes(value1, value2, value3) {
  var packetWriter = new PacketWriter();
  packetWriter._writeByte(value1);
  packetWriter._writeInt(value2);
  packetWriter._writeNullTerminatedString(value3);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());

  var newValue1 = packetReader._parseByte();
  assert.equal(newValue1, value1);

  var newValue2 = packetReader._parseInt();
  assert.equal(newValue2, value2);

  var len = packetReader._parseInt();
  var newValue3 = packetReader._parseNullTerminatedString(len);
  assert.equal(newValue3, value3);
}

function testPacketReaderBytes() {
  var packetReader = createPacketReader([1, 2]);

  var newValue = packetReader._parseBytes(2);
  assert.equal(newValue[0], 1);
  assert.equal(newValue[1], 2);
}

function testPacketReaderBuffer() {
  var packetWriter = new PacketWriter();
  packetWriter._writeBuffer(new Buffer([1, 2]));

  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());
  var newValue = packetReader._parseBuffer(2);
  assert.equal(newValue[0], 1);
  assert.equal(newValue[1], 2);
}

function testLong(value) {
  var packetWriter = new PacketWriter();
  packetWriter._writeLong(value);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());
  var newValue = packetReader._parseLong();
  assert.equal(newValue, value);
}

function testFloat(value) {
  var packetWriter = new PacketWriter();
  packetWriter._writeFloat(value);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());
  var newValue = packetReader._parseFloat();
  assert.equal(newValue, value);
}

function testDouble(value) {
  var packetWriter = new PacketWriter();
  packetWriter._writeDouble(value);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());
  var newValue = packetReader._parseDouble();
  assert.equal(newValue, value);
}

function testNumeric(value) {
  var packetWriter = new PacketWriter();
  packetWriter._writeNumeric(value);
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());
  var length = packetReader._parseInt();
  var newValue = packetReader._parseNumeric(length);
  assert.equal(newValue, value);
}

function testObject() {
  var packetWriter = new PacketWriter();
  packetWriter._writeBuffer(new Buffer([0, 0, 0, 0, 0, 1, 0, 2]));
  var packetReader = new PacketReader();
  packetReader.write(packetWriter._toBuffer());
  var newValue = packetReader._parseObject();
  assert.equal(newValue, 'OID:@0|1|2');
}
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

console.log('Unit test ' + module.filename.toString() + ' started...');

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
testLong(Math.pow(2, 53) + 100); // Overflow
testFloat(4.5);
testDouble(3.14);
testNumeric(1.5);
testObject();

console.log('Unit test ended OK.');
