/*var calendarTabType = {
  name: "calendar",
  panelId: "calendarTabPanel",
  modes: {
     calendar: {
       type: "calendar",
       openTab: function(aTab, aArgs) {
         throw "openTab";
       },
       showTab: function(aTab) {
         throw "showTab";
       }
     }
   }
}
*/

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
        // throw "shouldSwitchTo";
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
        //throw "closeTab";
      },
      saveTabState: function(aTab) {
        //throw "saveTabState";
      },
      showTab: function(aTab) {
        //throw "showTab";
      },
      persistTab: function(aTab) {
        //throw "persistTab";
      },
      restoreTab: function(aTabmail, aPersistedState) {
        //throw "restoreTab";
      },
      onTitleChanged: function(aTab) {
        //throw "onTitleChanged";
      },
      supportsCommand: function(aCommand, aTab) { return false; },
      isCommandEnabled: function(aCommand, aTab) { return false; },
      doCommand: function(aCommand, aTab) {

      },
      onEvent: function(aEvent, aTab) {
        //throw "onEvent";
      },
      //getBrowser(aTab)
    }
  },
  saveTabState: function(aTab) {
    //throw "saveTabState";
  }
};

window.addEventListener("load", function(e) {
  let tabmail = document.getElementById('tabmail');
  tabmail.registerTabType(calendarTabType);
  tabmail.registerTabMonitor(calendarTabMonitor);

  //document.getElementById("modeBroadcaster").setAttribute("mode", 'mail');
  //document.getElementById("modeBroadcaster").setAttribute("checked", "true");

  // document.getElementById("modeBroadcaster").setAttribute("mode", gCurrentMode);
  tabmail.openTab("caldavcalendar", {background: true});

  // openDialog('chrome://caldavcalendar/content/dialog.xul');
  openDialog('chrome://caldavcalendar/content/wizard.xul');
}, false);
