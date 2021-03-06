"use strict";

// Imports the Services module, that allows us to use Services.<service> to use
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Log.jsm");
Components.utils.import("resource://gre/modules/Http.jsm");
/// timeout, interval
Components.utils.import("resource://gre/modules/Timer.jsm");

Components.utils.import("resource://boltningmodules/util.jsm");

Components.utils.import("chrome://boltning/content/ical.js");

let log = Log.repository.getLogger("boltning.accountmanager");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

var XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1",
  "nsIXMLHttpRequest");
var XMLSerializer = Components.Constructor("@mozilla.org/xmlextras/xmlserializer;1",
  "nsIDOMSerializer");

const regexp_hexcolor_3digit = /^#([A-fa-f0-9]{1})([A-fa-f0-9]{1})([A-fa-f0-9]{1})$/;
const regexp_hexcolor_6digit = /^#([A-fa-f0-9]{2})([A-fa-f0-9]{2})([A-fa-f0-9]{2})([A-fa-f0-9]{2})?$/;

var EXPORTED_SYMBOLS = ["accounts"];

function findPrincipcal(login) {
  return new Promise(function(resolve, reject) {
    HttpCaldavRequest.propfind(login, '/', '<d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>').then(function(responses) {
      //log.debug('findPrincipcal.responses:', responses);
      for(var r=0;r<responses.length;r++) {
        var response = responses[r];
        if(response.error) {
          reject(response);
        } else {
          resolve(response.contentElement.querySelector('current-user-principal').querySelector('href').textContent);
        }
      }
    });
  });
}


function CalendarItem(calendar, path, vcalendar) {
  this.calendar = calendar;
  this.path = path;
  this.vcalendar = vcalendar;

  this.vevents = this.vcalendar.getAllSubcomponents('vevent');

  if(this.vevents.length == 1) {
    this.vevent = this.vcalendar.getFirstSubcomponent('vevent');
    this.summary = this.vevent.getFirstPropertyValue('summary');
    this.event = new ICAL.Event(this.vevent);
    this.events = [this.event];
  } else if(this.vevents.length > 1) {
    this.events = [];
    this.isRecurring = false;
    for(var v=0;v<this.vevents.length;v++) {
      let vevent = this.vevents[v];
      let event = new ICAL.Event(vevent);

      if(event.isRecurrenceException()) {
        continue;
      }

      /// We assume, that there is only a single event
      if(event.isRecurring()) {
        if(v != 0) {
          throw "Event is recurring, but index != 0!";
        }
        this.isRecurring = true;
        this.summary = vevent.getFirstPropertyValue('summary');
        this.event = event;
      } else {
        this.events.push(event);
      }

      // let summary = vevent.getFirstPropertyValue('summary');
      // summary
      // log.debug('events #'+v, [event.isRecurring(), event.isRecurrenceException()]);
    }

    //this.vevent = this.vcalendar.getFirstSubcomponent('vevent');
    //this.summary = this.vevent.getFirstPropertyValue('summary');
    //this.event = new ICAL.Event(this.vevent);

    // log.warn('More than 1 event', this.event.summary);
    /// Assumption is that the first event is recurring, and the other events
    /// are the refinements of occurences.

    /// 1. -> Test if first event is recurring
    /*
    try {
      if(!this.event.isRecurring()) {
        throw new Error("Event is not recurring");
      }
    } catch(e) {
        log.error(e.message, vcalendar);
    }
    */

    /*
    this.vevent = this.vevents[this.vevents.length-1];//
    this.summary = this.vevent.getFirstPropertyValue('summary');
    this.event = new ICAL.Event(this.vevent);
    */
  } else {
    log.error("No events for item!", vcalendar);
  }

  /*
  vcalendar.getAllSubcomponents('vevent').forEach((vevent, _) => {
    var event = new ICAL.Event(vevent);
    if(event.isRecurring()) {
      //log.debug('recurring vevent', event);
      var it = event.iterator();

      var occ;
      while((occ = it.next()) && occ.compare(endOfWeek) == -1) {
        if(occ.compare(startOfWeek) != -1) {
          var details = event.getOccurrenceDetails(occ);
          log.debug('getOccurrenceDetails', details.item.summary);
        }
      }
    } else {
      /// ...
      log.debug('CalendarItem.event', event);
    }
  });
  */
}


CalendarItem.prototype.checkRelevanceForRange = function(start, end) {
  /// One single event -> directly parsable!
  var events = [];
  if(this.event != undefined) {
    if(this.event.isRecurring()) {
      var it = this.event.iterator();
      var occ;
      while((occ = it.next()) && occ.compare(end) == -1) {
        if(occ.compare(start) != -1) {
          var details = this.event.getOccurrenceDetails(occ);
          var cmp = DateTimeUtility.compareRangesByDate(details.startDate, details.endDate, start, end);
          //log.debug('getOccurrenceDetails', [details.item.summary, cmp, details.startDate, details.endDate]);
          if(cmp) {
            //log.debug('occurence found', [details.item]);
            //this.event = details.item;
            /// TODO(rh): HACK
            //this.event.startDate = details.startDate;
            //this.event.endDate = details.endDate;
            // return cmp;
            events.push({event: this.event, summary: this.summary, startDate: details.startDate, endDate: details.endDate, cmp: cmp, calendar: this.calendar});
          }
        }
      }
      // return DateTimeUtility.compareRangesByDate(this.event.startDate, this.event.endDate, start, end);
      //return false;
    } else {
      let cmp = DateTimeUtility.compareRangesByDate(this.event.startDate, this.event.endDate, start, end);
      if(cmp) {
        events.push({event: this.event, summary: this.summary, startDate: this.event.startDate, endDate: this.event.endDate, cmp: cmp, calendar: this.calendar});
      }
    }
  } else {
    log.error('CalendarItem with more than 1 event. Ignoring.');
  }

  return events.length == 0 ? false : events;
}

function parseColor(txt) {
  var match = regexp_hexcolor_3digit.exec(txt);
  if(match != null) {
    return {r: parseInt(match[1]+match[1], 16), g: parseInt(match[2]+match[2], 16), b: parseInt(match[3]+match[3], 16)};
  }

  match = regexp_hexcolor_6digit.exec(txt);
  if(match != null) {
    return {r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16)};
  }

  throw "Unable to parse color: "+txt;
}

function Calendar(account, href, xml) {
  this.href = href;
  this.account = account;
  this.xml = xml;

  this.displayname = xml.querySelector('displayname').textContent;
  var colorElement = xml.querySelector('calendar-color');
  this.color = 'cyan';
  if(colorElement != null) {
    var rgba = parseColor(colorElement.textContent.trim());
    this.color = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+',0.5)';
  }
  /// TODO(rh): Random color here or save in properties?
  //this.color =  ? colorElement.textContent : 'cyan';
  //log.debug('Calendar', [this.displayname, this.color]);
}

Calendar.prototype.refresh = function refresh() {
  var items = new Map();
  this.items = items;
  var _this = this;

  return HttpCaldavRequest.report(this.account.login, this.href, '<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:getetag /><c:calendar-data /></d:prop><c:filter><c:comp-filter name="VCALENDAR" /></c:filter></c:calendar-query>', '1').then(function(responses) {
    for(var i=0;i<responses.length;i++) {
      let response = responses[i];

      var jcalData = ICAL.parse(response.contentElement.querySelector('calendar-data').textContent.trim());
      var vcalendar = new ICAL.Component(jcalData);
      var item = new CalendarItem(_this, response.href, vcalendar);
      items.set(response.href, item);
      // calendar.addItem(item);
      //break;
    }

    return items;
  });
}

function Account(login) {
  var calendars = new Map();
  this.login = login;
  this.calendars = calendars;
  var _this = this;
  // log.debug('Account', login);

  function loadCalendars(principal_path) {
    return HttpCaldavRequest.propfind(login, principal_path, '<?xml version="1.0" encoding="utf-8"?><x0:propfind xmlns:x1="http://calendarserver.org/ns/" xmlns:x0="DAV:" xmlns:x3="http://apple.com/ns/ical/" xmlns:x2="urn:ietf:params:xml:ns:caldav"><x0:prop><x1:getctag/><x0:displayname/><x2:calendar-description/><x3:calendar-color/><x3:calendar-order/><x0:resourcetype/><x2:calendar-free-busy-set/></x0:prop></x0:propfind>', '1').then(function(responses) {
      //log.debug('Account.loadCalendars', responses);
      for(var r=0;r<responses.length;r++) {
        let response = responses[r];
        /// schedule-inbox/output
        /// proxy-read/write
        if(!response.error) {
          var resourcetypeElement = response.contentElement.querySelector('resourcetype');
          if(resourcetypeElement != null) {
            var calendarElement = resourcetypeElement.querySelector('calendar');
            /// This is a calendar
            if(calendarElement != null) {
              var calendar = new Calendar(_this, response.href, response.contentElement);
              calendars.set(response.href, calendar);
            }
          } else {
            log.error('Unable to find <resourcetype>');
          }
        }
      }

      //log.debug('Account.calendars', calendars.size);
    });
  }

  this.ready = findPrincipcal(login).then(loadCalendars);
}

function AccountManager() {
  var accounts = [];
  this.accounts = accounts;
  var _promises = [];

  Services.core.init();

  function setup() {
    var numLogins = Services.logins.countLogins("", null, "");
    //log.debug('numLogins', numLogins);

    var logins = Services.logins.getAllLogins({});
    for (var i = 0; i < logins.length; i++) {
      let login = logins[i];
      let account = new Account(login);
      accounts.push(account);
      _promises.push(account.ready);
    }
  }

  this.ready = Promise.all(_promises);

  setup();
}

var accounts = new AccountManager();
