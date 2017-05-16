/**
 * CONFIGURATION FILE
 * Update this with your information before starting the bot
 */
var config = {};
config.twitch = {};
config.twitch.botAccount = {};
config.web = {};

/**
 * @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 * ENTER YOUR PERSONAL CONFIGURATION SETTINGS HERE
 * @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
 */
config.twitch.channelName = 'channelName';
config.twitch.botAccount.username = 'botUsername';
config.twitch.botAccount.password = 'oath:nvggocpoy739jl60l59kjtwhlt49qu';
config.web.port = process.env.WEB_PORT || 3000;

module.exports = config;