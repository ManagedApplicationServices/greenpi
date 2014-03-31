(function () {

  var totalCloud = 3;

  var currCloud = 0;
  var nextCloud = 1;

  document.getElementById('c' + currCloud).style.display = 'block';

  setInterval(function() {
    document.getElementById('c' + currCloud).style.display = 'none';
    document.getElementById('c' + nextCloud).style.display = 'block';

    currCloud = (currCloud + 1) % totalCloud;
    nextCloud = (nextCloud + 1) % totalCloud;
  }, 300000);

})();
