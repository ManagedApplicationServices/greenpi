(function() {

  'use strict';

  var paperUsage = []; // all months paper usage
  var cap = 0; // organization's single printer paper usage cap
  var socket = io();
  var dataset = []; // last 12 months of monthly paper usage
  var capset = []; // an array of single printer paper usage cap
  var monthset = [];
  var maxDataset = 0; // max of all monthly paper usage
  var maxHeightNormalised = 0;
  var maxHeight = 75;
  var maxWidth = 75;
  var i = 0; // iterator
  var singlePrinterCap = 0;
  var MONTHS = [ 'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec' ];

  function getLast12MonthsPaperUsage(paperUsage) {
    var dataset = [];

    if (paperUsage.length > 12) {
      dataset = paperUsage.slice(Math.max(paperUsage.length - 12, 1));
    } else {
      dataset = paperUsage;
    }

    return dataset;
  }

  function removeGraph() {
    if (!d3.select('.cap').empty()) {
      $('.cap').remove();
    }

    if (d3.selectAll('.bar') !== null) {
      d3.selectAll('.bar').remove();
    }
  }

  function drawGraph(maxHeight, maxWidth, cap, dataset, monthset) {
    var maxHeightNormalised = getMaxHeightNormalised(cap, d3.max(dataset));
    removeGraph();

    drawGraphDataset(dataset, maxHeightNormalised, maxHeight);
    drawGraphCap(maxHeightNormalised, maxHeight, cap);
    drawGraphMonthset(monthset);
  }

  function drawGraphMonthset(monthset) {
    d3.selectAll('.bar')
      .data(monthset)
      .append('p')
      .attr('class', 'months')
      .text(function(d) {
        return MONTHS[d];
      });
  }

  function drawGraphCap(maxHeightNormalised, maxHeight, cap) {
    d3.select('.graph')
      .append('div')
      .attr('class', 'cap')
      .style('height', function() {
        var barHeight = cap / maxHeightNormalised * maxHeight;
        return barHeight + 'vh';
      })
      .style('margin-top', function() {
        var barHeight = cap / maxHeightNormalised * maxHeight;
        return '-' + barHeight + 'vh';
      });
  }

  function drawGraphDataset(dataset, maxHeightNormalised, maxHeight) {
    d3.select('.graph')
      .selectAll('div')
      .data(dataset)
      .enter()

      .append('div')
      .attr('class', 'bar')
      .style('height', function(d) {
        var barHeight = d / maxHeightNormalised * maxHeight;
        return barHeight + 'vh';
      })
      .style('width', function() {
        var barWidth = (maxWidth - 2 * dataset.length) / dataset.length;
        return barWidth + 'vw';
      })

      .append('text')
      .text(function(d) {
        return d;
      });
  }

  function getMaxHeightNormalised(cap, maxDataset) {
    if (cap > maxDataset) {
      return cap;
    } else {
      return maxDataset;
    }
  }

  function setCapLine(data) {
    var capstyle = document.createElement('style');

    cap = data / 12;
    capstyle.innerHTML = '.cap:after{content: "monthly limit: ' + Math.round(cap) + '";}';
    document.head.appendChild(capstyle);
  }

  function initGraph(singlePrinterCap) {
    setCapLine(singlePrinterCap);
    paperUsage = [];
    dataset = [ 0 ];
    monthset = [];
    removeGraph();
  }

  // ----------- INITIALISATIONS --------------

  // single printer paper usage limit
  socket.on('singlePrinterCap', function(data) {
    singlePrinterCap = data;
    initGraph(singlePrinterCap);
  });

  // reset
  socket.on('resetted', function() {
    initGraph(singlePrinterCap);
  });

  socket.on('started', function() {
    initGraph(singlePrinterCap);
  });

  // ----------- WITH EACH LEAF / PRINT JOB --------

  // if new month, then add another array data
  socket.on('newMonthStarted', function(data) {
    var firstMonth = (new Date().getMonth() + 13 - dataset.length) % 12;

    if (data) {
      // push new array item
      paperUsage.push(0);
    }

    dataset = getLast12MonthsPaperUsage(paperUsage);

    monthset.push(firstMonth); // index 0 is filled in
    capset.push(cap); // index 0 is filled in

    for (i = 1; i < dataset.length; i++) {
      firstMonth++;
      firstMonth = (firstMonth + 12) % 12;
      monthset.push(firstMonth);
      capset.push(cap);
    }
  });

  // if new leaf fall / print job
  socket.on('currentMonthTotal', function(data) {
    paperUsage[paperUsage.length - 1] = parseInt(data);
    dataset = getLast12MonthsPaperUsage(paperUsage);
    maxDataset = d3.max(dataset);
    maxHeightNormalised = getMaxHeightNormalised(cap, maxDataset);
    drawGraph(maxHeight, maxWidth, cap, dataset, monthset);
  });

  // get current status upon page refresh
  $.getJSON('/status', function(result) {

    if (result.simulation === 'running' && result.paperRemaining > 0) {
      paperUsage = result.dataset;
      dataset = getLast12MonthsPaperUsage(paperUsage);
      monthset = result.monthset;
      maxDataset = d3.max(dataset);
      maxHeightNormalised = getMaxHeightNormalised(cap, maxDataset);

      setCapLine(result.paperCapPerPrinterPerYear);
      drawGraph(maxHeight, maxWidth, cap, dataset, monthset);
    }

  });

})();
