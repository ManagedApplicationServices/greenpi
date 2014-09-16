(function() {
  'use strict';

  var numPosters = 4,
    posterDiv = document.getElementsByClassName('overlay')[0],
    posterIntervalTime = 150000,  // 150000 every 2 min 30 sec
    posterDisplayTime = 135000,   // 135000 every 2 min 15 sec
    currPoster = 1,
    imagePath = 'img/poster',
    currImage = imagePath + currPoster + '.jpg',
    currLogo = '',
    posterRotation,
    allowedAlphaNumeric = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    randomAlphaNumeric = '',
    socket = io.connect('/');

  socket.on('set', function(data) {
    console.log('Admin settings amended!');
    if (posterDiv !== null) {
      posterDiv.style.display = 'none';

      // clear any interval
      clearInterval(posterRotation);
      posterRotation = 0;

      // set new logo
      currLogo = 'img/logo.jpg?rand=' + randomString(6, allowedAlphaNumeric);
      document.getElementById('logo').setAttribute('src', currImage);

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
  });

  function randomString(length, chars) {
    var result = '',
      i = 0;

    for (i = length; i > 0; --i) {
      result += chars[Math.round(Math.random() * (chars.length - 1))];
    }

    return result;
  }

})();
