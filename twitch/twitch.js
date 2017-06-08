var tmi = require('tmi.js');
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

// public methods
module.exports = {
		pushMessage: function() {
			return null;
		},
		getTwitchClient: function() {
			return client;
		},
		addExpressEndpoints: function(express, expressApp) {
			triviaEngine.addExpressEndpoints(express, expressApp);
		}	
}

