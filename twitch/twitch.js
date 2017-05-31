var tmi = require('tmi.js');
var express = require('express');
var config = require('../config');
var logger = require('../logger');
var triviaEngine = require('../trivia/trivia.js');
var pvpEngine = require('../pvp/pvp.js');

var channelName = config.twitch.channelName;
var username = config.twitch.botAccount.username;
if (channelName == 'channelName' || username == 'username') {
	logger.log("error", "Default settings found. Please configure your settings in the file 'config.js' found at the root of this application.");
	process.exit(1);
}
var options = {
        options: {
                debug: true
        },
        connection: {
                cluster: "aws",
                reconnect: true
        },
        identity: {
                username: username,
                password: config.twitch.botAccount.password
        },
        channels: [channelName]
};

var client = new tmi.client(options);
logger.log("info", "Attempting to log into channel: " + channelName + " with username: " + config.twitch.botAccount.username);
client.connect();

var app = express();
app.listen(config.web.port, function () {
  //console.log('Bot webapp listening on port 3000!')
});

app.use(express.static('site'));

app.get('/getLeaderboard', function (req, res) {
	/*leaderBoard = [
		{ 'rank': 1, 'name': 'aprilk', 'score': '124', 'percentCorrect': '80' },
		{ 'rank': 2, 'name': 'lanz', 'score': '123', 'percentCorrect': '75' },
		{ 'rank': 3, 'name': 'zaes', 'score': '122', 'percentCorrect': '70' },
		{ 'rank': 4, 'name': '1234567890123456789012345', 'score': '121', 'percentCorrect': '60' },
		{ 'rank': 5, 'name': 'meast', 'score': '120', 'percentCorrect': '50' }
	];*/
	res.send(triviaEngine.getLeaderboard());
})



module.exports = {
		pushMessage: function() {
			return null;
		},
		getTwitchClient: function() {
			return client;
		}
		
}

