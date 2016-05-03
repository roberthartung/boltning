"use strict";

/// ...
importScripts('resource://boltningmodules/account.js');

var account;

onmessage = function(e) {
  let data = e.data;
  switch(data.type) {
    case 'init' :
      if(account != undefined) {
        throw "Already initialized";
      }

      account = new Account(data.login);
      account.ready.then(function() {
        postMessage('account is ready');
        var promises = [];
        account.calendars.forEach(function(calendar, path) {
          postMessage('refreshing ' + calendar.displayname);
          promises.push(calendar.refresh());
        });

        return Promise.all(promises);
      }).then(() => {
        postMessage('All calendars loaded...');
        postMessage({type: 'ready'});
      });

      /// Create Account, query calendars
    break;
  }
}
