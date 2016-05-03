var fs = require('fs');
var xmlparser = require('../chrome/content/xmlparser.js');

var str = fs.readFileSync('calendar.xml', {encoding: 'utf8'});

var parser = new xmlparser.XMLParser();
var xml = parser.parseFromString(str);
console.log('xml', xml);
// console.log('obj', xml.toObject());
/*
for(var e of xml.children('multistatus')) {
  for(var r of e.children('response')) {
    for(var propstat of r.children('propstat')) {
      for(var prop of propstat.children('prop')) {
        for(var data of prop.children('calendar-data')) {
          console.log(data.childNodes[0].text);
        }
      }
    }
  }
}
*/
