
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

var DATE_FORMAT_TEST = "D MM YYYY"

// @TODO : use this to get Days into Year && Home Views
var _getWeeks = function(type, timestamp) {
    var days_per_week = 7;
    var result = {};
    var method = type.toLowerCase();
    var first = moment(timestamp).startOf(type);
    var last = moment(timestamp).endOf(type);

    var _range = function(week) {
        while(week.length < days_per_week) {
            week.push(null);
        }
        return week;
    }
    
    console.log("(" + _toDateString(timestamp, DATE_FORMAT_TEST) + ")get days from :", _toDateString(first, DATE_FORMAT_TEST), "to", _toDateString(last, DATE_FORMAT_TEST));
    
    var day = first;
    var month = day.month();
    var week = day.week();
    
    // @FIXME : handle change Month only for MonthView && YearView
    //day.month() == month
    
    while((day.isBefore(last) || day.isSame(last))) {
        if (result[week] == undefined || day.week() != week) {
            week = day.week();
            result[week] = [];
        }
        result[week].push(day.valueOf());
        day = day.add(1, "days");
    }
    
    // Each week must have 7 days long
    _.each(result, _range);
    
    return _.toArray(result);
}
    
var _CalendarData = function(data) {
    var result = [];
    if (data.type == "Week") {
        var start = moment(data.active).day();
        result.push(moment(data.active).day(start - 7).valueOf());
        result.push(data.active);
        result.push(moment(data.active).day(start + 7).valueOf());
        
    } else if (data.type == "Month") {
        var start = moment(data.active).month();
        result.push(moment(data.active).month(start - 1).valueOf());
        result.push(data.active);
        result.push(moment(data.active).month(start + 1).valueOf());
        
    } else if (data.type == "Year") {
        var start = moment(data.active).year();
        result.push(moment(data.active).year(start - 1).valueOf());
        result.push(data.active);
        result.push(moment(data.active).year(start + 1).valueOf());
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

var _toDateString = function(timestamp, format) {
    return moment(timestamp).format(format || DATE_FORMAT_ALL);
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
    
    _getProps: function(props) {
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
            // _views["Calendar.Week.Content"] = {
            //     "onScroll": _.debounce(this._handleScroll, SCROLL_DEBOUNCE)
            // };
        }
        
        return _.extend(props, {
            _views: _views
        });
    },
    
    _selectDate: function(data) {
        console.log("_selectDate", data)
        this.setState({
            "active": data.timestamp
        });
    },
    
    _updateMainView: function(data) {
        this.setState(data);
    },

    render: function() {
        var _props = this._getProps({
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
    
    filterProps: _filterProps,
    
    render: function() {

        var props = _.omit(this.props, "_views");
        
        var _getProps = this.filterProps;
        
        
        
        var content = _.map(this.props.weeks, function(timestamp, key) {
            var _props = {
                data: props.data,
                weeks: _getWeeks(props.data.type, timestamp)
            };
            
            // Display Menu only once
            var _header = (function(display_header) {
                if (display_header) {
                    return [(
                        <nav role="navigation">
                            <Calendar.Menu {..._getProps("Calendar.Menu", _props)} />
                        </nav>
                    )];
                }
                return "";

            })(key == "active");

            return (
                <div data-view="calendar-month-item" style={{width: "33.33%"}} ref={key}>
                    {_header}
                    <Calendar.Month.Content {..._getProps("Calendar.Month.Content", _props)} />
                </div>
            );
        });
        
        return (
            <div data-view="calendar-months" className="main-view">
                <Calendar.Breadcrumb {..._getProps("Calendar.Breadcrumb", props)} />
                <div className="scroll-view" ref="scroll-view" style={{overflow: "hidden"}}>
                    <div className="scroller" style={{width: "300%"}}>
                        {content}
                    </div>
                </div>
            </div>
        );
    }
});

Calendar.Month.Content = React.createClass({
    
    filterProps: _filterProps,
    
    _getLabel: function(timestamp) {
        if (timestamp) {
            return [(<span>{moment(timestamp).format("D")}</span>)];
        }
    },
    
    render: function() {
        
        console.log("Calendar.Month.Content", this.props)
        
        var content = this.props.weeks.map(function(timestamp, index) {
            
            // @TODO : className : prendre en compte le fait d'être en weekEnd ou pas
            // ajouter ce test à getDayStatus
            
            // @TODO : tronquer les semaines
            // dans getDays : faire des tableaux de semaine
            // [1,2,3], [4,5,6,7,8,9,10],[n...n+6]
            // A chaque changement de tableau
            
            
            var _props = {
                className: ""
            }
            
            return (
                <td className={_props.className}>{this._getLabel(timestamp)}</td>
            );
            
        }.bind(this))

                      // <td></td>
                      // <td></td>
                      // <td></td>
                      // <td></td>
                      // <td></td>
                      // <td className="week-end"></td>
                      // <td className="week-end"><span>1</span></td>
        
        return (
                        
                <table>
                  <caption>{}</caption>
                  <tr>
            {content}
                  </tr>
              </table>
        );
        
    }
});

Calendar.Week = React.createClass({
    
    // _scrollToWeek: function() {
    //     // @FIXME : conflict with other Scroll Call
    //     // Use dispatcher to handle these events
    //     // _scrollTo.call(this, "Week");
    // },
    
    componentDidMount: function() {
        // this._scrollToWeek();
    },
    
    componentDidUpdate: function() {
        // this._scrollToWeek();
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
        
        // @TODO : à mettre dans componentWillMount && componentWillUpdate
        var _getProps = this.filterProps;
        
        var content = _.map(this.props.weeks, function(timestamp, key) {
            var _props = {
                data: props.data,
                weeks: _getWeeks(props.data.type, timestamp)
            };
            return (
                <div data-view="calendar-week" style={{width: "33.33%"}} ref={key}>
                    <nav role="navigation">
                        <Calendar.Menu {..._getProps("Calendar.Menu", _props)} />
                    </nav>
                    <Calendar.Week.Content {..._getProps("Calendar.Week.Content", _props)} />
                </div>
            );
        });

        // var _handleScroll = _.debounce(this._handleScroll, SCROLL_DEBOUNCE);
        // onScroll={_handleScroll}
        return (
            <div data-view="calendar-weeks" className="main-view">
                <Calendar.Breadcrumb {..._getProps("Calendar.Breadcrumb", props)} />
                <div className="scroll-view" ref="scroll-view" style={{overflow: "auto"}}>
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
    
    getProps: function(day) {
        return {
            day: day,
            active: _getDayStatus(day, {active: this.props.data.active}),
            ref: (this.props.active) ? "active" : null
        }
    },
    
    _handleScroll: function() {
        var scroller = React.findDOMNode(this.refs["Scroller"]);
    },
    
    render: function() {
        var _getProps = this.getProps;
        
        var content = this.props.weeks.map(function(week) {
            return week.map(function(day, index) {
                return (
                    <Calendar.Week.Day {..._getProps(day)} />
                );
            });
        });
        
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
    
    filterProps: _filterProps,
    
    getProps: function(key, data) {
        var data = data || {};
        var props = {data: this.props.data};
        
        if (props.data.type == "Week") {
            var data = _.extend(data, {
                className: _getDayStatus(data.timestamp, props.data)
            });
        }
        return this.filterProps(key, _.extend(props, data));
    },
    
    render: function() {
        
        // @TODO : n'afficher qu'un seul menu pour cette vvue
        
        var commom = [];
        var header, content, footer = "";
        
        var _props = this.props;
        var _getProps = this.getProps;
        
        header = (function() {
            return _props.weeks.map(function(week) {
                return week.map(function(timestamp) {
                    return (
                        <Calendar.Menu.Header {..._getProps("Calendar.Menu.Header", {timestamp: timestamp})} />
                    );
                })
            });
        })();
        
        if (_props.data.type == "Week") {
            content = (function() {
                return _props.weeks.map(function(week) {
                    return week.map(function(timestamp, index) {
                        return (
                            <Calendar.Menu.Date {..._getProps("Calendar.Menu.Date", {timestamp: timestamp})} />
                        );
                    });
                });
            })();
        }
        
        footer = (function() {
            return (
                <Calendar.Menu.Footer {..._getProps("Calendar.Menu.Footer")} />
            );
        })();

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
    
    componentWillMount: function() {
        this.props.label = this._getLabel();
    },
    
    componentWillUpdate: function() {
        this.props.label = this._getLabel();
    },
    
    _handleClick: function() {
        this.props.onClick.call(this, {
            timestamp: this.props.timestamp
        });
    },
    
    _getLabel: function() {
        return moment(this.props.timestamp).format("dd");
    },
    
    render: function() {
        
        // Empty Days
        if (!this.props.timestamp) {
            return (
                <th></th>
            );
        }
        
        if (this.props.data.type == "Month") {
            return (
                <th>
                    {this._getLabel()}
                </th>
            );
        }
        
        return (
            <th className={this.props.className}>
                <a onClick={this._handleClick}>{this.props.label}</a>
            </th>
        );
    }
});

Calendar.Menu.Date = React.createClass({
    
    componentWillMount: function() {
        this.props.label = this._getLabel();
    },
    
    componentWillUpdate: function() {
        this.props.label = this._getLabel();
    },
    
    _getLabel: function() {
        return moment(this.props.timestamp).date();
    },
    
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
                <a onClick={this._handleClick} className={this.props.className}>{this.props.label}</a>
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
    
    componentWillMount: function() {
        this.props.label = this._getLabel();
    },
    
    componentWillUpdate: function() {
        this.props.label = this._getLabel();
    },
    
    _getLabel: function() {
        return moment(this.props.active).format(DATE_FORMAT_ALL);
    },
    
    render: function() {
        return (
            <td colSpan="7"><h1>{this.props.label}</h1></td>
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
            <div data-view="calendar-day">
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

