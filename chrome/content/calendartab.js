"use strict";
// Imports the Services module, that allows us to use Services.<service> to use
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Log.jsm");
//Components.utils.import("chrome://boltning/content/ical.js");
Components.utils.import("resource://boltningmodules/ical.js");
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

const startOfMonth = now.startOfMonth();
const endOfMonth = now.endOfMonth();

/// This will be OK, as it is Monday 0:0:0
const startOfWeek = now.startOfWeek(WEEKSTART);
/// This is kind of OK, because it will be Sunday 0:0:0, in terms of date this
/// is fine, but not datetime wise
const endOfWeek = now.endOfWeek(WEEKSTART);
/// ... Thus add 1 day to be on Monday 0:0:0
endOfWeek.addDuration(new ICAL.Duration({days: 1}));

var boltningCalendarTabMonitor = {
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
var boltningCalendarTabType = {
  name: "boltningcalendar",
  panelId: "boltningCalendarTabPanel",
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

  createMonthView();
}

const weeks = new Map();

function createMonthView() {
  let element = document.getElementById('calendar-monthview');
  var firstDay = startOfMonth.startOfWeek(WEEKSTART);
  /// TODO(rh): Always display 6 full weeks (in case where 1st is on sunday,
  /// and we got 31 days this is required)

  var lastDay = endOfMonth.endOfWeek(WEEKSTART);
  var current = firstDay.clone();
  /// Iterate through weeks here!
  while(current.compare(lastDay) == -1) {
    var weekNumber = current.weekNumber(WEEKSTART);

    let rowElement = document.createElement('row');
    rowElement.setAttribute('flex', '1');
    rowElement.setAttribute('class', 'foobar-class');

    let stackElement = document.createElement('stack');
    /// TODO(rh): Do we need these attributes?
    stackElement.setAttribute('flex', '1');
    stackElement.setAttribute('orient', 'vertical');
    stackElement.setAttribute('id', 'week-'+weekNumber);

    let weekEndDate = current.endOfWeek(WEEKSTART);
    weekEndDate.addDuration(new ICAL.Duration({days: 1}));

    // log.debug('weeknumber', weekNumber);
    weeks.set(weekNumber, {
      stack: stackElement,
      start: current.startOfWeek(WEEKSTART),
      end: weekEndDate
    });

    var day = current.clone();
    for(var i=0;i<7;i++) {
      let boxElement = document.createElement('box');
      var labelElement = document.createElement('label');
      var date = day.toJSDate();
      var dayNumber = date.getDate();
      if(dayNumber < 10) {
        dayNumber = '0'+dayNumber;
      }
      labelElement.setAttribute('value', dayNumber);
      labelElement.setAttribute('class', 'plain header');
      labelElement.setAttribute('flex', '1');
      boxElement.appendChild(labelElement);
      rowElement.appendChild(boxElement);
      day.adjust(1,0,0,0);
    }

    element.appendChild(rowElement);
    element.appendChild(stackElement);
    current  = day;
  }
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

/*
var worker = new ChromeWorker("resource://boltning/worker.js");
worker.onmessage = function(e) {
  log.debug('Message received from worker', e.data);
}

worker.onerror = function(e) {
  log.error("Error in Worker", {message: e.message, filename: e.filename, lineno: e.lineno});
}
*/

function clampDates(event, start, end) {
  var startDate = event.startDate;
  var endDate = event.endDate;

  /// Only if it is not larger!
  if(startDate.compare(start) != 1) {
    startDate = start;
  }

  /// Only if it is not smaller!
  if(endDate.compare(end) != -1) {
    endDate = end;
  }

  return [startDate, endDate];
}

function displayWeeks(weekevents) {
  //log.debug('displayWeeks');
  weeks.forEach(function(weekInfo, weekNumber) {
    let events = weekevents.get(weekNumber);
    // let stackElement = document.getElementById('week-'+weekNumber);
    let stackElement = weekInfo.stack;
    let map = mapEventsByDuration(events, weekInfo.start, weekInfo.end);
    try {
      displayWeek(map, stackElement);
    } catch(err) {
      log.error('error in displayweek', err.message);
    }
  });
}

function findFreeSlot(slots, dailyOffsets, event) {
  var slot = 0;

  while(true) {
    /// By default the event fits into the slot for all days
    var fits = true;
    /// Loop over days and check if the slot really fits
    for(var d=event.daysFromStart; d<7-event.daysToEnd;d++) {
      /// Get the map of slots for this day!
      var day = dailyOffsets.get(d);
      if(day.has(slot)) {
        fits = false;
        break;
      }
    }

    if(fits) {
      /// Check slot, and initilaize if necessary
      var slotObject = slots.get(slot);
      if(slotObject === undefined) {
        /// 0 ... 6 -> 7 days -> null
        slotObject = [null, null, null, null, null, null, null];
        slots.set(slot, slotObject);
      }
      /// If it fits, reserve slot across all days
      for(var d=event.daysFromStart; d<7-event.daysToEnd;d++) {
        var day = dailyOffsets.get(d);
        day.set(slot, true);
        slotObject[d] = event;
      }
      //slotObject[event.daysFromStart] = event;
      //log.debug('slotObject', slotObject);
      break;
    }
    slot++;
  }

  // return slot;
}

function mergeSlots(slots) {
  /// merge slots here
  slots.forEach(function(obj, slot) {
    var el = undefined;
    var newObj = [];
    while(obj.length > 0) {
      var x = obj.shift();
      if(el === undefined) {
        el = {type: x, length: 0};
      } else if(el.type !== x) {
        newObj.push(el);
        el = {type: x, length: 0};
      }
      el.length++;
    }
    newObj.push(el);

    /// This is not working.
    obj.push(...newObj);
  });
}

function displayWeek(durationMap, containerElement) {
  var dailyOffsets = new Map();

  for(var i=0;i<7;i++) {
    dailyOffsets.set(i, new Map());
  }

  var slots = new Map();

  // var offset = 0;
  durationMap.forEach(function(events, duration) {
    events.forEach(function(event, _) {
      //var element = document.createElement('alldayevent');
      /// We have to find a free slot, so the event fits in there!
      findFreeSlot(slots, dailyOffsets, event);
    });
  });

  mergeSlots(slots);

  slots.forEach(function(obj, slot) {
    var gridElement = document.createElement('grid');
    gridElement.setAttribute('top', 20+slot*(20+4));
    gridElement.setAttribute('left', 0);
    gridElement.setAttribute('right', 0);
    gridElement.setAttribute('height', 20);
    var columnsElement = document.createElement('columns');
    var rowsElement = document.createElement('rows');
    var rowElement = document.createElement('row');
    rowElement.setAttribute('equalsize', 'always');
    rowsElement.appendChild(rowElement);
    gridElement.appendChild(columnsElement);
    gridElement.appendChild(rowsElement);

    while(obj.length > 0) {
      var el = obj.shift();
      var columnElement = document.createElement('column');
      columnElement.setAttribute('flex', el.length);
      columnsElement.appendChild(columnElement);
      if(el.type === null) {
        var spacerElement = document.createElement('spacer');
        rowElement.appendChild(spacerElement);
      } else {
        var event = el.type;
        var boxElement = document.createElement('box');
        boxElement.setAttribute('style', 'padding: 2px;');
        var descriptionElement = document.createElement('description');
        descriptionElement.setAttribute('flex', '1');
        descriptionElement.setAttribute('class', 'plain');
        descriptionElement.setAttribute('crop', 'center');
        descriptionElement.setAttribute('tooltiptext', event.event.summary);
        descriptionElement.setAttribute('value', event.event.summary);
        descriptionElement.style.backgroundColor = event.event.calendar.color;
        boxElement.appendChild(descriptionElement);
        // <description flex="1" class="plain" value="Small" crop="center" tooltiptext="A really really small title" style="cursor: pointer; background-color: yellow;"/>
        rowElement.appendChild(boxElement);
      }
    }

    containerElement.appendChild(gridElement);
  });
}

function mapEventsByDuration(events, start, end) {
  var durationMap = new Map();

  durationMap.set(7, []);
  durationMap.set(6, []);
  durationMap.set(5, []);
  durationMap.set(4, []);
  durationMap.set(3, []);
  durationMap.set(2, []);
  durationMap.set(1, []);
  durationMap.set(0, []); // possible, if less than 1 day (e.g. non one-day events)

  // log.debug('mapEventsByDuration...', [start, end, events.length]);

  events.forEach(function(event, index) {
    var [startDate, endDate] = clampDates(event, start, end);

    var diffDuration = endDate.subtractDate(startDate);
    if(diffDuration.isNegative) {
      log.error("diffDuration: NEGATIVE!", event);
      throw new Error("Expected duration of an event to be positive (e.g. start < end!)");
    }
    var duration = diffDuration.days + diffDuration.weeks * 7;
    if(duration == 0) {
      /// single-day event
      duration = 1;
    }

    var diffStart = startDate.subtractDate(start);
    var daysFromStart = diffStart.days;
    var daysToEnd = 7 - daysFromStart - duration;

    durationMap.get(duration).push({
      daysFromStart: daysFromStart,
      daysToEnd: daysToEnd,
      duration: duration,
      event: event
    });
  });

  return durationMap;
}

function displayCalendars() {
  log.debug('displayCalendars()');

  var columns = document.getElementById('calendar-columns');
  // document.querySelectorAll('#calendar-columns .calendar-column');
  columns = columns.querySelectorAll('.calendar-column');

  var alldayevents = new Map();
  var weekevents = new Map();

  /// Durations from 1 to 7 days
  alldayevents.set(7, []);
  alldayevents.set(6, []);
  alldayevents.set(5, []);
  alldayevents.set(4, []);
  alldayevents.set(3, []);
  alldayevents.set(2, []);
  alldayevents.set(1, []);

  weeks.forEach(function(weekInfo, weekNumber) {
    weekevents.set(weekNumber, new Array());
  });

  // log.debug('weekevents', weekevents.size);
  for(var a=0;a<accounts.accounts.length;a++) {
    let account = accounts.accounts[a];
    account.calendars.forEach(function(calendar, path) {
      var events = [];

      /// Loop through all items for the calendar
      calendar.items.forEach(function(item, _) {
        /// TODO(rh): Don't check redundantly for each week

        /// 1.) Check if this item is relevant for the weeks
        weeks.forEach(function(weekInfo, weekNumber) {
          let _events = item.checkRelevanceForRange(weekInfo.start, weekInfo.end);
          if(_events) {
            // log.debug('Item matches week', [weekNumber, _events[0].summary]);
            weekevents.get(weekNumber).push(_events[0]);
          }
        });

        /// 2.) check for current week
        let _events = item.checkRelevanceForRange(startOfWeek, endOfWeek);
        if(_events) {
          events.push(_events[0]);
        }
      });

      events.forEach((event, _) => {
        if(event.startDate.isDate && event.endDate.isDate) {
          var [startDate, endDate] = clampDates(event, startOfWeek, endOfWeek);

          var diffDuration = endDate.subtractDate(startDate);
          if(diffDuration.isNegative) {
            log.error("diffDuration: NEGATIVE!", event);
            throw "Expected duration of an event to be positive (e.g. start < end!)";
          }
          var duration = diffDuration.days+diffDuration.weeks*7;

          var diffStart = startDate.subtractDate(startOfWeek);
          var daysFromStart = diffStart.days;
          var daysToEnd = 7 - daysFromStart - duration;

          alldayevents.get(duration).push({
            daysFromStart: daysFromStart,
            daysToEnd: daysToEnd,
            duration: duration,
            event: event,
            calendar: calendar
          });
        } else if(!event.startDate.isDate && !event.endDate.isDate) {
          /// Step 1: Find correct column!
          var diffToStartOfWeek = event.startDate.subtractDate(startOfWeek);
          var diffStartDays = diffToStartOfWeek.days + diffToStartOfWeek.weeks * 7;
          var diffEvent = event.endDate.subtractDate(event.startDate);

          //log.debug('event', [item.event.summary, diffStartDays]);

          //let stackElement = document.createElement('stack');
          //stackElement.setAttribute('flex', '1');

          let xe = document.createElement('description');
          xe.appendChild(document.createTextNode(event.summary));
          xe.setAttribute('top', ''+(diffToStartOfWeek.hours*100+diffToStartOfWeek.minutes/60.0*100.0));
          xe.setAttribute('height', ''+(diffEvent.hours*100.0+diffEvent.minutes/60.0*100.0));
          // xe.style.backgroundColor = 'rgba(255, 0, 0, 0.25)';
          xe.style.backgroundColor = calendar.color;
          //stackElement.appendChild(xe);

          //columns[diffStartDays].appendChild(stackElement);
          columns[diffStartDays].appendChild(xe);
          // dayColumnElement.appendChild(stackElement);
        } else {
          throw "One of startDate / endDate is a date, but the other one is a time!";
        }
      });
    });
  }

  displayWeeks(weekevents);

  var dailyOffsets = new Map();

  for(var i=0;i<7;i++) {
    dailyOffsets.set(i, new Map());
  }

  var calendarAlldayElement = document.getElementById('calendar-allday');
  displayWeek(alldayevents, calendarAlldayElement);
}

/// Main entry point. Wait for the document to be loaded
window.addEventListener("load", function(e) {
  /// Create tab
  let tabmail = document.getElementById('tabmail');
  tabmail.registerTabType(boltningCalendarTabType);
  tabmail.registerTabMonitor(boltningCalendarTabMonitor);
  tabmail.openTab("boltningcalendar", {background: true});

  /// Wait for the core to be initialized.
  /// TODO(rh): We should be able to use Service.core.init() here directly?!
  var interval;
  interval = window.setInterval(function() {
    if(Services.core.initialized) {
      window.clearInterval(interval);
      init();
    }
  }, 100);
}, false);

/// called after calendars are loaded initially.
function refreshCalendars() {
  log.debug('refreshCalendars()');

  accounts.query({from: startOfWeek.toJSON(), to: endOfWeek.toJSON()}).then((result) => {
    //log.debug('refreshCalendars.result', result);

    var events = [];
    result.forEach((calendars, _) => {
      calendars.forEach((items, _) => {
        //log.debug('items', items);
        for(var path in items) {
          var item = items[path];
          /// unserialize
          item.startDate = new ICAL.Time(item.startDate);
          item.endDate = new ICAL.Time(item.endDate);
          events.push(item);
        }
      });
    });

    return events;
  }).then((events) => {
    var columns = document.getElementById('calendar-columns').querySelectorAll('.calendar-column');

    for(var c=0;c<columns.length;c++) {
      var column = columns[c];
      while(column.hasChildNodes()) {
        column.removeChild(column.firstChild);
      }
    }

    var alldayevents = new Map();

    /// Durations from 1 to 7 days
    alldayevents.set(7, []);
    alldayevents.set(6, []);
    alldayevents.set(5, []);
    alldayevents.set(4, []);
    alldayevents.set(3, []);
    alldayevents.set(2, []);
    alldayevents.set(1, []);

    events.forEach((event, _) => {
      if(event.startDate.isDate && event.endDate.isDate) {
        var [startDate, endDate] = clampDates(event, startOfWeek, endOfWeek);

        var diffDuration = endDate.subtractDate(startDate);
        if(diffDuration.isNegative) {
          log.error("diffDuration: NEGATIVE!", event);
          throw "Expected duration of an event to be positive (e.g. start < end!)";
        }
        var duration = diffDuration.days+diffDuration.weeks*7;

        var diffStart = startDate.subtractDate(startOfWeek);
        var daysFromStart = diffStart.days;
        var daysToEnd = 7 - daysFromStart - duration;

        alldayevents.get(duration).push({
          daysFromStart: daysFromStart,
          daysToEnd: daysToEnd,
          duration: duration,
          event: event/*,
          calendar: calendar*/
        });
      } else if(!event.startDate.isDate && !event.endDate.isDate) {
        /// Step 1: Find correct column!
        var diffToStartOfWeek = event.startDate.subtractDate(startOfWeek);
        var diffStartDays = diffToStartOfWeek.days + diffToStartOfWeek.weeks * 7;
        var diffEvent = event.endDate.subtractDate(event.startDate);

        //log.debug('event', [item.event.summary, diffStartDays]);

        //let stackElement = document.createElement('stack');
        //stackElement.setAttribute('flex', '1');

        let xe = document.createElement('description');
        xe.appendChild(document.createTextNode(event.summary));
        xe.setAttribute('top', ''+(diffToStartOfWeek.hours*100+diffToStartOfWeek.minutes/60.0*100.0));
        xe.setAttribute('height', ''+(diffEvent.hours*100.0+diffEvent.minutes/60.0*100.0));
        xe.style.backgroundColor = 'rgba(255, 0, 0, 0.25)';
        //xe.style.backgroundColor = calendar.color;
        //stackElement.appendChild(xe);

        //columns[diffStartDays].appendChild(stackElement);
        columns[diffStartDays].appendChild(xe);
        // dayColumnElement.appendChild(stackElement);
      } else {
        throw "One of startDate / endDate is a date, but the other one is a time!";
      }
    });
  });

  // .then(displayCalendars)
}

function init() {
  //Services.logins.removeAllLogins();
  createCalendarXUL();

  let synchronizeButton = document.getElementById('boltning-synchronize');
  synchronizeButton.addEventListener('click', function(e) {
    if(synchronizeButton.disabled) {
      return;
    }

    var columns = document.getElementById('calendar-columns').querySelectorAll('.calendar-column');

    for(var c=0;c<columns.length;c++) {
      var column = columns[c];
      while(column.hasChildNodes()) {
        column.removeChild(column.firstChild);
      }
    }

    /// Force refresh
    synchronizeButton.disabled = true;
    accounts.synchronize().then(() => {
      synchronizeButton.disabled = false;
      refreshCalendars();
    });
  });

  let tree = document.getElementById('calendar-tree-children');

  accounts.ready.then(function() {
    if(accounts.accounts.length == 0) {
      var win = openDialog('chrome://boltning/content/AddAccount.xul');
      log.debug("AddAccountDialogWindow", win);
      // reject(new Error("No accounts found!"));
    } else {
      var _promises = [];

      for(var a=0;a<accounts.accounts.length;a++) {
        let account = accounts.accounts[a];
        _promises.push(account.ready);

        continue;
        /*
        account.calendars.forEach(function(calendar, path) {
          let treeitem = document.createElement('treeitem');
          let treerow = document.createElement('treerow');
          let treecell = document.createElement('treecell');
          treecell.setAttribute('label', calendar.displayname);
          treerow.appendChild(treecell);
          treeitem.appendChild(treerow);
          tree.appendChild(treeitem);

          _promises.push(calendar.refresh());
        });
        */
      }

      Promise.all(_promises).then(refreshCalendars);
    }
  });

  /// Setup button-click event for account manager dialog
  var accountButton = document.getElementById('calendar-accounts');
  accountButton.addEventListener('click', function(ev) {
    openDialog('chrome://boltning/content/AccountManagerDialog.xul');
  });
}

/*
var w2 = new SharedWorker('resource://boltning/shared.js', 'account:');

log.debug('w1', w1);
log.debug('w2', w2);

w2.port.onmessage = function(e) {
  log.debug('w2.message', e.data);
}
*/

/// ChromeWorker: https://developer.mozilla.org/en-US/docs/Web/API/ChromeWorker
