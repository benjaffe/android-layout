var app = app || {};

app.store = {};

(function () {
	var firebasePath = "https://benjaffe.firebaseio.com/android-layout/users/";
	var sessionTime;

	app.store.init = function() {
		app.fb = new Firebase(firebasePath + app.uid);
	};

	app.store.setInitialTimelineNode = function(path, nodeStr) {
		sessionTime = Date.now();
		app.fb.child(path).child(sessionTime).update({
			initialNode: nodeStr
		});
	};

	app.store.addTimelineNode = function(path, node) {
		console.log(path, node);
		app.fb.child(path).child(sessionTime).child('nodes').push(node);
	};

})(); 