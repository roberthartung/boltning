function Tokenizer() {

}

Tokenizer.prototype.tokenize = function(str) {
  var tokens = [];

  var i = 0;

  while(i < str.length) {
    /// Check for comment
    // <?xml version="1.0" encoding="utf-8" ?>
    if((i+1) < str.length && str[i] == '<' && str[i+1] == '?') {
      var start = i; // <!--
      var end = start+2;
      while(end < str.length && (str[end-1] != '?' || str[end] != '>')) {
        end++;
      }
      tokens.push(str.substr(start, end-start+1));
      i = end+1;
    }
    else if((i+3) < str.length && str[i] == '<' && str[i+1] == '!' && str[i+2] == '-' && str[i+3] == '-') {
      var start = i; // <!--
      var end = start+4;
      while(end < str.length && (str[end-2] != '-' || str[end-1] != '-' || str[end] != '>')) {
        end++;
      }
      tokens.push(str.substr(start, end-start+1));
      i = end+1;
    }
    else if((i+8) < str.length && str[i] == '<' && str[i+1] == '!' && str[i+2] == '[' && str[i+3] == 'C' && str[i+4] == 'D' && str[i+5] == 'A' && str[i+6] == 'T' && str[i+7] == 'A' && str[i+8] == '[') {
      var start = i; // <![CDATA[
      var end = start+9;
      while(end < str.length && (str[end-2] != ']' || str[end-1] != ']' || str[end] != '>')) {
        end++;
      }
      tokens.push(str.substr(start, end-start+1));
      i = end+1;
    }
    else if(str[i] == '<') {
      var start = i;
      var end = i+1;
      while(str[end] != '>' && end < str.length) {
        end++;
      }
      tokens.push(str.substr(start, end-start+1));
      i = end+1;
    } else {
      var start = i;
      var end = i+1;
      while(str[end] != '<' && end < str.length) {
        end++;
      }
      tokens.push(str.substr(start, end-start));
      i = end;
    }
  }

  return tokens;
}

function XMLParser() {
  this.tokenizer = new Tokenizer();
}

XMLParser.prototype.parseFromString = function(string) {
  var children = [];
  var stack = [];
  var tokens = this.tokenizer.tokenize(string);

  var ptr = children;

  tokens.forEach(function(token) {
    if(token[0] == '<') {
      if(token[1] == '/') { // </ ..>
        // Closing tag
        ptr = stack.pop();
      }
      else if(token[token.length-2] == '/') { // < /> tags
        ptr.push(token.substr(1,token.length - 3));
      } else if(token[token.length-2] == '?') { // <?xml ?> tag
        ptr.push(token.substr(1,token.length - 3));
      } else { // <...>
        // Opening tag

        var child = [];
        ptr.push(child);
        /// push old ptr and set new one
        stack.push(ptr);
        ptr = child;

        ptr.push(token.substr(1,token.length - 2));
      }
    } else if(token.trim() != "\n") {
      ptr.push(token);
    }
  });

  return children;
}

var fs = require('fs');
var str = fs.readFileSync('../../calendar.xml', {encoding: 'utf8'});

var parser = new XMLParser();
// var xml = parser.parseFromString('  <foo>  <bar> <test/><test/> <!-- foobar? --> <![CDATA[ Inhalt <> foobar]]> ]]> Testing... </bar>  </foo>  <!-- ending comment-->   ');
var xml = parser.parseFromString(str);
console.log('xml', xml[2][2][4]);
