(function() {
  'use strict';

  var numPosters = 4;
  var posterDiv = document.getElementsByClassName('overlay')[0];
  var posterIntervalTime = 150000;  // 150000 every 2 min 30 sec
  var posterDisplayTime = 135000;   // 135000 every 2 min 15 sec
  var currPoster = 1;
  var imagePath = 'img/poster';
  var currImage = imagePath + currPoster + '.jpg';
  var currLogo = '';
  var posterRotation;
  var allowedAlphaNumeric = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var socket = io();

  function triggerPosterAndLogo() {
    if (posterDiv !== null) {
      posterDiv.style.display = 'none';

      // clear any interval
      clearInterval(posterRotation);
      posterRotation = 0;

      // set new logo
      currLogo = 'img/logo.jpg?rand=' + randomString(6, allowedAlphaNumeric);
      document.getElementById('logo').setAttribute('src', currLogo);

      // set interval for new poster images
      posterRotation = setInterval(function() {
        posterDiv.style.display = 'none';
        setTimeout(function() {
          posterDiv.style.display = 'block';
          currPoster = currPoster % numPosters + 1;
          currImage = imagePath + currPoster + '.jpg?rand=' + randomString(6, allowedAlphaNumeric);
          document.getElementById('poster').setAttribute('src', currImage);
        }, posterDisplayTime);
      }, posterIntervalTime);
    }
  }

  function randomString(length, chars) {
    var result = '';
    var i = 0;

    for (i = length; i > 0; --i) {
      result += chars[Math.round(Math.random() * (chars.length - 1))];
    }

    return result;
  }

  // trigger poster & logo when first started
  triggerPosterAndLogo();

  // upon admin setting, trigger changes in posters and logo
  socket.on('setting', function() {
    triggerPosterAndLogo();
  });

})();
