var React = require('react');
var moment = require('moment');
var Calendar = require('./modules/calendar.js');
var Test = require('./modules/test.js');

var date = moment();

React.render(
    <Calendar type="Month" current={date.valueOf()} active={date.weekday(2).valueOf()} />,
    document.getElementById('calendar-container')
);