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
      calendar.init.then(() => {
        postMessage({type: 'init.done'});
      });
    break;
    case 'refresh' :
      // postMessage('CalendarWorker.refresh');
      calendar.refresh().then(() => {
        postMessage({type: 'refresh.done'});
      });
    break;
    case 'query' :
      calendar.query(data.query).then((result) => {
        postMessage({type: 'query.done', result: result});
      });
    break;
  }
}
