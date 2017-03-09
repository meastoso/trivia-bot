var tmi = require('tmi.js');
var express = require('express');
var app = express();
var channelName = "meastoso";
var scores = {}; // map to hold peoples scores
var userAnswers = {}; // used to hold answers each question
var answersMap = {};
var gameStarted = false; // default to false, let !start change this to true
var questions = [];
var currentParsedQuestion = {};
var currentQuestionIndex = 0; // used to track the index of the current question from questions array
var leaderBoard = [];

var WebSocketServer = require('websocket').server;
var http = require('http');

var server = http.createServer(function(request, response) {
    // process HTTP request. Since we're writing just WebSockets server
    // we don't have to implement anything.
});
server.listen(1337, function() { });

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
	/*leaderBoard = [
		{ 'rank': 1, 'name': 'aprilk', 'score': '124', 'percentCorrect': '80' },
		{ 'rank': 2, 'name': 'lanz', 'score': '123', 'percentCorrect': '75' },
		{ 'rank': 3, 'name': 'zaes', 'score': '122', 'percentCorrect': '70' },
		{ 'rank': 4, 'name': '1234567890123456789012345', 'score': '121', 'percentCorrect': '60' },
		{ 'rank': 5, 'name': 'meast', 'score': '120', 'percentCorrect': '50' }
	];*/
	res.send(leaderBoard); // TODO replace with leaderboards
})

client.on('connected', function(address, port) {
        console.log("Connected!");
});

/**
* TODO: document method
* 	Categories (ID):
	Video Games - 15
	TV - 14
	Music - 12
	Movies - 11
	General Knowledge - 8
*/
function populateQuestions() {
	var request = require('request');
	request('https://opentdb.com/api.php?amount=10&category=15&difficulty=easy&type=multiple', function (error, response, data) {
		if (!error && response.statusCode == 200) {
			var resp = JSON.parse(data);
			if (resp["response_code"] != 0) {
				console.log("[ERROR] failed to retrieve questions, response code: " + resp["response_code"]);
				return;
			}
			questions = resp["results"]; // store question objects in scoped variable accessible by other methods
		}
		else {
			console.log("[ERROR] failed to get questions from opentdb: " + error);
		}
		// now go fetch additional questions of a different category
		request('https://opentdb.com/api.php?amount=10&category=14&difficulty=easy&type=multiple', function (error, response, data) {
			if (!error && response.statusCode == 200) {
	                        var resp = JSON.parse(data);
	                        if (resp["response_code"] != 0) {
	                                console.log("[ERROR] failed to retrieve questions, response code: " + resp["response_code"]);
	                                return;
	                        }
	                }
	                else {
	                        console.log("[ERROR] failed to get questions from opentdb: " + error);
	                }
			var theseQuestions = resp["results"];
			for (var i = 0; i < theseQuestions.length; i++) {
				pushRandom(questions, theseQuestions[i]);
			}
			// now go fetch additional questions of a different category
	                request('https://opentdb.com/api.php?amount=10&category=12&difficulty=easy&type=multiple', function (error, response, data) {
	                        if (!error && response.statusCode == 200) {
	                                var resp = JSON.parse(data);
	                                if (resp["response_code"] != 0) {
	                                        console.log("[ERROR] failed to retrieve questions, response code: " + resp["response_code"]);
	                                        return;
	                                }
	                        }
	                        else {
	                                console.log("[ERROR] failed to get questions from opentdb: " + error);
	                        }
	                        var theseQuestions = resp["results"];
	                        for (var i = 0; i < theseQuestions.length; i++) {
	                                pushRandom(questions, theseQuestions[i]);
	                        }
				// now go fetch additional questions of a different category
	                        request('https://opentdb.com/api.php?amount=10&category=11&difficulty=easy&type=multiple', function (error, response, data) {
	                                if (!error && response.statusCode == 200) {
	                                        var resp = JSON.parse(data);
	                                        if (resp["response_code"] != 0) {
	                                                console.log("[ERROR] failed to retrieve questions, response code: " + resp["response_code"]);
	                                                return;
	                                        }
	                                }
	                                else {
	                                        console.log("[ERROR] failed to get questions from opentdb: " + error);
	                                }
	                                var theseQuestions = resp["results"];
	                                for (var i = 0; i < theseQuestions.length; i++) {
	                                        pushRandom(questions, theseQuestions[i]);
	                                }
	                        });
	                });
		});

	});
}

/**
* TODO: documentation
*/
function pushRandom(pushToArray, questionObj) {
	var max = pushToArray.length - 1;
	var min = 0;
	var randIndex = Math.random() * (max - min) + min;
	pushToArray.splice(randIndex, 0, questionObj);
}

/**
* TODO: document
* @return js obj with the following structure:
	{ 
		difficulty: diff,
		question: ques,
		answer: ans,
		options: {
			a: optionA,
			b: optionB,
			c: optionC,
			d: optionD
		}
	}
*/
function parseQuestion(question) {
	var parsedQuestion = {
		"difficulty": question["difficulty"],
		"question": question["question"]
	};
	var answerNum = Math.floor(Math.random() * 3); // random number between 0 and 3
	var options = {};
	var incorrectAnswersArr = question["incorrect_answers"];
	for (var i = 0; i < 4; i++) {
		var alphaChar = String.fromCharCode(i+97); // 'a' == ascii #97
		if (i == answerNum) {
			// insert the answer as option here
			options[alphaChar] = question["correct_answer"];
			parsedQuestion["answer"] = alphaChar;
		}
		else {
			// make a clone of the string char as we splice the array
			options[alphaChar] = JSON.parse(JSON.stringify(incorrectAnswersArr[0]));
			incorrectAnswersArr.splice(0,1); // remove first entry in array
		}
	}
	parsedQuestion["options"] = options;
	console.log(parsedQuestion);
	return parsedQuestion;
}

/**
* TODO: document this
*/ 
function updateLeaderboard() {
	var usernameScoreMap = {};
	var tempArr = [];
	for (var username in userAnswers) {
		tempArr.push(calculateUserScoreObj(username)); // get the user's score object (percent, session and total correct)
	}
	tempArr.sort(function(a, b) { 
		// sort by sessionScore descending
    		return b.sessionScore - a.sessionScore;
	});
	// add rank property
	var previousScore = -1;
	var previousRank = -1;
	for (var i = 0; i < tempArr.length; i++) {
		if (tempArr[i].sessionScore == previousScore) { // tie, use previous iterator for rank
			tempArr[i]["rank"] = previousRank;
		}
		else {
			tempArr[i]["rank"] = i+1;
		}
		previousScore = tempArr[i].sessionScore;
		previousRank = tempArr[i].rank;
	}
	leaderBoard = tempArr;
}

function getUserScore(username) {
	for (var i = 0; i < leaderBoard.length; i++) {
		var userScoreObj = leaderBoard[i];
		if (userScoreObj.username == username) {
			return userScoreObj;
		}
	}
}

/**
* TODO: docs
*/
function calculateUserScoreObj(username) {
	var percentCorrect = 0;
        var sessionScore = 0;
	var totalCorrectAnswers = 0;
	var userScoreObj = {
		"username": username,
		"percentCorrect": percentCorrect,
		"sessionScore": sessionScore,
		"totalCorrectAnswers": totalCorrectAnswers
	} 
	var thisUserAnswers = userAnswers[username];       
	if (thisUserAnswers === undefined || thisUserAnswers === null) {
		return userScoreObj; // returns 0s as default
	}
	else {
		// calculate score
		var totalCountedAnswers = 0;
		for (var answer in thisUserAnswers) {
			// go get answer from modAnswers map
			var matchingModAnswer = answersMap[answer];
			if (matchingModAnswer !== undefined && matchingModAnswer !== null) {
				// found matching mod answer, check values
				if (thisUserAnswers[answer] == matchingModAnswer) {
					totalCorrectAnswers++;
					sessionScore = sessionScore + 3;
				}
				else {
					sessionScore = sessionScore - 0;
				}
				totalCountedAnswers++;
			}
		}
		if (totalCountedAnswers !== 0) {
			percentCorrect = Math.round(totalCorrectAnswers / totalCountedAnswers * 100);
		}
		sessionScore = sessionScore - getDecayValue(username);
		userScoreObj["percentCorrect"] = percentCorrect;
		userScoreObj["sessionScore"] = sessionScore;
		userScoreObj["totalCorrectAnswers"] = totalCorrectAnswers;
	}
	return userScoreObj;
}

/**
* TODO: documentation
* @return int
*/
function getDecayValue(username) {
	// 1. find smallest key value as starting point
	// 2. use smallest key value, loop through master answer key map starting at that index
	// 3. for each master answer, check if answer exists in user's answer. if not, user didn't answer decay -1
	var decayValue = 0;
	var thisUserAnswers = userAnswers[username]; // guaranteed not null 
	if (thisUserAnswers === undefined || thisUserAnswers === null) {
		return 0;
        }
	var firstAnswer = 100; // arbitrary large number
	for (var answerKey in thisUserAnswers) {
		if (answerKey < firstAnswer) {
			firstAnswer = parseInt(answerKey);
		}
	}
	// use smallest key value, loop through master answer key map starting at that index
	for (var masterAnswerKey in answersMap) {
		if (masterAnswerKey >= firstAnswer && thisUserAnswers[masterAnswerKey] === undefined) {
			// found a question the user didn't answer, add (1) to decay value returned
			decayValue = decayValue + 1;
		}
	}

	return decayValue;
}

/**
* TODO: document object type used here
*/
function sendClientMsg(msgObj) {
	if (connection === undefined) {
		console.log("[ERROR] OBS hasn't established browser source to create websocket!");
		return;
	}
	connection.sendUTF(JSON.stringify(msgObj));
}

function sendAnswerToClient(answer) {
	var answerMsgObj = {
		"type": "answer",
		"data": answer
	};
	sendClientMsg(answerMsgObj);
}

function sendNextQuestionToClient(question) {
	var questionMsgObj = {
		"type": "question",
		"data": question
	};
	sendClientMsg(questionMsgObj);
}

function enterUserGuess(username, userGuess) {
                var currentAnswersMapSize = Object.keys(answersMap).length + 1;
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

client.on('chat', function(channel, user, message, self) {
	if (self) return;
	var username = user['username'];
	/* ###########################
	 *     !answer
	 * ########################### */
        if ((user['mod'] || username === channelName) && message.startsWith("!answer")) {
		// TODO: send message to client websocket to show answer

		var currentAnswer = currentParsedQuestion["answer"];
                var currentAnswersMapSize = Object.keys(answersMap).length + 1;
                answersMap[currentAnswersMapSize] = currentAnswer;
                console.log("Answered the question with answer: '" + currentAnswer + "'. Saving as answer key: " + currentAnswersMapSize);
		updateLeaderboard();
		sendAnswerToClient(currentAnswer);
        }
	/* ###########################
         *     !next
         * ########################### */
	else if ((user['mod'] || username === channelName) && message.startsWith("!next")) {
		if (currentQuestionIndex !== 0 || Object.keys(currentParsedQuestion).length > 1) {
			// don't incremement first time through
			currentQuestionIndex = currentQuestionIndex + 1;
		}
		// TODO push new question to screen
		currentParsedQuestion = parseQuestion(questions[currentQuestionIndex]);
		sendNextQuestionToClient(currentParsedQuestion);
        }
	/* ###########################
	 *     !guess
	 * ###########################*/
        else if (message.startsWith("!guess ")) {
                // parse guess/answer
                var userGuessUnparsed = message.substring(7, message.length);
		var userGuess = userGuessUnparsed.toLowerCase(); // make everything lowercase for final grading/scoring
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
		var userScoreObj = getUserScore(username);
		var responseMsg = username + " is rank #" + userScoreObj.rank + " with a game score of " + userScoreObj.sessionScore + ". (" + userScoreObj.totalCorrectAnswers + " correct answers - [" + userScoreObj.percentCorrect + "%])";
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
	else if (username === channelName && message.startsWith("!testguess")) {
		enterUserGuess("testGuessA", "a");
		enterUserGuess("testGuessB", "b");
		enterUserGuess("testGuessC", "c");
		enterUserGuess("testGuessD", "d");
	}
	else if (message.startsWith("!conn")) {
		connection.sendUTF(JSON.stringify( { type: 'history', data: "whocares this is a test"} ));

	}

});

