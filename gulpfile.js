'use strict';

/* пути к исходным файлам (src), к готовым файлам (build), а также к тем, за изменениями которых нужно наблюдать (watch) */
var path = {
	dist: {
		js: 'assets/dist/js/',
		css: 'assets/dist/css/',
		fonts: 'assets/dist/fonts/'
	},
	build: {
		html: 'assets/build/',
		js: 'assets/build/js/',
		css: 'assets/build/css/',
		img: 'assets/build/img/',
		fonts: 'assets/build/fonts/'
	},
	src: {
		html: 'assets/src/*.html',
		js: 'assets/src/js/main.js',
		style: 'assets/src/style/main.scss',
		img: 'assets/src/img/**/*.*',
		jquery: 'node_modules/jquery/dist/jquery.js',
		fonts: 'bower_components/components-font-awesome/webfonts/*.*'
	},
	watch: {
		html: 'assets/src/**/*.html',
		js: 'assets/src/js/**/*.*',
		css: 'assets/src/style/*.*',
		img: 'assets/src/img/**/*.*',
		fonts: 'assets/src/fonts/*.*'
	},
	clean: './assets/build/*,./assets/dist/*'
};

/* настройки сервера */
var config = {
	server: {
		baseDir: './assets/build'
	},
	notify: false
};

/* подключаем gulp и плагины */
var gulp = require('gulp'),  // подключаем Gulp
	webserver = require('browser-sync'), // сервер для работы и автоматического обновления страниц
	plumber = require('gulp-plumber'), // модуль для отслеживания ошибок
	rigger = require('gulp-rigger'), // модуль для импорта содержимого одного файла в другой
	sourcemaps = require('gulp-sourcemaps'), // модуль для генерации карты исходных файлов
	sass = require('gulp-sass'), // модуль для компиляции SASS (SCSS) в CSS
	less = require('gulp-less'),
	concat = require('gulp-concat'),
	merge = require('merge-stream'),
	autoprefixer = require('gulp-autoprefixer'), // модуль для автоматической установки автопрефиксов
	cleanCSS = require('gulp-clean-css'), // плагин для минимизации CSS
	uglify = require('gulp-uglify'), // модуль для минимизации JavaScript
	cache = require('gulp-cache'), // модуль для кэширования
	imagemin = require('gulp-imagemin'), // плагин для сжатия PNG, JPEG, GIF и SVG изображений
	jpegrecompress = require('imagemin-jpeg-recompress'), // плагин для сжатия jpeg
	pngquant = require('imagemin-pngquant'), // плагин для сжатия png
	del = require('del'), // плагин для удаления файлов и каталогов
	rename = require('gulp-rename');

/* задачи */

// запуск сервера
gulp.task('webserver', function () {
	webserver(config);
});

// сбор html
gulp.task('html:build', function () {
	return gulp.src(path.src.html) // выбор всех html файлов по указанному пути
	.pipe(plumber()) // отслеживание ошибок
	.pipe(rigger()) // импорт вложений
	.pipe(gulp.dest(path.build.html)) // выкладывание готовых файлов
	.pipe(webserver.reload({ stream: true })); // перезагрузка сервера
});

// сбор стилей
gulp.task('css:build', function () {
	return gulp.src(path.src.style) // получим main.scss
		.pipe(sass())// scss -> css
		.pipe(plumber()) // для отслеживания ошибок
		.pipe(sourcemaps.init()) // инициализируем sourcemap
		.pipe(autoprefixer()) // добавим префиксы
		.pipe(gulp.dest(path.build.css))
		.pipe(rename({ suffix: '.min' }))
		.pipe(cleanCSS()) // минимизируем CSS
		.pipe(sourcemaps.write('./')) // записываем sourcemap
		.pipe(gulp.dest(path.build.css)) // выгружаем в build
		.pipe(gulp.dest(path.dist.css)) // выгружаем в dist
		.pipe(webserver.reload({ stream: true })); // перезагрузим сервер
});

// сбор js
gulp.task('js:build', function () {
	gulp.src(path.src.jquery)
		.pipe(plumber())
		.pipe(gulp.dest(path.build.js))
		.pipe(rename({ suffix: '.min' }))
		.pipe(sourcemaps.init())
		.pipe(uglify())
		.pipe(sourcemaps.write('./'))
		.pipe(gulp.dest(path.build.js))
		.pipe(gulp.dest(path.dist.js));

	return gulp.src(path.src.js) // получим файл main.js
		.pipe(plumber()) // для отслеживания ошибок
		.pipe(rigger()) // импортируем все указанные файлы в main.js
		.pipe(gulp.dest(path.build.js))
		.pipe(rename({ suffix: '.min' }))
		.pipe(sourcemaps.init()) //инициализируем sourcemap
		.pipe(uglify()) // минимизируем js
		.pipe(sourcemaps.write('./')) //  записываем sourcemap
		.pipe(gulp.dest(path.build.js)) // положим готовый файл
		.pipe(gulp.dest(path.dist.js)) // положим готовый файл
		.pipe(webserver.reload({ stream: true })); // перезагрузим сервер
});

// перенос шрифтов
gulp.task('fonts:build', function () {
	return gulp.src(path.src.fonts)
	.pipe(gulp.dest(path.build.fonts))
	.pipe(gulp.dest(path.dist.fonts));
});

// обработка картинок
gulp.task('image:build', function () {
	return gulp.src(path.src.img) // путь с исходниками картинок
	.pipe(cache(imagemin([ // сжатие изображений
		imagemin.gifsicle({ interlaced: true }),
		jpegrecompress({
			progressive: true,
			max: 90,
			min: 80
		}),
		pngquant(),
		imagemin.svgo({ plugins: [{ removeViewBox: false }] })
	])))
	.pipe(gulp.dest(path.build.img)); // выгрузка готовых файлов
});

// удаление каталога build 
gulp.task('clean:build', function () {
	return del(path.clean);
});

// очистка кэша
gulp.task('cache:clear', function () {
	cache.clearAll();
});

// сборка
gulp.task('build',
	gulp.series('clean:build',
		gulp.parallel(
			'html:build',
			'css:build',
			'js:build',
			'fonts:build',
			'image:build'
		)
	)
);

// запуск задач при изменении файлов
gulp.task('watch', function () {
	gulp.watch(path.watch.html, gulp.series('html:build'));
	gulp.watch(path.watch.css, gulp.series('css:build'));
	gulp.watch(path.watch.js, gulp.series('js:build'));
	gulp.watch(path.watch.img, gulp.series('image:build'));
	gulp.watch(path.watch.fonts, gulp.series('fonts:build'));
});

// задача по умолчанию
gulp.task('default', gulp.series(
	'build',
	gulp.parallel('webserver','watch')
));