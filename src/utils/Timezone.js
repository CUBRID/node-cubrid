'use strict';
const moment = require('moment-timezone');

module.exports = Timezone;

/**
 * Constructor
 * @param datetime
 * @param timezone
 */
function Timezone(datetime, timezone) {
  this.datetime = datetime;

  if (timezone) {
    this.timezone = timezone.toString();
    const tz = this.timezone.split(' ');
    this.region = tz[0];

    if (!tz[1]) {
      // create from moment
      this.tzd = moment.tz(this.datetime, this.region).format('z')
    } else {
      this.tzd = tz[1];
    }

    const timeOffset = moment.tz(this.datetime, this.region).format('Z').split(':');
    this.tzh = timeOffset[0];
    this.tzm = timeOffset[1];
  } else {
    this.timezone = '';
    this.tzd = '';
    this.tzh = '';
    this.tzm = '';
  }
}

/**
 * Returns 'YYYY-MM-DD HH24:MI:SS TIMEZONE' format
 * @returns {string}
 */
Timezone.prototype.toString = function() {
    return `${this.format('YYYY-MM-DD HH24:MI:SS.FF')}${(this.timezone ? ` ${this.timezone}` : ``)}`;
};

/**
 * This format based Date/Time format from http://www.cubrid.org/manual/10_0/en/sql/function/typecast_fn.html#to-char-date-time
 * @param format
 * @returns {String}
 */
Timezone.prototype.format = function(format) {
  if (!this.datetime) return '';

  const weeks = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'];
  const date = this.datetime;
  const that = this;

  let am = (/AM|A\.M\./i).exec(format);
  let pm = (/PM|P\.M\./i).exec(format);
  if (am) {
    am = am[0];
    const code = am.charCodeAt(0) + 15;
    pm = am.replace(/A/i, String.fromCharCode(code));
  } else if (pm) {
    pm = pm[0];
    const code = pm.charCodeAt(0) - 15;
    am = pm.replace(/P/i, String.fromCharCode(code));
  }

  format = format.toUpperCase();
  const formatRex = /(CC|YYYY|YY|Q|MM|MONTH|MON|DD|DAY|DY|D|d|AM|PM|A\.M\.|P\.M\.|HH12|HH24|HH|MI|SS|FF|TZD|TZH|TZM)/g;

  return format.replace(formatRex, function($1) {
    switch($1) {
      case 'CC':
        return Math.floor(parseInt(date.getUTCFullYear() / 100)) + 1;
      case 'YYYY':
        return date.getUTCFullYear();
      case 'YY':
        return _zeroPadding(date.getUTCFullYear() % 100);
      case 'Q': {
        const mon = date.getMonth();
        if (mon < 3) return 1;
        else if (mon < 6) return 2;
        else if (mon < 9) return 3;
        else return 4;
      } case 'MM':
        return _zeroPadding(date.getMonth() + 1);
      case 'MONTH':
        return months[date.getMonth()];
      case 'MON':
        return months[date.getMonth()].substr(0, 3);
      case 'DD':
        return _zeroPadding(date.getUTCDate());
      case 'DAY':
        return weeks[date.getUTCDay()];
      case 'DY':
        return weeks[date.getUTCDay()].substr(0, 3);
      case 'D':
      case 'd':
        return (date.getUTCDay() == 0) ? 7 : date.getUTCDay();
      case 'AM':
      case 'A.M.':
      case 'PM':
      case 'P.M.':
        return (date.getUTCHours() < 12) ? am : pm;
      case 'HH':
      case 'HH12': {
        const hour = date.getUTCHours() % 12;
        return _zeroPadding((hour) ? hour : date.getUTCHours());
      } case 'HH24':
        return _zeroPadding(date.getUTCHours());
      case 'MI':
        return _zeroPadding(date.getUTCMinutes());
      case 'SS':
        return _zeroPadding(date.getUTCSeconds());
      case 'FF':
        return _zeroPadding(date.getMilliseconds(), true);
      case 'TZD':
        return that.tzd;
      case 'TZH':
        return that.tzh;
      case 'TZM':
        return that.tzm;
      default:
        return $1;
    }
  });
};

/**
 * Return the number of milliseconds between 1 January 1970 00:00:00 UTC and Timezone.datetime
 * @returns {Number}
 */
Timezone.prototype.valueOf = function() {
  return Date.prototype.valueOf.call(this.datetime);
};

/**
 * Return the number of offset for this timezone
 * @returns {Number}
 */
Timezone.prototype.getOffset = function() {
  const zone = moment.tz.zone(this.region);
  return zone.parse(this.datetime) * 60 * 1000;
};

function _zeroPadding(value, isMs) {
  let data;
  if (value < 10) {
    data = `0${value}`;
  } else {
    data = value;
  }

  if (isMs) {
    if (value < 100) {
      data = `0${data}`
    }
  }

  return data;
}