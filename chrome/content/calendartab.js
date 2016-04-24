"use strict";
// Imports the Services module, that allows us to use Services.<service> to use
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Log.jsm");
Components.utils.import("chrome://boltning/content/ical.js");
Components.utils.import("resource://boltningmodules/accountmanager.jsm");
Components.utils.import("resource://boltningmodules/util.jsm");

let log = Log.repository.getLogger("boltning.calendartab");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

const { require } = Components.utils.import("resource://gre/modules/commonjs/toolkit/require.js", {});
//var notifications = require("sdk/notifications");
//Components.utils.import("resource://gre/modules/PopupNotifications.jsm");
//log.debug('notifications', typeof notifications);

/*
notifications.notify({
  title: "Jabberwocky",
  text: "'Twas brillig, and the slithy toves",
  data: "did gyre and gimble in the wabe",
  onClick: function (data) {
    log.debug(data);
    // console.log(this.data) would produce the same result.
  }
});
*/

const WEEKSTART = ICAL.Time.MONDAY;
var calendars = new Map();
const now = ICAL.Time.now();
/// This will be OK, as it is Monday 0:0:0
const startOfWeek = now.startOfWeek(WEEKSTART);
/// This is kind of OK, because it will be Sunday 0:0:0, in terms of date this
/// is fine, but not datetime wise
const endOfWeek = now.endOfWeek(WEEKSTART);
/// ... Thus add 1 day to be on Monday 0:0:0
endOfWeek.addDuration(new ICAL.Duration({days: 1}));

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
  name: "boltningcalendar",
  panelId: "calendarTabPanel",
  modes: {
    boltningcalendar: {
      // only for tabs that should be displayed at startup
      // isDefault: true,
      // maximum tabs to display at the same time
      maxTabs: 1,
      // same as mode
      type: "boltningcalendar",
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
  createCalendarColumn('saturday', 'Saturday');
  createCalendarColumn('sunday', 'Sunday');
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
    spacerElement.setAttribute('height', '50');
    spacerElement.setAttribute('selected', 'true');
    vboxSpacerElement.appendChild(spacerElement);
    let spacerElement2 = document.createElement('spacer');
    spacerElement2.setAttribute('height', '50');
    spacerElement2.setAttribute('selected', 'true');
    vboxSpacerElement.appendChild(spacerElement2);
  }
  stackElement.appendChild(vboxSpacerElement);

  /// Container for the actual content
  let eventsBoxElement = document.createElement('stack'); // vbox
  eventsBoxElement.className = 'calendar-column';
  eventsBoxElement.setAttribute('id', "calendar-"+id);
  stackElement.appendChild(eventsBoxElement);

  // TODO(rh): Add more stacks here...
  vboxElement.appendChild(stackElement);

  /// TODO(rh): This is actually an inner shadow element, thus we should NOT use it!
  var outer = document.getElementById('calendar-columns');
  outer.appendChild(vboxElement);
}

function init() {
  //Services.logins.removeAllLogins();
  createCalendarXUL();

  let tree = document.getElementById('calendar-tree-children');

  accounts.ready.then(function() {
    // log.debug('accounts ready', accounts.accounts.length);
    if(accounts.accounts.length == 0) {
      var win = openDialog('chrome://boltning/content/AddAccount.xul');
      log.debug("AddAccountDialogWindow", win);
      // reject(new Error("No accounts found!"));
    } else {
      var _promises = [];
      for(var a=0;a<accounts.accounts.length;a++) {
        let account = accounts.accounts[a];
        //log.debug('... account', account);
        account.calendars.forEach(function(calendar, path) {
          log.debug('... calendar', calendar);
          let treeitem = document.createElement('treeitem');
          let treerow = document.createElement('treerow');
          let treecell = document.createElement('treecell');
          treecell.setAttribute('label', calendar.displayname);
          treerow.appendChild(treecell);
          treeitem.appendChild(treerow);
          tree.appendChild(treeitem);

          _promises.push(calendar.refresh());
        });
      }

      Promise.all(_promises).then(displayCalendars);
    }
  });

  /// Setup button-click event for account manager dialog
  var accountButton = document.getElementById('calendar-accounts');
  accountButton.addEventListener('click', function(ev) {
    openDialog('chrome://boltning/content/AccountManagerDialog.xul');
  });
}

function displayCalendars() {
  log.debug('displayCalendars');

  var columns = document.getElementById('calendar-columns');
  // document.querySelectorAll('#calendar-columns .calendar-column');
  columns = columns.querySelectorAll('.calendar-column');

  for(var a=0;a<accounts.accounts.length;a++) {
    let account = accounts.accounts[a];
    account.calendars.forEach(function(calendar, path) {


      var items = [];
      calendar.items.forEach(function(item, _) {
        //log.debug('item for ' + calendar.displayname, item.event.summary);
        let cmp = item.checkRelevanceForChange(startOfWeek, endOfWeek);
        if(cmp) {
          log.debug('relevant item', [item.summary, cmp]);
          items.push(item);
        }
      });

      items.forEach((item, _) => {
        if(item.event.startDate.isDate && item.event.endDate.isDate) {
          var startDate = item.event.startDate;
          var endDate = item.event.endDate;

          /// Only if it is not larger!
          if(startDate.compare(startOfWeek) != 1) {
            startDate = startOfWeek;
          }

          /// Only if it is not smaller!
          if(endDate.compare(endOfWeek) != -1) {
            endDate = endOfWeek;
          }

          var diffDuration = endDate.subtractDate(startDate);
          if(diffDuration.isNegative) {
            log.error("diffDuration: NEGATIVE!", item);
            throw "Expected duration of an event to be positive (e.g. start < end!)";
          }
          var duration = diffDuration.days+diffDuration.weeks*7;

          var diffStart = startDate.subtractDate(startOfWeek);
          var daysFromStart = diffStart.days;
          var daysToEnd = 7 - daysFromStart - duration;

          //log.debug('event', [item.event.summary, startDate, endDate, duration]);
          //log.debug('event', [item.event.summary, daysFromStart, daysToEnd, item.event.startDate, item.event.endDate]);
          //log.debug('event.vcalendar', item.vcalendar);

          var element = document.createElement('alldayevent');
          element.setAttribute('flex', '1');
          element.setAttribute('skip', ''+daysFromStart);
          element.setAttribute('length', ''+duration);
          element.setAttribute('fill', ''+daysToEnd);
          element.setAttribute('value', item.event.summary);

          var labelElement = document.createElement('label');
          labelElement.appendChild(document.createTextNode(item.event.summary.trim()));
          labelElement.setAttribute('class', 'plain');
          labelElement.setAttribute('flex', '1');
          labelElement.style.backgroundColor = calendar.color;
          element.appendChild(labelElement);

          var calendarAlldayElement = document.getElementById('calendar-allday');
          calendarAlldayElement.appendChild(element);
        } else if(!item.event.startDate.isDate && !item.event.endDate.isDate) {
          /// Step 1: Find correct column!

          var diffToStartOfWeek = item.event.startDate.subtractDate(startOfWeek);

          var diffStartDays = diffToStartOfWeek.days + diffToStartOfWeek.weeks * 7;

          var diffEvent = item.event.endDate.subtractDate(item.event.startDate);

          //log.debug('event', [item.event.summary, diffStartDays]);

          let stackElement = document.createElement('stack');
          stackElement.setAttribute('flex', '1');

          let xe = document.createElement('description');
          xe.appendChild(document.createTextNode(item.event.summary));
          xe.setAttribute('top', ''+(diffToStartOfWeek.hours*100));
          xe.setAttribute('height', ''+(diffEvent.hours*100.0+diffEvent.minutes/60.0*100.0));
          // xe.style.backgroundColor = 'rgba(255, 0, 0, 0.25)';
          xe.style.backgroundColor = calendar.color;


          stackElement.appendChild(xe);

          columns[diffStartDays].appendChild(stackElement);
          // dayColumnElement.appendChild(stackElement);
        } else {
          throw "One of startDate / endDate is a date, but the other one is a time!";
        }
      });


    });
  }
}

window.addEventListener("load", function(e) {
  let tabmail = document.getElementById('tabmail');
  tabmail.registerTabType(calendarTabType);
  tabmail.registerTabMonitor(calendarTabMonitor);
  tabmail.openTab("boltningcalendar", {background: true});

  var interval;
  interval = window.setInterval(function() {
    if(Services.core.initialized) {
      window.clearInterval(interval);
      init();
    }
  }, 100);
}, false);

/*
var worker = new Worker("resource://boltning/worker.js");
log.debug(worker);
worker.onmessage = function(e) {
  //result.textContent = e.data;
  log.debug('Message received from worker', e.data);
}

worker.onerror = function(e) {
  log.error("Error in Worker", {message: e.message, filename: e.filename, lineno: e.lineno});
}
*/
