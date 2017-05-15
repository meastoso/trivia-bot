var tmi = require('tmi.js');
var express = require('express');
var app = express();
var channelName = "meastoso";

var triviaEngine = require('./trivia/trivia.js');

triviaEngine.testFunctionPub();

var options = {
        options: {
                debug: true
        },
        connection: {
                cluster: "aws",
                reconnect: true
        },
        identity: {
                username: "fatbearbot_trivia",
                password: "oauth:cpoy739jnvgghlt4ol60l59kjtw9qu"
        },
        channels: [channelName]
};

var client = new tmi.client(options);
client.connect();

app.listen(3000, function () {
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

