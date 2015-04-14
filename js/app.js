var React = require('react');

var Calendar = require('./modules/calendar.js');
var Test = require('./modules/test.js');

React.render(
  <Calendar />,
  document.getElementById('calendar-container')
);
