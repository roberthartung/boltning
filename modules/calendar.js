"use strict";

importScripts('resource://boltningmodules/ical.js');

function Calendar(login, href, xml) {
  this.href = href;
  this.login = login;
  this.items = new Map();

  /*
  return;

  this.xml = xml;

  //this.displayname = xml.querySelector('displayname').textContent;
  this.displayname = xml.children('displayname').next().value.text();
  var colorElement = xml.children('calendar-color').next().value//xml.querySelector('calendar-color');
  this.color = 'cyan';
  if(colorElement != null) {
    var rgba = parseColor(colorElement.text().trim());
    this.color = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+',0.5)';
  }
  */
  /// TODO(rh): Random color here or save in properties?
  //this.color =  ? colorElement.textContent : 'cyan';
  //log.debug('Calendar', [this.displayname, this.color]);

  /// Load calendar initially
  this.init = this.synchronize();
}

Calendar.prototype.synchronize = function synchronize() {
  var items = this.items;
  /// TODO(rh): Check items / Use tokens before!

  return HttpCaldavRequest.report(this.login, this.href, '<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:getetag /><c:calendar-data /></d:prop><c:filter><c:comp-filter name="VCALENDAR" /></c:filter></c:calendar-query>', '1').then((responses) => {
    for(var i=0;i<responses.length;i++) {
      let response = responses[i];
      var jcalData = ICAL.parse(response.contentElement.children('calendar-data').next().value.text().trim());
      var vcalendar = new ICAL.Component(jcalData);
      var item = new CalendarItem(this, response.href, vcalendar);
      items.set(response.href, item);
    }
    return items;
  });
}

Calendar.prototype.query = function query(q) {
  return new Promise((resolve, reject) => {
    let fromDate = new ICAL.Time(q.from);
    let toDate = new ICAL.Time(q.to);

    var result = {};

    this.items.forEach((item, _) => {
      /// 2.) check for current week
      let _events = item.checkRelevanceForRange(fromDate, toDate);
      if(_events) {
        result[item.path] = {summary: _events[0].summary, startDate: _events[0].startDate.toJSON(), endDate: _events[0].endDate.toJSON()};
        // events.push(_events[0].summary);
      }
    });

    resolve(result);
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
    }

  } else {
    //log.error("No events for item!", vcalendar);
  }
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
    //log.error('CalendarItem with more than 1 event. Ignoring.');
  }

  return events.length == 0 ? false : events;
}

/*
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
*/

/*
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

    try {
      if(!this.event.isRecurring()) {
        throw new Error("Event is not recurring");
      }
    } catch(e) {
        log.error(e.message, vcalendar);
    }



    this.vevent = this.vevents[this.vevents.length-1];//
    this.summary = this.vevent.getFirstPropertyValue('summary');
    this.event = new ICAL.Event(this.vevent);

  } else {
    log.error("No events for item!", vcalendar);
  }


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

}
*/

/*
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
*/
