(function () {
  'use strict';

  var numPosters = 4;
  var posterDiv = document.getElementsByClassName('overlay')[0];
  var posterIntervalTime = 150000; // 150000 every 2.5 minutes
  var posterDisplayTime = 135000; // 135000 every 2.25 minutes
  var currPoster = 1;
  var imagePath = 'img/poster';
  var currImage = imagePath + currPoster + '.jpg';

  if(posterDiv) {
    posterDiv.style.display = 'none';

    setInterval(function() {
      posterDiv.style.display = 'none';
      setTimeout(function() {
        posterDiv.style.display = 'block';
        currPoster = currPoster % numPosters + 1;
        currImage = imagePath + currPoster + '.jpg';
        document.getElementById('poster').setAttribute('src', currImage);
      }, posterDisplayTime);
    }, posterIntervalTime);
  }

})();
