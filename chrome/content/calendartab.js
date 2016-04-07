// Imports the Services module, that allows us to use Services.<service> to use
Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Log.jsm");

let log = Log.repository.getLogger("caldavcalendar.calendartab");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));


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


  tabmail.openTab("caldavcalendar", {background: true});

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

      //var categoryManager = Components.classes["@mozilla.org/categorymanager;1"].getService(Components.interfaces.nsICategoryManager);
      //categoryManager.addCategoryEnty("protocol", "caldav", "caldavcalendar.proto.caldav", false /*must be false*/, true);

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
      log.debug(Services.logins.getAllLogins({}));
    }
  }, 100);
  //

  //Services.accounts.createAccount("someuser", "someid");


  // openDialog('chrome://caldavcalendar/content/dialog.xul');
  // openDialog('chrome://caldavcalendar/content/wizard.xul');
}, false);
