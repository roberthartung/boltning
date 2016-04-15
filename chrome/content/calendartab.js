"use strict";
// Imports the Services module, that allows us to use Services.<service> to use
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Log.jsm");
Components.utils.import("chrome://boltning/content/ical.js");

let log = Log.repository.getLogger("boltning.calendartab");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

const WEEKSTART = ICAL.Time.MONDAY;
var calendars = new Map();
const now = ICAL.Time.now();
const startOfWeek = now.startOfWeek(WEEKSTART);
const endOfWeek = now.endOfWeek(WEEKSTART);

function Calendar(displayname) {
  this.displayname = displayname;
  this.items = new Map();
}

Calendar.prototype.addItem = function(item) {
  this.items.set(item.path, item);
}

function CalendarItem(path, vcalendar) {
  this.path = path;
  this.vcalendar = vcalendar;

  /*
  if(vcalendar.getAllSubcomponents().length > 1) {
    log.debug('VCalendar with more than 1 component', vcalendar);
  }
  */
  /*
  if(vcalendar.getAllSubcomponents('vevent').length > 1) {
    log.debug('vcalendar with more than 1 vevent', vcalendar);
  }
  */

  this.vevent = this.vcalendar.getFirstSubcomponent('vevent');
  this.summary = this.vevent.getFirstPropertyValue('summary');

  vcalendar.getAllSubcomponents('vevent').forEach((vevent, _) => {
    var event = new ICAL.Event(vevent);
    if(event.isRecurring()) {
      //log.debug('recurring vevent', event);
      var it = event.iterator();
      /*event.startDate*//* startOfWeek */
      var occ;
      while((occ = it.next()) && occ.compare(endOfWeek) == -1) {
        if(occ.compare(startOfWeek) != -1) {
          var details = event.getOccurrenceDetails(occ);
          log.debug('getOccurrenceDetails', details.item.summary);
        }
      }
    } else {
      /// ...
    }
  });
  //

  this.event = new ICAL.Event(this.vevent);
  // event.duration
/*
  let startDate = this.event.startDate.toJSDate();
  let endDate = this.event.endDate.toJSDate();
  /// Fully contained within week
  //if(startDate >= datetime_from && endDate <= datetime_to) {
    log.debug('event.summary1', this.event.summary);
    let xe = document.createElement('description');
    xe.appendChild(document.createTextNode(this.event.summary));
    xe.setAttribute('top', offset);
    xe.setAttribute('height', 40);
    //xe.setAttribute('flex', '1');
    offset += 40;
    var dayColumnElement = document.getElementById('calendar-monday');
    dayColumnElement.appendChild(xe);
  //}
  */
  /// Fully overlapping week
  /*
  else if(startDate <= datetime_from && endDate >= datetime_to) {
    log.debug('event.summary2', summary);
  }
  */

}

/// Checks if the calendar is interesting for the date range. Following
/// cases can be identified:
///
/// -----------------------------------------------------> Time, t
///                   [s ############# e] <- event
/// 1)             |s--------------------e|
/// 2)                  |s-----------e|
/// 3)             |s------------e|
/// 4)                          |s-----------e|
/// 5) -----e|
/// 6)                                          |s------
CalendarItem.prototype.checkRelevanceForChange = function(start, end) {
  let compareStartStart = this.event.startDate.compare(start);
  let compareStartEnd = this.event.startDate.compare(end);
  let compareEndStart = this.event.endDate.compare(start);
  let compareEndEnd = this.event.endDate.compare(end);

  /// if start is smaller or end is greater -> no intereset
  /// This handles cases 5) and 6)
  if(compareStartEnd != -1 || compareEndStart != 1) {
    return false;
  }

  return true;

  log.debug('compareStartStart', [compareStartStart, this.event.startDate.toJSDate().toISOString(), start.toJSDate().toISOString()]);
  log.debug('compareStartEnd', [compareStartEnd, this.event.startDate.toJSDate().toISOString(), end.toJSDate().toISOString()]);
  log.debug('compareEndStart', [compareEndStart, this.event.endDate.toJSDate().toISOString(), start.toJSDate().toISOString()]);
  log.debug('compareEndEnd', [compareEndEnd, this.event.endDate.toJSDate().toISOString(), end.toJSDate().toISOString()]);
}

/*
var today = new Date();
today.setSeconds(0);
today.setMinutes(0);
today.setHours(0);
var datetime_from = new Date(today.getTime()-60*60*24*2*1000);
var datetime_to = new Date(today.getTime()+60*60*24*2*1000);
datetime_to.setSeconds(59);
datetime_to.setMinutes(59);
datetime_to.setHours(23);
*/
/*
log.debug('today', today);
log.debug('datetime_from', datetime_from);
log.debug('datetime_to', datetime_to);
*/

//log.debug("Details about bad thing only useful during debugging", {someInfo: "nothing"});

var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Ci.nsILoginInfo, "init");

var calendarTabMonitor = {
  monitorName: "boltning",
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
  name: "calendar",
  panelId: "calendarTabPanel",
  modes: {
    calendar: {
      // only for tabs that should be displayed at startup
      // isDefault: true,
      // maximum tabs to display at the same time
      maxTabs: 1,
      // same as mode
      type: "calendar",
      // Optional function
      shouldSwitchTo: function(aArgs) {
        log.debug("shouldSwitchTo");
        //return true;
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
        //throw "openTab";
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
  return new Promise(function(resolve, reject) {
    var numLogins = Services.logins.countLogins("", null, "");
    if(numLogins === 0) {
      var win = openDialog('chrome://boltning/content/AddAccount.xul');
      log.debug("dialog:", win);
      reject(new Error("No accounts found!"));
    } else {
      loadLogins().then(resolve);
    }
  });
}

function CreateAccount() {
  log.debug("CreateAccount!!!!");
}

function loadLogins() {
  log.debug('loadLogins');
  var promises = [];
  // Services.logins.getAllLogins({})
  var logins = Services.logins.getAllLogins({});
  for (var i = 0; i < logins.length; i++) {
    let login = logins[i];
    var p = setupServer(login);
    promises.push(p);
  }

  return Promise.all(promises);
}

function setupServer(login) {
  return new Promise(function(resolve, reject) {
    log.debug('setupServer');
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'document';
    xhr.addEventListener('load', function(ev) {
      /// TODO(rh): Replace this with specific request for current user principcal!
      var currentUserPrincipal = xhr.response.querySelector('current-user-principal');
      if(currentUserPrincipal) {
        var path = currentUserPrincipal.textContent.trim();
        loadCalendars(login, path).then(resolve);
      }
    });
    xhr.open('PROPFIND', login.hostname, true, login.username, login.password);
    /// Headers after open(), but before send()
    xhr.setRequestHeader('Depth', '1');
    xhr.setRequestHeader('Prefer', 'return-minimal');
    xhr.send();
  });
}

function loadCalendars(login, path) {
  return new Promise(function(resolve, reject){
    log.debug('loadCalendars');
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'document';
    xhr.addEventListener('load', function(ev) {
      parseCalendars(login, xhr.response).then(resolve);
    });
    xhr.open('PROPFIND', login.hostname+path, true, login.username, login.password);
    /// Headers after open(), but before send()
    xhr.setRequestHeader('Depth', '1');
    xhr.setRequestHeader('Prefer', 'return-minimal');
    xhr.send();
  });
}

function parseCalendars(login, xml) {
  let responses = xml.documentElement.querySelectorAll('response');

  log.debug('parseCalendars', xml.innerHtml);
  var tree = document.getElementById('calendar-tree-children');
  for(var i=0;i<responses.length;i++) {
    let response = responses[i];
    let calendarElement = response.querySelector('calendar');
    if(calendarElement != null) {
      var calendarDisplayName = response.querySelector('displayname').textContent.trim();

      calendars.set(response.querySelector('href').textContent.trim(), new Calendar(calendarDisplayName));

      let treeitem = document.createElement('treeitem');
      let treerow = document.createElement('treerow');
      let treecell = document.createElement('treecell');
      treecell.setAttribute('label', calendarDisplayName);
      treerow.appendChild(treecell);
      treeitem.appendChild(treerow);
      tree.appendChild(treeitem);
    }
  }
  /*
  for(var key of calendars.keys()) {
    refreshCalendar(login, key, calendars.get(key));
  }
  */
  var promises = [];
  calendars.forEach(function(calendar, key) {
    var p = refreshCalendar(login, key, calendar);
    promises.push(p);
  });
  return Promise.all(promises);
}

function refreshCalendar(login, path, calendar) {
  log.debug('refreshCalendar', path);
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'document';
    xhr.addEventListener('load', function(ev) {
      parseCalendarData(login, calendar, xhr.response).then(resolve);
    });
    xhr.open('REPORT', login.hostname + path, true, login.username, login.password);
    /// Headers after open(), but before send()
    xhr.setRequestHeader('Depth', '1');
    xhr.setRequestHeader('Prefer', 'return-minimal');
    xhr.send('<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav"><d:prop><d:getetag /><c:calendar-data /></d:prop><c:filter><c:comp-filter name="VCALENDAR" /></c:filter></c:calendar-query>');
  });
}

let offset = 0;

function parseCalendarData(login, calendar, xml) {
  return new Promise(function(resolve, reject) {
    let responses = xml.querySelectorAll('response');
    log.debug('parseCalendarData', responses.length);
    var dayColumnElement = document.getElementById('calendar-monday');
    for(var i=0;i<responses.length;i++) {
      let response = responses[i];
      var jcalData = ICAL.parse(response.querySelector('calendar-data').textContent.trim());
      var vcalendar = new ICAL.Component(jcalData);
      var item = new CalendarItem(response.querySelector('href').textContent.trim(), vcalendar);
      calendar.addItem(item);
      /// TODO(rh): Check start/end within week
    }
    resolve();
  });
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

function createCalendarXUL() {
  let timeslotsLabelsElement = document.getElementById('timeslots-labels');

  for(var h=0;h<=23;h++) {
    let vboxElement = document.createElement('vbox');
    vboxElement.setAttribute('height', '100');

    let labelElement = document.createElement('label');
    labelElement.setAttribute('align', 'center');
    labelElement.setAttribute('value', h+':00');
    vboxElement.appendChild(labelElement);

    timeslotsLabelsElement.appendChild(vboxElement);
  }

  createCalendarColumns();
}

function createCalendarColumns() {
  createCalendarColumn('monday', 'Monday');
  createCalendarColumn('tuesday', 'Tuesday');
  createCalendarColumn('wednesday', 'Wednesday');
  createCalendarColumn('thursday', 'Thursday');
  createCalendarColumn('friday', 'Friday');
}

function createCalendarColumn(id, label) {
  /*
  <vbox flex="1"> <!-- 1 column -->
    <stack flex="1"> <!-- stack -->
      <vbox>
        <spacer height="100" selected="true"/>
        <spacer height="100"/>
        <spacer height="100"/>
        <spacer height="100"/>
      </vbox>
    </stack>
  </vbox>
  */
  let vboxElement = document.createElement('vbox');
  vboxElement.setAttribute('flex', '1');

  let stackElement = document.createElement('stack');
  stackElement.setAttribute('flex', '1');

  let vboxSpacerElement = document.createElement('vbox');
  for(var h=0;h<=23;h++) {
    let spacerElement = document.createElement('spacer');
    spacerElement.setAttribute('height', '100');
    spacerElement.setAttribute('selected', 'true');
    vboxSpacerElement.appendChild(spacerElement);
  }
  stackElement.appendChild(vboxSpacerElement);

  /// Container for the actual
  let eventsBoxElement = document.createElement('vbox');
  eventsBoxElement.setAttribute('id', "calendar-"+id);
  stackElement.appendChild(eventsBoxElement);

  // TODO(rh): Add more stacks here...
  vboxElement.appendChild(stackElement);

  var outer = document.getElementById('calendar-columns');
  outer.appendChild(vboxElement);
}

function init() {
  createCalendarXUL();
  checkAccounts().then(displayCalendars).catch(function(err) {
    log.error('Error in init', err);
  });
  //displayCalendars();
}

function displayCalendars() {
  //log.debug('displayCalendars', calendars);
  calendars.forEach(function(calendar, _) {

    var items = [];
    calendar.items.forEach(function(item, _) {
      if(item.checkRelevanceForChange(startOfWeek, endOfWeek)) {
        items.push(item);
      }
    });
    log.debug('displayCalendars'+_, [calendar.items.size, items.length]);
    items.forEach((item, _) => {
      /// 1. Check duration of the event to see if it's an all-day event
      /// These events can be directly displayed at the top of each day!
      // if(item.event.startDate.is)
      // log.debug('interesting item', item);
    });
  });
}

window.addEventListener("load", function(e) {
  let tabmail = document.getElementById('tabmail');
  tabmail.registerTabType(calendarTabType);
  tabmail.registerTabMonitor(calendarTabMonitor);
  tabmail.openTab("calendar", {background: true});
  /// TODO(rh): Start thread via Services.tm
  /// https://developer.mozilla.org/en-US/docs/The_Thread_Manager
  //var syncThread1 = Services.tm.newThread(0);
  //var syncThread2 = Services.tm.newThread(0);
  //log.debug("syncThread:", [syncThread1, syncThread2, syncThread1==syncThread2]);
  var worker = new Worker("resource://boltning/worker.js");
  log.debug(worker);
  worker.onmessage = function(e) {
    //result.textContent = e.data;
    log.debug('Message received from worker', e.data);
  }

  worker.onerror = function(e) {
    log.error("Error in Worker", {message: e.message, filename: e.filename, lineno: e.lineno});
  }


  /// https://developer.mozilla.org/en-US/docs/Mozilla/Tech/XPCOM/Reference/Interface/nsIRunnable

  //var myLoginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);

  /*

  var logins = myLoginManager.getAllLogins({});
  if(logins.length == 0) {
    aConsoleService.logStringMessage("No accounts found :(");
    //var loginInfo = new nsLoginInfo(hostname, formSubmitURL, httprealm, username, password, usernameField, passwordField);
    var loginInfo = new nsLoginInfo('chrome://boltning', null, 'CalDAV Calendar', 'hartung', '123456', '', ''); // PW?
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
      // categoryManager.addCategoryEnty("protocol", "caldav", "boltning.proto.caldav", false /*must be false*/, true);
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


  // openDialog('chrome://boltning/content/dialog.xul');
  // openDialog('chrome://boltning/content/wizard.xul');
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
