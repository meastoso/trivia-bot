var tmi = require('tmi.js');
var express = require('express');
var app = express();
var channelName = "meastoso";
var scores = {}; // map to hold peoples scores
var userAnswers = {}; // used to hold answers each question
var answersMap = {};
var gameStarted = false; // default to false, let !start change this to true

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
  console.log('Example app listening on port 3000!')
});

app.use(express.static('site'));

app.get('/getLeaderboard', function (req, res) {
	var test = [
		{ 'rank': 1, 'name': 'aprilk', 'score': '124', 'percentCorrect': '80' },
		{ 'rank': 2, 'name': 'lanz', 'score': '123', 'percentCorrect': '75' },
		{ 'rank': 3, 'name': 'zaes', 'score': '122', 'percentCorrect': '70' },
		{ 'rank': 4, 'name': '1234567890123456789012345', 'score': '121', 'percentCorrect': '60' },
		{ 'rank': 5, 'name': 'meast', 'score': '120', 'percentCorrect': '50' }
	];
	res.send(test); // TODO replace with leaderboards
})

client.on('connected', function(address, port) {
        console.log("Connected!");
});

function populateQuestions() {
	// https://opentdb.com/api.php?amount=30&category=15&type=multiple
	var request = require('request');
	request('https://opentdb.com/api.php?amount=30&category=15&type=multiple', function (error, response, data) {
		if (!error && response.statusCode == 200) {
			console.log(data) // Print the body of response.
		}
		else {
			console.log("[ERROR] could you get questions from opentdb");
		}
	});
}

client.on('chat', function(channel, user, message, self) {
	if (self) return;
	var username = user['username'];
	/* ###########################
	 *     !answer
	 * ########################### */
        if ((user['mod'] || username === channelName) && message.startsWith("!answer")) {
		// TODO: send message to client websocket to show answer

		// answer current question
                var currentAnswersMapSize = Object.keys(answersMap).length + 1;
                answersMap[currentAnswersMapSize] = modAnswer;
                console.log("Mod " + username + " answered the question with answer: '" + modAnswer + "'. Saving as answer key: " + currentAnswersMapSize);
        }
	/* ###########################
         *     !next
         * ########################### */
	else if ((user['mod'] || username === channelName) && message.startsWith("!next")) {
                // parse answer submitted by mods
                var modAnswer = message.substring(8, message.length);
                var currentAnswersMapSize = Object.keys(answersMap).length + 1;
                answersMap[currentAnswersMapSize] = modAnswer;
                console.log("Mod " + username + " answered the question with answer: '" + modAnswer + "'. Saving as answer key: " + currentAnswersMapSize);
        }
	/* ###########################
	 *     !guess
	 * ###########################*/
        else if (message.startsWith("!guess ")) {
                // parse guess/answer
                var userGuessUnparsed = message.substring(7, message.length);
		var userGuess = userGuessUnparse.toLowerCase(); // make everything lowercase for final grading/scoring
                var currentAnswersMapSize = Object.keys(answersMap).length + 1;
                // this is wrong, need to make a nested object for each user and check it

                // check if user has an answer map yet
                var thisUserAnswers = userAnswers[username];
                if (thisUserAnswers === undefined || thisUserAnswers === null) {
                        // create this user's answer map
                        userAnswers[username] = {};
                        userAnswers[username][currentAnswersMapSize] = userGuess;
                }
                else {
                        // user already has answer map, just push in answer
                        thisUserAnswers[currentAnswersMapSize] = userGuess;
                }
        }
	/* ###########################
         *      !score
         * ########################### */
        else if (message.startsWith("!score")) {
                var percentCorrect = 0;
                var sessionScore = 0;
                var thisUserAnswers = userAnswers[username];
                var responseMsg = "default";
                if (thisUserAnswers === undefined || thisUserAnswers === null) {
                        responseMsg = username + " has not answered any questions yet.";
                }
                else {
                        // calculate score
                        // TODO: move this to shared method
			var totalCountedAnswers = 0;
                        var totalCorrectAnswers = 0;
                        for (var answer in thisUserAnswers) {
                                console.log(answer + ": " + thisUserAnswers[answer]);
                                // go get answer from modAnswers map
                                var matchingModAnswer = answersMap[answer];
                                if (matchingModAnswer !== undefined && matchingModAnswer !== null) {
                                        // found matching mod answer, check values
                                        if (thisUserAnswers[answer] == matchingModAnswer) {
                                                totalCorrectAnswers++;
                                        }
                                        totalCountedAnswers++;
                                }
                        }
                        if (totalCountedAnswers !== 0) {
                                percentCorrect = Math.round(totalCorrectAnswers / totalCountedAnswers * 100);
                        }
                        responseMsg = username + "'s score is: " + percentCorrect + "% with " + totalCorrectAnswers + " correct answers!";
                }
                client.action(channelName, responseMsg);
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
		if (gameStarted) {
			console.log("already started game!");
		}
		else {
			// START THE TRIVIA GAME!!
			console.log("STARTING TRIVIA!");
			gameStarted = true;
			populateQuestions();
		}
	}

});

