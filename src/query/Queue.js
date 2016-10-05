module.exports = Queue;

function Queue() {
  this.items = [];
}

Queue.prototype.push = function (item) {
  this.items.push(item);
  this.process();
};

Queue.prototype.unshift = function (item) {
  this.items.unshift(item);
  this.process();
};

Queue.prototype.process = function () {
  if (!this.currentItem && this.items.length) {
    // Get the front item.
    this.currentItem = this.items.shift();

    /*
    * From http://stackoverflow.com/a/15349865/556678.
    * Use `setImmediate` if you want to queue the function
    * behind whatever I/O event callbacks that are already
    * in the event queue. Use `process.nextTick` to effectively
    * queue the function at the head of the event queue so
    * that it executes immediately after the current function
    * completes.
    * So in a case where you're trying to break up a long
    * running, CPU-bound job using recursion, you would now
    * want to use `setImmediate` rather than `process.nextTick`
    * to queue the next iteration as otherwise any I/O event
    * callbacks wouldn't get the chance to run between iterations.
    * */
		setImmediate(() => {
      // Every item is a function which calls the callback
      // we pass when done.
      this.currentItem(() => {
        this.currentItem = null;

        this.process();
      });
    })
  }
};

Queue.prototype.getDepth = function () {
  return this.items.length + (this.currentItem ? 1 : 0);
};

Queue.prototype.isEmpty = function () {
  return this.items.length == 0 && !this.currentItem;
};

Queue.prototype.empty = function () {
  // The most efficient way to empty an array is the following
  // as stated in http://stackoverflow.com/a/1232046/556678.
  this.items.length = 0;
  // Remember, that this functions will remove all pending
  // requests, but does not terminate the running query.
};
