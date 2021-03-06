
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

var ALL_DAYS;
var CALENDAR_TYPE = ['year', 'month', 'week', 'day'];
var STEP = 3;

// @TODO : add to Getters
// @TODO : use this to get Days into Year && Home Views
function fetchDates(data, parent) {
    var result = [];
    var model = _.clone(data);

    _.extend(model, {
        type: model.type || "day",
        first: getValueOf('start'),
        last: getValueOf('end')
    });

//     console.log("(" + model.type + ")", _toDateString(model.first), "to", _toDateString(model.last));
    
    // @FIXME : 3x la même année
    // @TODO : factoriser les 3 tests ci-dessous

    // #FIXME : ajouter un test pour remplir des valeurs vides 
    // een début ou fin de tableau

    var day = model.first;
    var type = getChildrenType(model);
    var method = type + 's';
    while(day.isBefore(model.last)) {
        var _day = getChildren(type);
        result.push(_day);
        day = day.add(1, method);
    }
    return result;

    function getValueOf(){
        var _method = _.isString(arguments[0]) ? arguments[0] : 'start';
        var _model = arguments[1] || model;
        var _value = moment(_model.current)[_method + 'Of'](_model.type);
        return isInner(_value, _model) ? _value : getValueOf(_method, parent);
    }
    function isInner(timestamp, model) {
        var isSameMonth = moment(timestamp).month() === moment(model.current).month();
        var isSameYear = moment(timestamp).year() === moment(model.current).year();
        return ('year' === model.type) ? isSameYear : isSameMonth && isSameYear;
    }
    function getChildrenType(model) {
        return _.first(_.compact(_.map(CALENDAR_TYPE, function filterChildren(key, index, array) {
            return (model.type === key) ? array[index+1] : null;
        })));
    }
    function getChildren(method) {
        if ('day' !== method) {
            return fetchDates({
                    current: day, 
                    type: method
                }, model);
        }
//        console.log(_toDateString(day))
        return day.valueOf();
    }
}

// @TODO : add to Getters
function getAllDates(data) {
    var model = { 
        active: data.active, 
        type: 'year'
    };
    return _.map(getDatesRange(model), function(timestamp) {
        return fetchDates({
            type: 'year',
            current: timestamp
        });
    });

    // Get all days 
    // wathever the view type
    // filter after to get a closer scope
    function getDatesRange(data) {
        return _.flatten([
            getPreviousDate(data),
            data.active,
            getNextDate(data)
        ]);
    };
}

function getPreviousDate(data){
    var method = data.type.toLowerCase();
    var value = moment(data.active)[method]();
    return _.sortBy(_.map(_.range(STEP), function getDates(index) {
        return moment(data.active)[method](value - (index + 1)).valueOf()
    }));
}

function getNextDate(data){
    var method = data.type.toLowerCase();
    var value = moment(data.active)[method]();
    return _.sortBy(_.map(_.range(STEP), function getDates(index) {
        return moment(data.active)[method](value + (index + 1)).valueOf()
    }));
}

// @TODO : add to Getters
var _CalendarState = function(obj0, obj1) {
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

// Get Calendar data Scope 
// return specific data scope for some Calendar.Type
// (default) return all data

// TODO
// les données devraient être rechargées toutes les années -3
// cad que dès que lo'n visionne l'année suivante on charge l'annéeSuivante+3

function getDatesScope(state, options) {
    var keys = ['week', 'day'];
    var type = state.type.toLowerCase();
    var options = options || {};
    var result;

    // Get the bigger scope needed
    // It will be useless for the back navigation (breadcrumb)
    if (!ALL_DAYS || options.refresh) {
        ALL_DAYS = getAllDates(state);
    }

    // Return specific scope
    if (_.contains(keys, type)) {
        return filterDates(state);
    }
    
    // Return default scope
    return ALL_DAYS;
    
    function filterDates(state) {
        var previousDate = getFirstDay(getPreviousDate(state));
        var nextDate = getLastDay(getNextDate(state));

        return _compact(_.map(_.clone(ALL_DAYS), function(year) {
            return _compact(_.map(year, function(month) {
                return _compact(_.map(month, function(days) {
                    return _compact(_.filter(days, isInner));
                }));
            }));
        }));

        function isInner(day) {
            var format = 'day';
            var isAfter = moment(day).isAfter(previousDate, format) || moment(day).isSame(previousDate, format);
            var isBefore = moment(day).isBefore(nextDate, format) || moment(day).isSame(nextDate, format);
            return isAfter && isBefore;
        }
    }
}
function getProps(obj0, obj1, obj2) {
    var obj = _.clone(obj0);
    if (obj1) _.extend(obj, {days: obj1});
    if (obj2) _.extend(obj, obj2);
    return obj;
}
function _compact(array){
    var result = _.compact(array);
    return _.isEmpty(result) ? null : result;
}
function getFirstDay(array) {
    return _.first(_.compact(_.flatten(array)));
}
function getLastDay(array) {
    return _.last(_.compact(_.flatten(array)));
}
function getIndexOf(type) {
    return _.indexOf(CALENDAR_TYPE, type) + 1 || -1;
}
function toCapitalize(string){
    return string[0].toUpperCase() + string.substring(1, string.length);
}

// @TODO : add to Getters
function getDayStatus(data) {
    var timestamp = (data || {}).timestamp;
    if (!timestamp) return;

    var data = _.pick(data || {}, 'current', 'active');
    var result = [];

    _.find(data, function(value, name) {
        var test = isSame(value, timestamp)
        if (test) result.push(name);
        return test;
    });
    if (isWeekEnd(timestamp)) {
        result.push('week-end')
    }
    return result.join(' ');

    function isSame(value0, value1) {
        return moment(value0).isSame(value1, 'day');
    }
    function isWeekEnd(value) {
        return moment(value).weekday() == 5 || moment(value).weekday() == 6;
    }
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

// @TODO : add to Stores
function getBreadcrumbData(data) {
    var type = getParentType(data);

    return {
        type: type,
        active : moment(data.active).startOf(type).valueOf() || null
    };

    function getParentType(model) {
        return _.first(_.compact(_.map(CALENDAR_TYPE, function filterParentType(key, index, array) {
            return (model.type.toLowerCase() === key) ? array[index-1] : null;
        })));
    }
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

var CALENDAR;

// @FIXME : passer par un passage d'événement (Store)
function updateCalendarView(data) {
    data.type = data.type.toLowerCase();
    console.log('updateCalendarView', _toDateString(data.active), data);
    CALENDAR.setState(data);
}
function gotoDay(timestamp) {
    updateCalendarView({
        active: timestamp,
        type: 'week'
    });
}
var Calendar = React.createClass({

    /*
        @type peut avoir comme valeur : 
         - "event"
         - "month"
         - "year"
    */
    getInitialState: function() {
        CALENDAR = this;
        var date = moment();
        return {
            current: date.valueOf(),  // Current Day
            active: date.weekday(2).valueOf(),      // Day visible into the view (scrollTO that day)
            type: "week"
        };
    },

    componentWillMount: function() {
        var data = _CalendarState(this.state, this.props);
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
    // // vois si l'utilisation de flux avec le dispatcher
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

    render: function() {
        var props = getProps(this.state, getDatesScope(this.state));
        var tagName = toCapitalize(this.state.type + 's');
        return (        
            React.createElement(Calendar[tagName], props)
        );
    }

});

Calendar.Years = React.createClass({

    render: function() {
        var content = (this.props.days || []).map(function(months) {
            return (
                <Calendar.Years.Item {...getProps(this.props, months)} />
            );
        }.bind(this));

        return (
            <div data-view="calendar-years" className="main-view scroll-view">
                <div className="scroll-view" ref="scroll-view">
                    {content}
                </div>
            </div>
        );
    }
});

Calendar.Years.Item = React.createClass({

    render: function() {
        var header = (function(months) {
            var timestamp = getFirstDay(months);
            var year = moment(timestamp).year();
            return (<h1>{year}</h1>);
        })(this.props.days);

        var content = (this.props.days || []).map(function(month) {
            return (
                <Calendar.Months.Item {...getProps(this.props, month)} />
            );
        }.bind(this));
        
        return (
            <div data-view="calendar-year">
                {header}
                <div data-view="calendar-year-content">
                    {content}
                </div>
            </div>
        );
        
    }
});

Calendar.Months = React.createClass({

    render: function() {
        var header;

        var content = (this.props.days || []).map(function(months) {
            return _.map(months, function(month) { 
                // Display Menu only once
                if (header == undefined) {
                    header = (<Calendar.Menu {...getProps(this.props, getFirstDay(month))} />);
                }
                return (
                    <Calendar.Months.Item {...getProps(this.props, month)} />
                );
            }.bind(this));
        }.bind(this));
        
        return (
            <div className="main-view scroll-view">
                <Calendar.Breadcrumb {...this.props} />
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

Calendar.Months.Item = React.createClass({
    getStyles: function() {
        var firstday = getFirstDay(this.props.days);
        var weekday = moment(firstday).weekday();
        return {
            width: Math.ceil((1 - weekday * 1 / 7) * 100) + '%'
        };
    },

    getClassName: function() { 
        var firstday = getFirstDay(this.props.days);
        return moment(firstday).isSame(this.props.active, 'month') ? 'active' : ''
    },

    getLabel: function(days) {
        var firstday = getFirstDay(this.props.days);
        return moment(firstday).format('MMMM');
    },

    render: function() {
        var content = (this.props.days || []).map(function(week) {
            var cells = (week || []).map(function(timestamp, index) {
                return (
                    <Calendar.Months.Item.Date timestamp={timestamp} {...this.props} />
                );
            }.bind(this));
            return (<tr>{cells}</tr>);
        }.bind(this));

        return (
            <table className={this.getClassName()}>
                <caption><span style={this.getStyles()}>{this.getLabel()}</span></caption>
                {content}
            </table>
        );
        
    }
});

Calendar.Months.Item.Date = React.createClass({
    
    getClassName: function() {
        return getDayStatus(this.props);
    },
    
    getLabel: function() {
        return moment(this.props.timestamp).format('D');
    },
    
    render: function() {
        var timestamp = this.props.timestamp;
        if (!timestamp) {
            return (
                <td></td>
            )
        }
        return (
            <td><a onClick={function() { gotoDay(timestamp) }} className={this.getClassName()}>{this.getLabel()}</a></td>
        );
    }
});

Calendar.Weeks = React.createClass({
    
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
    
    render: function() {
        var content = (this.props.days || []).map(function(year) {
            return _.map(year, function(month) {
                return _.map(month, function(week, key) {
                    return (
                        <div className="week-container" ref={key}>
                            <Calendar.Menu {...getProps(this.props, week)} />
                            <Calendar.Weeks.Content {...getProps(this.props, week)} />
                        </div>
                    );
                }.bind(this));
            }.bind(this))
        }.bind(this));

        // var _handleScroll = _.debounce(this._handleScroll, SCROLL_DEBOUNCE);
        // onScroll={_handleScroll}
        return (
            <div className="main-view scroll-view">
                <Calendar.Breadcrumb {...this.props} />
                <div className="weeks-container">
                    { content }
                </div>
            </div>
        );
    }
});

Calendar.Weeks.Content = React.createClass({

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
        // var scroller = React.findDOMNode(this.refs["Scroller"]);
    },
    
    render: function() {
        var content = (this.props.days || []).map(function(day) {
            var props = getProps(this.props, null, {timestamp: day});
            var status = getDayStatus(props);
            return (
                <Calendar.Weeks.Day timestamp={day} status={status} />
            );
        }.bind(this));
        
        // onScroll={this.props.onScroll}
        // var _handleScroll = _.debounce(this._handleScroll, SCROLL_DEBOUNCE);
        // onScroll={_handleScroll}
        return (
            <div className="week-content" ref="calendar-week" style={{height: 300}}>
                { content }
            </div>
        );
        
    }
});

Calendar.Breadcrumb = React.createClass({
    handleClick: function() {
        var data = getBreadcrumbData(this.props);
        updateCalendarView(data);
    },
    
    getLabel: function() {
        var format = ('week' === this.props.type.toLowerCase()) ? DATE_FORMAT_MONTH_YEAR : DATE_FORMAT_YEAR;
        return moment(this.props.active).format(format);
    },
    
    render: function() {
        return (
            <aside className="breadcrumb">
                <a onClick={this.handleClick} className="breadcrumb-item">{this.getLabel()}</a>
            </aside>
        );
    }
});

Calendar.Menu = React.createClass({
    render: function() {
        if ('week' !== this.props.type.toLowerCase()) {
            return (
                <nav role="navigation">
                    <table data-view="calendar-menu">
                        <thead></thead>
                        <tbody></tbody>
                        <tfoot>
                            <tr>
                                <Calendar.Menu.Current {...this.props} />
                            </tr>
                        </tfoot>
                    </table>
                </nav>
            );
        }

        return (
            <nav role="navigation">
                <table data-view="calendar-menu">
                    <thead>
                        <tr>
                            <Calendar.Menu.List {...getProps(this.props, null, {type: 'date'})} />
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <Calendar.Menu.List {...getProps(this.props, null, {type: 'day'})} />
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <Calendar.Menu.Current {...this.props} />
                        </tr>
                    </tfoot>
                </table>
            </nav>
        );
    }
});

Calendar.Menu.List = React.createClass({

    getClassName: function(timestamp) {
        var props = getProps(this.props, null, {timestamp: timestamp});
        return getDayStatus(props);
    },

    getLabel: function(timestamp) {
        var format = ('date' === this.props.type.toLowerCase()) ? 'dd' : 'D';
        return moment(timestamp).format(format);
    },

    render: function() {
        var content = _.map(this.props.days || [], function (timestamp) {
            return (
                <th className={this.getClassName(timestamp)}>
                    <a onClick={function() { gotoDay(timestamp) }}>{this.getLabel(timestamp)}</a>
                </th>
            );
        }.bind(this));

        return (<th>{content}</th>);
    }
});
    
Calendar.Menu.Current = React.createClass({

    getDefaultProps: function() {
        return {
            format: DATE_FORMAT_ALL
        }
    },
    
    getLabel: function() {
        var timestamp = getFirstDay(this.props.days);
        return moment(timestamp).format(this.props.format);
    },
    
    render: function() {
        return (
            <td colSpan="7"><h1>{this.getLabel()}</h1></td>
        );
    }
});

Calendar.Weeks.Day = React.createClass({

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
        var day = this.props.timestamp;
        var hours = _.range(0, 25);
        var content = hours.map(function(hour) {
            var ref = "hour:" + hour;
            var timestamp = day + hour * 60 * 60 * 1000;
            return (<Calendar.Weeks.Hour ref={ref} value={timestamp} scale={this.state.scale} />);
        }.bind(this));
        
        // @TODO :faire une vue à la place
        // y inclure le state (n'appartient à à cette vue)
        // var is_active = this.is_active();
        
        var is_active = false;

        // var _status = getDayStatus(day, this.props);
        
        var timer = (function(props) {
            if (is_active) {
                return (<Calendar.Weeks.Timer scale={this.state.scale} />);
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

Calendar.Weeks.Timer = React.createClass({
    // @TODO : mettre un timeout pour changer l'heure a chaque fois
    // mais uniquement lorsque cette vue est visible 
    // donc en fonction du router
    getInitialState: function() {
        return {
            timestamp: moment().valueOf()
        };
    },
    
    toHours: function(label) {
        var label = label.split(":");
        return label[0] * 1 + (label[1] * 1 / 60);
    },
    
    getLabel: function() {
        return moment(this.state.timestamp).format("HH:mm");
    },
    
    getCoords: function(label) {
        var time = this._toHours(label);
        return {
            "left": "20%",
            "top": Math.ceil(time * this.props.scale),
            "width": "80%"
        }
    },
    
    render: function() {
        var label = this.getLabel();
        var coords = this.getCoords(label);
        return (
            <div id="current-timer" style={coords}><span>{label}</span></div>
        );
    }
});

Calendar.Weeks.Hour = React.createClass({
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

