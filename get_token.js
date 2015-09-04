var path = require('path');
var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */

var clientSecret = process.env.GCAL_CLIENT_SECRET;
var clientId = process.env.GCAL_CLIENT_ID;
var redirectUrl = process.env.GCAL_REDIRECT_URL;
var auth = new googleAuth();
var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

var authUrl = oauth2Client.generateAuthUrl({
	access_type: 'offline',
	scope: ['https://www.googleapis.com/auth/calendar.readonly']
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
		console.log("SET GCAL_TOKEN TO:")
		console.log(token);
	});
});