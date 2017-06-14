/**
* Javascript used to communicate with the current 
* express server to get/set configuration 
*/
(function($) {	
	$(document).ready(function(){
		
		// go and get the current configuration
		var req = $.get( "/getConfig", function(data) {
			console.log( "success" );
			console.log("Data is: " + JSON.stringify(data));
		})
		.done(function() {
			console.log( "second success" );
		})
		.fail(function() {
			console.log( "error" );
		})
		.always(function() {
			console.log( "finished" );
		});
			 
		// Perform other work here ...
			 
		// Set another completion function for the request above
		req.always(function() {
			console.log( "second finished" );
		});
		
		$("#addUserButton").on("click", function(e) {
			e.preventDefault();
			$("#addUserFormGroup").slideToggle();
		});
		
		$("#submitUserButton").on("click", function(e) {
			e.preventDefault();
			createUserDiv($("#input_addUsername").val());
			$("#input_addUsername").val('');
		});
		
		function createUserDiv(username) {
			var userImg = $("<img class='img-responsive user-img' src='img/user_icon.svg'>");
			var usernameSpan = $("<span class='name'>" + username + "</span>");
			var delImg = $("<a href='#'><img class='img-responsive del-img' src='img/del_icon.png'></a>");
			var newUserDiv = $("<div class='user'></div>");
			newUserDiv.append(userImg).append(usernameSpan).append(delImg);
			$(".users-container").append(newUserDiv);
			setClickHandlersForDeleteUser();
		}
		
		function setClickHandlersForDeleteUser() {
			$(".del-img").on("click", function(e) {
				e.preventDefault();
				$(this).closest("div.user").remove();
			});
		}
		
		setClickHandlersForDeleteUser(); // do this on page load for any existing delete things
		
	});
})(jQuery);