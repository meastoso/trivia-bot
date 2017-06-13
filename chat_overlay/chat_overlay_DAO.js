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
		// TODO: Don't write the file here once we have the UI to configure properties
		putConfig(configJSON);
	}
	return configJSON;
}

/**
 * TODO
 * @returns
 */
function getInitialConfigJSON() {
	var config = {};
	config.chatapp = {};
	config.chatapp.overlaywindow = {};
	config.chatapp.filters = {};
	config.chatapp.filters.user = {};
	config.chatapp.filters.regex = {};
	
	/**
	 * Use the "x" and "y" values below to set the position (top-left corner) of the chat window
	 * on your screen, using x=0 and y=0 means the top-left corner of your screen.
	 */
	config.chatapp.overlaywindow.x = 220;
	config.chatapp.overlaywindow.y = 0;
	/**
	 * Adjust the width and height of the chat window here
	 */
	config.chatapp.overlaywindow.width = 350;
	config.chatapp.overlaywindow.height = 200;
	/**
	 * Setting transparent = true means the chat overlay window is see-through. You cannot click-through
	 * this window whether the transparency is true or false.
	 */
	config.chatapp.overlaywindow.transparent = true;
	/**
	 * Setting alwaysOnTop to true means that as long as the application you are streaming isn't in
	 * full-screen mode, the chat overlay window will always be on-top and visible. 
	 * 
	 * NOTE: In windows 10 this may also show the windows taskbar. This will happen for any "always-on-top"
	 * type application. To work around this, right-click taskbar, go to properties > settings and set
	 * "hide taskbar by default" to true while streaming. Make sure to restart your game after you make this change
	 * so the game graphics know to adjust their resolution accordingly.
	 */
	config.chatapp.overlaywindow.alwaysOnTop = true;
	/**
	 * Setting frame to true means the top part of the window with file, edit, view, etc. is visible.
	 */
	config.chatapp.overlaywindow.frame = false;


	// TODO: let users customize chat message properties, i.e. color, size, font, etc.

	/**
	 * totalMessagesThreshold indicates to the bot to show chat messages from any user
	 * if the user has less than 'x' total message so far today in the channel, where 'x'
	 * is the value selected. For example, if you set '2', the first two messages any user enters
	 * into your twitch channel will be shown by the overlay chat app
	 */
	config.chatapp.filters.user.totalMessagesThreshold = "1"; // "users with less than 'x' total messages"
	/**
	 * totalBitsDonatedThreshold indicates to the bot to show messages from any user
	 * if the user has donated more than 'x' number of bits, where 'x' is the value selected.
	 * For example, if you set '5000', any messages from users who have donated more than 5000 bits
	 * will be shown in the overlay chat app window.
	 */
	config.chatapp.filters.user.totalBitsDonatedThreshold = "5000"; // show messages from users who have donated more than $50 in bits
	/**
	 * whitelistUsers is a collection of usernames that will always show messages in the overlay
	 * chat app. For example, if the value set is '["meastoso", "mtqcapture"]' any messages from
	 * meastoso or mtqcapture are displayed in the overlay chat app window.
	 * 
	 * NOTE: When editing this value, ensure that the format is: ["name1", "name2", "name3"]
	 */
	config.chatapp.filters.regex.whitelistUsers = ["meastoso", "mtqcapture"]; // whitelist of users who's messages will always be shown in the app
	/**
	 * whitelistPhrases is a collection of strings that will allow the bot to show any messages
	 * containing any of these strings on the overlay chat app. This whitelist is case-insensitive 
	 * so capitalization does not matter. Here are a few examples:
	 * 
	 * Phrase			Example Message that will pass through to the overlay chat app
	 * ____________		_____________________________________________________________
	 * "@meastoso"		"Hey @meastoso what did you think of last night's episode of barney?"
	 * "hello"			"Hello meast how are you whats up!"
	 * "hi"				"man i got so high last night" 
	 * 						NOTE: you prob wanted just the word "hi" but at this time it also includes any words with "hi" in it
	 * 								(This will be coming in a later update, you can select "starts with", "ends with", "equals", "contains", etc.)
	 * "meast"			"meast what are you doing dude..."
	 */
	config.chatapp.filters.regex.whitelistPhrases = ["@meastoso", "hi"]; // for now just "contains" the string will match, but eventually we can customize the matcher, i.e. "endsWith()"

	return config;
}

module.exports = {
		getConfig: getConfig,
		putConfig: putConfig
}