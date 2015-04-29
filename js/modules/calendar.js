
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
var _CalendarWeeks = function(type, timestamp) {
    var result = {};
    var method = type.toLowerCase();
    var first = moment(timestamp).startOf(type);
    var last = moment(timestamp).endOf(type);
    
    var _range = function(week, len) {
        var result = week || [];
        while(result.length < len) {
            result.push(null);
        }
        return result;
    }
    
    // console.log("(" + _toDateString(timestamp, DATE_FORMAT_TEST) + ")get days from :", _toDateString(first, DATE_FORMAT_TEST), "to", _toDateString(last, DATE_FORMAT_TEST));
    
    var day = first;
    var month = day.month();
    var week = day.week();
    while(day.isBefore(last)) {
        if (result[week] == undefined || day.week() != week) {
            week = day.week();
            result[week] = _range([], 7);
        }
        var index = day.weekday();
        result[week][index] = day.valueOf();
        day = day.add(1, "days");
    }
    return _.toArray(result);
}
    
var _CalendarDates = function(data) {
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

var _CalendarChildrenProps = function(view, data) {
    var result = {};

    if (data.type == "Week") {
        result["Calendar.Breadcrumb"] = {
            "format": DATE_FORMAT_MONTH,
            "onClick": view._updateMainView
        };
        result["Calendar.Menu.Header"] = {
            "onClick": view._selectDate
        };
        result["Calendar.Menu.Date"] = {
            "onClick": view._selectDate
        };
        result["Calendar.Menu.Footer"] = {
            "format": DATE_FORMAT_ALL
        };
        // _views["Calendar.Week.Content"] = {
        //     "onScroll": _.debounce(this._handleScroll, SCROLL_DEBOUNCE)
        // };
    } else if (data.type == "Month") {
        result["Calendar.Breadcrumb"] = {
            "format": DATE_FORMAT_YEAR,
            "onClick": view._updateMainView
        };
        result["Calendar.Menu.Footer"] = {
            "format": DATE_FORMAT_MONTH_YEAR
        };
        result["Calendar.Month.Content.Date"] = {
            "onClick": view._selectDate
        };
    }
    return (_.isEmpty(result)) ? null : {_views: result};
}

var _getDayStatus = function(timestamp, data) {
    if (!timestamp) {
        return;
    }
    var _isEqual = function(value0, value1) {
        return moment(value0).isSame(value1, "day");
    }
    var _isWeekEnd = function(timestamp) {
        return moment(timestamp).weekday() == 5 || moment(timestamp).weekday() == 6;
    }
    
    var result = [];
    _.each(data, function(value, statusName) {
        if (_isEqual(timestamp, data[statusName])) {
            result.push(statusName);
        }
    });
    if (_isWeekEnd(timestamp)) {
        result.push("week-end")
    }
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
    if (_.has(_views, key)) {
        _.extend(data, _views[key]);
        _views = _.omit(_views, key);
    }
    
    if (_.isEmpty(_views)) {
        return _.extend(data, {
            data: this.props.data
        });
    }
    
    return _.extend(data, { 
        _views: _views,
        data: this.props.data
    });
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
        return _.extend(props, _CalendarChildrenProps(this, this.state));
    },
    
    _selectDate: function(data) {
        console.log("_selectDate", data)
        this.setState(data);
    },
    
    _updateMainView: function(data) {
        this.setState(data);
    },

    render: function() {
        var _props = this._getProps({
            data: this.state,
            weeks: _CalendarDates(this.state)
        });
        return (        
            React.createElement(Calendar[this.state.type], _props)
        );
    }

});

Calendar.Year = React.createClass({
    
    filterProps: _filterProps,
    
    render: function() {
        
        var header, content, footer = [];
        
        var _filter = this.filterProps;
        console.log("Calendar.Year.render", this.props)
        return (
            <div className="main-view">
                <nav role="navigation">
                    {header}
                </nav>
                <div data-view="calendar-year" className="scroll-view" ref="scroll-view">
                    {content}
                </div>
            </div>
        );
    }
});

Calendar.Month = React.createClass({
    
    filterProps: _filterProps,
    
    _getProps: function(timestamp) {
        return {
            weeks: _CalendarWeeks(this.props.data.type, timestamp)
        }
    },
    
    render: function() {
        
        var _filter = this.filterProps;
        
        var _getProps = this._getProps;
        
        var header;
        
        var content = _.map(this.props.weeks, function(timestamp, key) {
            var _props = _getProps(timestamp);

            // Display Menu only once
            if (header == undefined) {
                var __weeks = [_props.weeks[0]];
                var __props = _.extend(_.clone(_props), {weeks: __weeks});
                header = (<Calendar.Menu {..._filter("Calendar.Menu", __props)} />);
            }

            return (
                <Calendar.Month.Content {..._filter("Calendar.Month.Content", _props)} />
            );
        });
        
        return (
            <div className="main-view">
                <Calendar.Breadcrumb {..._filter("Calendar.Breadcrumb")} />
                <nav role="navigation">
                    {header}
                </nav>
                <div data-view="calendar-month" className="scroll-view" ref="scroll-view">
                    {content}
                </div>
            </div>
        );
    }
});

Calendar.Month.Content = React.createClass({
    
    filterProps: _filterProps,
    
    _getMonth: function(timestamp, index) {
        var isActive = moment(timestamp).month() == moment(this.props.data.active).month();
        return {
            styles: {width: Math.ceil((1 - index * 1 / 7) * 100) + "%"},
            label: moment(timestamp).format("MMMM"),
            className: (isActive) ? "active" : ""
        };
    },
    
    render: function() {
        
        var month;
        
        var content = this.props.weeks.map(function(week) {
            var cells = week.map(function(timestamp, index) {
                var _props;
                if (timestamp) {
                    if (month == undefined) {
                        month = this._getMonth(timestamp, index);
                    }
                    _props = {timestamp: timestamp};
                } 
                return (
                    <Calendar.Month.Content.Date {...this.filterProps("Calendar.Month.Content.Date", _props)} />
                );
            }.bind(this));
            
            return (
                <tr>{cells}</tr>
            )
        }.bind(this))
        
        return (
            <table className={month.className}>
                <caption><span style={month.styles}>{month.label}</span></caption>
                {content}
            </table>
        );
        
    }
});

Calendar.Month.Content.Date = React.createClass({

    _handleClick: function() {
        this.props.onClick.call(this, {
            active: this.props.timestamp,
            type: "Week"
        });
    },
    
    _getClassName: function() { 
        return _getDayStatus(this.props.timestamp, this.props.data);
    },
    
    _getLabel: function() {
        return moment(this.props.timestamp).format("D");
    },
    
    render: function() {
        if (!this.props.timestamp) {
            return (
                <td></td>
            )
        }
        return (
            <td><a onClick={this._handleClick} className={this._getClassName()}>{this._getLabel()}</a></td>
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
        
        // console.log("=>Calendar.Week", _toDateString(props.data.active))
        
        // @TODO : à mettre dans componentWillMount && componentWillUpdate
        var _getProps = this.filterProps;
        
        var content = _.map(this.props.weeks, function(timestamp, key) {
            var _props = {
                weeks: _CalendarWeeks(props.data.type, timestamp)
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
            <div className="main-view">
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
        // var scroller = React.findDOMNode(this.refs["Scroller"]);
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
        return moment(this.props.data.active).format(this.props.format);
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
        var timestamp = (data) ? data.timestamp : null;
        
        if (data && data.timestamp) {
            _.extend(data, {
                className: _getDayStatus(timestamp, this.props.data)
            });
        }
        
        return this.filterProps(key, data);
    },
    
    render: function() {
        var commom = [];
        var header, content, footer = "";
        
        var _data = this.props.data;
        var _weeks = this.props.weeks;
        var _getProps = this.getProps;
        
        header = (function() {
            return _weeks.map(function(week) {
                return week.map(function(timestamp) {
                    return (
                        <Calendar.Menu.Header {..._getProps("Calendar.Menu.Header", {timestamp: timestamp})} />
                    );
                })
            });
        }.bind(this))();
        
        if (_data.type == "Week") {
            content = (function() {
                return _weeks.map(function(week) {
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
                <a onClick={this._handleClick}>{this._getLabel()}</a>
            </th>
        );
    }
});

Calendar.Menu.Date = React.createClass({
    
    _getLabel: function() {
        return moment(this.props.timestamp).date();
    },
    
    _handleClick: function() {
        this.props.onClick.call(this, {
            active: this.props.timestamp,
            type: "Week"
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
                <a onClick={this._handleClick} className={this.props.className}>{this._getLabel()}</a>
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
        return moment(this.props.data.active).format(this.props.format);
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
    
    _toHours: function(label) {
        var label = label.split(":");
        return label[0] * 1 + (label[1] * 1 / 60);
    },
    
    _getLabel: function() {
        return moment(this.state.timestamp).format("HH:mm");
    },
    
    _getCoords: function(label) {
        var time = this._toHours(label);
        return {
            "left": "20%",
            "top": Math.ceil(time * this.props.scale),
            "width": "80%"
        }
    },
    
    _getProps: function() {
        var label = this._getLabel();
        var coords = this._getCoords(label);
        return {
            label: label,
            coords: coords
        }
    },
    
    render: function() {
        var props = this._getProps();
        return (
            <div id="current-timer" style={props.coords}><span>{props.label}</span></div>
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

