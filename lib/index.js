/* global require */
'use strict';
let
	child_process = require("child_process"),
	PluginError = require("plugin-error"),
	log = require("fancy-log"),
	c = require("ansi-colors"),
	es = require("event-stream"),
	path = require("path"),
	temp = require("temp"),
	fs = require("fs"),
	teamcity = require("./teamcity"),

	PLUGIN_NAME = "gulp-nunit-runner",
	NUNIT_CONSOLE = "nunit-console.exe",
	NUNIT_X86_CONSOLE = "nunit-console-x86.exe",

	isWin = /^win/.test(process.platform),
	runner;

// Main entry point
runner = function gulpNunitRunner(opts) {
	let stream,
		files;
	opts = opts || {};

	files = [];

	stream = es.through(function write(file) {
		if (file === undefined || file === null) {
			fail(this, "File is required.");
		}

		files.push(file);
		this.emit("data", file);
	}, function end() {
		run(this, files, opts);
	});

	return stream;
};

runner.getExecutable = function (options) {
	let executable,
		consoleRunner;
	consoleRunner = options.platform === "x86" ? NUNIT_X86_CONSOLE : NUNIT_CONSOLE;
	if (!options.executable) {
		return consoleRunner;
	}
	// trim any existing surrounding quotes and then wrap in ""
	executable = trim(options.executable, "\\s", "\"", "'");
	return !path.extname(options.executable) ?
		path.join(executable, consoleRunner) : executable;
};

runner.getArguments = function (options, assemblies) {
	let args = [];

	if (options.options) {
		args = args.concat(parseSwitches(options.options));
	}
	args = args.concat(assemblies);

	return args;
};

function parseSwitches(options) {
	let filtered,
		switches;
	const // when running under mono on linux/mac switches must be specified with a - not a /
		switchChar = isWin ? "/" : "-";

	switches = Object.keys(options || {}).map(function (key) {
		let qualifier;
		const val = options[key];
		if (typeof val === "boolean") {
			if (val) {
				return (switchChar + key);
			}
			return undefined;
		}
		if (typeof val === "string") {
			if (key === "where") {
				return (switchChar + key + ":" + val);
			} else {
				qualifier = val.trim().indexOf(" ") > -1 ? "\"" : "";
				return (switchChar + key + ":" + qualifier + val + qualifier);
			}
		}
		if (typeof val === "number"){
			return (switchChar + key + ":" + val);
		}
		if (val instanceof Array) {
			return (switchChar + key + ":" + val.join(","));
		}
	});

	filtered = switches.filter(function (val) {
		return val !== undefined;
	});

	return filtered;
}

function fail(stream, msg) {
	stream.emit('error', new PluginError(PLUGIN_NAME, msg));
}

function end(stream) {
	stream.emit('end');
}

function run(stream, files, options) {

	let child,
		args,
		exe,
		opts,
		assemblies,
		cleanupTempFiles;

	options.options = options.options || {};

	if (!options.options.result && options.teamcity) {
		temp.track();
		options.options.result = temp.path({suffix: ".xml"});
		cleanupTempFiles = temp.cleanup;
	}

	assemblies = files.map(function (file) {
		return file.path;
	});

	if (assemblies.length === 0) {
		return fail(stream, "Some assemblies required."); //<-- See what I did there ;)
	}

	opts = {
		stdio: [null, process.stdout, process.stderr, "pipe"]
	};

	exe = runner.getExecutable(options);
	args = runner.getArguments(options, assemblies);

	if (!isWin) {
		args.unshift(exe);
		exe = "mono";
	}

	child = child_process.spawn(exe, args, opts);

	child.on("error", function (e) {
		fail(stream, e.code === "ENOENT" ? "Unable to find \"" + exe + "\"." : e.message);
	});

	child.on("close", function (code) {
		if (options.teamcity) {
			if (fs.existsSync(options.options.result)) {
				log.info(teamcity(fs.readFileSync(options.options.result, "utf8")));
			} else {
				fail(stream, "NUnit output not found: " + options.options.result);
			}
		}
		if (cleanupTempFiles) {
			cleanupTempFiles();
		}
		if (code !== 0) {
			log.error(c.red("NUnit tests failed."));
			if (!options.continueOnError) {
				fail(stream, "NUnit tests failed.");
			}
		} else {
			log.info(c.cyan("NUnit tests passed"));
		}
		return end(stream);
	});
}

function trim() {
	const args = Array.prototype.slice.call(arguments),
		source = args[0],
		replacements = args.slice(1).join(","),
		regex = new RegExp("^[" + replacements + "]+|[" + replacements + "]+$", "g");
	return source.replace(regex, '');
}

module.exports = runner;
