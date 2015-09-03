var path = require('path');
var util = require('util');
var http = require('http');
var fs = require('fs');
var geocoder = require('geocoder');
var async = require('async');
var hogan = require("hogan.js");
var express = require('express');
var request = require("request");
var favicon = require('serve-favicon');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'calendar-api-quickstart.json';

if (!fs.existsSync(TOKEN_DIR)){
    fs.mkdirSync(TOKEN_DIR);
}

var oauth2Client = null;

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken() {
	var authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES
	});

	console.log('Authorize this app by visiting this url: ', authUrl);
	var rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	rl.question('Enter the code from that page here: ', function(code) {
		rl.close();
		oauth2Client.getToken(code, function(err, token) {
			if (err) {
				console.log('Error while trying to retrieve access token', err);
				return;
			}
			oauth2Client.credentials = token;
			fs.writeFile(TOKEN_PATH, JSON.stringify(token));
			console.log('Token stored to ' + TOKEN_PATH);
		});
	});
}



// Load client secrets from a local file.
fs.readFile('client_secret.json', function processClientSecrets(err, content) {
	if (err) {
		console.log('Error loading client secret file: ' + err);
		return;
	}
	// Authorize a client with the loaded credentials, then call the
	// Google Calendar API.
	var credentials = JSON.parse(content);
	var clientSecret = credentials.installed.client_secret;
	var clientId = credentials.installed.client_id;
	var redirectUrl = credentials.installed.redirect_uris[0];
	var auth = new googleAuth();
	oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
	
	// Check if we have previously stored a token.
	fs.readFile(TOKEN_PATH, function(err, token) {
		if (err) {
			getNewToken(oauth2Client);
		} else {
			oauth2Client.credentials = JSON.parse(token);
		}
	});
});


var app = express();
var server = require('http').Server(app);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.set('port', process.env.PORT || 5000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.use(function (req, res, next) {
//     res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
//     res.header('Expires', '-1');
//     res.header('Pragma', 'no-cache');
//     next()
// });

app.get('/', function(req, res){
	res.render("index", {})
});



var template = hogan.compile('<div class="info">\
		<div class="title">{{summary}}</div>\
		<p>{{start.dateTime}} @ {{location}}</p>\
		<p>{{description}}</p>\
		<p><small>{{creator.displayName}}</small></p>\
	</div>');

app.get('/data', function (req, res) {

	//https://github.com/google/google-api-nodejs-client/blob/master/apis/calendar/v3.js#L872
	var calendar = google.calendar('v3');
	calendar.events.list({
		auth: oauth2Client,
		calendarId: 'mcq01cj8g9blh0u8afm2r0rhng@group.calendar.google.com',
		timeMin: (new Date()).toISOString(),
		maxResults: 10,
		//singleEvents: true,
		//orderBy: 'startTime'
	}, function(err, response) {
		if (err) {
			res.send('The API returned an error: ' + err);
			return;
		}
		var events = [];
		console.log("response.items.length", response.items.length);
		async.eachSeries(response.items, function(event, next){
			geocoder.geocode(event.location, function ( err, data ) {
				if(data.results.length > 0) {
					var result = data.results.pop();
					var start = event.start.dateTime || event.start.date;

					events.push({
						info: template.render(event),
						icon: "/img/comedyclub.png",
						location: result.geometry.location,
						title: event.summary,
					});
				}
				next(null);
			});
		}, function(err){
			res.json({events: events});
		});
	});
});


server.listen(app.get('port'));
server.on('listening', function(){
	var host = require('os').hostname();
	require('dns').lookup(host, function (err, addr, fam) {
		console.log("listening on", addr, app.get('port'));
	});
});
