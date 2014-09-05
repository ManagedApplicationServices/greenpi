(function() {

  'use strict';

  window.smoothScrollTo = (function() {
    var timer, start, factor;

    return function(target, duration) {
      var offset = window.pageYOffset,
        delta  = target - window.pageYOffset;     // Y-offset difference
      duration = duration || 1000;              // default 1 sec animation
      start = Date.now();                       // get start time
      factor = 0;

      if (timer) {
        clearInterval(timer);                 // stop any running animations
      }

      function step() {
        var y;
        factor = (Date.now() - start) / duration; // get interpolation factor
        if (factor >= 1 ) {
          clearInterval(timer); // stop animation
          factor = 1;           // clip to max 1.0
        }
        y = factor * delta + offset;
        window.scrollBy(0, y - window.pageYOffset);
      }

      timer = setInterval(step, 10);
      return timer;
    };
  }());

  var timeToScroll = 3000, // 3 seconds to scroll
    positionTop = 0, // right at the top
    positionBottom = document.body.scrollHeight, // right at the bottom
    timeAtScrollTop = 600000, // scroll to top to the sky every 5 min
    timeAtScrollBottom = 30000; // scroll to bottom to the forest after 30 sec

  setInterval(function() {
    window.smoothScrollTo(positionTop, timeToScroll);
    setTimeout(function() {
      window.smoothScrollTo(positionBottom, timeToScroll);
    }, timeAtScrollBottom);
  }, timeAtScrollTop);

  setTimeout(function() {
    window.smoothScrollTo(99999, timeToScroll);
  }, 0);

})();
