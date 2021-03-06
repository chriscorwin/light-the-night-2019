console.group(`
============================================================
Demuxe: Running \`app.js\` now...
------------------------------------------------------------
`);
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const ejs = require('ejs');
const express = require('express');
const expressSanitizer = require('express-sanitizer');
const fs = require('fs');
const util = require('util');
const logger = require('morgan');
const path = require('path');
const sassMiddleware = require('node-sass-middleware');
const classnames = require('classnames');
const sizeOf = require('image-size');

const Papa = require('papaparse');
const donationData = Papa.parse(fs.readFileSync('./themes/light-the-night/master.csv').toString());

let scssDebug = false;
console.debug = function() {
	if (process.env.DEBUG === "true") {
		// console.debug = console.log;
		scssDebug = true;
		console.log.apply(this, arguments);
	} else {
		return;
	}
	// if( config.debug === false ) return;
};

const config = require('./config/config.js')();
config.localization.contestData = donationData.data;

const app = express();



console.log(`[ app.js:29 ] config.debug: `, util.inspect(config.debug, { showHidden: true, depth: null, colors: true }));


console.group(`
============================================================
Demuxe: Express Server up and running...
------------------------------------------------------------
`);

console.log('Express server started');
console.log(`port: ${config.port}`);
console.log(`process.env.NODE_ENV ${process.env.NODE_ENV}`);
console.log(`theme: ${config.theme}`);

console.debug('config data');
console.debug(`${path.join(__dirname, 'app.js')}:41 ] config: `, util.inspect(config, { showHidden: false, depth: 1, colors: true }));

console.groupEnd();

// view engine setup
// https://expressjs.com/en/4x/api.html#app.set
// views are looked up in the order they occur in the array (earlier takes precedence over later --cascade flows reverse of the way it does in CSS)
const appViews = config.appViews;
// if (config.theme) {
// 	appViews.push(path.join(__dirname, 'themes', config.theme));
// }
// appViews.push(path.join(__dirname, 'engine'));
app.set('views', appViews);

app.set('view engine', 'ejs');
app.set('view options', { root: '/Users/cmcculloh/projects/demuxe/demo-overrides' });
app.set('view options', {compileDebug: true});
app.set('view options', {compileDebug: true, outputFunctionName: 'echo'});

// https://expressjs.com/en/4x/api.html#app.use
// Paths looked up in sequential order to which they are added, earlier takes precedence over later
const appUse = [
	// logger('dev'),
	express.json(),
	express.urlencoded({ extended: false }),
	expressSanitizer(),
	cookieParser()
];

const sourceMap = (typeof config.sourceMap !== 'undefined') ? config.sourceMap : true;
// SASS loads things in a first-found-in-array manner
if (config.theme) {
	appUse.push(
		sassMiddleware({
			debug: scssDebug,
			sourceMap,
			outputStyle: 'expanded',
			src: path.join(__dirname, 'themes', config.theme)
		}),
		express.static(path.join(__dirname, 'themes', config.theme))
	);
}

appUse.push(
	sassMiddleware({
		debug: scssDebug,
		sourceMap,
		outputStyle: 'expanded',
		src: path.join(__dirname, 'engine')
	}),
	express.static(path.join(__dirname, 'engine'))
);


app.use(appUse);

const router = express.Router();

/**
 * Serve up the .ejs files
 *
 * This dynamically routes to any .ejs file that exists, otherwise it routes to
 * the /404.ejs file.
 *
 * eg: http://your.site.com/kidney/beans, serves the ejs file /demo-overrides/kidney/beans.ejs
 * or serves /demo-overrides/404.ejs if that file does not exist.
 *
 * If a non-existent static (js/css/html/svg/png/etc) file is requested, it will fall through the
 * express.static middleware into this. This will handle it and serve an appropriate 404 error.
 *
 * All user input will be sanitized. If you have a URL or Query param that is getting mutated unexpectedly, this is why.
 */
router.get('/*', (req, res) => {
	// Pass any query params they put in the URL on into the EJS template for use
	const sanitizedQueryParams = Object.keys(req.query).reduce((sanitizedQueryParams, param) => {
		sanitizedQueryParams[req.sanitize(param)] = req.sanitize(req.query[param]);
		return sanitizedQueryParams;
	}, {});
	const sanitizedURL = req.sanitize(req.params[0]) || 'index';
	let fileName = (sanitizedURL.match(/\/$/)) ? `${sanitizedURL}index.ejs` : `${sanitizedURL}.ejs`;

	// Okay, so, the server's glee at finding and including stuff can bite us when it attempts to find `file.css.ejs`. Just silly. Here we tell it in static asset casses to just look for the asset, not an .esj file.
	if ( fileName.endsWith('.css.ejs') || fileName.endsWith('.js.ejs') || fileName.endsWith('.png.ejs') || fileName.endsWith('.png.ejs') ) {
		fileName = fileName.replace('.ejs', '');
	}
	let fileNameSlug = fileName;
	if ( fileNameSlug.endsWith('.ejs') ) {
		fileNameSlug = fileNameSlug.replace('.ejs', '');
	}



	const state = sanitizedQueryParams.state || 'initial';
	config.state = state;

	let error = true;
	// Check to see if the file exists in any of the three possible view directories. If not, error.
	// Note that this doesn't actually decide where files are served from, it just _checks to see if
	// the file exists in a place_. If you want to add a new place that files can be served from, all
	// of that config stuff happens in config.js in the "view engine setup" area.

	fs.access(path.join(__dirname, 'themes', (config.theme) ? config.theme : '', fileName), fs.constants.F_OK | fs.constants.R_OK, (err) => {

		// console.log(`[ ${path.join(__dirname, 'app.js')}:169 ] err: `, util.inspect(err, { showHidden: true, depth: null, colors: true }));

		if (!err) error = false;


		fs.access(path.join(__dirname, 'engine', fileName), fs.constants.F_OK | fs.constants.R_OK, (err) => {

			console.log(`[ ${path.join(__dirname, 'app.js')}:176 ] err: `, util.inspect(err, { showHidden: true, depth: null, colors: true }));

			if (!err) error = false;
			if (error) {
				// find out if it's a slug in our magick-flows

				res.render('404', { page: fileName, ...config, sanitizedQueryParams: sanitizedQueryParams }, (err, html) => {

					if (req.url.match(/\.js$/)) {
						res.set('Content-Type', 'application/javascript');
						res.send(html);
					} else {
						res.set('X-error', err);
						res.set('X-original-filename', fileName);
						res.send(html);
					}
				});

			} else {

				res.render('_wrapper', { ...config, fileName: fileName, urlSlug: fileNameSlug, sanitizedQueryParams: sanitizedQueryParams, classnames: classnames, sizeOf: sizeOf, util: util, path: path });
			}
		});
	});



});
app.use('/', router);


// catch 404 and forward to error handler
app.use((req, res, next) => {
	next(createError(404));
});

// error handler
app.use((err, req, res) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;

console.log(`...end \`app.js\`
------------------------------------------------------------
`);
console.groupEnd();
