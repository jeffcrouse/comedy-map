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

var google = require('googleapis');
var googleAuth = require('google-auth-library');



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

	var clientSecret = process.env.GCAL_CLIENT_SECRET;
	var clientId = process.env.GCAL_CLIENT_ID;
	var redirectUrl = process.env.GCAL_REDIRECT_URL;
	var auth = new googleAuth();
	var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
	oauth2Client.credentials = JSON.parse(process.env.GCAL_TOKEN);


	//https://github.com/google/google-api-nodejs-client/blob/master/apis/calendar/v3.js#L872
	var calendar = google.calendar('v3');
	calendar.events.list({
		auth: oauth2Client,
		calendarId: 'mcq01cj8g9blh0u8afm2r0rhng@group.calendar.google.com',
		timeMin: (new Date()).toISOString(),
		maxResults: 200,
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
				} else {
					console.log("Couldn't find location. Skipping")
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
