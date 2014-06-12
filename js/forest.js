(function() {

  'use strict';

  var maxPaperCount = 1000,
    maxPaperCountWording = '1 thousand',
    paperCountSections = [1000, 900, 550, 300, 100],

    currentTree = 0,
    percentSize = 0,
    treeSizeOriginal = [],
    treeLeftPosition = [],
    treeLeftPositionOriginal = [],
    treeSizeUnit = '',
    treeSize = 0,
    min = 0,
    max = 0,
    position = '',
    lostWords = '',
    lost = '',
    count = 0,
    fallingLeaf = 0,
    vanishingLeaf = 0,
    currLeafCount = 0,
    prevLeafCount = maxPaperCount,
    differenceLeafCount = 0,
    simulationStartedAt;

  function detectStartSimulation() {
    document.getElementById('start').onclick = function() {
      socket.emit('simulation', 'start');
      initialiseSimulation();
    };
  }

  function initialiseSimulation() {
    currentTree = 1;
    percentSize = 0;
    treeSizeOriginal = [20, 40, 35, 30, 25];
    treeLeftPosition = [11, 26, 46, 72, 86];
    treeLeftPositionOriginal = [2, 7, 29.5, 58, 74.5];
    treeSizeUnit = 'vw';
    treeSize = 0;
    min = 0;
    max = 0;
    position = '';
    lostWords = '';
    lost = '';
    count = 0;
    fallingLeaf = 0;
    vanishingLeaf = 0;
    currLeafCount = 0;
    prevLeafCount = maxPaperCount;
    differenceLeafCount = 0;
    simulationStartedAt = Date();

    // scroll to bottom on load
    window.scrollTo(0,document.body.scrollHeight);

    [1, 2, 3, 4, 5].forEach(function(element, index, array) {
      document.getElementById('t' + element).style.width = treeSizeOriginal[index] + treeSizeUnit;
      document.getElementById('t' + element).style.height = treeSizeOriginal[index] + treeSizeUnit;
      document.getElementById('t' + element).style.left = treeLeftPositionOriginal[index] + treeSizeUnit;
      document.getElementById('f' + element).style.display = 'block';
    });

    document.getElementById('lost').style.width = '0%';
    document.getElementById('lost').style.display = 'block';
    document.getElementById('left').style.width = '100%';
    document.getElementById('left').style.display = 'block';

    document.getElementById('start').style.display = 'none';
    document.getElementById('status').style.display = 'none';
  }

  function changesOnEveryPrint(data) {
    count += 1;
    currLeafCount = data;
    fallingLeaf = (count % 5) + 1;
    vanishingLeaf = (fallingLeaf % 5) + 1;

    differenceLeafCount = prevLeafCount - currLeafCount;

    document.getElementById('l' + fallingLeaf).style.display = 'block';
    if(differenceLeafCount > 0) {
      document.getElementById('l' + vanishingLeaf).style.display = 'none';
      document.getElementById('l' + fallingLeaf).innerHTML = '-' + differenceLeafCount;
    }

    document.getElementById('left').style.width = Math.round(data/10) + '%';
    var lost = 100 - Math.round(data/10) + '%';
    document.getElementById('lost').style.width = lost;
    document.getElementById('lost').innerHTML = lost + ' forest lost since ' + moment(simulationStartedAt).startOf('minute').fromNow();

    prevLeafCount = data;
  }

  function reduceForest(min, max, currentTreeNum, data) {
    var prevTreeNum = currentTreeNum - 1;
    var prevTree = document.getElementById('t' + prevTreeNum);
    var prevFlower = document.getElementById('f' + prevTreeNum);
    var currTree = document.getElementById('t' + currentTreeNum);

    if(prevTreeNum > 0) {
      prevTree.style.width = 0 + treeSizeUnit;
      prevTree.style.height = 0 + treeSizeUnit;
      prevFlower.style.display = 'none';
    }

    treeSize = treeSizeOriginal[currentTreeNum-1]*((data-min)/(max-min));
    currTree.style.width = treeSize + treeSizeUnit;
    currTree.style.height = treeSize + treeSizeUnit;
    currTree.style.left = treeLeftPosition[currentTreeNum - 1] - treeSize / 2 + treeSizeUnit;
  }

  function changesOnLastPrint(data) {
    document.getElementById('t5').style.width = 0 + treeSizeUnit;
    document.getElementById('t5').style.height = 0 + treeSizeUnit;
    document.getElementById('f5').style.display = 'none';

    document.getElementById('left').style.display = 'none';
    document.getElementById('lost').style.width = '100%';
    document.getElementById('lost').innerHTML = '100% forest is lost :(';

    document.getElementById('start').style.display = 'block';

    document.getElementById('status').style.display = 'block';
    document.getElementById('status').innerHTML = '<h1>All forest is lost</h1>' + '<p>' + maxPaperCountWording + ' papers were printed since ' + moment(simulationStartedAt).startOf('minute').fromNow() + '.<br>Can we do better next time?</p>';
  }

  var socket = io.connect('/');
  detectStartSimulation();

  socket.on('ping', function (data) {

    changesOnEveryPrint(data);

    if(data > paperCountSections[1] && data <= paperCountSections[0]) {
      reduceForest(paperCountSections[1], paperCountSections[0], 1, data);
    } else if(data > paperCountSections[2] && data <= paperCountSections[1]) {
      reduceForest(paperCountSections[2], paperCountSections[1], 2, data);
    } else if(data > paperCountSections[3] && data <= paperCountSections[2]) {
      reduceForest(paperCountSections[3], paperCountSections[2], 3, data);
    } else if(data > paperCountSections[4] && data <= paperCountSections[3]) {
      reduceForest(paperCountSections[4], paperCountSections[3], 4, data);
    } else if(data > 1 && data <= 100) {
      reduceForest(1, paperCountSections[4], 5, data);
    } else {
      changesOnLastPrint(data);
    }

  });
})();
