var startTime = new Date();

function wait(timeout) {
  console.log('Iterating...');

  var currTime = new Date();
  if (currTime - startTime < timeout) {
    wait(timeout);
  }
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  while ((new Date().getTime() - start) < milliseconds) {
    console.log('Iterating...');
  }
}

sleep(1000);
console.log('After wait...');

