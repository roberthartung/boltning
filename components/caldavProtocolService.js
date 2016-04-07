const Cc = Components.classes;
const Ci = Components.interfaces;
const Cr = Components.results;

const nsIProtocolHandler = Ci.nsIProtocolHandler;

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

function TwitterProtocol() {
}

TwitterProtocol.prototype = {
  scheme: "caldav",
  protocolFlags: nsIProtocolHandler.URI_NORELATIVE |
                 nsIProtocolHandler.URI_NOAUTH |
                 nsIProtocolHandler.URI_LOADABLE_BY_ANYONE,

  newURI: function(aSpec, aOriginCharset, aBaseURI)
  {
    var uri = Cc["@mozilla.org/network/simple-uri;1"].createInstance(Ci.nsIURI);
    uri.spec = aSpec;
    return uri;
  },

  newChannel: function(aURI)
  {
    var ios = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
    /* Get twitterName from URL */
    var twitterName = aURI.spec.split(":")[1];
    var uri = ios.newURI("http://twitter.com/" + twitterName, null, null);
    var channel = ios.newChannelFromURI(uri, null).QueryInterface(Ci.nsIHttpChannel);
    /* Have the URL bar change to the new URL */
    channel.setRequestHeader("X-Moz-Is-Feed", "1", false);
    return channel;
  },
  classDescription: "Twitter Protocol Handler",
  contractID: "@mozilla.org/network/protocol;1?name=" + "t",
  classID: Components.ID('{B9F1A53C-C865-4203-97D9-455E4251FD3C}'),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIProtocolHandler])
}

if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([TwitterProtocol]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([TwitterProtocol]);
