var app = app || {};

(function () {
	var errorList = [];
	var errors = function() {
		return errorList;
	};

	errors.push = function(error){
		errorList.push(error);
	};

	errors.clear = function() {
		errorList.length = 0;
	};

	app.errors = errors;

})(); 