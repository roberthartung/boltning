const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;
const Cu = Components.utils;
// Imports the Services module, that allows us to use Services.<service> to use

Cu.import("resource://gre/modules/XPCOMUtils.jsm");

Components.utils.import("resource://gre/modules/Log.jsm");
let log = Log.repository.getLogger("caldavcalendar.workerthread");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

function WorkerThread() {

}

WorkerThread.prototype = {
  classID: Components.ID("{B9F1A53C-C865-4203-97D9-455E4251FD3C}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIRunnable]),
  fun: function() {
    log.debug("WorkerThread.run!");
  }
}

var components = [WorkerThread];
if ("generateNSGetFactory" in XPCOMUtils)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);  // Gecko 2.0+
else
  var NSGetModule = XPCOMUtils.generateNSGetModule(components);    // Gecko 1.9.x
