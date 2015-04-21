
// @TODO : normalement, installer moment, underscore avec npm start (ou build)
var moment = require('moment');
var _ = require('underscore');
var React = require('react');

// @FIXME : DOESNT WORK ?!
moment.locale('fr');
console.log(moment(1316116057189).fromNow());

var SCROLL_DEBOUNCE = 500;
var RESIZE_DEBOUNCE = 100;

var YEAR_STEP  = 6; // Get the MONTH_STEP weeks before/after the current date
var WEEK_STEP = 1;  // Get the WEEK_STEP weeks before/after the current date

var DATE_FORMAT_STORE = "DD-MM-YYYY";
var DATE_FORMAT_FULL = "dddd D MMMM YYYY";
var DATE_FORMAT_KEY = "YYYYMD";

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

var _get_day_status = function(index, props) {
    var result = [];
    if (index == moment(props.current).weekday()) {
        result.push("current");
    }
    if (index == moment(props.active).weekday()) {
        result.push("active");
    }
    return result.join(" ");
}

var _get_full_date = function(timestamp) {
    return moment(timestamp).format(DATE_FORMAT_FULL);
}

var _get_id = function(timestamp, type) {
    return moment(timestamp).format(DATE_FORMAT_KEY) + "-" + type;
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
            current: null,  // Current Day
            active: null      // Day visible into the view (scrollTO that day)
        };
    },

    componentWillMount: function() {
        var _today = moment().valueOf();
        this.setState({
            "current": moment().valueOf(),
            "active": moment().endOf("week").valueOf()
        });
    },
    
    componentDidMount: function() {
        // this._displayScroll();
    },

    componentWillUnmount: function() {
        
    },
    
    componentDidUpdate: function() {
        this._displayScroll();
    },
    
    _set_active: function(data) {
        var value;
        if (data.timestamp) {
            value = data.timestamp;
        } else if (data.weekday) {
            value = moment(this.state.active).weekday(data.weekday).valueOf();
        }
        console.log("_set_active", _get_full_date(value))
        this.setState({
            "active": value
        });
    },

    // Force Scroll
    _displayScroll: function() {
        var el = React.findDOMNode(this);
        var content = React.findDOMNode(this.refs["Week"]);
        var weekday = moment(this.state.active).weekday().valueOf();
        console.log("_displayScroll", _get_full_date(this.state.active), weekday);
        content.scrollLeft = weekday * el.offsetWidth;
    },
    
    _handleScroll: function() {
        // var content = React.findDOMNode(this.refs["Week"]);
        // var weekday_tmp = content.scrollLeft / content.offsetWidth;
        // var weekday = moment(this.state.active).weekday().valueOf();
        //
        // // Get the greater value less than current value when we scroll to the left
        // var _floor = (weekday_tmp < weekday) ? "floor" : "ceil";
        // console.log("_handleScroll", { weekday: Math[_floor](weekday_tmp)})
        // this._set_active({ weekday: Math[_floor](weekday_tmp)});
    },
    
    _handleClickDate: function(event, data) {
        console.log("_handleClickDate", _get_full_date(data.timestamp))
        this._set_active(data);
    },

    render: function() {
        var props = get_calendar_days("week", this.state);
        return (
            <div data-view="calendar-week-view" className="main-view">
                <nav role="navigation">
                    <Calendar.Breadcrumb {...props} />
                    <Calendar.Week.Menu {...props} onClickDate={this._handleClickDate} />
                </nav>
                <Calendar.Week {...props} ref="Week" onScroll={_.debounce(this._handleScroll, SCROLL_DEBOUNCE)} />
            </div>
        );
    }

});

Calendar.Breadcrumb = React.createClass({
  render: function() {
      var month = moment(this.props.active).format("MMMM");
      return (
          <a href="#" className="breadcrumb">{month}</a>
      );
  }
});

Calendar.Week = React.createClass({
    render: function() {
        var days = this.props.days.map(function(day, index) {
            return (
                <Calendar.Week.Day day={day} status={_get_day_status(index, this.props)} />
            );
        }.bind(this));
        
        var styles = {
            "width": "700%"
        }

        // @TODO : calculer la position du timer
        // @TODO : affecter l'événement avec addEventListener
        return (
            <div data-view="week-view" className="scroll-view"  style={{height: 300}}  onScroll={this.props.onScroll}>
                <div className="scroller" ref="Scroller" style={styles}>
                    { days }
                </div>
            </div>
        );
    }
});

Calendar.Week.Menu = React.createClass({
    render: function() {
        // @FIXME: est-ce qu'il faut afficher le header pour tous les jours ?
        // dans le cas où l'on charge plusieurs semaine
        // Parceque : 1 tableau pour chaque semaine
        
        var props = [];
        
        var get_props = function(timestamp, index) {
            return {
                timestamp: timestamp,
                className: _get_day_status(index, this.props),
                ref: _get_id(timestamp, "header"),
                onClick: this.props.onClickDate
            };
        }.bind(this);
        
        var header = this.props.days.map(function(timestamp, index) {
            props.push(get_props(timestamp, index));
            return (
                <Calendar.Week.Menu.Header {...props[index]} />
            );
        }.bind(this));
        
        var content = this.props.days.map(function(timestamp, index) {
            return (
                <Calendar.Week.Menu.Date {...props[index]} />
            );
        });
        
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
                        <Calendar.Week.Menu.Footer active={this.props.active} />
                    </tr>
                </tfoot>
            </table>
        );
    }
});

Calendar.Week.Menu.Header = React.createClass({
    render: function() {
        return (
            <th id={this.props.ref} className={this.props.className}>{moment(this.props.timestamp).format("dd")}</th>
        );
    }
});
Calendar.Week.Menu.Date = React.createClass({
    
    _handle_click: function(event) {
        this.props.onClick.call(this, event, {
            timestamp: this.props.timestamp
        });
    },
    
    render: function() {
        return (
            <td headers={this.props.ref}>
                <a onClick={this._handle_click} className={this.props.className}>{moment(this.props.timestamp).date()}</a>
            </td>
        );
    }
});

Calendar.Week.Menu.Footer = React.createClass({
    render: function() {
        console.log(this.props.active, _get_full_date(this.props.active))
        return (
            <td colSpan="7"><h1>{_get_full_date(this.props.active)}</h1></td>
        );
    }
});

Calendar.Week.Day = React.createClass({

    // @TODO : mettre un timeout pour changer l'heure a chaque fois
    // mais uniquement lorsque cette vue est visible 
    // donc en fonction du router
    getInitialState: function() {
        return {
            "time": "02h15"
        };
    },
  
    componentDidMount: function() {
        var _is_current = this.props.current;
        if (_is_current) {
            // @TODO : aller au moment courant
            // Scoller en hauteur
            // Pour aller jusqu'au Timer
            
            // @TODO : Initialiser le timer gràce à cette value
        }
    },
    
    render: function() {
        var day = this.props.day;
        var hours = _.range(0, 25);
        
        var content = hours.map(function(hour) {
          var timestamp = day + hour * 60 * 60 * 1000;
          return (
              <Calendar.Week.Hour value={timestamp} />
          );
        });
        
        // @TODO :faire une vue à la place
        // y inclure le state (n'appartient à à cette vue)
        var timer = (function(props, state) {
            var content = [];
            var style = {top: 200, left: 0};
            if (props.current) {
                content.push(<div id="current-timer" style={style}>{state}</div>);
            }
            return content;
        })(this.props, this.state);
        
        return (
          <div data-view="day-view" className={this.props.status}>
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

Calendar.Week.Hour = React.createClass({
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



module.exports = Calendar;

