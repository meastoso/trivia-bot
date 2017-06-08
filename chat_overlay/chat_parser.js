/**
 * Engine used to parse chat messages
 */
//var chatOverlayDAO = require('./chat_overlay_DAO.js');




/**
 * Boolean function which will return true/false based
 * on the content of the message, regardless of user
 */
function showMessageBasedOnContent(message) {
	return true;
}

/**
 * Boolean function which will return true/false based
 * simply on the data of the user, not the contents
 * of the message
 */
function showMessageBasedOnUser(user) {
	return true;
}

/**
 * Boolean public function used to YES/NO a message
 */
function showMessage(msgObj) {
	// TODO: add the logic with caching
	console.log("Checked message returning true hardcoded!");
	console.log(JSON.stringify(msgObj));
	return showMessageBasedOnUser(msgObj.user) && showMessageBasedOnContent(msgObj.message);
}

// public methods from trivia module
module.exports = {
		isMsgImportant: showMessage,
		addExpressEndpoints: function(express, expressApp) {
			expressApp.use("/config", express.static('chat_overlay/config_page'));
		}
}