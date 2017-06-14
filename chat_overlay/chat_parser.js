/**
 * Engine used to parse chat messages
 */
var chatOverlayDAO = require('./chat_overlay_DAO.js');
var chatOverlayConfig = chatOverlayDAO.getConfig();
var userMessageNumberCache = {};

// Users with less than “x” total messages
function totalMessagesCheck(user) {
	// get current number of messages
	var num = userMessageNumberCache[user.username]; // currentNumberOfMessagesForUser
	if (num === undefined || num === null || num == '') {
		// this is user's first message
		num = 0;
	}
	var inc = (parseInt(num) + 1);
	var ret = false;
	if (parseInt(num) < chatOverlayConfig.chatapp.filters.user.totalMessagesThreshold) {
		console.log("total messages are high enough");
		ret = true; // this is within the threshold
	}
	userMessageNumberCache[user.username] = inc;
	return ret;
}

// Users with more than “x” bit badge
function totalBitsDonatedCheck(user) {
	var ret = false;
	var badges = user.badges;
	if (user.badges !== undefined && user.badges !== null && user.badges.bits !== undefined && user.badges.bits !== null && user.badges.bits != '') {
		var num = parseInt(user.badges.bits);
		if (num >= chatOverlayConfig.chatapp.filters.user.totalBitsDonatedThreshold) {
			console.log("bits are high enough");
			ret = true;
		}
	}
	return ret;
}

// User is configured as "whitelisted"
function isUserWhitelisted(user) {
	var ret = false;
	var userArr = chatOverlayConfig.chatapp.filters.regex.whitelistUsers;
	if (userArr !== undefined && userArr !== null && userArr.length > 0 && userArr.indexOf(user.username) > -1) {
		console.log("user is whitelisted");
		ret = true;
	}
	return ret;
}

// Message contains a whitelisted phrase
function isMessageWhitelisted(message) {
	var ret = false;
	var phraseArr = chatOverlayConfig.chatapp.filters.regex.whitelistPhrases;
	if (phraseArr !== undefined && phraseArr !== null && phraseArr.length > 0) {
		for (var i = 0; i < phraseArr.length; i++) {
			if (message.toLowerCase().includes(phraseArr[i].toLowerCase())) {
				console.log("messages is whitelisted");
				ret = true;
			}
		}
	}
	return ret;
}

/**
 * Boolean function which will return true/false based
 * on the content of the message, regardless of user
 */
function showMessageBasedOnContent(message) {
	return isMessageWhitelisted(message);
}

/**
 * Boolean function which will return true/false based
 * simply on the data of the user, not the contents
 * of the message
 */
function showMessageBasedOnUser(user) {
	return totalMessagesCheck(user) || totalBitsDonatedCheck(user) || isUserWhitelisted(user);
}

/**
 * Boolean public function used to YES/NO a message
 */
function showMessage(msgObj) {
	try {
		return showMessageBasedOnUser(msgObj.user) || showMessageBasedOnContent(msgObj.message);
	}
	catch (e) {
		console.log(e);
		return true;
	}
}

// public methods from trivia module
module.exports = {
		isMsgImportant: showMessage,
		addExpressEndpoints: function(express, expressApp) {
			expressApp.use("/config", express.static('chat_overlay/config_page'));
			expressApp.get('/getConfig', function (req, res) {
				res.send(chatOverlayDAO.getConfig());
			});
		}
}