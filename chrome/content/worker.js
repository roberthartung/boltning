"use strict";

/// This is a special require() for workers only!
importScripts("resource://gre/modules/workers/require.js");
importScripts("chrome://boltning/content/xmlparser.js");

var HttpCaldavRequest = {
  'request': function request(login, method, path, content, depth) {
    postMessage("HttpCaldavRequest.request" + login.hostname + '// ' + login.username);
    depth = depth || '0';
    content = content || null;
    return new Promise(function(resolve, reject) {
      let xhr = new XMLHttpRequest();
      xhr.addEventListener('load', function(ev) {
        //var parser = new DOMParser();
        //var doc = parser.parseFromString(xhr.response, "application/xml");
        var parser = new XMLParser();
        var data = parser.parseFromString(xhr.response);
        postMessage('data.length: ' + (data.length));
        // xhr.response.documentElement
        /*
        var responses = [];
        let _responses = doc.querySelectorAll('response');
        for(var i=0;i<_responses.length;i++) {
          let _response = _responses[i];
          responses.push(new Response(_response));
        }
        resolve(responses);
        */
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

onmessage = function(e) {
  // postMessage('Message received!' + e.data);
  var data = e.data;

  switch(data.type) {
    case 'login' :
      //postMessage("Message received. Login: " + data.login);
      //postMessage("Typeof Promise:" + (typeof Promise));
      try {
        findPrincipcal(data.login).then(function(response) {

        });
      }
      catch(err) {
        postMessage('ERROR :/ ' + err.message);
      }
    break;
  }
}

function findPrincipcal(login) {
  return new Promise(function(resolve, reject) {
    HttpCaldavRequest.propfind(login, '/', '<d:propfind xmlns:d="DAV:"><d:prop><d:current-user-principal/></d:prop></d:propfind>').then(function(responses) {
      //log.debug('findPrincipcal.responses:', responses);
      for(var r=0;r<responses.length;r++) {
        var response = responses[r];
        if(response.error) {
          reject(response);
        } else {
          resolve(response.contentElement.querySelector('current-user-principal').querySelector('href').textContent);
        }
      }
    });
  });
}

/*
for(var k in ctypes) {
  postMessage('ctypes.' + k);
}
*/
/*
function makeRequest() {
  var request = new XMLHttpRequest();
  request.onload = function(ev) {

  }
  request.open('REPORT');
  request.send();
}

makeRequest();
*/
/*
throw "Test";

var i = 0;
while(1) {
  i++;
  if(i % 10000000 == 0) {
    // postMessage(i);
  }
}
*/
