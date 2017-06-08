/**
 * THIS IS THE ELECTRON APP
 * NOTE: This is actually the primary entrance point for the app
 */

// TODO: CLEAN THIS SHIT UP LATER DONT BE A TRASH CAN
var twitchApp = require('../twitch/twitch.js');
var config = require('../config');
var logger = require('../logger');
var chatParser = require('./chat_parser.js');

var channelName = config.twitch.channelName;

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



/*********************************
*   ELECTRON CODE HERE
*********************************/
if (config.electron === undefined || config.electron === null || config.electron == true) {
	const {app, BrowserWindow} = require('electron')
	const path = require('path')
	const url = require('url')
	
	// Keep a global reference of the window object, if you don't, the window will
	// be closed automatically when the JavaScript object is garbage collected.
	let win
	
	function createWindow () {
	  // Create the browser window.
	  win = new BrowserWindow({width: 800, height: 600})
	
	  // and load the index.html of the app.
	  win.loadURL(url.format({
	    pathname: path.join(__dirname, 'index.html'),
	    protocol: 'file:',
	    slashes: true
	  }))
	
	  // Open the DevTools.
	  win.webContents.openDevTools()
	
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

/**
 * Function to parse chat message for bot commands
 */
client.on('chat', function(channel, user, message, self) {
	if (self) return;
	try {
		var username = user['username'];
		var msgObj = {
				'user': user,
				'message': message
		}
		// pass the message through the filter method
		if (chatParser.isMsgImportant(msgObj)) {
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
        else if (message.startsWith("!trivia")) {
            var msg = "We're playing TRIVIA! Throughout the stream we will ask random trivia questions. You can answer with the command '!guess <your answer>'. You can change your answer with the same '!guess' command as many times as you need until a mod answers the question. Use '!score' to find out your score."
            client.say(channelName, msg);
        }
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
	}
	catch(error) {
		console.log("ERROR: " + error);
	}

});


