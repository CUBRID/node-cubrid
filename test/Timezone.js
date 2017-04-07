'use strict';

const expect = require('chai').expect;
const Timezone = require('../src/utils/Timezone');
const testSetup = require('./testSetup');
// const CAS = require('../src/constants/CASConstants');

// test the Timezone module's function or method
describe('Timezone', function() {
  describe('format', function() {
    it('should success to validate the return values', function() {
      let timezone = 'Asia/Seoul KST';
      let timezoneObject;

      // 1. format: 'CC' and 'cc'
      timezoneObject = new Timezone(new Date(Date.UTC(1970, 0, 1)), timezone);
      expect(timezoneObject.format('CC')).to.equal('20');
      expect(timezoneObject.format('cc')).to.equal('20');

      timezoneObject = new Timezone(new Date(Date.UTC(2000, 0, 1)), timezone);
      expect(timezoneObject.format('CC')).to.equal('21');
      expect(timezoneObject.format('cc')).to.equal('21');

      timezoneObject = new Timezone(new Date(Date.UTC(2100, 0, 1)), timezone);
      expect(timezoneObject.format('CC')).to.equal('22');
      expect(timezoneObject.format('cc')).to.equal('22');

      timezoneObject = new Timezone(new Date(Date.UTC(2200, 0, 1)), timezone);
      expect(timezoneObject.format('CC')).to.equal('23');
      expect(timezoneObject.format('cc')).to.equal('23');


      // 2. format 'YYYY' and 'yyyy'
      timezoneObject = new Timezone(new Date(Date.UTC(1970, 0, 1)), timezone);
      expect(timezoneObject.format('YYYY')).to.equal('1970');
      expect(timezoneObject.format('yyyy')).to.equal('1970');

      timezoneObject = new Timezone(new Date(Date.UTC(2000, 0, 1)), timezone);
      expect(timezoneObject.format('YYYY')).to.equal('2000');
      expect(timezoneObject.format('yyyy')).to.equal('2000');

      timezoneObject = new Timezone(new Date(Date.UTC(2100, 0, 1)), timezone);
      expect(timezoneObject.format('YYYY')).to.equal('2100');
      expect(timezoneObject.format('yyyy')).to.equal('2100');

      timezoneObject = new Timezone(new Date(Date.UTC(2200, 0, 1)), timezone);
      expect(timezoneObject.format('YYYY')).to.equal('2200');
      expect(timezoneObject.format('yyyy')).to.equal('2200');

      timezoneObject = new Timezone(new Date(), timezone);
      expect(parseInt(timezoneObject.format('YYYY'))).to.equal(timezoneObject.datetime.getUTCFullYear());
      expect(parseInt(timezoneObject.format('yyyy'))).to.equal(timezoneObject.datetime.getUTCFullYear());


      // 3. format 'YY' and 'yy'
      timezoneObject = new Timezone(new Date(Date.UTC(1970, 0, 1)), timezone);
      expect(timezoneObject.format('YY')).to.equal('70');
      expect(timezoneObject.format('yy')).to.equal('70');

      timezoneObject = new Timezone(new Date(Date.UTC(2000, 0, 1)), timezone);
      expect(timezoneObject.format('YY')).to.equal('00');
      expect(timezoneObject.format('yy')).to.equal('00');

      timezoneObject = new Timezone(new Date(Date.UTC(2010, 0, 1)), timezone);
      expect(timezoneObject.format('YY')).to.equal('10');
      expect(timezoneObject.format('yy')).to.equal('10');

      timezoneObject = new Timezone(new Date(Date.UTC(2020, 0, 1)), timezone);
      expect(timezoneObject.format('YY')).to.equal('20');
      expect(timezoneObject.format('yy')).to.equal('20');

      timezoneObject = new Timezone(new Date(), timezone);
      expect(parseInt(timezoneObject.format('YY'))).to.equal(timezoneObject.datetime.getUTCFullYear() % 100);
      expect(parseInt(timezoneObject.format('yy'))).to.equal(timezoneObject.datetime.getUTCFullYear() % 100);


      // 4. format 'Q' and 'q', 'MM' and 'mm', 'MONTH' and 'month', 'MON' and 'mon'
      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('1');
      expect(timezoneObject.format('q')).to.equal('1');
      expect(timezoneObject.format('MM')).to.equal('01');
      expect(timezoneObject.format('mm')).to.equal('01');
      expect(timezoneObject.format('MONTH')).to.equal('January');
      expect(timezoneObject.format('month')).to.equal('January');
      expect(timezoneObject.format('MON')).to.equal('Jan');
      expect(timezoneObject.format('mon')).to.equal('Jan');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 1, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('1');
      expect(timezoneObject.format('q')).to.equal('1');
      expect(timezoneObject.format('MM')).to.equal('02');
      expect(timezoneObject.format('mm')).to.equal('02');
      expect(timezoneObject.format('MONTH')).to.equal('February');
      expect(timezoneObject.format('month')).to.equal('February');
      expect(timezoneObject.format('MON')).to.equal('Feb');
      expect(timezoneObject.format('mon')).to.equal('Feb');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 2, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('1');
      expect(timezoneObject.format('q')).to.equal('1');
      expect(timezoneObject.format('MM')).to.equal('03');
      expect(timezoneObject.format('mm')).to.equal('03');
      expect(timezoneObject.format('MONTH')).to.equal('March');
      expect(timezoneObject.format('month')).to.equal('March');
      expect(timezoneObject.format('MON')).to.equal('Mar');
      expect(timezoneObject.format('mon')).to.equal('Mar');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 3, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('2');
      expect(timezoneObject.format('q')).to.equal('2');
      expect(timezoneObject.format('MM')).to.equal('04');
      expect(timezoneObject.format('mm')).to.equal('04');
      expect(timezoneObject.format('MONTH')).to.equal('April');
      expect(timezoneObject.format('month')).to.equal('April');
      expect(timezoneObject.format('MON')).to.equal('Apr');
      expect(timezoneObject.format('mon')).to.equal('Apr');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 4, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('2');
      expect(timezoneObject.format('q')).to.equal('2');
      expect(timezoneObject.format('MM')).to.equal('05');
      expect(timezoneObject.format('mm')).to.equal('05');
      expect(timezoneObject.format('MONTH')).to.equal('May');
      expect(timezoneObject.format('month')).to.equal('May');
      expect(timezoneObject.format('MON')).to.equal('May');
      expect(timezoneObject.format('mon')).to.equal('May');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 5, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('2');
      expect(timezoneObject.format('q')).to.equal('2');
      expect(timezoneObject.format('MM')).to.equal('06');
      expect(timezoneObject.format('mm')).to.equal('06');
      expect(timezoneObject.format('MONTH')).to.equal('June');
      expect(timezoneObject.format('month')).to.equal('June');
      expect(timezoneObject.format('MON')).to.equal('Jun');
      expect(timezoneObject.format('mon')).to.equal('Jun');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 6, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('3');
      expect(timezoneObject.format('q')).to.equal('3');
      expect(timezoneObject.format('MM')).to.equal('07');
      expect(timezoneObject.format('mm')).to.equal('07');
      expect(timezoneObject.format('MONTH')).to.equal('July');
      expect(timezoneObject.format('month')).to.equal('July');
      expect(timezoneObject.format('MON')).to.equal('Jul');
      expect(timezoneObject.format('mon')).to.equal('Jul');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 7, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('3');
      expect(timezoneObject.format('q')).to.equal('3');
      expect(timezoneObject.format('MM')).to.equal('08');
      expect(timezoneObject.format('mm')).to.equal('08');
      expect(timezoneObject.format('MONTH')).to.equal('August');
      expect(timezoneObject.format('month')).to.equal('August');
      expect(timezoneObject.format('MON')).to.equal('Aug');
      expect(timezoneObject.format('mon')).to.equal('Aug');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 8, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('3');
      expect(timezoneObject.format('q')).to.equal('3');
      expect(timezoneObject.format('MM')).to.equal('09');
      expect(timezoneObject.format('mm')).to.equal('09');
      expect(timezoneObject.format('MONTH')).to.equal('September');
      expect(timezoneObject.format('month')).to.equal('September');
      expect(timezoneObject.format('MON')).to.equal('Sep');
      expect(timezoneObject.format('mon')).to.equal('Sep');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 9, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('4');
      expect(timezoneObject.format('q')).to.equal('4');
      expect(timezoneObject.format('MM')).to.equal('10');
      expect(timezoneObject.format('mm')).to.equal('10');
      expect(timezoneObject.format('MONTH')).to.equal('October');
      expect(timezoneObject.format('month')).to.equal('October');
      expect(timezoneObject.format('MON')).to.equal('Oct');
      expect(timezoneObject.format('mon')).to.equal('Oct');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 10, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('4');
      expect(timezoneObject.format('q')).to.equal('4');
      expect(timezoneObject.format('MM')).to.equal('11');
      expect(timezoneObject.format('mm')).to.equal('11');
      expect(timezoneObject.format('MONTH')).to.equal('November');
      expect(timezoneObject.format('month')).to.equal('November');
      expect(timezoneObject.format('MON')).to.equal('Nov');
      expect(timezoneObject.format('mon')).to.equal('Nov');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 11, 1)), timezone);
      expect(timezoneObject.format('Q')).to.equal('4');
      expect(timezoneObject.format('q')).to.equal('4');
      expect(timezoneObject.format('MM')).to.equal('12');
      expect(timezoneObject.format('mm')).to.equal('12');
      expect(timezoneObject.format('MONTH')).to.equal('December');
      expect(timezoneObject.format('month')).to.equal('December');
      expect(timezoneObject.format('MON')).to.equal('Dec');
      expect(timezoneObject.format('mon')).to.equal('Dec');


      // 5. format 'DD' and 'dd', 'DAY' and 'day', 'DY' and 'dy', 'D' and 'd'
      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1)), timezone);
      expect(timezoneObject.format('DD')).to.equal('01');
      expect(timezoneObject.format('dd')).to.equal('01');
      expect(timezoneObject.format('DAY')).to.equal('Sunday');
      expect(timezoneObject.format('day')).to.equal('Sunday');
      expect(timezoneObject.format('DY')).to.equal('Sun');
      expect(timezoneObject.format('dy')).to.equal('Sun');
      expect(timezoneObject.format('D')).to.equal('7');
      expect(timezoneObject.format('d')).to.equal('7');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 3, 15)), timezone);
      expect(timezoneObject.format('DD')).to.equal('15');
      expect(timezoneObject.format('dd')).to.equal('15');
      expect(timezoneObject.format('DAY')).to.equal('Saturday');
      expect(timezoneObject.format('day')).to.equal('Saturday');
      expect(timezoneObject.format('DY')).to.equal('Sat');
      expect(timezoneObject.format('dy')).to.equal('Sat');
      expect(timezoneObject.format('D')).to.equal('6');
      expect(timezoneObject.format('d')).to.equal('6');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 8, 20)), timezone);
      expect(timezoneObject.format('DD')).to.equal('20');
      expect(timezoneObject.format('dd')).to.equal('20');
      expect(timezoneObject.format('DAY')).to.equal('Wednesday');
      expect(timezoneObject.format('day')).to.equal('Wednesday');
      expect(timezoneObject.format('DY')).to.equal('Wed');
      expect(timezoneObject.format('dy')).to.equal('Wed');
      expect(timezoneObject.format('D')).to.equal('3');
      expect(timezoneObject.format('d')).to.equal('3');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 11, 25)), timezone);
      expect(timezoneObject.format('DD')).to.equal('25');
      expect(timezoneObject.format('dd')).to.equal('25');
      expect(timezoneObject.format('DAY')).to.equal('Monday');
      expect(timezoneObject.format('day')).to.equal('Monday');
      expect(timezoneObject.format('DY')).to.equal('Mon');
      expect(timezoneObject.format('dy')).to.equal('Mon');
      expect(timezoneObject.format('D')).to.equal('1');
      expect(timezoneObject.format('d')).to.equal('1');


      // 6. format 'HH12' and 'hh12', 'HH' and 'hh', 'HH24' and 'hh24'
      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0)), timezone);
      expect(timezoneObject.format('HH12')).to.equal('00');
      expect(timezoneObject.format('hh12')).to.equal('00');
      expect(timezoneObject.format('HH')).to.equal('00');
      expect(timezoneObject.format('hh')).to.equal('00');
      expect(timezoneObject.format('HH24')).to.equal('00');
      expect(timezoneObject.format('hh24')).to.equal('00');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 12, 0, 0)), timezone);
      expect(timezoneObject.format('HH12')).to.equal('12');
      expect(timezoneObject.format('hh12')).to.equal('12');
      expect(timezoneObject.format('HH')).to.equal('12');
      expect(timezoneObject.format('hh')).to.equal('12');
      expect(timezoneObject.format('HH24')).to.equal('12');
      expect(timezoneObject.format('hh24')).to.equal('12');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 15, 0, 0)), timezone);
      expect(timezoneObject.format('HH12')).to.equal('03');
      expect(timezoneObject.format('hh12')).to.equal('03');
      expect(timezoneObject.format('HH')).to.equal('03');
      expect(timezoneObject.format('hh')).to.equal('03');
      expect(timezoneObject.format('HH24')).to.equal('15');
      expect(timezoneObject.format('hh24')).to.equal('15');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 20, 0, 0)), timezone);
      expect(timezoneObject.format('HH12')).to.equal('08');
      expect(timezoneObject.format('hh12')).to.equal('08');
      expect(timezoneObject.format('HH')).to.equal('08');
      expect(timezoneObject.format('hh')).to.equal('08');
      expect(timezoneObject.format('HH24')).to.equal('20');
      expect(timezoneObject.format('hh24')).to.equal('20');


      // 7. format 'AM' or 'PM', 'A.M.' or 'P.M.'
      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0)), timezone);
      expect(timezoneObject.format('AM')).to.equal('AM');
      expect(timezoneObject.format('Am')).to.equal('Am');
      expect(timezoneObject.format('am')).to.equal('am');
      expect(timezoneObject.format('A.M.')).to.equal('A.M.');
      expect(timezoneObject.format('A.m.')).to.equal('A.m.');
      expect(timezoneObject.format('a.m.')).to.equal('a.m.');
      expect(timezoneObject.format('PM')).to.equal('AM');
      expect(timezoneObject.format('Pm')).to.equal('Am');
      expect(timezoneObject.format('pm')).to.equal('am');
      expect(timezoneObject.format('P.M.')).to.equal('A.M.');
      expect(timezoneObject.format('P.m.')).to.equal('A.m.');
      expect(timezoneObject.format('p.m.')).to.equal('a.m.');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 13, 0, 0)), timezone);
      expect(timezoneObject.format('AM')).to.equal('PM');
      expect(timezoneObject.format('Am')).to.equal('Pm');
      expect(timezoneObject.format('am')).to.equal('pm');
      expect(timezoneObject.format('A.M.')).to.equal('P.M.');
      expect(timezoneObject.format('A.m.')).to.equal('P.m.');
      expect(timezoneObject.format('a.m.')).to.equal('p.m.');
      expect(timezoneObject.format('PM')).to.equal('PM');
      expect(timezoneObject.format('Pm')).to.equal('Pm');
      expect(timezoneObject.format('pm')).to.equal('pm');
      expect(timezoneObject.format('P.M.')).to.equal('P.M.');
      expect(timezoneObject.format('P.m.')).to.equal('P.m.');
      expect(timezoneObject.format('p.m.')).to.equal('p.m.');


      // 8. format 'MI' and 'mi'
      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0)), timezone);
      expect(timezoneObject.format('MI')).to.equal('00');
      expect(timezoneObject.format('mi')).to.equal('00');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 5, 0)), timezone);
      expect(timezoneObject.format('MI')).to.equal('05');
      expect(timezoneObject.format('mi')).to.equal('05');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 35, 0)), timezone);
      expect(timezoneObject.format('MI')).to.equal('35');
      expect(timezoneObject.format('mi')).to.equal('35');


      // 9. format 'SS' and 'ss'
      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0)), timezone);
      expect(timezoneObject.format('SS')).to.equal('00');
      expect(timezoneObject.format('ss')).to.equal('00');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 5)), timezone);
      expect(timezoneObject.format('SS')).to.equal('05');
      expect(timezoneObject.format('ss')).to.equal('05');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 35)), timezone);
      expect(timezoneObject.format('SS')).to.equal('35');
      expect(timezoneObject.format('ss')).to.equal('35');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 60)), timezone);
      expect(timezoneObject.format('SS')).to.equal('00');
      expect(timezoneObject.format('ss')).to.equal('00');


      // 10. format 'FF' and 'ff'
      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0)), timezone);
      expect(timezoneObject.format('FF')).to.equal('000');
      expect(timezoneObject.format('ff')).to.equal('000');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0, 10)), timezone);
      expect(timezoneObject.format('FF')).to.equal('010');
      expect(timezoneObject.format('ff')).to.equal('010');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0, 100)), timezone);
      expect(timezoneObject.format('FF')).to.equal('100');
      expect(timezoneObject.format('ff')).to.equal('100');


      // 11. format 'TZD' and 'tzd', 'TZH' and 'tzh', 'TZM' and 'tzm'
      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0)), timezone);
      expect(timezoneObject.format('TZD')).to.equal('KST');
      expect(timezoneObject.format('tzd')).to.equal('KST');
      expect(timezoneObject.format('TZH')).to.equal('+09');
      expect(timezoneObject.format('tzh')).to.equal('+09');
      expect(timezoneObject.format('TZM')).to.equal('00');
      expect(timezoneObject.format('tzm')).to.equal('00');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0)), 'UTC UTC');
      expect(timezoneObject.format('TZD')).to.equal('UTC');
      expect(timezoneObject.format('tzd')).to.equal('UTC');
      expect(timezoneObject.format('TZH')).to.equal('+00');
      expect(timezoneObject.format('tzh')).to.equal('+00');
      expect(timezoneObject.format('TZM')).to.equal('00');
      expect(timezoneObject.format('tzm')).to.equal('00');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0)), 'Europe/London BST');
      expect(timezoneObject.format('TZD')).to.equal('BST');
      expect(timezoneObject.format('tzd')).to.equal('BST');
      expect(timezoneObject.format('TZH')).to.equal('+00');
      expect(timezoneObject.format('tzh')).to.equal('+00');
      expect(timezoneObject.format('TZM')).to.equal('00');
      expect(timezoneObject.format('tzm')).to.equal('00');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0)), 'America/Los_Angeles PDT');
      expect(timezoneObject.format('TZD')).to.equal('PDT');
      expect(timezoneObject.format('tzd')).to.equal('PDT');
      expect(timezoneObject.format('TZH')).to.equal('-08');
      expect(timezoneObject.format('tzh')).to.equal('-08');
      expect(timezoneObject.format('TZM')).to.equal('00');
      expect(timezoneObject.format('tzm')).to.equal('00');

      timezoneObject = new Timezone(new Date(Date.UTC(2017, 0, 1, 0, 0, 0)), 'America/St_Johns NDT');
      expect(timezoneObject.format('TZD')).to.equal('NDT');
      expect(timezoneObject.format('tzd')).to.equal('NDT');
      expect(timezoneObject.format('TZH')).to.equal('-03');
      expect(timezoneObject.format('tzh')).to.equal('-03');
      expect(timezoneObject.format('TZM')).to.equal('30');
      expect(timezoneObject.format('tzm')).to.equal('30');


      // 12. format combinations
      const date = new Date(Date.UTC(2017, 3, 5, 13, 30, 30, 300));
      timezoneObject = new Timezone(date, timezone);
      expect(timezoneObject.format('YYYY-MM-DD AM HH:MI:SS.FF')).to.equal('2017-04-05 PM 01:30:30.300');
      expect(timezoneObject.format('YYYY-MM-DD HH24:MI:SS.FF TZD')).to.equal('2017-04-05 13:30:30.300 KST');
      expect(timezoneObject.format('YYYY-MM-DD HH24:MI:SS.FF TZD TZH:TZM')).to.equal('2017-04-05 13:30:30.300 KST +09:00');
      expect(timezoneObject.format('CC Q DY, MON DD YYYY HH24:MI:SS.FF TZD TZH:TZM')).to.equal('21 2 Wed, Apr 05 2017 13:30:30.300 KST +09:00');
    });
  });

  describe('toString', function() {
    it('should success to validate the return values', function() {
      const date = new Date(Date.UTC(2017, 3, 5, 13, 30, 30, 300));
      const timezone = 'Asia/Seoul KST';
      const timezoneObject = new Timezone(date, timezone);
      expect(timezoneObject.toString()).to.equal('2017-04-05 13:30:30.300 Asia/Seoul KST')
    });
  });

  describe('valueOf', function() {
    it('should success to validate the return values', function() {
      let date = new Date(Date.UTC(2017, 3, 5, 13, 30, 30, 300));
      const timezone = 'Asia/Seoul KST';
      let timezoneObject = new Timezone(date, timezone);
      expect(timezoneObject.valueOf()).to.equal(1491399030300);

      date = new Date(Date.UTC(2017, 10, 1, 20, 35, 40, 700));
      timezoneObject = new Timezone(date, timezone);
      expect(timezoneObject.valueOf()).to.equal(1509568540700);
    });
  });

  describe('getOffset', function() {
    it('should success to validate the return values', function() {
      const date = new Date(Date.UTC(2017, 3, 5, 13, 30, 30, 300));
      let timezoneObject = new Timezone(date, 'Asia/Seoul KST');
      expect(timezoneObject.getOffset()).to.equal(-32400000);

      timezoneObject = new Timezone(date, 'UTC UTC');
      expect(timezoneObject.getOffset()).to.equal(0);

      timezoneObject = new Timezone(date, 'Europe/London BST');
      expect(timezoneObject.getOffset()).to.equal(-3600000);

      timezoneObject = new Timezone(date, 'America/Los_Angeles PDT');
      expect(timezoneObject.getOffset()).to.equal(25200000);

      timezoneObject = new Timezone(date, 'America/St_Johns NDT');
      expect(timezoneObject.getOffset()).to.equal(9000000);
    });
  });

  describe('with CUBRID', function() {

    it('should success to set Asia/Seoul in session', () => {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
        .connect()
        .then(() => {
          return client.query(`SET SYSTEM PARAMETERS 'timezone=Asia/Seoul'`)
        })
        .then(() => {
          return client.query(`SELECT DATETIMELTZ'2017-11-11 11:11:11.111'`);
        })
        .then(res => {
          const value = res.result.ColumnValues[0][0];
          expect(value.timezone)
            .to.equal('Asia/Seoul KST');
        })
        .then(() =>{
          return client.close();
        });
    });

    it('should success to set Ameraca/Los_Angeles in session', () => {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
        .connect()
        .then(() => {
          return client.query(`SET SYSTEM PARAMETERS 'timezone=America/Los_Angeles'`)
        })
        .then(() => {
          return client.query(`SELECT DATETIMELTZ'2017-11-11 11:11:11.111'`);
        })
        .then(res => {
          const value = res.result.ColumnValues[0][0];
          expect(value.timezone)
            .to.equal('America/Los_Angeles PST');
        })
        .then(() =>{
          return client.close();
        });
    });

    it('should success to set Europe/Zurich in session', () => {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
        .connect()
        .then(() => {
          return client.query(`SET SYSTEM PARAMETERS 'timezone=Europe/Zurich'`)
        })
        .then(() => {
          return client.query(`SELECT DATETIMELTZ'2017-11-11 11:11:11.111'`);
        })
        .then(res => {
          const value = res.result.ColumnValues[0][0];
          expect(value.timezone)
            .to.equal('Europe/Zurich CET');
        })
        .then(() =>{
          return client.close();
        });
    });

    const TABLE_NAME = 'timezone_tbl';
    const TIMEZONE = 'Asia/Seoul';

    beforeEach(testSetup.cleanup(TABLE_NAME));
    after(testSetup.cleanup(TABLE_NAME));

    const createTable = `CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (\
    col1 DATETIMETZ, col2 DATETIMELTZ, col3 TIMESTAMPTZ, col4 TIMESTAMPLTZ)`;
    const insertData = `INSERT INTO ${TABLE_NAME} VALUES (\
    DATETIMETZ'2017-04-05 13:30:30.500 ${TIMEZONE}',\
    DATETIMELTZ'2017-04-05 13:30:30.500 ${TIMEZONE}',\
    TIMESTAMPTZ'2017-04-05 13:30:30 ${TIMEZONE}',\
    TIMESTAMPLTZ'2017-04-05 13:30:30 ${TIMEZONE}')`;

    it('should success to insert and select', () => {
      const client = testSetup.createDefaultCUBRIDDemodbConnection();

      return client
        .connect()
        .then(() => {
          return client.query(`SET SYSTEM PARAMETERS 'timezone=${TIMEZONE}'`)
        })
        .then(() => {
          return client.execute(createTable);
        })
        .then(() => {
          return client.execute(insertData);
        })
        .then(() => {
          // Testing DATETIMETZ and TIMESTAMPTZ
          return client.query(`SELECT col1, col3 FROM ${TABLE_NAME}`);
        })
        .then(res => {
          const result = res.result;

          // This test should be fail because server respond invalid data type
          // const datetimetz = result.ColumnDataTypes[0];
          // const timestamptz = result.ColumnDataTypes[0];
          //
          // expect(datetimetz)
          //   .to.equal(CAS.getCUBRIDDataTypeName(CAS.CUBRIDDataType.CCI_U_TYPE_DATETIMETZ));
          // expect(timestamptz)
          //   .to.equal(CAS.getCUBRIDDataTypeName(CAS.CUBRIDDataType.CCI_U_TYPE_TIMESTAMPTZ));

          const row = result.ColumnValues[0];
          const col1 = row[0].toString();
          const col2 = row[1].toString();

          expect(col1)
            .to.equal('2017-04-05 13:30:30.500 Asia/Seoul KST');
          expect(col2)
            .to.equal('2017-04-05 13:30:30.000 Asia/Seoul KST');
        })
        .then(() =>{
          return client.close();
        })
        .then(() => {
          return client.connect();
        })
        .then(() => {
          return client.query(`SET SYSTEM PARAMETERS 'timezone=America/Los_Angeles'`);
        })
        .then(() => {
          // Testing DATETIMELTZ and TIMESTAMPLTZ
          return client.query(`SELECT col2, col4 FROM ${TABLE_NAME}`)
        })
        .then(res => {
          const result = res.result;

          // This test should be fail because server respond invalid data type
          // const datetimeltz = result.ColumnDataTypes[0];
          // const timestampltz = result.ColumnDataTypes[0];
          //
          // expect(datetimeltz)
          //   .to.equal(CAS.getCUBRIDDataTypeName(CAS.CUBRIDDataType.CCI_U_TYPE_DATETIMELTZ));
          // expect(timestampltz)
          //   .to.equal(CAS.getCUBRIDDataTypeName(CAS.CUBRIDDataType.CCI_U_TYPE_TIMESTAMPLTZ));

          const row = result.ColumnValues[0];
          const col2 = row[0].toString();
          const col4 = row[1].toString();

          expect(col2)
            .to.equal('2017-04-04 21:30:30.500 America/Los_Angeles PDT');
          expect(col4)
            .to.equal('2017-04-04 21:30:30.000 America/Los_Angeles PDT');
        })
        .then(() =>{
          return client.close();
        });
    });
  });
});
