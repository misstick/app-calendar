
// @TODO : normalement, installer moment, underscore avec npm start (ou build)
var moment = require('moment');
var _ = require('underscore');
var React = require('react');

// @FIXME : DOESNT WORK ?!
moment.locale('fr');
console.log(moment(1316116057189).fromNow());

var SCROLL_DEBOUNCE = 500;
var RESIZE_DEBOUNCE = 100;

var DATE_FORMAT_ALL = "dddd D MMMM YYYY";
var DATE_FORMAT_MONTH_YEAR = "MMMM YYYY";
var DATE_FORMAT_YEAR = "YYYY";
var DATE_FORMAT_MONTH = "MMMM";
var DATE_FORMAT_KEY = "YYYYMD";

// @TODO : use this to get Days into Year && Home Views
var _getDays = function(type, timestamp) {
    var result = [];
    var method = type.toLowerCase();
    var first = moment(timestamp).startOf("week");
    var last = moment(timestamp).endOf("week");
    
    // console.log(_toDateString(first), _toDateString(timestamp), _toDateString(last));
    
    var day = first;
    var month = day.month();
    while((day.isBefore(last) || day.isSame(last)) && day.month() == month) {
        result.push(day.valueOf());
        day = day.add(1, "days");
    }
    return result;
}
    
var _CalendarData = function(data) {
    var result = {active: data.active};
    if (data.type == "Week") {
        var start = moment(data.active).day();
        result.previous = moment(data.active).day(start - 7).valueOf();
        result.next = moment(data.active).day(start + 7).valueOf();
        
    } else if (data.type == "Month") {
        var start = moment(data.active).month();
        result.previous = moment(data.active).month(start - 1).valueOf();
        result.next = moment(data.active).month(start + 1).valueOf();
        
    } else if (data.type == "Year") {
        var start = moment(data.active).year();
        result.previous =  moment(data.active).year(start - 1).valueOf();
        result.next =  moment(data.active).year(start + 1).valueOf();
    }
    return result;
};

var _getDayStatus = function(timestamp, data) {
    var _isEqual = function(value0, value1) {
        return moment(value0).isSame(value1, "day");
    }
    
    var result = [];
    _.each(data, function(value, statusName) {
        if (_isEqual(timestamp, data[statusName])) {
            result.push(statusName);
        }
    });
    return result.join(" ");
}

var _toDateString = function(timestamp) {
    return moment(timestamp).format(DATE_FORMAT_ALL);
}

var _getId = function(type, timestamp) {
    if (_.isNull(timestamp)) {
        return false;
    }
    return type + "::" + moment(timestamp).valueOf();
}

var _getState = function(obj0, obj1) {
    var data = null;
    _.keys(obj0).forEach(function(key) {
        var value = obj1[key];
        if (!_.isUndefined(value) && !_.isNull(value) && !_.isEmpty(value)) {
            if (_.isNull(data)) {
                data = {};
            }
            data[key] = value;
        }
    });
    return data;
}

var _CalendarFormat = function(view, type) {
    var result;
    if (view == "Calendar.Breadcrumb") {
        switch (type) {
            case "Week":
                result = DATE_FORMAT_MONTH;
                break;
            
            case "Month":
                result = DATE_FORMAT_YEAR;
                break;
        }
    }
    if (view == "Calendar.Menu.Footer") {
        switch (type) {
            case "Week":
                result = DATE_FORMAT_ALL;
                break;
            
            case "Month":
                result = DATE_FORMAT_MONTH_YEAR;
                break;
        }
    }
    return result;
}

var _CalendarGoBackData = function(data) {
    
    var result = _.clone(data);
    
    switch (data.type) {
        case "Week":
            result.type = "Month";
            result.active = moment(data.active).startOf("month").valueOf();
            break;
        
        // @TODO : vérifier si le calcul est correct
        case "Month":
            result.type = "Year";
            result.active = moment(data.active).startOf("year").valueOf();
            break;
        
        // @TODO : vérifier si le calcul est correct
        case "Year":
            result.type = "Home";
            result.active = moment(data.active).startOf("year").valueOf();
            break;
        
        // @TODO : Est-ce que ce cas est utile ?
        case "Event":
            break;
    }
    return result;
}

var _filterProps = function(key, data) {
    var data = _.clone(data || {});
    var views = _.clone(this.props._views || {});
    
    var _filter = function(key, props) {
        return _.omit(props, function(_value, _key) {
            return _key.indexOf(key) == -1;
        });
    }
    
    // Get ChildViews
    var _views = _filter(key, views);
    
    // Separate properties 
    // form MainView to ChildViews
    var _isViewProps = _views[key] != undefined;
    if (_isViewProps) {
        _.extend(data, _views[key]);
        delete _views[key];
    }
    
    return (_.isEmpty(_views)) ? data : _.extend(data, { _views: _views });
}

var _scrollTo = function(type) {
    var el = React.findDOMNode(this.refs["scroll-view"]);
    var content = React.findDOMNode(this.refs["active"]);
    el.scrollLeft = content.offsetLeft;
}

/*

{
    name: "event0",
    date: 'timestampValue',
    status: "important|normal"
}

Note : manipulation des données jours :
 - vue année : charger ts les jours +/- 6 mois en fction du mois affiché
 - vue jour : charger toute la semaine en cours +/- les semaines autour
*/

var Calendar = React.createClass({

    /*
        @type peut avoir comme valeur : 
         - "event"
         - "month"
         - "year"
    */
    getInitialState: function() {
        var date = moment();
        return {
            current: date.valueOf(),  // Current Day
            active: date.weekday(2).valueOf(),      // Day visible into the view (scrollTO that day)
            type: "Week"
        };
    },

    componentWillMount: function() {
        var data = _getState(this.state, this.props);
        if (data) {
            this.setState(data);
        }
    },
    
    //
    // componentDidMount: function() {
    //     // @TODO : handle the into MonthView
    //     this._displayScroll();
    // },
    //
    // componentDidUpdate: function() {
    //     // @TODO : handle the into MonthView
    //     this._displayScroll();
    // },
    
    // // Force Scroll
    // _displayScroll: function() {
    //     var el = React.findDOMNode(this);
    //     var content = React.findDOMNode(this.refs["Week"]);
    //     var weekday = moment(this.state.active).weekday().valueOf();
    //     // console.log("_displayScroll", _toDateString(this.state.active), weekday);
    //     content.scrollLeft = weekday * el.offsetWidth;
    // },
   
    // // @FIXME : les événements se chevauchent
    // // vois si l'utilisation de lux avec le dispatcher
    // // ne résoudrait pas ce conflit
    // _handleScroll: function() {
    //     // var content = React.findDOMNode(this.refs["Week"]);
    //     // var weekday_tmp = content.scrollLeft / content.offsetWidth;
    //     // var weekday = moment(this.state.active).weekday().valueOf();
    //     //
    //     // // Get the greater value less than current value when we scroll to the left
    //     // var _floor = (weekday_tmp < weekday) ? "floor" : "ceil";
    //     // console.log("_handleScroll", weekday, { weekday: Math[_floor](weekday_tmp)})
    //     // this._set_active({ weekday: Math[_floor](weekday_tmp)});
    // },
    
    _getViewProps: function(props) {
        var _views = {}
        _views["Calendar.Breadcrumb"] = {
            "format": _CalendarFormat("Calendar.Breadcrumb", this.state.type),
            "onClick": this._updateMainView
        };
        _views["Calendar.Menu.Footer"] = {
            "format": _CalendarFormat("Calendar.Menu.Footer", this.state.type)
        };
        
        if (this.state.type == "Week") {
            _views["Calendar.Menu.Header"] = {
                "onClick": this._selectDate
            };
            _views["Calendar.Menu.Date"] = {
                "onClick": this._selectDate
            };
            _views["Calendar.Week.Content"] = {
                "onScroll": _.debounce(this._handleScroll, SCROLL_DEBOUNCE)
            };
        }
        
        return _.extend(props, {
            _views: _views
        });
    },
    
    _selectDate: function(data) {
        this.setState({
            "active": data.timestamp
        });
    },
    
    _updateMainView: function(data) {
        this.setState(data);
    },

    render: function() {
        var _props = this._getViewProps({
            data: this.state,
            weeks: _CalendarData(this.state)
        });
        return (        
            React.createElement(Calendar[this.state.type], _props)
        );
    }

});

Calendar.Year = React.createClass({
    
    render: function() {
        console.log("Calendar.Year.render")
        return (
            "PLOP"
        );
    }
});

Calendar.Month = React.createClass({
    
    render: function() {
        console.log("Calendar.Month.render", this.props)
        
        
        return (
            <div data-view="calendar-month-view" className="main-view">
                <Calendar.Breadcrumb data={this.props.data} onClick={this.props.onClick} />
                <div className="scroll-view" ref="scroll-view" style={{overflow: "hidden"}}>
                    <div className="scroller" style={{width: "300%"}}>
                        
                        <Calendar.Month.Content {...this.props} />
            
                    </div>
                </div>
            </div>
        );
    }
});

Calendar.Month.Content = React.createClass({
    
    render: function() {
        return (
                        
                <table>
                  <caption style={{left: 260}}>Mars</caption>
                  <tr>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td className="week-end"></td>
                      <td className="week-end"><span>1</span></td>
                  </tr>
                  <tr>
                      <td><span>2</span></td>
                      <td><span>3</span></td>
                      <td><span>4</span></td>
                      <td><span>5</span></td>
                      <td><span className="active">6</span></td>
                      <td className="week-end"><span>7</span></td>
                      <td className="week-end"><span>8</span></td>
                  </tr>
                  <tr>
                      <td><span>9</span></td>
                      <td><span>10</span></td>
                      <td><span>11</span></td>
                      <td><span>12</span></td>
                      <td><span>13</span></td>
                      <td className="week-end"><span>14</span></td>
                      <td className="week-end"><span>15</span></td>
                  </tr>
                  <tr>
                      <td><span>16</span></td>
                      <td><span>17</span></td>
                      <td><span>18</span></td>
                      <td><span>19</span></td>
                      <td><span>20</span></td>
                      <td className="week-end"><span>21</span></td>
                      <td className="week-end"><span>22</span></td>
                  </tr>
                  <tr>
                      <td><span>23</span></td>
                      <td><span>24</span></td>
                      <td><span>25</span></td>
                      <td><span>26</span></td>
                      <td><span>27</span></td>
                      <td className="week-end"><span>28</span></td>
                      <td className="week-end"><span>29</span></td>
                  </tr>
                  <tr>
                      <td><span>30</span></td>
                      <td><span>31</span></td>
                      <td></td>
                      <td></td>
                      <td></td>
                      <td className="week-end"></td>
                      <td className="week-end"></td>
                  </tr>
              </table>
        );
        
    }
});

Calendar.Week = React.createClass({
    
    _scrollToWeek: function(status) {
        // @FIXME : conflict with other Scroll Call
        // Use dispatcher to handle these events
        _scrollTo.call(this, "Week");
    },
    
    componentDidMount: function() {
        this._scrollToWeek();
    },
    
    componentDidUpdate: function() {
        this._scrollToWeek();
    },
    
    _handleScroll: function() {
        // @FIXME : conflict with other Scroll Call
        // Use dispatcher to handle these events
        
        // @TODO: get week active number
        // update Calendar.state.active
        // => le render global remodifiera tout
        
        // @TODO: définir la limite min/max du scroll
        // si on tombe 2x de suite sur la valeur
        // alors activer la semaine précédente/suivante
        // => le render re-modiefiera tout
    },
    
    // @TODO : surclasser React.class
    // et faire hériter ttes les vues de cette méthode
    filterProps: _filterProps,
    
    render: function() {

        var props = _.omit(this.props, "_views");
        
        var type = this.props.data.type;
        
        var content = _.map(this.props.weeks, function(timestamp, key) {
            var props = { 
                data: this.props.data,
                week: _getDays(type, timestamp)
            };
            return (
                <div data-view="calendar-week-view" style={{width: "33.33%"}} ref={key}>
                    <nav role="navigation">
                        <Calendar.Menu {...this.filterProps("Calendar.Menu", props)} />
                    </nav>
                    <Calendar.Week.Content {...this.filterProps("Calendar.Week.Content", props)} />
                </div>
            );
        }.bind(this));

        // var _handleScroll = _.debounce(this._handleScroll, SCROLL_DEBOUNCE);
        // onScroll={_handleScroll}
        return (
            <div data-view="calendar-weeks-view" className="main-view">
                <Calendar.Breadcrumb {...this.filterProps("Calendar.Breadcrumb", props)} />
                <div className="scroll-view" ref="scroll-view" style={{overflow: "hidden"}}>
                    <div className="scroller" style={{width: "300%"}}>
                        { content }
                    </div>
                </div>
            </div>
        );
    }
});

Calendar.Week.Content = React.createClass({

    _scrollToDay: function(status) {
        // @FIXME : conflict with other Scroll Call
        // Use dispatcher to handle these events
        // _scrollTo.call(this, "Day");
    },

    componentDidMount: function() {
        this._scrollToDay();
    },
    
    componentDidUpdate: function() {
        this._scrollToDay();
    },
    
    _handleScroll: function() {
        var scroller = React.findDOMNode(this.refs["Scroller"]);
    },
    
    render: function() {
        var content = this.props.week.map(function(day, index) {
            var props = {
                day: day,
                active: _getDayStatus(day, {active: this.props.data.active})
            };
            if (props.active) {
                props.ref = "active";
            }
            return (
                <Calendar.Week.Day {...props} />
            );
        }.bind(this));
        
        // onScroll={this.props.onScroll}
        // var _handleScroll = _.debounce(this._handleScroll, SCROLL_DEBOUNCE);
        // onScroll={_handleScroll}
        return (
            <div className="scroll-view" ref="scroll-view" style={{height: 300}}>
                <div className="scroller" style={{width: "700%"}}>
                    { content }
                </div>
            </div>
        );
        
    }
});


Calendar.Breadcrumb = React.createClass({

    getDefaultProps: function() {
        return {
            format: "MMMM"
        }
    },
    
    filterProps: _filterProps,
    
    _handleClick: function() {
        var data = _CalendarGoBackData(this.props.data);
        this.props.onClick.call(this, data);
    },
    
    _getLabel: function() {
        return moment(this.props.active).format(this.props.format);
    },
    
    render: function() {
        return (
            <aside className="breadcrumb">
                <a onClick={this._handleClick} className="breadcrumb-item">{this._getLabel()}</a>
            </aside>
        );
    }
});

Calendar.Menu = React.createClass({
    
    // Create Blank Days
    _rangeDays: function() {
        while(this.props.week.length < 7) {
            this.props.week.push(null);
        }
    },
    
    filterProps: _filterProps,
    
    getProps: function(key, data) {
        var data = _.extend(data || {}, {
            className: _getDayStatus(data.timestamp, this.props.data)
        });
        return this.filterProps(key, data);
    },
    
    componentWillMount: function() {
        this._rangeDays()
    },
    
    componentWillUpdate: function() {
        this._rangeDays()
    },
    
    render: function() {
        var commom = [];
        
        var _getProps = this.getProps;
        
        var header = this.props.week.map(function(timestamp, index) {
            var props = _getProps("Calendar.Menu.Header", {timestamp: timestamp});
            return (
                <Calendar.Menu.Header {...props} />
            );
        });

        var content = this.props.week.map(function(timestamp, index) {
            var props = _getProps("Calendar.Menu.Date", {timestamp: timestamp});
            return (
                <Calendar.Menu.Date {...props} />
            );
        });
        
        var footer = (function(props) {
            var props = _getProps("Calendar.Menu.Footer", props.data);
            return (
                <Calendar.Menu.Footer {...props} />
            );
        })(this.props);
        
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
                        {footer}
                    </tr>
                </tfoot>
            </table>
        );
    }
});

Calendar.Menu.Header = React.createClass({
    
    _handleClick: function() {
        console.log(this.props)
        // this.props.onClick.call(this, {
       //      timestamp: this.props.timestamp
       //  });
    },
    
    render: function() {
        if (!this.props.timestamp) {
            return (
                <th></th>
            );
        }
        
        return (
            <th className={this.props.className}>
                <a onClick={this._handleClick}>{moment(this.props.timestamp).format("dd")}</a>
            </th>
        );
    }
});

Calendar.Menu.Date = React.createClass({
    
    _handleClick: function() {
        this.props.onClick.call(this, {
            timestamp: this.props.timestamp
        });
    },
    
    render: function() {
        
        if (!this.props.timestamp) {
            return (
                <td></td>
            );
        }
        
        return (
            <td>
                <a onClick={this._handleClick} className={this.props.className}>{moment(this.props.timestamp).date()}</a>
            </td>
        );
    }
});

Calendar.Menu.Footer = React.createClass({

    getDefaultProps: function() {
        return {
            format: DATE_FORMAT_ALL
        }
    },
    
    _getLabel: function() {
        return moment(this.props.active).format(this.props.format);
    },
    
    render: function() {
        return (
            <td colSpan="7"><h1>{this._getLabel()}</h1></td>
        );
    }
});

Calendar.Week.Day = React.createClass({

    getInitialState: function() {
        return {
            scale: 25 // Num. of pixel per. hour
        };
    },
  
    componentDidMount: function() {
        // var is_active = this.is_active();
       //  if (is_active) {
       //      // @TODO : aller au moment courant
       //      // Scoller en hauteur
       //      // Pour aller jusqu'au Timer
       //
       //      // @TODO : Initialiser le timer gràce à cette value
       //  }
    },
    
    render: function() {
        var day = this.props.day;
        var hours = _.range(0, 25);
        var content = hours.map(function(hour) {
            var ref = "hour:" + hour;
            var timestamp = day + hour * 60 * 60 * 1000;
            return (<Calendar.Week.Hour ref={ref} value={timestamp} scale={this.state.scale} />);
        }.bind(this));
        
        // @TODO :faire une vue à la place
        // y inclure le state (n'appartient à à cette vue)
        // var is_active = this.is_active();
        
        var is_active = false;

        // var _status = _getDayStatus(day, this.props.data);
        
        var timer = (function(props) {
            if (is_active) {
                return (<Calendar.Week.Timer scale={this.state.scale} />);
            }
        }.bind(this))(this.props);
        
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

Calendar.Week.Timer = React.createClass({
    // @TODO : mettre un timeout pour changer l'heure a chaque fois
    // mais uniquement lorsque cette vue est visible 
    // donc en fonction du router
    getInitialState: function() {
        return {
            "timestamp": moment().valueOf()
        };
    },
    
    to_decimal: function(label) {
        var label = label.split(":");
        return label[0] * 1 + (label[1] * 1 / 60);
    },
    
    get_coords: function(label) {
        var time = this.to_decimal(label);
        return {
            left: "20%",
            top: Math.ceil(time * this.props.scale),
            width: "80%"
        }
    },
    
    render: function() {
        var label = moment(this.state.timestamp).format("HH:mm");
        var coords = this.get_coords(label);
        return (
            <div id="current-timer" style={coords}><span>{label}</span></div>
        );
    }
});

Calendar.Week.Hour = React.createClass({
    render: function() {
        // @TODO : ajouter ici les événements
        var label = moment(this.props.value).format("HH:mm");
        var height = this.props.scale;
        return (
            <tr style={{ "height": height}}>
                <th scope="row"><span>{label}</span></th>
                <td></td>
            </tr>
        );
    }
});



module.exports = Calendar;

