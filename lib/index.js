var fs = require('fs');
var path = require('path');
var uglifycss = require('uglifycss');
var uglify = require('uglify-js');
var request = require('request');
var promises = require('./promises');
var gzbz2 = require('gzbz2');
var gzip = new gzbz2.Gzip;

var gzbz2deflate = function(html, cb) {
	try {
		var gzdata1 = gzip.deflate(html);
		var gzdata2 = gzip.end();
		cb(null,gzdata1 + gzdata2);
	}
	catch(err) {
		cb(err);
	}
};

var readFile = promises.wrap(fs.readFile);
var gzipHtml = promises.wrap(gzbz2deflate);
var requestUrl = promises.wrap(function(options, callback) {
	request(options, function(err, response, body) {
		callback(err, body);
	});
});



var urlExp = /^https?:\/\//;

module.exports = exports = function crush(url, options, cb) {
	if (typeof options === 'function') {
		cb = options;
		options = {};
	} else if (!options) {
		options = {};
	}
	
	if (!options.dir) {
		options.dir = path.dirname(url);
		if (options.root) options.dir = path.relative(options.root, options.dir) || '.';
		url = path.basename(url);
	}
	
	return loadResource(url, options, 'utf8').then(function(html) {
		exports.crushHTML(html, options, cb);
	}, function(err) {
		if (cb) cb(err);
	});
};


exports.crushHTML = function crushHTML(html, options, cb) {
	if (typeof options === 'function') {
		cb = options;
		options = {};
	} else if (!options) {
		options = {};
	}
	
	if (!options.dir) options.dir = '.';
	
	return processCSS(html, options)
	.then(processScripts)
	.then(processHTML)
	.then(compressHTML)
	.then(function(html) {
		if (cb) cb(null, html);
		return html;
	}, function(err) {
		if (cb) cb(err);
	});
};




function loadResource(url, options, encoding) {
	
	if (urlExp.test(url)) {
		return requestUrl({ uri: url, encoding: encoding });
	} else if (options.root && urlExp.test(options.root)) {
		url = path.normalize(options.root + '/' + options.dir + '/' + url);
		return requestUrl({ uri: url, encoding: encoding });
	} else {
		var file;
		if (url.slice(0, 1) === '/' && options.root) file = options.root + url;
		else file = path.normalize(options.dir + '/' + url);
		return readFile(file, encoding);
	}
}

var cssUrlAllExp = /url\([ '"]*([^)]+?)[ '"]*\)/g;
function processCSSText(css, options) {
	css = uglifycss.processString(css);
	if (typeof options === 'undefined') {
		options = {}
	}
	var urls = {}, match; // we want unique urls, no need to load the same image twice
	while (match = cssUrlAllExp.exec(css)) urls[match[1]] = true;
	
	var pending = Object.keys(urls).map(function(url) {
		var urlRpl = new RegExp(escapeExp(url), 'g');
		return loadResource(url, options).then(function(buffer) {
			css = css.replace(urlRpl, 'data:image/' + url.split('.').pop() + ';base64,' + buffer.toString('base64'));
		});
	});
	
	if (!pending.length) return promises.fulfilled(css);
	
	return promises.after(pending).then(function(results) {
		return css;
	});
}

var cssTagExp = /<(link)[^>]*rel="stylesheet"[^>]*>\s*|\s*<style[^>]*>([\s\S]*?)<\/style>/g;
var cssLinkExp = /<link[^>]*href="([^"]*)"[^>]*>/;
function processCSS(html, options) {
	var match;
	var pending = [];
	var newHTML = html;
	if (typeof options === 'undefined') {
		options = {}
	}
	while (match = cssTagExp.exec(html)) pending.push(match);
	
	pending.forEach(function(match, i) {
		var tag = match[0];
		var css = match[2];
		
		if (match[1] === 'link') {
			match = tag.match(cssLinkExp);
			if (match) {
				var cssUrl = match[1];
				pending[i] = loadResource(cssUrl, options, 'utf8').then(function(css) {
					// load image resources relative to the css file
					var opts = clone(options);
					if (urlExp.test(cssUrl)) {
						opts.dir = '.';
						opts.root = path.dirname(cssUrl);
					} else {
						opts.dir = path.dirname(path.normalize(opts.dir + '/' + cssUrl));
					}
					return processCSSText(css, opts).then(function(css) {
						newHTML = newHTML.replace(tag, '<style type="text/css">' + css.replace(/\$/g, '$$$$') + '</style>');
					});
				});
			}
		} else {
			pending[i] = processCSSText(css).then(function(css) {
				newHTML = newHTML.replace(tag, '<style type="text/css">' + css.replace(/\$/g, '$$$$') + '</style>');
			});
		}
	});
	
	if (!pending.length) return promises.fulfilled(newHTML);
	
	return promises.after(pending).then(function(results) {
		return promises.args(newHTML, options);
	});
}

var scriptTagExp = /<script[^>]*>([\s\S]*?)<\/script>/g;
var scriptTagSrcExp = /<script[^>]*?src="([^"]*)"[^>]*>[\s\S]*<\/script>/;
function processScripts(html, options) {
	var match;
	var pending = [];
	var newHTML = html;
	if (typeof options === 'undefined') {
		options = {}
	}
	while (match = scriptTagExp.exec(html)) pending.push(match);
	
	pending.forEach(function(match, i) {
		var tag = match[0];
		var js = match[1];
		var srcMatch = tag.match(scriptTagSrcExp);
		
		if (srcMatch) {
			var url = srcMatch[1];
			pending[i] = loadResource(url, options, 'utf8').then(function(js) {
				newHTML = newHTML.replace(tag, '<script type="text/javascript">' + uglify(js).replace(/\$/g, '$$$$') + '</script>');
			});
		} else {
			newHTML = newHTML.replace(tag, '<script type="text/javascript">' + uglify(js).replace(/\$/g, '$$$$') + '</script>');
		}
	});
	
	if (!pending.length) return promises.fulfilled(newHTML);
	
	return promises.after(pending).then(function(results) {
		return promises.args(newHTML, options);
	});
}

var imgTagExp = /<img[^>]+src="([^"]+)"[^>]*>/g;
var imgSrcExp = /(<img[^>]+src=")[^"]+("[^>]*>)/;
function processHTML(html, options) {
	html = minifyHTML(html, options);
	if (typeof options === 'undefined') {
		options = {}
	}
	var urls = {}, url, tag, match; // we want unique urls, no need to load the same image twice
	while (match = imgTagExp.exec(html)) {
		tag = match[0];
		url = match[1];
		if (urls.hasOwnProperty(url)) urls[url].push(tag);
		else urls[url] = [tag];
	}
	
	
	var pending = Object.keys(urls).map(function(url) {
		var tags = urls[url];
		return loadResource(url, options).then(function(buffer) {
			if (typeof buffer === 'string') throw new Error('buffer is string');
			var data = 'data:image/' + url.split('.').pop() + ';base64,' + buffer.toString('base64');
			tags.forEach(function(tag) {
				html = html.replace(tag, tag.replace(imgSrcExp, '$1' + data.replace(/\$/g, '$$$$') + '$2'));
			});
		});
	});
	
	if (!pending.length) return promises.fulfilled(html);
	
	return promises.after(pending).then(function(results) {
		return promises.args(html, options);
	});
}

function compressHTML(html, options) {
	if (typeof(options) == 'undefined') {
		options = {};
	}
	if (options.uncompressed) return promises.fulfilled(html);
	return gzipHtml(html);
}


var preTagExp = /<pre[\s\S]+?<\/pre>/g;
function minifyHTML(html, options) {
	// get all pre tags untouched
	var pres = html.match(preTagExp);
	
	// optimize for whitespace
	html = html.replace(/[\r\n\t ]+/g, ' ');
	
	if (pres) {
		// replace pre tags with unoptimized ones
		html = html.split(preTagExp);
		for (var i = 1; i < html.length; i+=2) {
			html.splice(i, 0, pres.shift());
		}
		html = html.join('');
	}
	
	return html;
}

var escapeChars = /\\|\*|\+|\?|\||\{|\[|\(|\)|\^|\$|\.|\#/g;
function escapeExp(str) {
	return str.replace(escapeChars, '\\$&');
}

function clone(options) {
	var clone = {};
	for (var i in options) clone[i] = options[i];
	return clone;
}