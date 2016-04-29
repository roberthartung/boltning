/// THIS TEST IS NOT WORKING!!!

var fs = require('fs');
var str = fs.readFileSync('calendar.xml', {encoding: 'utf8'});

var parser = new XMLParser();
// var xml = parser.parseFromString('  <foo>  <bar> <test/><test/> <!-- foobar? --> <![CDATA[ Inhalt <> foobar]]> ]]> Testing... </bar>  </foo>  <!-- ending comment-->   ');
var xml = parser.parseFromString(str);
console.log('xml', xml[2][2][4]);
