"use strict";
// Imports the Services module, that allows us to use Services.<service> to use
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Log.jsm");
Components.utils.import("chrome://caldavcalendar/content/ical.js");

let log = Log.repository.getLogger("caldavcalendar.calendartab");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

var calendars = new Map();

//log.debug("Details about bad thing only useful during debugging", {someInfo: "nothing"});

var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Ci.nsILoginInfo, "init");

var calendarTabMonitor = {
  monitorName: "caldavcalendar",
  onTabTitleChanged: function() {},
  onTabOpened: function() {},
  onTabClosing: function() {},
  onTabPersist: function() {},
  onTabRestored: function() {},
  onTabSwitched: function onTabSwitched(aNewTab, aOldTab) {
    //throw "onTabSwitched";
  }
}

/// Taken from http://mxr.mozilla.org/comm-central/source/mail/base/content/tabmail.xml
var calendarTabType = {
  name: "caldavcalendar",
  panelId: "calendarTabPanel",
  modes: {
    caldavcalendar: {
      // only for tabs that should be displayed at startup
      // isDefault: true,
      // maximum tabs to display at the same time
      maxTabs: 1,
      // same as mode
      type: "caldavcalendar",
      // Optional function
      shouldSwitchTo: function(aArgs) {
        log.debug("shouldSwitchTo");
      },
      openTab: function(aTab, aArgs) {
        // aTab.mode available
        // this points to tab type, not mode type!
        aTab.title = 'Calendar';
        aTab.className = "tabmail-tab";
        aTab.accesskey="C";
        aTab.flex="100";
        aTab.width="0";
        aTab.minwidth="100";
        aTab.maxwidth="210";
      },
      closeTab: function(aTab) {
        // cleanup
        log.debug("closeTab");
      },
      saveTabState: function(aTab) {
        log.debug("saveTabState");
      },
      showTab: function(aTab) {
        /*
        log.debug("showTab", Services.logins.countLogins("", "", "CalDAV Calendar"));
        var check = {value: false};                  // default the checkbox to false
        var password = {value: "pass"};
        var result = Services.prompt.promptPassword(null, "Title", "Enter password:", password, "Save password in password manager?", check);
        if(result) {
          log.debug('password entered', check, password);
        }
        */
        /// ?
      },
      persistTab: function(aTab) {
        log.debug("persistTab");
      },
      restoreTab: function(aTabmail, aPersistedState) {
        log.debug("restoreTab");
      },
      onTitleChanged: function(aTab) {
        log.debug("onTitleChanged");
      },
      supportsCommand: function(aCommand, aTab) { return false; },
      isCommandEnabled: function(aCommand, aTab) { return false; },
      doCommand: function(aCommand, aTab) {

      },
      onEvent: function(aEvent, aTab) {
        log.debug("onEvent");
      },
      //getBrowser(aTab)
    }
  },
  saveTabState: function(aTab) {
    log.debug("saveTabState");
  }
};

function checkAccounts() {
  var numLogins = Services.logins.countLogins("", null, "");
  if(numLogins === 0) {
    var win = openDialog('chrome://caldavcalendar/content/AddAccount.xul');
    log.debug("dialog:", win);
  } else {
    loadLogins();
  }
}

function CreateAccount() {
  log.debug("CreateAccount!!!!");
}

function loadLogins() {
  log.debug('loadLogins');
  // Services.logins.getAllLogins({})
  var logins = Services.logins.getAllLogins({});
  for (var i = 0; i < logins.length; i++) {
    let login = logins[i];
    setupServer(login);
  }
}

function setupServer(login) {
  log.debug('setupServer', login);
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'document';
  xhr.addEventListener('load', function(ev) {
    //var response = parseXml(xhr.response);
    var currentUserPrincipal = xhr.response.querySelector('current-user-principal');
    /// For
    if(currentUserPrincipal) {
      var path = currentUserPrincipal.textContent.trim();
      loadCalendars(login, path);
    }
  });
  xhr.open('PROPFIND', login.hostname, true, login.username, login.password);
  /// Headers after open(), but before send()
  xhr.setRequestHeader('Depth', '1');
  xhr.setRequestHeader('Prefer', 'return-minimal');
  /*
  xhr.setRequestHeader('Content-Type', 'application/xml; charset=utf-8');

  <d:propfind xmlns:d="DAV:" xmlns:cs="http://calendarserver.org/ns/">
  <d:prop>
     <d:displayname />
     <cs:getctag />
  </d:prop>
</d:propfind>
  */
  xhr.send();
}

function loadCalendars(login, path) {
  log.debug('loadCalendars', login);
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'document';
  xhr.addEventListener('load', function(ev) {
    parseCalendars(login, xhr.response);
  });
  xhr.open('PROPFIND', login.hostname+path, true, login.username, login.password);
  /// Headers after open(), but before send()
  xhr.setRequestHeader('Depth', '1');
  xhr.setRequestHeader('Prefer', 'return-minimal');
  xhr.send();
}

var today = new Date();
today.setSeconds(0);
today.setMinutes(0);
today.setHours(0);
var datetime_from = new Date(today.getTime()-60*60*24*2*1000);
var datetime_to = new Date(today.getTime()+60*60*24*2*1000);
datetime_to.setSeconds(59);
datetime_to.setMinutes(59);
datetime_to.setHours(23);
/*
log.debug('today', today);
log.debug('datetime_from', datetime_from);
log.debug('datetime_to', datetime_to);
*/

function parseCalendars(login, xml) {
  let responses = xml.documentElement.querySelectorAll('response');
  log.debug('parseCalendars', responses.length);
  var tree = document.getElementById('calendar-tree-children');
  for(var i=0;i<responses.length;i++) {
    let response = responses[i];
    let calendarElement = response.querySelector('calendar');
    if(calendarElement != null) {
      var calendarDisplayName = response.querySelector('displayname').textContent.trim();

      calendars.set(response.querySelector('href').textContent.trim(), calendarDisplayName);

      let treeitem = document.createElement('treeitem');
      let treerow = document.createElement('treerow');
      let treecell = document.createElement('treecell');
      treecell.setAttribute('label', calendarDisplayName);
      treerow.appendChild(treecell);
      treeitem.appendChild(treerow);
      tree.appendChild(treeitem);
    }
  }

  for(var key of calendars.keys()) {
    refreshCalendar(login,key);
    //break;
    //log.debug('calendars:', key);
    //break;
  }
  // calendars.forEach();
}

function refreshCalendar(login, path) {
  log.debug('refreshCalendar', path);
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'document';
  xhr.addEventListener('load', function(ev) {
    parseCalendarData(login, xhr.response);
  });
  xhr.open('REPORT', login.hostname + path, true, login.username, login.password);
  /// Headers after open(), but before send()
  xhr.setRequestHeader('Depth', '1');
  xhr.setRequestHeader('Prefer', 'return-minimal');
  xhr.send('<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:getetag /><c:calendar-data /></d:prop><c:filter><c:comp-filter name="VCALENDAR" /></c:filter></c:calendar-query>');
}

let offset = 0;

function parseCalendarData(login, xml) {
  let responses = xml.querySelectorAll('response');
  log.debug('parseCalendarData', responses.length);
  var dayColumnElement = document.getElementById('calendar-monday');
  for(var i=0;i<responses.length;i++) {
    let response = responses[i];
    var jcalData = ICAL.parse(response.querySelector('calendar-data').textContent.trim());
    var vcalendar = new ICAL.Component(jcalData);
    var vevent = vcalendar.getFirstSubcomponent('vevent');
    var summary = vevent.getFirstPropertyValue('summary');
    var event = new ICAL.Event(vevent);
    // event.duration
    /// TODO(rh): dont convert using .toJSDate(), but use
    let startDate = event.startDate.toJSDate();
    let endDate = event.endDate.toJSDate();
    /// Fully contained within week
    if(startDate >= datetime_from && endDate <= datetime_to) {
      log.debug('event.summary1', summary);
      let xe = document.createElement('box');
      xe.appendChild(document.createTextNode(summary));
      xe.setAttribute('top', offset);
      offset += 20;
      dayColumnElement.appendChild(xe);
    }
    /// Fully overlapping week
    else if(startDate <= datetime_from && endDate >= datetime_to) {
      log.debug('event.summary2', summary);
    }

    /// TODO(rh): Check start/end within week
  }
}

/*
function parseXml(xml) {
  switch(xml.documentElement.tagName.toLowerCase()) {
    case "multistatus":
      let responses = xml.documentElement.querySelectorAll('response propstat prop');
      for(var i=0;i<responses.length;i++) {
        let response = responses[i];
        log.debug(response.querySelector('displayname').textContent);
      }

    break;
  }
}
*/

function init() {
  checkAccounts();
}

window.addEventListener("load", function(e) {
  let tabmail = document.getElementById('tabmail');
  tabmail.registerTabType(calendarTabType);
  tabmail.registerTabMonitor(calendarTabMonitor);
  tabmail.openTab("caldavcalendar", {background: true}); // true

  /// TODO(rh): Start thread via Services.tm
  /// https://developer.mozilla.org/en-US/docs/The_Thread_Manager
  var syncThread = Services.tm.newThread(0);
  /// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIRunnable

  //var myLoginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);

  /*

  var logins = myLoginManager.getAllLogins({});
  if(logins.length == 0) {
    aConsoleService.logStringMessage("No accounts found :(");
    //var loginInfo = new nsLoginInfo(hostname, formSubmitURL, httprealm, username, password, usernameField, passwordField);
    var loginInfo = new nsLoginInfo('chrome://caldavcalendar', null, 'CalDAV Calendar', 'hartung', '123456', '', ''); // PW?
    myLoginManager.addLogin(loginInfo);
  } else {
    // Simple Array[nsLoginInfo]
    //aConsoleService.logStringMessage("Accounts found? :)"+JSON.stringify(logins));
  }
  */


  //Services.core.init();
  var interval;
  interval = window.setInterval(function() {
    if(Services.core.initialized) {
      window.clearInterval(interval);

      init();


      // var categoryManager = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager);
      // categoryManager.addCategoryEnty("protocol", "caldav", "caldavcalendar.proto.caldav", false /*must be false*/, true);
      // Services.logins.removeAllLogins();

      /*
      log.debug("Core initialized");
      try {
        var x = Services.core.getProtocolById("caldav");
        log.debug(x);
        var y = Services.core.getProtocols();
        log.debug(y);
      } catch(err) {
        log.error(err);
      }
      log.debug("done");
      */
      //var proto = Components.classes[cid].createInstance(Ci.prplIProtocol);
      //log.debug(proto);
      //log.info(Services.core.getProtocols()); // ('caldav')
      //log.debug(Services.accounts);
      // log.debug(Services.logins.getAllLogins({}));
    }
  }, 100);
  //

  //Services.accounts.createAccount("someuser", "someid");


  // openDialog('chrome://caldavcalendar/content/dialog.xul');
  // openDialog('chrome://caldavcalendar/content/wizard.xul');
}, false);

window.addEventListener("load", function(e) {
  var interval;
  interval = window.setInterval(function() {
    if(Services.core.initialized) {
      window.clearInterval(interval);
      //log.debug('logins', Services.logins.getAllLogins({}));
    }
  }, 100);
});
