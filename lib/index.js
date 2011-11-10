var fs = require('fs');

var preTags = /<pre[\s\S]+<\/pre>/g;

exports.file = function(file, cb) {
	fs.readFile(file, 'utf8', function(err, contents) {
		if (err) cb(err);
		
		// get pre tags untouched
		var pres = contents.match(preTags);
		
		// optimize for whitespace
		contents = contents.replace(/[\r\n\t ]+/g, ' ');
		
		// replace pre tags with unoptimized ones
		contents = contents.split(preTags);
		for (var i = 1; i < contents.length; i+=2) {
			contents.splice(i, 0, pres.shift());
		}
		contents = contents.join('');
		
		// finished
		cb(null, contents);
	});
};
