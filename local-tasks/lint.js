const
	gulp = requireModule("gulp"),
	jshint = require("gulp-jshint"),
	filter = require("gulp-filter");

gulp.task('lint', function () {
	return gulp.src('**/*.js')
		.pipe(filter(['*', '!node_modules/**/*']))
		.pipe(jshint({node: true}))
		.pipe(jshint.reporter('default'));
});
