/// Utility class for the boltning calendar

var EXPORTED_SYMBOLS = ['DateTimeUtility', 'HttpCaldavRequest'];

Components.utils.import("resource://gre/modules/Log.jsm");
let log = Log.repository.getLogger("boltning.util");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

/// In jsm several DOM classes are not directly available. Import them here:
var XMLHttpRequest = Components.Constructor("@mozilla.org/xmlextras/xmlhttprequest;1",
  "nsIXMLHttpRequest");
var XMLSerializer = Components.Constructor("@mozilla.org/xmlextras/xmlserializer;1",
  "nsIDOMSerializer");

var DateTimeUtility = {
  COMPARE_SMALLER: -1,
  COMPARE_EQUAL: 0,
  COMPARE_LARGER: 1,

  OVERLAP_NONE: 0,
  OVERLAP_CONTAIN: 1,
  OVERLAP_FULL: 2,
  OVERLAP_END: 3,
  OVERLAP_START: 4,

  /// Compares to date ranges. Given by [start1, end1] and [start2, end2]
  /// Returned is the comparison of range1 to range2
  ///
  /// Following cases can be identified:
  /// -----------------------------------------------------> Time, t
  ///                   [s1 ############# e1] <- event
  /// 1)            |s2 ----#############---- e2|
  /// 2)                    |s2 ###### e2|
  /// 3)        |s2 --------## e2|
  /// 4)                           |s2 ##---- e2|
  /// 5) -----e2|
  /// 6)                                           |s2------

  compareRangesByDate: function compareRangesByDate(start1, end1, start2, end2) {
    let compareStart2End1   = start2.compare(end1);
    let compareStart2Start1 = start2.compare(start1);
    let compareEnd2Start1   = end2.compare(start1);
    let compareEnd2End1     = end2.compare(end1);

    //log.debug("compare", [start1, end1, start2, end2]);

    /// Cases 5) and 6)
    if(compareEnd2Start1 == this.COMPARE_SMALLER     || compareStart2End1    == this.COMPARE_LARGER ||
       compareEnd2Start1 == this.COMPARE_EQUAL       || compareStart2End1    == this.COMPARE_EQUAL) {
      //log.debug('none');
      return this.OVERLAP_NONE;
    }

    /// Case 1)
    if( (compareStart2Start1 == this.COMPARE_SMALLER || compareStart2Start1  == this.COMPARE_EQUAL) &&
        (compareEnd2End1 == this.COMPARE_LARGER      || compareEnd2End1      == this.COMPARE_EQUAL) ) {
      //log.debug('contain');
      return this.OVERLAP_CONTAIN;
    }

    // Case 2)
    if( compareStart2Start1 == this.COMPARE_LARGER   && compareEnd2End1      == this.COMPARE_SMALLER ) {
      //log.debug('full');
      return this.OVERLAP_FULL;
    }

    // Case 3)
    if( (compareStart2Start1 == this.COMPARE_SMALLER ||compareStart2Start1  == this.COMPARE_EQUAL) &&
        (compareEnd2Start1   == this.COMPARE_LARGER/*  || compareEnd2Start1    == this.COMPARE_EQUAL*/) &&
        (compareEnd2End1     == this.COMPARE_SMALLER || compareEnd2End1      == this.COMPARE_EQUAL)) {
     //log.debug('end');
     return this.OVERLAP_END;
    }

    // Case 4)
    if( (compareEnd2End1     == this.COMPARE_LARGER  || compareEnd2End1      == this.COMPARE_EQUAL) &&
        (compareStart2Start1 == this.COMPARE_LARGER  /*|| compareStart2Start1  == this.COMPARE_EQUAL*/) &&
        (compareStart2End1   == this.COMPARE_SMALLER || compareStart2End1    == this.COMPARE_EQUAL)) {
      //log.debug('start');
      return this.OVERLAP_START;
    }

    throw "ERROR in overlap range check";
    //return this.OVERLAP_NONE;
  }
};

/*
 <response>
  <href>/caldav.php/boltning/calendar/</href>
  <propstat>
   <prop>
    <C:getctag>"afb61e921107fd7f5d0c2ff05cad54c1"</C:getctag>
    <displayname>boltning boltning calendar</displayname>
    <A:calendar-color>#ef1f1f</A:calendar-color>
    <resourcetype>
     <collection/>
     <C1:calendar/>
    </resourcetype>
   </prop>
   <status>HTTP/1.1 200 OK</status>
  </propstat>
  <propstat>
   <prop>
    <C1:calendar-description/>
    <A:calendar-order/>
    <C1:calendar-free-busy-set/>
   </prop>
   <status>HTTP/1.1 404 Not Found</status>
  </propstat>
 </response>
*/

function Response(xml) {
  this.error = true;
  this.contentElement = null;
  this.href = xml.querySelector('href').textContent;
  let propstatElements = xml.querySelectorAll('propstat');
  for(var p=0; p<propstatElements.length;p++) {
    var propstatElement = propstatElements[p];
    var statusElement = propstatElement.querySelector('status');
    if(statusElement.textContent.trim() == 'HTTP/1.1 200 OK') {
      this.error = false;
      this.contentElement = propstatElement.querySelector('prop');
      break;
    }
  }

  //var ns = new XMLSerializer();
  //var ss= ns.serializeToString(xml);
  //log.debug('Response', ss);

  // this.xml = xml;
  // Multiple <propset>
}

var HttpCaldavRequest = {
  'request': function request(login, method, path, content, depth) {
    depth = depth || '0';
    content = content || null;
    return new Promise(function(resolve, reject) {
      var xhr = new XMLHttpRequest();
      //let xhr = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Components.interfaces.nsIXMLHttpRequest);
      xhr.responseType = 'document';
      xhr.addEventListener('load', function(ev) {
        var responses = [];
        let _responses = xhr.response.documentElement.querySelectorAll('response');
        for(var i=0;i<_responses.length;i++) {
          let _response = _responses[i];
          responses.push(new Response(_response));
        }
        resolve(responses);
      });
      xhr.addEventListener('error', function(ev) {
        reject(new Error('Unknown error for HttpCaldavRequest.request'));
      });
      xhr.open(method, login.hostname+path, true, login.username, login.password);
      /// Headers after open(), but before send()
      xhr.setRequestHeader('Depth', depth);
      xhr.setRequestHeader('Prefer', 'return-minimal');
      if(content) {
        xhr.setRequestHeader('Content-Type', 'application/xml; charset=utf-8');
      }
      xhr.send(content);
    });
  },
  'propfind': function propfind(login, path, content, depth) {
    return this.request(login, 'PROPFIND', path, content, depth);
  },
  'report': function report(login, path, content, depth) {
    return this.request(login, 'REPORT', path, content, depth);
  }
};
