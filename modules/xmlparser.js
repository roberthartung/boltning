"use strict";

function TagTokenizer() {

}

TagTokenizer.prototype.tokenize = function(str) {
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

///
/// ----------------------------------------------------------------------------
///

function AttributeTokenizer() {

}

AttributeTokenizer.prototype.tokenize = function(str) {
  var attributes = {};

  var i = 0;

  var name = undefined;
  var value = undefined;
  while(i < str.length) {
    var start = i;
    var end = start+1;

    while(end < str.length && str[end] != '=') {
      end++;
    }
    i = end+1;
    name = str.substr(start, end-start);

    if(str[i] == '"') {
      start = i+1;
      end = start+1;
      while(end < str.length && (str[end-1] == '\\' || str[end] != '"')) {
        end++;
      }
      //console.log('end is:', end, str[end]);
      i = end+2; // +1 to skip " and +1 for space afterwards
      value = str.substr(start, end-start);
      // console.log('attr', "'"+name+"'", "'"+value+"'");
      attributes[name] = value;
      name = undefined;
      value = undefined;
    } else {
      throw new Error("AttributeTokenizer error");
    }
  }

  if(name != undefined) {
    if(value != undefined) {
      attributes[name] = value;
    } else {
      attributes[name] = name;
    }
  }

  return attributes;
}


///
/// ----------------------------------------------------------------------------
///

Node.NODE_TEXT = 1;
Node.NODE_COMMENT = 2;
Node.NODE_ELEMENT = 3;

function Node(nodeType) {
  this.nodeType = nodeType;
  this.childNodes = new Array();
}

/// Returns all children with the given name
Node.prototype.children = function* children(tag) {
  for(var c=0; c<this.childNodes.length;c++) {
    let node = this.childNodes[c];
    if(node.tagName == tag) {
      yield node;
    }
  }
}

Node.prototype.appendChild = function children(node) {
  if(!(node instanceof Node)) {
    throw new Error("argument 1 to appendChild is not instance of Node.");
  }

  this.childNodes.push(node);
}

/// Returns an object tree
Node.prototype.toObject = function toTree() {
  if(this.nodeType == Node.NODE_TEXT) {
    return this.textContent;
  }

  var obj = {};
  this.childNodes.forEach(function(node, _) {
    var key;
    switch(node.nodeType) {
      case Node.NODE_TEXT :
        key = 'text';
      break;
      case Node.NODE_COMMENT :
        key = 'comment';
      break;
      default :
        key = node.tagName;
      break;
    }

    if(key in obj) {
      if(!(obj[key] instanceof Array)) {
        obj[key] = new Array(obj[key]);
      }
      obj[key].push(node.toObject());
    } else {
      obj[key] = node.toObject();
    }
  });
  return obj;
}

Node.prototype.text = function text() {
  if(this.nodeType == Node.NODE_TEXT) {
    return this.textContent;
  }

  var text = ''
  this.childNodes.forEach(function(node, _) {
    text += node.text();
  });
  return text;
}

///
/// ----------------------------------------------------------------------------
///

function TextNode(text) {
  Node.call(this, Node.NODE_TEXT);
  this.textContent = text;
}

TextNode.prototype = Object.create(Node.prototype, {

});
TextNode.constructor = ElementNode;

///
/// ----------------------------------------------------------------------------
///

function CommentNode(comment) {
  Node.call(this, Node.NODE_COMMENT);
  this.comment = comment;
}

CommentNode.prototype = Object.create(Node.prototype, {

});

CommentNode.constructor = ElementNode;

///
/// ----------------------------------------------------------------------------
///

var tokenizer = new AttributeTokenizer();
function ElementNode(token) {
  Node.call(this, Node.NODE_ELEMENT);
  var firstSpace = token.indexOf(' ');
  if(firstSpace == -1) {
    this.tagName = token; // .substr(1,token.length-2);
    this.attributes = {};
  } else {
    this.tagName = token.substr(0, firstSpace);
    var attributeString = token.substr(firstSpace + 1, token.length - firstSpace - 1);
    this.attributes = tokenizer.tokenize(attributeString);
  }

  var colonPos = this.tagName.indexOf(':');
  if(colonPos != -1) {
    this.tagName = this.tagName.substr(colonPos+1);
  }
}

ElementNode.prototype = Object.create(Node.prototype, {

});

ElementNode.constructor = ElementNode;

///
/// ----------------------------------------------------------------------------
///

function XMLParser(options) {
  this.options = options || {removeComments: true, removeWhitespace: true};
  this.tokenizer = new TagTokenizer();
}

XMLParser.prototype.parseFromString = function(string) {
  var _this = this;
  // var children = [];
  var root = new Node();
  var stack = [];
  var tokens = this.tokenizer.tokenize(string);

  var ptr = root;

  tokens.forEach(function(token) {
    if(token[0] == '<') {
      if(token[1] === '!') {
        if(token[2] == '[') {
          /// TODO(rh): Remove CDATA
          ptr.appendChild(new TextNode(token));
        } else if(_this.options.removeComments == undefined || !_this.options.removeComments) {
          ptr.appendChild(new CommentNode(token));
        }
      }
      else if(token[1] == '/') { // </ ..>
        // Closing tag
        ptr = stack.pop();
      }
      else if(token[token.length-2] == '/') { // < /> tags
        var node = new ElementNode(token.substr(1, token.length-3));
        ptr.appendChild(node); // token.substr(1,token.length - 3)
      } else if(token[token.length-2] == '?') { // <?xml ?> tag
        // META INFORMATION
        // ptr.push(token.substr(1,token.length - 3));
      } else { // <...>
        // Opening tag
        var node = new ElementNode(token.substr(1, token.length-2));
        ptr.appendChild(node);

        /// push old ptr and set new one
        stack.push(ptr);
        ptr = node;
        // token.substr(1,token.length - 2)
      }
    } else {
      var trimmed_token = token.trim();
      if(trimmed_token.length > 0 || !_this.options.removeWhitespace) {
        ptr.appendChild(new TextNode(token));
      }
    }
  });

  return root;
}

/// TODO(rh): Provide/Implement toObject() method to navigate like this:
/// root.multistatus.response[0]...

if(typeof module != 'undefined') {
  module.exports = {
    XMLParser: XMLParser
  }
}
