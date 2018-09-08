/**
 * THIS IS THE ELECTRON APP
 * NOTE: This is actually the primary entrance point for the app
 */

// TODO: CLEAN THIS SHIT UP LATER DONT BE A TRASH CAN
var twitchApp = require('../twitch/twitch.js');
var config = require('../config');
var logger = require('../logger');
var chatParser = require('./chat_parser.js');
var chatOverlayDAO = require('./chat_overlay_DAO.js');
var overlayConfig = chatOverlayDAO.getConfig();
var player = require('play-sound')(opts = {});
var hueController = require('../hue/hue-lights.js');
var spotifyController = require('../spotify/spotify-web-helper.js');

const {app, BrowserWindow} = require('electron')

var channelName = overlayConfig.twitch.channelName;

var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
server.listen(1338, function() { });

// create the server
wsServer = new WebSocketServer({
    httpServer: server
});
var connection;
// WebSocket server
wsServer.on('request', function(request) {
    //var connection = request.accept(null, request.origin);
    connection = request.accept(null, request.origin);

    // This is the most important callback for us, we'll handle
    // all messages from users here.
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            // process WebSocket message
        }
    });

    connection.on('close', function(connection) {
        // close user connection
    });
});

/*********************************
*   MAIN EXPRESS CODE HERE
* 
*   NOTE: Add "addExpressEndpoints()" 
*         to modules as necessary
*********************************/
var express = require('express');
var expressApp = express();
expressApp.listen(config.web.port, function () {
  //console.log('Bot webapp listening on port 3000!')
});
twitchApp.addExpressEndpoints(express, expressApp);
chatParser.addExpressEndpoints(express, expressApp);
// TODO: Figure out why put endpoints suck dick fuck you express
expressApp.get('/putConfig', function (req, res) {
	var config = req.query;
	chatOverlayDAO.putConfig(config);
	// refresh the current config cached
	overlayConfig = config;
	createWindow();
	res.send("OK");
});



/* http://localhost:3000/config/config.html */


/**
* TODO: document object type used here
*/
function sendClientMsg(msgObj) {
	if (connection === undefined) {
		logger.log("error", "Client hasn't been opened.");
		return;
	}
	connection.sendUTF(JSON.stringify(msgObj));
}

let showWindow = true;

/*process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
  if (index == 3 && val == '-no-window') {
	  showWindow = false;
  }
});*/

if (process.argv[2] == '-no-window') {
	showWindow = false;
}

/*********************************
*   ELECTRON CODE HERE
*********************************/
//if (config.electron === undefined || config.electron === null || config.electron == true) {
	//const {app, BrowserWindow} = require('electron')
	//const remote = require('electron').remote;
if (showWindow) {
	const path = require('path')
	const url = require('url')
	
	// Keep a global reference of the window object, if you don't, the window will
	// be closed automatically when the JavaScript object is garbage collected.
	let win
	
	function createWindow () {
	  // Create the browser window.
		var frame = (overlayConfig.chatapp.overlaywindow.frame == 'true');
		var transparent = (overlayConfig.chatapp.overlaywindow.transparent == 'true');
		var alwaysOnTop = (overlayConfig.chatapp.overlaywindow.alwaysOnTop == 'true');
	  win = new BrowserWindow({width: parseInt(overlayConfig.chatapp.overlaywindow.width), height: parseInt(overlayConfig.chatapp.overlaywindow.height), frame: frame, transparent: transparent, alwaysOnTop: alwaysOnTop, x: parseInt(overlayConfig.chatapp.overlaywindow.x), y: parseInt(overlayConfig.chatapp.overlaywindow.y)})
	
	  // and load the index.html of the app.
	  win.loadURL(url.format({
	    pathname: path.join(__dirname, 'index.html'),
	    protocol: 'file:',
	    slashes: true
	  }))
	
	  // Open the DevTools.
	  //win.webContents.openDevTools()
	
	  // Emitted when the window is closed.
	  win.on('closed', () => {
	    // Dereference the window object, usually you would store windows
	    // in an array if your app supports multi windows, this is the time
	    // when you should delete the corresponding element.
	    win = null
	  })
	}
	
	// This method will be called when Electron has finished
	// initialization and is ready to create browser windows.
	// Some APIs can only be used after this event occurs.
	app.on('ready', createWindow)
	
	// Quit when all windows are closed.
	app.on('window-all-closed', () => {
	  // On macOS it is common for applications and their menu bar
	  // to stay active until the user quits explicitly with Cmd + Q
	  if (process.platform !== 'darwin') {
	    app.quit()
	  }
	})
	
	app.on('activate', () => {
	  // On macOS it's common to re-create a window in the app when the
	  // dock icon is clicked and there are no other windows open.
	  if (win === null) {
	    createWindow()
	  }
	})
}
//}


/*********************************
*   TWITCH CLIENT CODE HERE
*********************************/
var client = twitchApp.getTwitchClient();

client.on('connected', function(address, port) {
    //console.log("Connected!");
});

/**
 * Helper method to wrap trivia engine's isGameStarted() function with 
 * a response message from the bot indicating why nothing is happening.
 */
function isGameStarted() {
	if (!triviaEngine.isGameStarted()) {
		var responseMsg = "No trivia game has been started.";
		client.action(channelName, responseMsg);
	}
	return triviaEngine.isGameStarted();
}

let sessionId = '';

/**
 * Function to parse chat message for bot commands
 */
client.on('chat', function(channel, user, message, self) {
	console.log('user id is: ' + user['user-id']);
	if (self) return;
	try {
		var username = user['username'];
		var msgObj = {
				'user': user,
				'message': message
		}
		// pass the message through the filter method
		if (showWindow && chatParser.isMsgImportant(msgObj)) {
			sendClientMsg(msgObj);
		}
		/* ###########################
		 *     !answer
		 * ########################### */
	    if ((user['mod'] || username === channelName) && message.startsWith("!answer")) {
	    	if (isGameStarted()) {
		        triviaEngine.answerQuestion();
		        triviaEngine.updateLeaderboard();
	    	}
	    }
	    /* ###########################
	     *     !next
	     * ########################### */
		else if ((user['mod'] || username === channelName) && message.startsWith("!next")) {
			if (isGameStarted()) {
				triviaEngine.nextQuestion();
			}
        }
		/* ###########################
		 *     !guess
		 * ###########################*/
        else if (message.startsWith("!guess ")) {
        	if (isGameStarted()) {
	            // parse guess/answer from user
	            var userGuessUnparsed = message.substring(7, message.length);
	            var userGuess = userGuessUnparsed.toLowerCase(); // make everything lowercase for final grading/scoring
	            triviaEngine.addUserGuess(username, userGuess);
        	}
        }
		/* ###########################
         *      !score
         * ########################### */
        else if (message.startsWith("!score")) {
        	if (isGameStarted()) {
        		var userScoreObj = triviaEngine.getUserScore(username);
    			var responseMsg = username + " has not answered any questions yet!";
    			if (userScoreObj !== undefined && Object.keys(userScoreObj).length > 0) {
    				responseMsg = username + " is rank #" + userScoreObj.rank + " with a game score of " + userScoreObj.sessionScore + ". (" + userScoreObj.totalCorrectAnswers + " correct answers - [" + userScoreObj.percentCorrect + "%])";
    			}
                client.action(channelName, responseMsg);
        	}
        }
		/* ###########################
		 *     !trivia
		 * ########################### */
        /*else if (message.startsWith("!trivia")) {
            var msg = "We're playing TRIVIA! Throughout the stream we will ask random trivia questions. You can answer with the command '!guess <your answer>'. You can change your answer with the same '!guess' command as many times as you need until a mod answers the question. Use '!score' to find out your score."
            client.say(channelName, msg);
        }*/
		/* ###########################
		 *      !start
		 * ##########################*/
		else if (username === channelName && message.startsWith("!start")) { // only channel owner can start this
			triviaEngine.startGame();
		}
	    /* ###########################
		 *      !testguess
		 *      NOTE: USED FOR DEBUGGING ONLY
		 * ##########################*/
		else if (username === channelName && message.startsWith("!testguess")) {
			triviaEngine.testGuess();
		}
		else if (message.startsWith("!misszo")) {
			var msg = "did you guys know @miss_zo is AMAZING cook?!?! check out her cooking blog at https://misszocooks.wordpress.com";
			client.say(channelName, msg);
		}
		else if (message.startsWith("!hype")) {
			var msg = "meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype meastoHype";
			client.say(channelName, msg);
		}
		else if (message.startsWith("!server")) {
			var msg = "~-.-~ meast is playing on Behemoth [Primal] ~-.-~";
			client.say(channelName, msg);
		}
		else if (message.startsWith("!pldpov")) {
			var msg = "Interested in the PLD point-of-view during our RAID?! Check out Mizzteq's stream! She gives out free bread with honey on it! twitch.tv/mtqcapture";
			client.say(channelName, msg);
		}
		else if (message.startsWith("!discord")) {
			var msg = "We have a stream DISCORD! Come hang out! https://discord.gg/P8AdrAQ";
			client.say(channelName, msg);
		}
		else if (message.startsWith("!meangirls")) {
			var msg = "commands are: !getinloser, !karen, !sears, !fetch, !butter, !pink, !shedoesntgohere and !youcantsitwithus LELEL";
			client.say(channelName, msg);
		}
		else if (message.startsWith("!shoutout ")) {
			var shoutoutTarget = message.substring(10, message.length);
			var msg = "My dear friend " + shoutoutTarget + " is an AWESOME STREAMER! Check them out at www.twitch.tv/" + shoutoutTarget;
			client.say(channelName, msg);
		}
		else if (message.startsWith("!trivia")) {
			var msg = "meastoso is the creator of TriviaChamp, the twitch extension you see in the top-left corner of the screen! Give it a whirl and let us know what you think!";
			client.say(channelName, msg);
		}
		else if (message.startsWith("!getinloser")) {
	    	// $ mplayer foo.mp3 
	    	player.play('D:\\twitch_plugins\\sounds\\getInLoser.mp3', function(err){
	    	  if (err) throw err
	    	})
	    }
		else if (message.startsWith("!karen")) {
	    	// $ mplayer foo.mp3 
	    	player.play('D:\\twitch_plugins\\sounds\\ohMyGodKaren.mp3', function(err){
	    	  if (err) throw err
	    	})
	    }
		else if (message.startsWith("!sears")) {
	    	// $ mplayer foo.mp3 
	    	player.play('D:\\twitch_plugins\\sounds\\sears.mp3', function(err){
	    	  if (err) throw err
	    	})
	    }
		else if (message.startsWith("!fetch")) {
	    	// $ mplayer foo.mp3 
	    	player.play('D:\\twitch_plugins\\sounds\\fetch.mp3', function(err){
	    	  if (err) throw err
	    	})
	    }
		else if (message.startsWith("!butter")) {
	    	// $ mplayer foo.mp3 
	    	player.play('D:\\twitch_plugins\\sounds\\butterCarb.mp3', function(err){
	    	  if (err) throw err
	    	})
	    }
		else if (message.startsWith("!pink")) {
	    	// $ mplayer foo.mp3 
	    	player.play('D:\\twitch_plugins\\sounds\\pink.mp3', function(err){
	    	  if (err) throw err
	    	})
	    }
		else if (message.startsWith("!shedoesntgohere")) {
	    	// $ mplayer foo.mp3 
	    	player.play('D:\\twitch_plugins\\sounds\\doesntGoHere.mp3', function(err){
	    	  if (err) throw err
	    	})
	    }
		else if (message.startsWith("!youcantsitwithus")) {
	    	// $ mplayer foo.mp3 
	    	player.play('D:\\twitch_plugins\\sounds\\youCantSitWithUs.mp3', function(err){
	    	  if (err) throw err
	    	})
	    }
		else if (message.startsWith("!colors")) {
			var msg = "Set the color of meast's room with the new !setcolor command. Available colors are: red, yellow, green, cyan, blue and magenta. Use !customcolor <red> <green> <blue> to set a custom color of your choice where each color is a number between 0 and 255!";
			client.say(channelName, msg);
		}
		else if (message.startsWith("!setcolor ")) {
			var color = message.substring(10, message.length);
			if (color == 'red') {
				hueController.setOfficeRed();
			}
			else if (color == 'yellow') {
				hueController.setOfficeYellow();
			}
			else if (color == 'green') {
				hueController.setOfficeGreen();
			}
			else if (color == 'cyan') {
				hueController.setOfficeCyan();
			}
			else if (color == 'blue') {
				hueController.setOfficeBlue();
			}
			else if (color == 'magenta') {
				hueController.setOfficeMagenta();
			}
			else {
				var msg = 'That color is not yet supported.';
				client.say(channelName, msg);
			}
		}
		else if (message.startsWith("!customcolor ")) {
			var commandArgs = message.substring(13, message.length).split(" ");
			var msg = 'Invalid: must specify 3 numbers between 0-255, i.e. !customcolor 255 255 255';
			if (commandArgs.length != 3) {
				client.say(channelName, msg);
			}
			else {
				var r = parseInt(commandArgs[0]);
				var g = parseInt(commandArgs[1]);
				var b = parseInt(commandArgs[2]);
				if (r < 0 || r > 255 || g < 0 || g > 255 || b < 0 || b > 255) {
					client.say(channelName, msg);
				}
				else {
					hueController.setCustom(r, g, b);
				}
			}
		}
		else if (username === channelName && message.startsWith("!setsession ")) {
			sessionId = message.substring(12, message.length);
			var msg = "Successfully set session ID to: " + sessionId;
			client.say(channelName, msg);
		}
		else if (message.startsWith("!session")) {
			var msg = "Meastoso's current Monster Hunter Session ID: " + sessionId;
			client.say(channelName, msg);
		}
	}
	catch(error) {
		console.log("ERROR: " + error);
	}

});

client.on("subscription", function (channel, username) {
	var msg = 'Thanks for bearbacking, ' + username + '! Also, make sure to practice safe-sex, xoxo';
	client.say(channelName, msg);
});

