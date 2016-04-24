"use strict";

Components.utils.import("resource://gre/modules/Log.jsm");
Components.utils.import("resource://boltningmodules/accountmanager.jsm");

let log = Log.repository.getLogger("boltning.calendartab");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

function onLoad() {
  // log.debug("test", document.getElementById('accountmanagerdialog'));
  log.debug('load', typeof accounts);
}

function onAccept() {
  log.debug('accept');
  return true;
}

function onCancel() {
  log.debug('cancel');
  return true;
}
