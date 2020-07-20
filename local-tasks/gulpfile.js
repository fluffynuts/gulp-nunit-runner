const
	gulp = requireModule("gulp"),
	mocha = require("gulp-mocha");


gulp.task('test', ['lint'], function () {
	return gulp.src('test/*.js', {read: false})
		.pipe(mocha({reporter: 'spec', ui: 'bdd'}));
});

