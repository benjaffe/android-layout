(function(){

	var lastKeyDate;

	app.store.init();

	// authenticate
	app.fb.authWithOAuthPopup("google", function(error, authData) {
		if (error) {
			console.log("Login Failed!", error);
		} else {
			console.log("Authenticated successfully with payload:", authData);
		}
		getUserList(10);
	});


	var ViewModel = function() {
		var vm = this;
		vm.timelines = ko.observableArray();
		vm.currentTimeline = ko.observable();
		vm.playTimeline = function() {
			var timeline = this.value;
			vm.currentTimeline(this);
			console.log(timeline);
			var firstTimelineNode = JSON.parse(timeline.initialNode);
			
			// ensure the order of our timeline by converting to an
			// array, then sorting the nodes by their original key
			timeline = Object.keys(timeline.nodes).sort().map(function (key) { 
				return JSON.parse(timeline.nodes[key]);
			});

			// add the first node
			timeline.unshift(firstTimelineNode);

			console.log(timeline);

			// calculate the content for each frame
			var contentTimeline = readDiff(timeline);

			var timeOffset = contentTimeline[0].timestamp;

			

			contentTimeline.forEach(function(node){
				var timeUntilDisplay = node.timestamp - timeOffset;
				var content = node.content;
				console.log(node);
				setTimeout(displayContent.bind(content), timeUntilDisplay);
			});

		};
	};

	app.viewModel = new ViewModel();

	ko.applyBindings( app.viewModel );



	function log (stuff) {
		document.getElementById('log').textContent = stuff;
	}

	function displayContent () {
		console.log('displaying ' + this);
		log(this);
	}

	function getUserList () {
		var users = [];
		app.fb.once('value',function(usersSnapshot) {
			usersSnapshot.forEach(function(userSnapshot) {
				users.push(userSnapshot.val());
			});

			displayUser (users[0]);
		});
	}

	function displayUser (user) {
		var paths = buildPathObject(user, '');
		app.viewModel.timelines( verifyTimelineOrder(paths));
		console.log(app.viewModel.timelines());
		
	}

	// return an object with keys of the path, value of the object
	function buildPathObject (node, path) {
		// console.log(path, node);
		var key, value;
		var obj = {};
		
		// return early if we're there
		if (node.nodes || node.initialNode) {
			obj[path] = node;
			return obj;
		}

		for (key in node) {
			if (node.hasOwnProperty(key)) {
				value = node[key];
				obj = objectExtend(obj, buildPathObject(value, path + '/' + key) );
			}
		}

		return obj;
	}

	// convert the timeline objects to arrays to verify the order of playback
	function verifyTimelineOrder (paths) {
		return Object.keys(paths).map(function (key) { 
			return {
				'key': key,
				'value': paths[key]
			}; 
		});
	}



	function objectExtend (obj1, obj2) {
		for (var i in obj2) {
			if (obj2.hasOwnProperty(i)) {
				obj1[i] = obj2[i];
			}
		}
		return obj1;
	}

	
	

	/**
	 * Converts a complete array of diffs into a content history
	 * @param  {[arr]} diff [diff operation arrays]
	 * @return {[arr]}      []
	 */
	function readDiff(diff) {
		var history = [];
		var finalContent = '';

		// run through every set of diff operations
		diff.forEach(function(diff){
			var i = 0, timestamp;

			// mutate the final content state for each diff operation
			diff.forEach(function(diffOp){
				var mode = diffOp[0];
				var content = diffOp.slice(1);
				var num = content*1;
				
				// addition
				if (mode === 'A') {
					finalContent = finalContent.substr(0, i) + content + finalContent.slice(i-1+content.length);
					// console.log('added ' + JSON.stringify(content) + ' at ' + i);
					i += content.length;
				}

				// removal
				else if (mode === 'R') {
					finalContent = finalContent.substr(0, i) + finalContent.slice(i+num);
					// console.log('removed ' + num + ' at ' + i);
					// console.log(finalContent.substr(0, i), '-', finalContent.slice(i+num));
				}

				// unchanged data
				else if (mode === '$') {
					// console.log('no action for ' + num + ' characters');
					i += num;
				}

				// absolute timestamp
				else if (mode === 'T') {
					lastKeyDate = num;
					timestamp = num;
				}

				// relative timestamp
				else if (mode === 't') {
					timestamp = lastKeyDate + num;
					lastKeyDate = timestamp;
				}
			});

			history.push({
				timestamp: timestamp,
				content: finalContent
			});
		});

		return history;
	}

})();