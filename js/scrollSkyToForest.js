(function () {
  window.smoothScrollTo = (function () {
    var timer, start, factor;

    return function (target, duration) {
      var offset = window.pageYOffset,
        delta  = target - window.pageYOffset;     // Y-offset difference
        duration = duration || 1000;              // default 1 sec animation
        start = Date.now();                       // get start time
        factor = 0;

        if( timer ) {
          clearInterval(timer);                 // stop any running animations
        }

        function step() {
          var y;
          factor = (Date.now() - start) / duration; // get interpolation factor
          if( factor >= 1 ) {
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

  var timeToScroll = 500;
  var positionTop = 0;
  var positionBottom = document.body.scrollHeight;
  var timeAtScrollTop = 120000;
  var timeAtScrollBottom = 15000;

  setInterval(function() {
    smoothScrollTo(positionTop, timeToScroll);
    setTimeout(function() {
      smoothScrollTo(positionBottom, timeToScroll);
    }, timeAtScrollBottom);
  }, timeAtScrollTop);

})();
