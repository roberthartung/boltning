Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import("resource://gre/modules/Log.jsm");

var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Components.interfaces.nsILoginInfo, "init");

let log = Log.repository.getLogger("caldavcalendar.AddAccount");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

function CreateAccount() {
  var loginInfo = new nsLoginInfo(document.getElementById('serverurl').value, // hostname
    null, // formSubmitURL
    document.getElementById('accountname').value, // httprealm
    document.getElementById('username').value, // username
    document.getElementById('userpassword').value, // password
    "", "");
  
  Services.logins.addLogin(loginInfo);

  return true;
}

function Cleanup() {
  document.getElementById('serverurl').value = '';
  document.getElementById('accountname').value = '';
  document.getElementById('username').value = '';
  document.getElementById('userpassword').value = '';
  return true;
}
