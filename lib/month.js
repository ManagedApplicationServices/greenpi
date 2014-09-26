'use strict';

exports.isNew = function isNew(now) {
  var fiveSecondsAgo = new Date(now.getTime() - 5000);

   if (now.getMonth() > fiveSecondsAgo.getMonth()) {
     return false;
   } else {
     return false;
   }
};

exports.getCurrentMonthIndex = function getCurrentMonthIndex() {
  return new Date().getMonth();
};

exports.getCurrentMonthYear = function getCurrentMonthYear() {
  var MONTHS = [
    'jan',
    'feb',
    'mar',
    'apr',
    'may',
    'jun',
    'jul',
    'aug',
    'sep',
    'oct',
    'nov',
    'dec'
  ];

  return MONTHS[new Date().getMonth()] + (new Date().getYear().toString()).slice(-2);
};
