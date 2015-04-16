
// @TODO : normalement, installer moment, underscore avec npm start (ou build)
var moment = require('moment');
var _ = require('underscore');
var React = require('react');

var YEAR_STEP  = 6; // Get the MONTH_STEP weeks before/after the current date
var WEEK_STEP = 1;  // Get the WEEK_STEP weeks before/after the current date

var DATE_FORMAT_STORE = "DD-MM-YYYY";
var DATE_FORMAT_COMPARE = "X";

var _get_period = function(scope, timestamp) {
    var current, min, max;
    switch(scope) {
        case "week":
            current = moment(timestamp).week();
            min = current - WEEK_STEP;
            max = current + WEEK_STEP;
            break;
        case "year":
            current = moment(timestamp).week();
            min = current - YEAR_STEP;
            max = current + YEAR_STEP;
            break;
        default:
            break;
    }
    return {
        min: min,
        max: max
    };
}

// @FIXME : les jours récupérés sont tous les jours de la semaine
// Ne récupérer que les jours des semaines comprises entre
// period.min et period.max
var _range_weeks = function(min, max) {
    var days = [];
    var start = moment().week(min).startOf("month");
    var end = moment().week(max).endOf("month");
    
    var _date = start;
    while (_date.format(DATE_FORMAT_COMPARE) <= end.format(DATE_FORMAT_COMPARE)) {
        days.push(_date.format(DATE_FORMAT_STORE));
        _date = _date.add(1, "days");
    }
    return days;
}

var _get_data = function(scope, timestamp) {
    if (timestamp == undefined) {
        var timestamp = new Date();
    }
    var period = _get_period(scope, timestamp);
    var days = _range_weeks(period.min, period.max);
    return {
        period: period,
        days: days
    };
}


/*

{
    name: "event0",
    date: 'timestampValue',
    status: "important|normal"
}

*/
/*
    @TODO : formattage de date

    Lister les formats d'affichage de date pour chaque vue utilisée :
     - Lundi 6 Avril 2015 (date courante)
     - L 6 (Menu)
     - 2015 (Année courante)
     - timestamp (utile pour le cid)


Note : manipulation des données jours :

 - vue année : charger ts les jours +/- 6 mois en fction du mois affiché
 - vue jour : charger toute la semaine en cours +/- les semaines autour

Le scroll met à jour les dates à charger
=> state pour année : mois en cours
=> state pour semaine en cours : num de la semaine avec l'année (ex: { wekk: 52, year: 2015})
*/

var Calendar = React.createClass({

  // getInitialState: function() {
  //   return getTodoState();
  // },

  componentDidMount: function() {
      
  },

  componentWillUnmount: function() {
      
  },

  render: function() {
      var props = _get_data("week");
      return (
          <div data-view="calendar-week-view" className="main-view">
              <nav role="navigation">
                  <Calendar.Breadcrumb {...props} />
                  <Calendar.Menu {...props} />
                  <Calendar.Week {...props} />
              </nav>
          </div>
      );
  }

});


Calendar.Menu = React.createClass({
    render: function() {return (
        <table data-view="calendar-menu">
            <thead>
                <tr>
                    <th id="monday-cell">
                        L<span className="ellipsis">undi</span>
                    </th>
                    <th id="tuesday-cell">
                        M<span className="ellipsis">ardi</span>
                    </th>
                    <th id="wednesday-cell">
                        M<span className="ellipsis">ercredi</span>
                    </th>
                    <th id="thursday-cell">
                        J<span className="ellipsis">eudi</span>
                    </th>
                    <th id="friday-cell">
                        V<span className="ellipsis">endredi</span>
                    </th>
                    <th id="saturday-cell">
                        S<span className="ellipsis">amedi</span>
                    </th>
                    <th id="sunday-cell">
                        D<span className="ellipsis">imanche</span>
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td headers="monday-cell">
                        <span className="active">6</span>
                    </td>
                    <td headers="tuesday-cell">
                        <span>7</span>
                    </td>
                    <td headers="wednesday-cell">
                        <span>8</span>
                    </td>
                    <td headers="thursday-cell">
                        <span>9</span>
                    </td>
                    <td headers="friday-cell">
                        <span>10</span>
                    </td>
                    <td headers="saturday-cell">
                        <span>11</span>
                    </td>
                    <td headers="sunday-cell">
                        <span>12</span>
                    </td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <td colSpan="7"><h1>Lundi 6 Avril 2015</h1></td>
                </tr>
            </tfoot>
        </table>
        );
    }
});


Calendar.Breadcrumb = React.createClass({
  render: function() {
      return (
          <a href="#" className="breadcrumb">Avril</a>
      );
  }
});

Calendar.Day = React.createClass({
  render: function() {
      
      // @TODO : générer ici 24 lignes 
      // soit 1 pour chaque heure
      
      console.log("Calendar.Day", this.props);
      
      var content = [];
      var cmpt = 24;
      
      content = _.map(_.range(1, 25), function(hour) {
          // @TODO : transformer l'heure (cf moment)
          // 1 => 01:00 
          return (
              <Calendar.Hour value={hour} />
          );
      });
      return (
          <table  data-day="lundi">
              <tbody>
                  {content}
              </tbody>
          </table>
      );
  }
});

Calendar.Hour = React.createClass({
  render: function() {
      
      console.log("Calendar.Hour", this.props);
      return (
          <tr>
              <th scope="row"><span>00:00</span></th>
              <td></td>
          </tr>
      );
  }
});

// @TODO : récupérer le numéro de la semaine
// @props.week
Calendar.Week = React.createClass({
  render: function() {
      
      console.log("Calendar.Week", this.props);
      
      // @FIXME : les données récupérées sont fausses

      var days = this.props.days.map(function(day, index) {
          return (
              <Calendar.Day value={day} />
          );
      });
      return (
          <div data-view="week-view" className="scroll-view" style={{height: 300}}>
              <div id="current-timer" style={{top: 200, left: 0}}>
                  <span>02h15</span>
              </div>
              { days }
          </div>
      );
  }
});


module.exports = Calendar;

