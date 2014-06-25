var es = require('event-stream');
var fs = require('fs');
var path = require('path');
var child_process = require('child_process');
var async = require('async');
var PluginError = require('gulp-util').PluginError;
var winExt = /^win/.test(process.platform)?".cmd":"";


// optimization: cache for protractor binaries directory
var protractorDir = null;

function getProtractorDir() {
	if (protractorDir) {
		return protractorDir;
	}
	
	protractorDir = require.resolve('protractor');
	protractorDir = path.normalize(path.dirname(protractorDir + '/../../../../') + '/.bin');
	
	return protractorDir;
}

var protractor = function(options) {
	var files = [],
		child, args;

	options = options || {};
	args = options.args || [];

	if (!options.configFile) {
		this.emit('error', new PluginError('gulp-protractor', 'Please specify the protractor config file'));
	}
	return es.through(function(file) {
		files.push(file.path);
	}, function() {
		var stream = this;

		// Attach Files, if any
		if (files.length) {
			args.push('--specs');
			args.push(files.join(','));
		}

		// Pass in the config file
		args.unshift(options.configFile);

		child = child_process.spawn(path.resolve(getProtractorDir() + '/protractor'+winExt), args, {
			stdio: 'inherit',
			env: process.env
		}).on('exit', function(code) {
			if (child) {
				child.kill();
			}
			if (stream) {
				if (code) {
					stream.emit('error', new PluginError('gulp-protractor', 'protractor exited with code ' + code));
				}
				else {
					stream.emit('end');
				}
			}
		});
	});
};

var webdriver_update = function(opts, cb) {
	var callback = (cb ? cb : opts);
	var options = (cb ? opts : null);
	var args = ["update", "--standalone"];
	if (options) {
		if (options.browsers) {
			options.browsers.forEach(function(element, index, array) {
				args.push("--" + element);
			});
		}
	}	
	child_process.spawn(path.resolve(getProtractorDir() + '/webdriver-manager'+winExt), args, {
		stdio: 'inherit'
	}).once('close', cb);
};

var webdriver_update_specific = function(opts) {
	return webdriver_update.bind(this, opts);
};

webdriver_update.bind(null, ["ie", "chrome"])

var webdriver_standalone = function(cb) {
	var child = child_process.spawn(path.resolve(getProtractorDir() + '/webdriver-manager'+winExt), ['start'], {
		stdio: 'inherit'
	}).once('close', cb);
};

module.exports = {
	getProtractorDir: getProtractorDir,
	protractor: protractor,
	webdriver_standalone: webdriver_standalone,
	webdriver_update: webdriver_update,
	webdriver_update_specific: webdriver_update_specific
};
