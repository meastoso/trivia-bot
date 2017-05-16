/**
* Custom Logging Implementation to match TMI
*/
function getTime() {
	var now = new Date();
	var h = now.getHours();
	var m = now.getMinutes();
	return h + ":" + m;
}

function formatLogMessage(type, msg) {
	return "[" + getTime() + "] " + type + ": " + msg;
}

module.exports = {
		log: function(type, msg) {
			console.log(formatLogMessage(type, msg));
		}
} 