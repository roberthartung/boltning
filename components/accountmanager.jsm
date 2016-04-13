"use strict";

const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

// const nsIProtocolHandler = Ci.nsIProtocolHandler;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function CaldavAccountManager() {
}

CaldavAccountManager.prototype = {
  classDescription: "CalDAV Account Manager",
  contractID: "@caldavcalendar/accounts/manager;1",
  classID: Components.ID('{B9F1A53C-C865-4203-97D9-455E4251FD3C}'),
  QueryInterface: XPCOMUtils.generateQI(
    [Components.interfaces.nsIObserver,
     Components.interfaces.nsIMyInterface,
     "nsIFoo",
     "nsIBar" ]),
}

var components = [CaldavAccountManager];
if ("generateNSGetFactory" in XPCOMUtils)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory(components);  // Gecko 2.0+
else
  var NSGetModule = XPCOMUtils.generateNSGetModule(components);    // Gecko 1.9.x
