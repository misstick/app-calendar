var moment = require('moment');

var YEAR_STEP  = 6; // Get the MONTH_STEP weeks before/after the current date
var WEEK_STEP = 4;  // Get the WEEK_STEP weeks before/after the current date

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

var _get_days = function(scope, timestamp) {
    var period = _get_period(scope, timestamp);
    var days = _range_weeks(period.min, period.max);
}

var _current_date = Date.now();
var _calendar_days = _get_days("year", _current_date);


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



