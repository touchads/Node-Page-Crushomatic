(function(undefined) {
	
	// compatibility
	if (!Function.prototype.bind) {
		Function.prototype.bind = function (oThis) {
			if (typeof this !== "function") {
				// closest thing possible to the ECMAScript 5 internal IsCallable function
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}
			
			var aArgs = slice.call(arguments, 1),
				fToBind = this,
				fNOP = function () {},
				fBound = function () {
					return fToBind.apply(this instanceof fNOP
							? this : oThis || window,
							aArgs.concat(slice.call(arguments)));
				};
			
			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();
			
			return fBound;
		};
	}
	
	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function(callback, thisArg) {
			var T, k;
			if (this == null) {
				throw new TypeError(" this is null or not defined");
			}
			var O = Object(this);
			var len = O.length >>> 0;
			
			if ({}.toString.call(callback) != "[object Function]") {
				throw new TypeError(callback + " is not a function");
			}
			
			if (thisArg) {
				T = thisArg;
			}
			k = 0;
			
			while (k < len) {
				var kValue;
				if (k in O) {
					kValue = O[ k ];
					callback.call(T, kValue, k, O);
				}
				k++;
			}
		};
	}
	
	
	//The promise of a an action to be fulfilled with methods to respond to that action after it is finished. The action
	// may happen synchronously or asynchronously.
	
	var slice = Array.prototype.slice;
	
	function Promise() {
		
	}
		
	// Allows responding to an action once it is fulfilled or has failed. Allows responding to progress updates as well.
	// A promise may or may not choose to provide progress updates.
	//
	// @param {Function} failedHandler A function which will be called with the error of the promise when failed.
	// @param {Function} progressHandler A function which will be called with progress information.
	// @return {Promise} A new promise that provides the results of the fulfilledHandler or failedHandler. If these
	// handlers return a promise then the new promise will wait until their promise is finished.
	
	Promise.prototype.then = function abstractThen(fulfilledHandler, failedHandler, progressHandler) {
		throw new TypeError('The Promise base class is abstract, this function is overwritten by the promise\'s deferred object');
	};
	
	
	// Specific method for only passing a fulfilled handler.
	
	Promise.prototype.whenFulfilled = function whenFulfilled(handler) {
		return this.then(handler);
	};
	
	
	// Specific method for only passing a failed handler.
	
	Promise.prototype.whenFailed = function whenFailed(handler) {
		return this.then(null, handler);
	};
	
	
	Promise.prototype.whenFinished = function whenFinished(handler) {
		return this.then(handler, handler);
	};
	
	
	
	// Specific method for only passing a progress handler.
	
	Promise.prototype.whenProgress = function whenProgress(handler) {
		return this.then(null, null, handler);
	};
	
	
	
	// Allows the cancellation of a promise. Some promises are cancelable and so this method may be created on
	// subclasses of Promise to allow a consumer of the promise to cancel it.
	// 
	// @return {String|Error} Error string or object to provide to failedHandlers
	
	Promise.prototype.cancel = function cancel() {
		return 'Promise canceled';
	};
	
	
	// A shortcut to return the value of a property from the returned promise results. The same as providing your own
	// <code>promise.then (obj) -> obj.propertyName</code> method.
	// 
	// @param {String} propertyName The name of the property to return
	// @return {Promise} The new promise for the property value
	
	Promise.prototype.get = function get(propertyName) {
		return this.then(function get() {
			var args = packageArgs(arguments);
			if (args[0]) args[0] = args[0][propertyName];
			return args;
		});
	};
	
	
	
	// A shortcut to set the property from the returned promise results to a certain value. The same as providing your
	// own <code>promise.then (obj) -> obj.propertyName = value; return obj</code> method. This returns the
	// original promise results after setting the property as opposed to <code>put</code> which returns the value which
	// was set.
	// 
	// @param {String} propertyName The name of the property to set
	// @param {mixed} value The value for the property to be set to
	// @return {Promise} A new promise with the original results
	
	Promise.prototype.set = function set(propertyName, value) {
		return this.then(function set() {
			var args = packageArgs(arguments);
			if (args[0]) args[0][propertyName] = value;
			return args;
		});
	};
	
	
	
	// A shortcut to set the property from the returned promise results to a certain value. The same as providing your
	// own <code>promise.then (obj) -> return obj.propertyName = value</code> method. This returns the new value
	// after setting the property as opposed to <code>set</code> which returns the original promise results.
	// 
	// @param {String} propertyName The name of the property to set
	// @param {mixed} value The value for the property to be set to
	// @return {Promise} A new promise with the value
	
	Promise.prototype.put = function put(propertyName, value) {
		return this.then(function put() {
			var args = packageArgs(arguments);
			if (args[0]) args[0] = args[0][propertyName] = value;
			return args;
		});
	};
	
	
	
	// A shortcut to call a method on the returned promise results. The same as providing your own
	// <code>promise.then (obj) -> obj.functionName(); return obj</code> method. This returns the original results
	// after calling the function as opposed to <code>call</code> which returns the function's results.
	// 
	// @param {String} functionName The name of the function to call
	// @param {mixed} [...arguments] Zero or more arguments to pass to the function
	// @return {Promise} A new promise with the original results
	
	Promise.prototype.run = function run(functionName/*, params...*/) {
		var params = slice.call(arguments, 1);
		return this.then(function run() {
			var args = packageArgs(arguments), obj, fn;
			if (obj = args[0] && typeof (fn = obj[functionName]) === 'function')
				fn.apply(obj, params);
			return args;
		});
	};
	
	
	
	// A shortcut to call a method on the returned promise results. The same as providing your own
	// <code>promise.then (obj, rest...) -> obj.functionName rest...</code> method. This returns the function's results
	// after calling the function as opposed to <code>run</code> which returns the original results.
	// 
	// @param {String} functionName The name of the function to call
	// @param {mixed} [...arguments] Zero or more arguments to pass to the function
	// @return {Promise} A new promise with the original results
	
	Promise.prototype.call = function call(functionName/*, params...*/) {
		var params = slice.call(arguments, 1);
		return this.then(function call() {
			var args = packageArgs(arguments), obj, fn;
			if (obj = args[0] && typeof (fn = obj[functionName]) === 'function')
				args[0] = fn.apply(obj, params);
			return args;
		});
	};
	
	// Add array methods onto promise for async array handling
	function addMethod(method) {
		Promise.prototype[method] = function () {
			var args = slice.call(arguments);
			return this.then(function (object) {
				var fn = object[method];
				if (typeof object[method] === 'function')
					var result = fn.apply(object, args);
				return result !== undefined ? result : object;
			});
		};
	}
	
	['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift', 'filter', 'forEach', 'every', 'map', 'some'].forEach(addMethod);
	
	
	// Combines one or more methods behind a promise. If the methods return a promise <code>after</code> will wait until they
	// are finished to complete its promise.
	// 
	// Example:
	// <code>after([method1(), method2()]).then(function (results) { // handle... })</code>
	// both methods have finished and the results from their promises are available
	
	function after(params) {
		var deferred = new Deferred();
		
		params = slice.call(params);
		var count = params.length;
		var failed = false;
		function failCallback(value) {
			failed = true;
			return value;
		}
		
		function createCallback(index) {
			return function() {
				var results = slice.call(arguments), value;
				params[index] = value = (results.length > 1 ? results : results[0]);
				
				if (--count === 0) {
					if (failed)
						deferred.fail.apply(deferred, params);
					else
						deferred.fulfill.apply(deferred, params);
				}
				
				return value;
			}
		}
		
		
		params.forEach(function(obj, index) {
			if (obj && typeof obj.then === 'function')
				obj.then(createCallback(index), failCallback);
			else
				--count;
		});
		
		if (count === 0) // if all the calls are already finished
			deferred.fulfill.call(deferred, params);
		
		return deferred.promise;
	}
	
	
	// Combines one or more methods behind a promise. If the methods return a promise <code>when</code> will wait until they
	// are finished to complete its promise.
	// 
	// Example:
	// <code>when(method1(), method2()).then(function (result1, result2) { // handle... })</code>
	// both methods have finished and the results from their promises are available
	
	function when() {
		return after(slice.call(arguments)).then(function (results) {
			return packageArgs(results);
		});
	}
	
	
	
	// Allows returning multiple values from a method that will be passed in as arguments in any methods handling the
	// promise.
	// @param ...arguments to be passed in
	
	function args() {
		var params = slice.call(arguments);
		params.isArgs = true;
		return params;
	}
	
	// package an arguments object up as an "args" object for returning multiple values from a promise handler
	
	function packageArgs(args) {
		var params = slice.call(args);
		params.isArgs = true;
		return params;
	}
	
	
	
	
	// Represents a deferred action with an associated promise.
	// 
	// @param promise Allow for custom promises to be used with deferred.
	
	function Deferred(promise) {
		if (!promise) promise = new Deferred.Promise;
		this.promise = promise;
		this.status = 'unfulfilled';
		this.progressHandlers = [];
		this.handlers = [];
		var deferred = this;
		this.then = this.then.bind(this);
		this.fulfill = this.fulfill.bind(this);
		this.fail = this.fail.bind(this);
		this.progress = this.progress.bind(this);
		
		// wrap the promises' cancel function so that it will fail the deferred after being called
		if (promise.cancel) {
			cancel = promise.cancel;
			promise.cancel = function cancel() {
				var params = slice(arguments);
				var error = cancel.apply(promise, params);
				deferred.fail(error);
			};
		}
		
		// overwrite the promise's then with the deferred's for deferred to handle
		promise.then = this.then;
	}
	
	
	// handle a promise whether it was fulfilled, failed, and/or its progress
	Deferred.prototype.then = function then(fulfilledHandler, failedHandler, progressHandler) {
		if ( (fulfilledHandler && typeof fulfilledHandler !== 'function') || (failedHandler && typeof failedHandler !== 'function') )
			throw new Error('Handlers must be functions');
		
		if (typeof progressHandler === 'function')
			this.progressHandlers.push(progressHandler);
		
		var nextDeferred = new Deferred();
		var handler = {
			fulfilled: fulfilledHandler,
			failed: failedHandler,
			nextDeferred: nextDeferred
		};
		
		if (this.finished())
			notify(this, handler);
		else
			this.handlers.push(handler);
		
		return nextDeferred.promise;
	};
	
	
	// whether or not the deferred is finished processing
	Deferred.prototype.finished = function finished() {
		return this.status != 'unfulfilled';
	};
	
	
	// successfully fulfill this deferred's promise.
	Deferred.prototype.fulfill = function fulfill(args) {
		var params = (args && args.isArgs) ? args : slice.call(arguments);
		finish(this, 'fulfilled', params);
	};
	
	
	// fail this deferred's promise
	Deferred.prototype.fail = function fail(args) {
		var params = (args && args.isArgs) ? args : slice.call(arguments);
		finish(this, 'failed', params);
	};
	
	
	// update progress on this deferred's promise
	Deferred.prototype.progress = function progress(args) {
		var params = (args && args.isArgs) ? args : slice.call(arguments), promise = this.promise;
		this.progressHandlers.forEach(function(handler) {
			handler.apply(promise, params);
		});
	};
	
	
	// set a timeout for this deferred to auto-fail
	Deferred.prototype.timeout = function timeout(milliseconds, error) {
		clearTimeout(this._timeout);
		var deferred = this;
		
		this._timeout = setTimeout(function() {
			deferred.fail(error || new Error('Operation timed out'));
		}, milliseconds);
	};
	
	
	// reset this deferred dropping all handlers and resetting status
	Deferred.prototype.reset = function reset() {
		this.status = 'unfulfilled';
		this.progressHandlers = [];
		this.handlers = [];
	};
	
	
	// private method to finish the promise
	function finish(deferred, status, results) {
		if (deferred.status !== 'unfulfilled') return;  // throw new Error('Deferred has already been ' + this.status);
		clearTimeout(deferred._timeout);
		deferred.status = status;
		deferred.results = results;
		deferred.handlers.forEach(function(handler) {
			notify(deferred, handler);
		});
	}
	
	
	// private method to notify the handler
	function notify(deferred, handler) {
		var results = deferred.results;
		var method = handler[deferred.status];
		var nextDeferred = handler.nextDeferred;
		var fn;
		
		// pass along the error/result
		if (!method) {
			fn = nextDeferred[deferred.status.slice(0, -2)];
			fn.apply(nextDeferred, results);
			return;
		}
		
		
		// run the then
		var nextResult = method.apply(deferred.promise, results);
		
		if (nextResult && typeof nextResult.then === 'function')
			nextResult.then(nextDeferred.fulfill, nextDeferred.fail);
		else if (nextResult instanceof Error)
			nextDeferred.fail(nextResult);
		else if (nextResult === undefined)
			// pass along the error/result
			nextDeferred[deferred.status.slice(0, -2)].apply(nextDeferred, results);
		else
			nextDeferred.fulfill(nextResult);
	}
	
	
	Deferred.Promise = Promise; // default promise implementation

	var promises;
	
	// if not a module set 'promises' on the global scope
	if (typeof exports !== 'undefined') {
		promises = exports;
	} else {
		this.promises = promises = {};
	}
	
	promises.Deferred = Deferred;
	promises.Promise = Promise;
	promises.after = after;
	promises.when = when;
	promises.args = args;
	
	// call a method that takes a callback returning the promise
	promises.wrap = function wrap(method, opts) {
		if (typeof method !== 'function')
			throw new Error('Method for wrapping is not a function');
		
		opts = opts || {};
		return function wrapped() {
			var args = slice.call(arguments);
			var deferred = new Deferred(opts.promise);
			if (typeof args[args.length - 1] === 'function')
				var callback = args.pop();
			
			args.push(function(err) {
				var results = slice.call(arguments, 1);
				if (callback) callback.apply(null, arguments);
				if (err) deferred.fail(err);
				else deferred.fulfill.apply(deferred, results);
			});
			
			method.apply(this, args);
			if (opts.timeout) deferred.timeout(opts.timeout);
			return deferred.promise;
		};
	};
	
	// shortcuts to create synchronous failed and fulfilled promises.
	promises.fulfilled = function fulfilled(result, promise) {
		var deferred = new Deferred(promise);
		deferred.fulfill(result);
		return deferred.promise;
	};
	
	promises.failed = function failed(err, promise) {
		var deferred = new Deferred(promise);
		deferred.fail(err);
		return deferred.promise;
	};

})();