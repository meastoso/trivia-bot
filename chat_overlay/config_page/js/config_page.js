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
	});
})(jQuery);