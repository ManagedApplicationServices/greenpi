(function() {

  'use strict';

  var prevLeafCount = 1000,
    currentTree = 0,
    percentSize = 0,
    treeSizeOriginal = [],
    treeLeftPosition = [],
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
    differenceLeafCount = 0;

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
    prevLeafCount = 1000;
    differenceLeafCount = 0;

    document.getElementById('b').style.display = 'block';

    document.getElementById('t1').style.width = treeSizeOriginal[0] + treeSizeUnit;
    document.getElementById('t1').style.height = treeSizeOriginal[0] + treeSizeUnit;
    document.getElementById('t2').style.width = treeSizeOriginal[1] + treeSizeUnit;
    document.getElementById('t2').style.height = treeSizeOriginal[1] + treeSizeUnit;
    document.getElementById('t3').style.width = treeSizeOriginal[2] + treeSizeUnit;
    document.getElementById('t3').style.height = treeSizeOriginal[2] + treeSizeUnit;
    document.getElementById('t4').style.width = treeSizeOriginal[3] + treeSizeUnit;
    document.getElementById('t4').style.height = treeSizeOriginal[3] + treeSizeUnit;
    document.getElementById('t5').style.width = treeSizeOriginal[4] + treeSizeUnit;
    document.getElementById('t5').style.height = treeSizeOriginal[4] + treeSizeUnit;

    document.getElementById('f1').style.display = 'block';
    document.getElementById('f2').style.display = 'block';
    document.getElementById('f3').style.display = 'block';
    document.getElementById('f4').style.display = 'block';
    document.getElementById('f5').style.display = 'block';

    document.getElementById('lost').style.width = '0%';
    document.getElementById('lost').style.display = 'block';
    document.getElementById('left').style.width = '100%';
    document.getElementById('left').style.display = 'block';

    document.getElementById('start').style.display = 'none';
    document.getElementById('lost').style.display = 'block';
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
    document.getElementById('lost').innerHTML = lost + ' forest lost ';

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
    document.getElementById('b').style.display = 'none';
    document.getElementById('t5').style.width = 0 + treeSizeUnit;
    document.getElementById('t5').style.height = 0 + treeSizeUnit;
    document.getElementById('f5').style.display = 'none';

    document.getElementById('left').style.display = 'none';
    document.getElementById('lost').style.width = '100%';
    document.getElementById('lost').innerHTML = 'all forest is lost :(';

    document.getElementById('start').style.display = 'block';
  }

  var socket = io.connect('/');
  detectStartSimulation();

  socket.on('ping', function (data) {

    changesOnEveryPrint(data);

    if(data > 900 && data <= 1000) {
      reduceForest(900, 1000, 1, data);
    } else if(data > 550 && data <= 900) {
      reduceForest(550, 900, 2, data);
    } else if(data > 300 && data <= 550) {
      reduceForest(300, 550, 3, data);
    } else if(data > 100 && data <= 300) {
      reduceForest(100, 300, 4, data);
    } else if(data > 1 && data <= 100) {
      reduceForest(1, 100, 5, data);
    } else {
      changesOnLastPrint(data);
    }

  });
})();
