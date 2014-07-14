(function() {

  'use strict';
  var maxPaperCount = 0,
    treeSizeRatios = [1, 0.9, 0.55, 0.3, 0.1],
    paperCountSections = [],

    currentTree = 0,
    percentSize = 0,
    treeSizeOriginal = [20, 40, 35, 30, 25],
    treeLeftPosition = [11, 26, 46, 72, 82], // css - .treeN, left
    treeLeftPositionOriginal = [2, 7, 29.5, 58, 70.5], //css - .leavesN, left
    treeSizeUnit = 'vw',
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
    simulationStartedAt,
    demo = 0,
    socket = io.connect('/');

  function startSimulation() {
    document.getElementById('stop').style.display = 'block';
    socket.emit('start');

    socket.on('paperRemaining', function (data) {
      maxPaperCount = data;
      createPaperCountSections(maxPaperCount);
    });

    socket.on('demo', function (data) {
      setDemoMode(data);
    });

    initialiseSimulation();
  }

  function stopSimulation() {
    document.getElementById('stop').style.display = 'none';
    socket.emit('stop');
    initialiseSimulation();
    document.getElementById('start').style.display = 'block';
  }

  function initialiseSimulation() {
    currentTree = 1;
    percentSize = 0;
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
    data = parseInt(data);

    count += 1;
    currLeafCount = data;
    fallingLeaf = (count % 5) + 1;
    vanishingLeaf = (fallingLeaf % 5) + 1;

    differenceLeafCount = Math.round(prevLeafCount - currLeafCount);

    document.getElementById('l' + fallingLeaf).style.display = 'block';
    if(differenceLeafCount > 0) {
      document.getElementById('l' + vanishingLeaf).style.display = 'none';
      document.getElementById('l' + fallingLeaf).innerHTML = '-' + differenceLeafCount;
    }

    document.getElementById('left').style.width = Math.round(data/maxPaperCount*100) + '%';
    var lost = 100 - Math.round(data/maxPaperCount*100) + '%';
    document.getElementById('lost').style.width = lost;
    document.getElementById('lost').innerHTML = lost + ' forest lost since ' + moment(simulationStartedAt).startOf('minute').fromNow();

    prevLeafCount = data;
  }

  function reduceForest(min, max, data, currentTreeNum) {
    var i = 0;
    var currTree = document.getElementById('t' + currentTreeNum);

    for(i = 1; i < currentTreeNum; i++) {
      document.getElementById('t' + i).style.width = 0;
      document.getElementById('t' + i).style.height = 0;
      document.getElementById('f' + i).style.display = 'none';
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
    document.getElementById('status').innerHTML = '<h1>All forest is lost</h1>' + '<p>' + Math.round(maxPaperCount) + ' papers were printed since ' + moment(simulationStartedAt).startOf('minute').fromNow() + '.<br>Can we do better next time?</p>';
  }

  function createPaperCountSections(data) {
    treeSizeRatios.forEach(function (element, index, array) {
      paperCountSections.push(data * element);
    });

    paperCountSections.push(1);
  }

  function triggerReduceForest(data) {
    var i = 0;
    var currentTreeNum = 0;

    if(data < 1) {
      changesOnLastPrint(data);
    } else {
      for(i = 1; i <= paperCountSections.length; i++) {
        if(data > paperCountSections[i]) {
          currentTreeNum = i;
          socket.emit('currentTreeNum', i);
          reduceForest(paperCountSections[i], paperCountSections[i-1], data, currentTreeNum);
          break;
        }
      }
    }
  }

  function setDemoMode(isDemoMode) {
    if(isDemoMode) {
      document.getElementById('demo').style.display = 'block';
    } else {
      document.getElementById('demo').style.display = 'none';
    }
  }

  document.getElementById('start').addEventListener('click', startSimulation, false);
  document.getElementById('stop').addEventListener('click', stopSimulation, false);

  // get current status upon page refresh
  $.getJSON('/usages', function(result) {
    var data = 0;

    if(result.simulation === 'running' && result.paperRemaining > 0) {
      maxPaperCount = result.paperCapPerPrinterPerYear;
      data = result.paperRemaining;
      simulationStartedAt = result.simulationStartAt;
      demo = result.demo;
      setDemoMode(demo);

      document.getElementById('start').style.display = 'none';
      createPaperCountSections(maxPaperCount);
      triggerReduceForest(data);
    }

  });

  socket.on('ping', function (data) {
    changesOnEveryPrint(data);
    triggerReduceForest(data);
  });

})();
