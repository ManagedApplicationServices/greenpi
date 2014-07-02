(function () {

  'use strict';

  var paperUsage = []; // all months paper usage
  var cap = 0; // organization's single printer paper usage cap
  var socket = io.connect('/');
  var dataset = []; // last 12 months of monthly paper usage
  var capset = []; // an array of single printer paper usage cap
  var monthset = [];
  var maxDataset = 0; // max of all monthly paper usage
  var maxHeightNormalised = 0;
  var maxHeight = 75;
  var maxWidth = 75;
  var i = 0; // iterator
  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

  // ----------- INITIALISATIONS --------------

  // single printer paper usage limit
  socket.on('singlePrinterCap', function (data) {
    cap = data / 12; // per month per printer paper usage cap
    var capstyle = document.createElement('style');
    capstyle.innerHTML = '.cap:after{content: "monthly limit: ' + cap + '";}';
    document.head.appendChild(capstyle);
    dataset = [0];
  });

  // ----------- WITH EACH LEAF / PRINT JOB --------

  // if new month, then add another array data
  socket.on('newMonthStarted', function(data) {
    var firstMonth = (new Date().getMonth() + 13 - dataset.length) % 12;
    if(data) {paperUsage.push(0);} // push new array item
    dataset = getLast12MonthsPaperUsage(paperUsage);

    monthset.push(firstMonth); // index 0 is filled in
    capset.push(cap); // index 0 is filled in

    for(i = 1; i < dataset.length; i ++) {
      firstMonth++;
      firstMonth = (firstMonth + 12) % 12;
      monthset.push(firstMonth);
      capset.push(cap);
    }
  });

  // if new leaf fall / print job
  socket.on('currentMonthTotal', function(data) {
    maxWidth = 80;
    paperUsage[paperUsage.length - 1] = parseInt(data);
    dataset = getLast12MonthsPaperUsage(paperUsage);
    maxDataset = d3.max(dataset);
    maxHeightNormalised = getMaxHeightNormalised(cap, maxDataset);
    drawGraph(dataset, maxHeightNormalised, maxHeight, maxWidth, monthset, cap);
  });

  function getLast12MonthsPaperUsage(paperUsage) {
    var dataset = [];

    if(paperUsage.length > 12) {
      dataset = paperUsage.slice(Math.max(paperUsage.length - 12, 1));
    } else {
      dataset = paperUsage;
    }

    return dataset;
  }

  function drawGraph(dataset, maxHeightNormalised, maxHeight, maxWidth, monthset, cap) {
    console.log('dataset before drawing graph: ');
    console.log(dataset);
    console.log(monthset);

    if(!d3.select('.cap').empty()){
      $('.cap').remove();
    }

    if(d3.selectAll('.bar') !== null) {
      d3.selectAll('.bar').remove();
    }

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
      .style('width', function(d) {
        var barWidth = (maxWidth - 2*dataset.length)/dataset.length;
        return barWidth + 'vw';
      })

      .append('text')
      .text(function(d) {
        return d;
      });

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

    d3.selectAll('.bar')
      .data(monthset)
      .append('p')
      .attr('class', 'months')
      .text(function(d) {
        return MONTHS[d];
      });
  }

  function getMaxHeightNormalised(cap, maxDataset) {
    if(cap > maxDataset) {
      return cap;
    } else {
      return maxDataset;
    }
  }

})();
