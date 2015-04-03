var app = app || {};

app.store = {};

(function () {
	var firebasePath = "https://benjaffe.firebaseio.com/android-layout/users/";
	var sessionTime;

	app.store.init = function(uid) {
		if (uid) {
			app.fb = new Firebase(firebasePath + uid);
		} else {
			app.fb = new Firebase(firebasePath);
		}
	};

	app.store.setInitialTimelineNode = function(path, time, nodeStr) {
		sessionTime = time;
		app.fb.child(path).child(sessionTime).update({
			initialNode: nodeStr
		});
	};

	app.store.addTimelineNode = function(path, nodeStr) {
		app.fb.child(path).child(sessionTime).child('nodes').push(nodeStr);
	};

})(); 