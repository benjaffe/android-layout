var app = app || {};

(function () {
	var errorList = [];
	var errors = function() {
		var errorStrList = errorList.map(function(error){
			var value = app.androidLayout.errorList[error.id];
			var line = null;
			for (var key in error) {
				
				if (key !== 'id') {
					value = value.replace(key, error[key]);
				}

				if (key === '$lineNum') {
					line = error[key];
				}
			}
			return {
				value: value,
				line: line
			};
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