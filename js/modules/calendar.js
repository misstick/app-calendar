
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

var _getWeek = function(timestamp) {
    var result = [];
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
    
var _getWeeks = function(type, timestamp) {
    if (type == "Month") {
        return {
            "previous": moment(timestamp).day(-7).valueOf(),
            "active": timestamp,
            "next": moment(timestamp).day(+7).valueOf()
        };
    }
    if (type == "Year") {
        return {
            "previous": moment(timestamp).month(-1).valueOf(),
            "active": timestamp,
            "next": moment(timestamp).day(+1).valueOf()
        };
    }
    return {
        "previous": moment(timestamp).year(-1).valueOf(),
        "active": timestamp,
        "next": moment(timestamp).year(+1).valueOf()
    };
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
    return moment(timestamp).format(DATE_FORMAT_FULL);
}

var _getId = function(type, timestamp) {
    return moment(timestamp).format(DATE_FORMAT_KEY) + "-" + type;
}

var _getViewType = function(data) {
    switch (data.type) {
        case "Month":
            return "Year";
            break;
            
        case "Year":
            return "Global";
            break;
            
        case "Event":
            return "Month";
            break;
        
        default:
            return "Global";
            break;
    }
}

var _goto = function(type) {
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
        return {
            current: null,  // Current Day
            active: null,      // Day visible into the view (scrollTO that day)
            type: "Month"
        };
    },

    componentWillMount: function() {
        var current = moment();
        this.setState({
            "current": current.valueOf(),
            "active": current.weekday(2).valueOf()
        });
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
    
    _selectDate: function(data) {
        this.setState({
            "active": data.timestamp
        });
    },
    
    _updateType: function(value) {
        console.log("_updateType", value)
        // this.setState({
        //     type: value
        // })
    },

    render: function() {
        
        var callback = {
            onClickBreadcrumb: this._updateType
        };
        if (this.state.type == "Month") {
            callback.onClickDate = this._selectDate;
            // callback.onScrollWeek = _.debounce(this._handleScroll, SCROLL_DEBOUNCE);
        }

        return (
            React.createElement(Calendar[this.state.type], 
                { 
                    data: this.state,
                    weeks: _getWeeks(this.state.type, this.state.active),
                    callback: callback
                })
        );
    }

});

Calendar.Breadcrumb = React.createClass({
    
    _handleClick: function() {
        this.props.onClick.call(this, {
            type: _getViewType(this.props.data)
        })
    },
    
    render: function() {
        var month = moment(this.props.active).format("MMMM");
        return (
            <aside className="breadcrumb">
                <a onClick={this._handleClick} className="breadcrumb-item">{month}</a>
            </aside>
        );
    }
});

Calendar.Month = React.createClass({
    
    _gotoWeek: function(status) {
        // @FIXME : conflict whitch other Scroll Call
        // Use dispatcher to handle these events
        _goto.call(this, "Week");
    },

    componentDidMount: function() {
        this._gotoWeek();
    },
    
    componentDidUpdate: function() {
        this._gotoWeek();
    },
    
    _handleScroll: function() {
        // @FIXME : conflict whitch other Scroll Call
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
        
        var content = _.map(this.props.weeks, function(timestamp, key) {
            var week = _getWeek(timestamp);
            return (
                <div data-view="calendar-week-view" style={{width: "33.33%"}} ref={key}>
                    <nav role="navigation">
                        <Calendar.Menu week={week} data={this.props.data} onClick={this.props.callback.onClickDate} />
                    </nav>
                    <Calendar.Week week={week} data={this.props.data} />
                </div>
            );
        }.bind(this));

        var _handleScroll = _.debounce(this._handleScroll, SCROLL_DEBOUNCE);
        
        return (
            <div data-view="calendar-month-view" className="main-view">
                <Calendar.Breadcrumb data={this.props.data} onClick={this.props.callback.onClickBreadcrumb} />
                <div className="scroll-view" ref="scroll-view" style={{overflow: "hidden"}} onScroll={_handleScroll}>
                    <div className="scroller" style={{width: "300%"}}>
                        { content }
                    </div>
                </div>
            </div>
        );
    }
});

Calendar.Week = React.createClass({

    _gotoDay: function(status) {
        // @FIXME : conflict whitch other Scroll Call
        // Use dispatcher to handle these events
        // _goto.call(this, "Day");
    },

    componentDidMount: function() {
        this._gotoDay();
    },
    
    componentDidUpdate: function() {
        this._gotoDay();
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
                <Calendar.Month.Day {...props} />
            );
        }.bind(this));
        
         // onScroll={this.props.onScroll}
        var _handleScroll = _.debounce(this._handleScroll, SCROLL_DEBOUNCE);

        return (
            <div className="scroll-view" ref="scroll-view" style={{height: 300}} onScroll={_handleScroll}>
                <div className="scroller" style={{width: "700%"}}>
                    { content }
                </div>
            </div>
        );
        
    }
});

Calendar.Menu = React.createClass({
    
    render: function() {
        
        var props = [];
        
        while(this.props.week.length < 7) {
            this.props.week.push(null);
        }
        
        
        var _getProps = function(timestamp, index) {
            return {
                timestamp: timestamp,
                className: _getDayStatus(timestamp, this.props.data),
                onClick: this.props.onClick
            };
        }.bind(this);
        
        var header = this.props.week.map(function(timestamp, index) {
            props.push(_getProps(timestamp, index));
            return (
                <Calendar.Menu.Header {...props[index]} />
            );
        }.bind(this));

        var content = this.props.week.map(function(timestamp, index) {
            return (
                <Calendar.Menu.Date {...props[index]} />
            );
        });
        
        // var content = header = []
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
                        <Calendar.Menu.Footer value={this.props.data.active} />
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
    render: function() {
        return (
            <td colSpan="7"><h1>{_toDateString(this.props.value)}</h1></td>
        );
    }
});

Calendar.Month.Day = React.createClass({

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
            return (<Calendar.Month.Hour ref={ref} value={timestamp} scale={this.state.scale} />);
        }.bind(this));
        
        // @TODO :faire une vue à la place
        // y inclure le state (n'appartient à à cette vue)
        // var is_active = this.is_active();
        
        var is_active = false;

        // var _status = _getDayStatus(day, this.props.data);
        
        var timer = (function(props) {
            if (is_active) {
                return (<Calendar.Month.Timer scale={this.state.scale} />);
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

Calendar.Month.Timer = React.createClass({
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

Calendar.Month.Hour = React.createClass({
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

