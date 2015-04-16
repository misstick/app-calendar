
// @TODO : normalement, installer moment, underscore avec npm start (ou build)
var moment = require('moment');
var _ = require('underscore');
var React = require('react');

// @FIXME : DOESNT WORK ?!
moment.locale('fr');
console.log(moment(1316116057189).fromNow());

var YEAR_STEP  = 6; // Get the MONTH_STEP weeks before/after the current date
var WEEK_STEP = 1;  // Get the WEEK_STEP weeks before/after the current date

var DATE_FORMAT_STORE = "DD-MM-YYYY";
var DATE_FORMAT_FULL = "dddd D MMMM YYYY";

var get_full_date = function(timestamp) {
    return moment(this.state).format(DATE_FORMAT_FULL);
}

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
    while (moment(_date).isBefore(end) || moment(_date).isSame(end)) {
        days.push(_date.valueOf());
        _date = _date.add(1, "days");
    }
    return days;
}

var _get_data = function(scope, data) {
    var result = data || {date: new Date()};
    result.weeks = _get_period(scope, result.date);
    result.days = _range_weeks(result.weeks.min, result.weeks.max);
    return result;
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

  getInitialState: function() {
      return {
          date: moment().valueOf()
      };
  },

  componentDidMount: function() {
      
  },

  componentWillUnmount: function() {
      
  },

  render: function() {
      var props = _get_data("week", this.state);
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
    render: function() {
        
        // @FIXME: est-ce qu'il faut afficher le header pour tous les jours ?
        // Parceque : 1 tableau pour chaque semaine
        
        // @FIXME : n'affiche pas les bons jours (tjrs la date courante)
        
        var header = this.props.days.map(function(day) {
            var weekday = moment(day.timestamp).format("dd");
            var id = weekday + "-cell";
            return (
                <th id={id}>{weekday}</th>
            );
        });
        
        var content = this.props.days.map(function(day) {
            var weekday = moment(day.timestamp).format("dddd");
            var id = weekday + "-cell";
            var date = moment(day.timestamp).date();
            return (
                <td headers="wednesday-cell">
                    <span>{date}</span>
                </td>
            );
        })
        
        var footer = get_full_date(this.props.current);
        
        return (
            <table data-view="calendar-menu">
                <thead>
                    <tr>
                        {header}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        {content}
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan="7"><h1>{footer}</h1></td>
                    </tr>
                </tfoot>
            </table>
        );
    }
});


Calendar.Breadcrumb = React.createClass({
  render: function() {
      var month = moment(this.props.date).format("MMMM");
      return (
          <a href="#" className="breadcrumb">{month}</a>
      );
  }
});

Calendar.Day = React.createClass({
  render: function() {
      var day = this.props.day;
      var hours = _.range(1, 25);
      var content = hours.map(function(hour) {
          var timestamp = day + hour * 60 * 60 * 1000;
          return (
              <Calendar.Hour value={timestamp} />
          );
      });
      return (
          <table  data-timestamp={day}>
              <tbody>
                  {content}
              </tbody>
          </table>
      );
  }
});

Calendar.Hour = React.createClass({
  render: function() {
      var label = moment(this.props.value).format("HH:mm");
      return (
          <tr>
              <th scope="row">{label}</th>
              <td></td>
          </tr>
      );
  }
});

Calendar.Week = React.createClass({

    // @TODO : mettre un timeout pour changer l'heure a chaque fois
    // mais uniquement lorsque cette vue est visible 
    // donc en fonction du router
    getInitialState: function() {
        return {
            "time": "02h15"
        };
    },
    
    render: function() {
      var days = this.props.days.map(function(day, index) {
          return (
              <Calendar.Day day={day} />
          );
      });
      return (
          <div data-view="week-view" className="scroll-view" style={{height: 300}}>
              <div id="current-timer" style={{top: 200, left: 0}}>
                  {this.state}
              </div>
              { days }
          </div>
      );
    }
});


module.exports = Calendar;

