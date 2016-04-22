/// Utility class for the boltning calendar

var EXPORTED_SYMBOLS = ['DateTimeUtility'];

Components.utils.import("resource://gre/modules/Log.jsm");
let log = Log.repository.getLogger("boltning.util");
log.level = Log.Level.Debug;
log.addAppender(new Log.ConsoleAppender(new Log.BasicFormatter()));

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
