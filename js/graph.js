(function () {

  'use strict';

  // usage input
  var paperUsage = [ 25000, 7, 5, 260, 11, 100, 234, 1, 45, 12, 23, 5000, 600, 2342, 34234];
  var cap = 20000;

  var dataset = [];
  if(paperUsage.length > 12) {
    dataset = paperUsage.slice(Math.max(paperUsage.length - 12, 1));
  } else {
    dataset = paperUsage;
  }

  var capset = [cap];
  var maxDataset = d3.max(dataset);
  var maxHeightNormalised = 0;
  var maxHeight = 80;
  var maxWidth = 80;
  var i = 0;

  if(cap > maxDataset) {
    maxHeightNormalised = cap;
  } else {
    maxHeightNormalised = maxDataset;
  }

  var MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  var monthset = [];

  var firstMonth = (new Date().getMonth() + 13 - dataset.length) % 12;

  monthset.push(firstMonth);

  for(i = 1; i < dataset.length; i ++) {
    firstMonth++;
    firstMonth = (firstMonth + 12) % 12;
    monthset.push(firstMonth);
    capset.push(cap);
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

  var capstyle = document.createElement('style');
  capstyle.innerHTML = '.cap:after{content: "limit: ' + cap + '";}';
  document.head.appendChild(capstyle);
})();
