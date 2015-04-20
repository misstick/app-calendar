
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
    return moment(timestamp).format(DATE_FORMAT_FULL);
}

// var _get_period = function(scope, timestamp) {
//     var current, min, max;
//     switch(scope) {
//         case "week":
//             current = moment(timestamp).week();
//             min = current - WEEK_STEP;
//             max = current + WEEK_STEP;
//             break;
//         case "year":
//             current = moment(timestamp).week();
//             min = current - YEAR_STEP;
//             max = current + YEAR_STEP;
//             break;
//         default:
//             break;
//     }
//     return {
//         min: min,
//         max: max
//     };
// }

// // @FIXME : les jours récupérés sont tous les jours de la semaine
// // Ne récupérer que les jours des semaines comprises entre
// // period.min et period.max
// var _range_weeks = function(min, max) {
//     var days = [];
//     var start = moment().week(min).startOf("month");
//     var end = moment().week(max).endOf("month");
//
//     var _date = start;
//     while (moment(_date).isBefore(end) || moment(_date).isSame(end)) {
//         days.push(_date.valueOf());
//         _date = _date.add(1, "days");
//     }
//     return days;
// }

var get_calendar_days = function(scope, data) {
    
    var data = data || {start: new Date()};
    var days = [];
    // result.weeks = _get_period(scope, result.date);
    // result.days = _range_weeks(result.weeks.min, result.weeks.max);
    
    var first_day = moment(day).startOf(scope);
    var last_day = moment(day).endOf(scope);
    
    var day = first_day;
    while(day.isBefore(last_day) || day.isSame(last_day)) {
        days.push(day.valueOf());
        day = day.add(1, "days");
    }
    return _.extend(data, {
        days: days
    });
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
          start: moment().valueOf()
      };
  },

  componentDidMount: function() {
      
  },

  componentWillUnmount: function() {
      
  },

  render: function() {
      var props = get_calendar_days("week", this.state);
      return (
          <div data-view="calendar-week-view" className="main-view">
              <nav role="navigation">
                  <Calendar.Breadcrumb {...props} />
                  <Calendar.Menu {...props} />
              </nav>
            <Calendar.Week {...props} />
          </div>
      );
  }

});



Calendar.Menu = React.createClass({
    render: function() {
        
        // @FIXME: est-ce qu'il faut afficher le header pour tous les jours ?
        // dans le cas où l'on charge plusieurs semaine
        // Parceque : 1 tableau pour chaque semaine
        
        var props = [];
        
        var get_props = function(timestamp) {
            var weekday = moment(timestamp).format("dddd");
            return {
                id: weekday.toLowerCase() + "-cell",
                weekday: weekday,
                weekday_small: moment(timestamp).format("dd"),
                date: moment(timestamp).date()
            };
        }
        
        
        var header = this.props.days.map(function(data, indice) {
            var _props = get_props(data);
            props.push(_props);
            return (
                <th id={_props.id}>{_props.weekday_small}</th>
            );
        });
        
        var content = this.props.days.map(function(data, indice) {
            var _props = props[indice];
            return (
                <td headers={_props.id}>{_props.date}</td>
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

    // @TODO : mettre un timeout pour changer l'heure a chaque fois
    // mais uniquement lorsque cette vue est visible 
    // donc en fonction du router
    getInitialState: function() {
        return {
            "time": "02h15"
        };
    },
    
    render: function() {
        var day = this.props.day;
        var hours = _.range(0, 25);
        
        var content = hours.map(function(hour) {
          var timestamp = day + hour * 60 * 60 * 1000;
          return (
              <Calendar.Hour value={timestamp} />
          );
        });
        
        // @TODO :faire une vue à la place
        // y inclure le state (n'appartient à à cette vue)
        var timer = (function(props, state) {
            var content = [];
            var style = {top: 200, left: 0};
            if (props.is_current) {
                content.push(<div id="current-timer" style={style}>{state}</div>);
            }
            return content;
        })(this.props, this.state);
        
        return (
          <div data-view="day-view">
            {timer}
              <table data-timestamp={day}>
                  <tbody>
                      {content}
                  </tbody>
              </table>
        </div>
        );
    }
});

Calendar.Hour = React.createClass({
  render: function() {
      var label = moment(this.props.value).format("HH:mm");
      return (
          <tr>
              <th scope="row"><span>{label}</span></th>
              <td></td>
          </tr>
      );
  }
});

Calendar.Week = React.createClass({
    
    render: function() {
      var days = this.props.days.map(function(day, index) {
          return (
              <Calendar.Day day={day} />
          );
      });
      
      //@TODO : calculer la position du timer
      return (
          <div data-view="week-view" className="scroll-view" style={{height: 300}}>
              <div className="scroller" style={{ width: "700%" }}>
                  { days }
              </div>
          </div>
      );
    }
});


module.exports = Calendar;

