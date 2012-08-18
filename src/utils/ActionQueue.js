/*
 Based on code originating from the 'async' module - author license included here below:

 Copyright (c) 2010 Caolan McMahon

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

(function () {
  var actionQueue = {};
  var self = this;

  if (typeof module != 'undefined' && module.exports) {
    module.exports = actionQueue;
  } else {
    self.actionQueue = actionQueue;
  }

  // nextTick implementation with browser-compatible fallback
  if (typeof process === 'undefined' || !(process.nextTick)) {
    actionQueue.nextTick = function (fn) {
      setTimeout(fn, 0);
    };
  } else {
    actionQueue.nextTick = process.nextTick;
  }

  actionQueue.enqueue = function (tasks, callback) {
    callback = callback || function () {
    };
    if (!tasks.length) {
      return callback();
    }
    var wrapIterator = function (iterator) {
      return function (err) {
        if (err) {
          callback(err);
          callback = function () {
          };
        } else {
          var args = Array.prototype.slice.call(arguments, 1);
          var next = iterator.next();
          if (next) {
            args.push(wrapIterator(next));
          } else {
            args.push(callback);
          }
          actionQueue.nextTick(function () {
            iterator.apply(null, args);
          });
        }
      };
    };
    wrapIterator(actionQueue._iterator(tasks))();
  };

  actionQueue._iterator = function (tasks) {
    var makeCallback = function (index) {
      var fn = function () {
        if (tasks.length) {
          tasks[index].apply(null, arguments);
        }
        return fn.next();
      };
      fn.next = function () {
        return (index < tasks.length - 1) ? makeCallback(index + 1) : null;
      };
      return fn;
    };
    return makeCallback(0);
  };

  actionQueue.while = function (test, iterator, callback) {
    if (test()) {
      iterator(function (err) {
        if (err) {
          return callback(err);
        }
        actionQueue.while(test, iterator, callback);
      });
    } else {
      callback();
    }
  };

}());

