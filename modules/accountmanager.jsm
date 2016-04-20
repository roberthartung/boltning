"use strict";
/// timeout, interval
Components.utils.import("resource://gre/modules/Timer.jsm");

// Imports the Services module, that allows us to use Services.<service> to use
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Log.jsm");

//Components.utils.import("chrome://boltning/content/ical.js");

let log = Log.repository.getLogger("boltning.accountmanager");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

var EXPORTED_SYMBOLS = ["accounts"];

function AccountManager() {
  var interval;

  function setup() {
    log.debug('setup');
  }

  var numLogins = Services.logins.countLogins("", null, "");
  log.debug('numLogins', numLogins);

  function waitForCore() {
    if(Services.core.initialized) {
      clearInterval(interval);
      setup();
    }
  }
  interval = setInterval(waitForCore.bind(this), 100);
}

var accounts = new AccountManager();
