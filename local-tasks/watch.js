const
	gulp = requireModule("gulp");

gulp.task("watch", function () {
	gulp.watch(["**/*.js", "!node_modules/**/*.js"], ["test"]);
});
