onmessage = function(e) {
  console.log('Message received from main script');
  var workerResult = 'Result: ' + (e.data[0] * e.data[1]);
  console.log('Posting message back to main script');
  postMessage(workerResult);
}

function makeRequest() {
  var request = new XMLHttpRequest();
  request.onload = function(ev) {

  }
  request.open('REPORT');
  request.send();
}

makeRequest();
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
