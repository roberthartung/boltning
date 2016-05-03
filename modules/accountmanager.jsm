"use strict";

const { require } = Components.utils.import("resource://gre/modules/commonjs/toolkit/require.js", {});

// Imports the Services module, that allows us to use Services.<service> to use
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Log.jsm");
Components.utils.import("resource://gre/modules/Http.jsm");
/// timeout, interval
Components.utils.import("resource://gre/modules/Timer.jsm");

Components.utils.import("resource://boltningmodules/util.jsm");

//Components.utils.import("chrome://boltning/content/ical.js");

//Components.utils.import("resource://gre/modules/PromiseWorker.jsm");

//importScripts("resource://gre/modules/workers/require.js");
//let PromiseWorker = require("resource://gre/modules/PromiseWorker.jsm");

let log = Log.repository.getLogger("boltning.accountmanager");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

var XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1",
  "nsIXMLHttpRequest");
var XMLSerializer = Components.Constructor("@mozilla.org/xmlextras/xmlserializer;1",
  "nsIDOMSerializer");


var EXPORTED_SYMBOLS = ["accounts"];

function AccountWrapper(login) {
  this.accountWorker = new Worker('resource://workers/account.js');
  this.accountWorker.onmessage = function(e) {
    log.debug('message from worker', e.data);
  }
  this.accountWorker.postMessage({
    type: 'init',
    login: {
      hostname: login.hostname,
      username: login.username,
      password: login.password
    }
  });
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

      var account = new AccountWrapper(login);
      accounts.push(account);

      /*let accountWorker = new SharedWorker('resource://workers/account.js', 'account:'+login.username+'@'+login.hostname);

      accountWorker.port.onmessage = function(e) {
        log.debug('accountWorker.message', e.data);
      }
      */

      /*
      let account = new Account(login);
      accounts.push(account);
      _promises.push(account.ready);
      */
    }
  }

  this.ready = Promise.all(_promises);

  setup();
}

var accounts = new AccountManager();
