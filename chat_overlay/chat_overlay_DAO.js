/**
 * DAO with interfaces for the data source
 */
var fs = require("fs");

function putConfig(configData) {
	fs.writeFile("config.json", JSON.stringify(configData), "utf8", function() {
		// callback here
		console.log("finished writing");
	});
}

/**
 * TODO
 * @returns
 */
function getConfig() {
	var configJSON;
	// first check if we have a config file already or if this is first startup
	try {
		configJSON = require("../config.json");
	}
	catch (e) {
		console.log("Unable to read configuration - " + e);
		console.log("...returning initial configuration.");
		configJSON = getInitialConfigJSON();
	}
	return configJSON;
}

/**
 * TODO
 * @returns
 */
function getInitialConfigJSON() {
	var config = {};
	
	/* Chat Overlay Config Defaults */
	config.overlaywindow = {};
	config.overlaywindow.x = 220;
	config.overlaywindow.y = 0;
	config.overlaywindow.width = 350;
	config.overlaywindow.height = 200;
	config.overlaywindow.transparent = false; // TODO; change back after debugging
	config.overlaywindow.alwaysOnTop = false; // TODO; change back after debugging
	config.overlaywindow.frame = false;
	// TODO: let users customize chat message properties, i.e. color, size, font, etc.
	
	/* Define filters sub-category of config */
	config.filters = {};
	
	/* User-related filters */
	config.filters.user = {};
	config.filters.user.totalMessagesThreshold = "1"; // "users with less than 'x' total messages"
	config.filters.user.totalBitsDonatedThreshold = "5000"; // show messages from users who have donated more than $50 in bits
	
	/* Regex-related */
	config.filters.regex = {};
	config.filters.regex.whitelistUser = ["meastoso"]; // whitelist of users who's messages will always be shown in the app
	config.filters.regex.whitelistPhrases = ["@meastoso", "hi"]; // for now just "contains" the string will match, but eventually we can customize the matcher, i.e. "endsWith()"
	
	return config;
}

module.exports = {
		getConfig: getConfig,
		putConfig: putConfig
}