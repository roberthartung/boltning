"use strict";

importScripts('resource://boltningmodules/xmlparser.js');
importScripts('resource://boltningmodules/util.jsm');
//importScripts('resource://boltningmodules/calendar.js');

/// Constructor/Base of CalendarShadow
/// Initially
function CalendarShadow(account, href, xml) {
  this.xml = xml;

  this.displayname = xml.children('displayname').next().value.text();
  var colorElement = xml.children('calendar-color').next().value;
  this.color = 'cyan';
  if(colorElement != null) {
    var rgba = parseColor(colorElement.text().trim());
    this.color = 'rgba('+rgba.r+','+rgba.g+','+rgba.b+',0.5)';
  }

  this.worker = new Worker('resource://workers/calendar.js');

  /// Initializes
  this.ready = new Promise((resolve, reject) => {
    this.worker.postMessage({type: 'init', href: href, login: account.login});
    this.initResolve = resolve;
    this.initReject = reject;
  });

  this.worker.addEventListener('message', (e) => {
    let data = e.data;
    switch(data.type) {
      case 'refresh.done' :
        this.refreshResolve();
      break;
      case 'init.done' :
        this.initResolve();
      break;
      case 'query.done' :
        this.queryResolve(data.result);
      break;
      default :
        postMessage(data);
      break;
    }
  });
}

/// Refreshes the calendar's items!
CalendarShadow.prototype.refresh = function refresh() {
  return new Promise((resolve, reject) => {
    this.worker.postMessage({type: 'refresh'});
    this.refreshResolve = resolve;
    this.refreshReject = resolve;
  });
}

CalendarShadow.prototype.query = function query(q) {
  return new Promise((resolve, reject) => {
    this.worker.postMessage(q);
    this.queryResolve = resolve;
    this.queryReject = resolve;
  });
}

function Account(login) {
  var calendars = new Map();
  this.login = login;
  this.calendars = calendars;
  var _this = this;

  function loadCalendars(principal_path) {
    return HttpCaldavRequest.propfind(login, principal_path, '<?xml version="1.0" encoding="utf-8"?><x0:propfind xmlns:x1="http://calendarserver.org/ns/" xmlns:x0="DAV:" xmlns:x3="http://apple.com/ns/ical/" xmlns:x2="urn:ietf:params:xml:ns:caldav"><x0:prop><x1:getctag/><x0:displayname/><x2:calendar-description/><x3:calendar-color/><x3:calendar-order/><x0:resourcetype/><x2:calendar-free-busy-set/></x0:prop></x0:propfind>', '1').then(function(responses) {
      for(var r=0;r<responses.length;r++) {
        let response = responses[r];
        /// schedule-inbox/output
        /// proxy-read/write
        if(!response.error) {
          var resourcetypeElement = response.contentElement.children('resourcetype').next().value;
          if(resourcetypeElement) {
            var calendarElement = resourcetypeElement.children('calendar').next().value;
            /// This is a calendar
            if(calendarElement != null) {
              var calendar = new CalendarShadow(_this, response.href, response.contentElement);
              calendars.set(response.href, calendar);
            }
          } else {
            log.error('Unable to find <resourcetype>');
          }
        }
      }
    });
  }

  this.ready = findPrincipcal(login).then(loadCalendars);
}

function findPrincipcal(login) {
  return new Promise(function(resolve, reject) {
    HttpCaldavRequest.propfind(login, '/', '<d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>').then(function(responses) {
      //log.debug('findPrincipcal.responses:', responses);
      for(var r=0;r<responses.length;r++) {
        var response = responses[r];
        if(response.error) {
          reject(response);
        } else {
          resolve(response.contentElement.text());
          // resolve(response.contentElement.querySelector('current-user-principal').querySelector('href').textContent);
        }
      }
    });
  });
}

/*
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
*/
