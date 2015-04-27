var React = require('react');
var moment = require('moment');
var Calendar = require('./modules/calendar.js');
var Test = require('./modules/test.js');

// @TODO : donner une autre date 
// que l'isntant présent
var date = moment();

React.render(
    <Calendar type="Month" />,
    document.getElementById('calendar-container')
);