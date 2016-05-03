"use strict";

importScripts('resource://boltningmodules/xmlparser.js');
importScripts('resource://boltningmodules/util.jsm');
importScripts('resource://boltningmodules/calendar.js');

var calendar;

/// Calendar worker
onmessage = function(e) {
  let data = e.data;
  switch(data.type) {
    case 'init' :
      // data.href
      // data.login
      calendar = new Calendar(data.login, data.href);
    break;
    case 'refresh' :
      postMessage('CalendarWorker.refresh');
      calendar.refresh().then(() => {
        postMessage({type: 'ready'});
      });
    break;
  }
}
