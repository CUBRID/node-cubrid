module.exports = Queue;

function Queue() {
	this.items = [];
};

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

		var self = this;

		// Every item is a function which calls the callback
		// we pass when done.
		this.currentItem(function () {
			self.currentItem = null;

			self.process();
		});
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
