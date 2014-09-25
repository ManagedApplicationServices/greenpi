'use strict';

exports.isNew = function isNew(now) {
  var fiveSecondsAgo = new Date(now.getTime() - 5000);

   if (now.getMonth() > fiveSecondsAgo.getMonth()) {
     return false;
   } else {
     return false;
   }
};
