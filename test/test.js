const path = require("path");

/* global require,describe,it,beforeEach */
(function () {
	"use strict";
	const expect = require("chai").expect;
	let nunit;

	function clearNunit() {
		delete require.cache[require.resolve('../')];
		nunit = require('../');
	}

	describe("Tests for gulp-nunit-runner", function () {
		beforeEach(function () {
			clearNunit();
		});

		describe("Test quoted executable path and path with spaces.", function () {
			let opts;

			it("Should not quote a non-quoted string", function () {
				opts = {
					executable: "C:\\nunit\\bin\\nunit-console.exe"
				};

				expect(nunit.getExecutable(opts)).to.equal("C:\\nunit\\bin\\nunit-console.exe");
			});

			it("Should unquote a double-quoted string", function () {
				opts = {
					executable: `"C:\\nunit\\bin\\nunit-console.exe"`
				};

				expect(nunit.getExecutable(opts)).to.equal("C:\\nunit\\bin\\nunit-console.exe");
			});

			it("Should wrap options in double quotes instead of single ones", function () {
				const isWin = /^win/.test(process.platform),
					switchChar = isWin ? "/" : "-";

				opts = {
					options: {
						where: "cat != critical",
					}
				};

				const res = nunit.getArguments(opts, []);

				expect(res).to.deep.equal(
					[
						switchChar + "where:cat != critical",
					]);
			});

			it("Should unquote a single-quoted string", function () {
				opts = {
					executable: "'C:\\nunit\\bin\\nunit-console.exe'"
				};

				expect(nunit.getExecutable(opts)).to.equal("C:\\nunit\\bin\\nunit-console.exe");
			});

			it("Should add the anycpu executable if only a path is passed and no platform is specified", function () {
				opts = {
					executable: path.join("C:", "nunit", "bin")
				};

				expect(nunit.getExecutable(opts)).to.equal(path.join("C:", "nunit", "bin", "nunit-console.exe"));
			});

			it("Should add the anycpu executable if only a path is passed and anycpy platform is specified", function () {
				opts = {
					executable: path.join("C:", "nunit", "bin"),
					platform: "anycpu"
				};

				expect(nunit.getExecutable(opts)).to.equal(path.join("C:", "nunit", "bin", "nunit-console.exe"));
			});

			it("Should add the x86 executable if only a path is passed and platform is x86", function () {
				opts = {
					executable: path.join("C:", "nunit", "bin"),
					platform: "x86"
				};

				expect(nunit.getExecutable(opts)).to.equal(path.join("C:", "nunit", "bin", "nunit-console-x86.exe"));
			});

			it("Should be the anycpu executable if no path is passed and no platform is specified", function () {
				expect(nunit.getExecutable({})).to.equal("nunit-console.exe");
			});

			it("Should be the anycpu executable if no path is passed and anycpy platform is specified", function () {
				opts = {
					platform: "anycpu"
				};

				expect(nunit.getExecutable(opts)).to.equal("nunit-console.exe");
			});

			it("Should be the x86 executable if no path is passed and platform is x86", function () {
				opts = {
					platform: "x86"
				};

				expect(nunit.getExecutable(opts)).to.equal("nunit-console-x86.exe");
			});
		});

		describe("Adding assemblies and option switches should yield correct command.", function () {
			let stream,
				opts,
				assemblies;

			it("Should throw an error with no assemblies", function (cb) {
				stream = nunit({
					executable: "C:\\nunit\\bin\\nunit-console.exe"
				});
				stream.on("error", function (err) {
					expect(err.message).to.equal("File is required.");
					cb();
				});
				stream.write();
			});

			it("Should have correct options with assemblies only.", function () {
				opts = {
					executable: "C:\\nunit\\bin\\nunit-console.exe"
				};

				assemblies = ["First.Test.dll", "Second.Test.dll"];

				expect(nunit.getArguments(opts, assemblies)).to.deep.equal(["First.Test.dll", "Second.Test.dll"]);
			});

			it("Should have correct options with options and assemblies.", function () {
				const isWin = /^win/.test(process.platform),
					switchChar = isWin ? "/" : "-";

				opts = {
					executable: "C:\\nunit\\bin\\nunit-console.exe",
					options: {
						nologo: true,
						config: "Release",
						transform: "myTransform.xslt"
					}
				};

				assemblies = ["First.Test.dll", "Second.Test.dll"];

				expect(nunit.getArguments(opts, assemblies)).to.deep.equal(
					[
						switchChar + "nologo",
						switchChar + "config:Release",
						switchChar + "transform:myTransform.xslt",
						"First.Test.dll",
						"Second.Test.dll"
					]);
			});

			it("Should properly format multi args.", function () {
				const isWin = /^win/.test(process.platform),
					switchChar = isWin ? "/" : "-";

				opts = {
					options: {
						exclude: ["Acceptance", "Integration"]
					}
				};

				expect(nunit.getArguments(opts, [])).to.deep.equal(
					[
						switchChar + "exclude:Acceptance,Integration"
					]);
			}); // end it
		});

		describe("Test parsing options into switches.", function(){
			let opts;
			const isWin = /^win/.test(process.platform),
				switchChar = isWin ? "/" : "-";

			it("Should parse number type option.", function () {
				opts = {
					options: {
						number: 123,
					}
				};

				expect(nunit.getArguments(opts, [])).to.deep.equal(
					[
						switchChar + "number:123"
					]);
			});
		});
		// end describe
	}); // end describe suite
}());
