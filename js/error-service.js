var app = app || {};

(function () {
	var errorList = [];
	var errors = function() {
		var errorStrList = errorList.map(function(error){
			var text = app.androidLayout.errorList[error.id];
			for (var key in error) {
				console.log(key, error[key]);
				if (key !== 'id') {
					text = text.replace(key, error[key]);
				}
			}
			return text;
		});
		return errorStrList;
	};

	errors.push = function(error){
		errorList.push(error);
	};

	errors.unshift = function(error){
		errorList.unshift(error);
	};

	errors.clear = function() {
		errorList.length = 0;
	};

	app.errors = errors;

})(); 