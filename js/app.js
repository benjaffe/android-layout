var app = app || {};

(function() {

	if (location.hash === '#tabletmode') {
		sessionStorage.tabletMode = 'true';
		location.hash = '/';
	}


	// this is the place the user codes
	var myCodeMirror;

	// this is a unique id assigned to the current page
	var pageInstanceUID;

	app.readyToRun = false;

	if (localStorage.uid) {
		app.uid = JSON.parse(localStorage.uid);
	} else {
		app.uid = Date.now().toString(36);
		localStorage.uid = JSON.stringify(app.uid);
	}

	app.initPage = function() {
		// get the hash key
		app.hash = app.getHashKey();

		// create code input area
		app.initCodeMirror();

		// calculate editor layout
		refreshEditorLayout();

		app.diffEngine = window.diffEngine();

    app.diffEncoder = app.diffEngine.getEncoder();

    // app.diffDecoder = app.diffEngine.getDecoder([]);

		// run the code
		app.run();

		// ensure CodeMirror code gets properly rendered
		requestAnimationFrame(function(){
			myCodeMirror.refresh();
		});

		// we're assuming they won't visit the same page twice within one second
		pageInstanceUID = Math.floor(Date.now()/1000);
		app.fb = new Firebase('https://android-visualizer.firebaseio.com/users/' + app.uid + '/' + app.hash + '/' + pageInstanceUID);

	};

	app.getHashKey = function() {
		var hash = location.hash;
		if (hash.length > 2 && hash.substr(0,2) === '#/') {
			return hash.slice(2);
		} else {
			return '';
		}
	};

	app.initCodeMirror = function(){
		// clear pre-existing code areas
		$('.input-area').html('');

		myCodeMirror = CodeMirror(document.querySelector('.input-area'), {
			value: app.getCodeForHash(),
			mode: "android-xml",
			lineNumbers: true,
			indentUnit: 4,
			fixedGutter: true,
			viewportMargin: Infinity
		});

    myCodeMirror.on('change', function(e){
      app.run({ autorun: true });
    });

    myCodeMirror.on('cursorActivity', function(e){
      var selection = e.doc.sel.ranges[0];
      if (selection.anchor.line === selection.head.line && selection.anchor.ch === selection.head.ch) {
        return false;
      }
      // storing as a string to circumvent a bug in jsDiff
      var selectionStr = '';
      selectionStr += 'anchor: line' + selection.anchor.line + ', char' + selection.anchor.ch + ';';
      selectionStr += 'head: line' + selection.head.line + ', char' + selection.head.ch + ';';
      updateState({
        selection: selectionStr
      });
    });

    // hooks for debugging
    if (localStorage.debug) {
      window.myCodeMirror = myCodeMirror;
    }
	};

	app.getCodeForHash = function() {
		// this is for testing code (#/test/...)
		if (app.hash.slice(0,4) === 'test') {
			$.get('tests/android/' + app.hash.slice(12) + '.xml', function(data){
				myCodeMirror.setValue(data);
				myCodeMirror.refresh();
				app.run({
					code: data,
					force: true
				});
			}, 'text');
			$('.test-reference-image').attr('src', 'tests/android/' + app.hash.slice(12) + '.png');
			return '';
		}

		// we have a previously-saved version
		if (localStorage['code-' + app.hash]) {
			return JSON.parse( localStorage['code-' + app.hash] );
		}

		// return the default (if there is one)
		else {
			return app.getCodeForHashDefault();
		}

		return '';
	};

	app.getCodeForHashDefault = function() {
		if (app.androidCodeDefaults) {
			if (app.androidCodeDefaults[ app.hash ]) {
				return app.androidCodeDefaults[ app.hash ];
			} else {
				return app.androidCodeDefaults[ 'default' ];
			}
		}

		return '';
	};


	app.resetCodeToHashDefault = function() {
		myCodeMirror.setValue(app.getCodeForHashDefault());
		myCodeMirror.refresh();
	};



	// this runs after code is successfully evaluated
	function runSuccess(code) {

    clearTimeout(app.codeEvaluationTimeout);

		// save current student code
		if (app.hash.slice(0,4) !== 'test') {
			localStorage['code-' + app.hash] = JSON.stringify(code);
		}

		$('html').removeClass('invalid-code evaluating-invalid-code');
		requestAnimationFrame(function(){
			$('html').addClass('valid-code');
		});

		$('.code-saved-msg').removeClass('code-not-saved');

	}

	// this runs if the code is considered invalid or unevaluatable
	function runFail (opt) {
		var code = opt.code;
		clearTimeout(app.codeEvaluationTimeout);
		$('html').removeClass('invalid-code').addClass('evaluating-invalid-code');

		app.codeEvaluationTimeout = setTimeout(function(){
	 		$('html').removeClass('evaluating-invalid-code').addClass('invalid-code');
		},2000);

		if (opt.errors) {
			opt.errors.forEach(function(errorID){
				// add any errors to the error stack
				app.errors.push({
					id: errorID
				});
			});
		}

		if (!localStorage.debug) {
			$('.code-saved-msg').addClass('code-not-saved');
		} else {
			console.log('failed, but saving anyway since we\'re in debug mode');
			runSuccess(code);
		}
	}

	function updateState (newState) {
		var state = app.state || {};
    var areChanges = false;
    var key;

		// copy over any new parameters from the previous state
		for(key in newState) {
      if (newState.hasOwnProperty(key)) {
        if (state[key] !== newState[key]) {
          areChanges = true;
    			state[key] = newState[key];
        }
      }
		}

    // if there are no changes in the new state object, we're not going to update
    if (!areChanges) {
      return false;
    }

		var diff = app.diffEncoder.push(state);
		app.state = state;
    // console.log(diff);
    // console.log(app.diffDecoder);
    // app.diffDecoder.setDiffs(app.diffEncoder.getDiffs());
    // console.log(app.diffDecoder.getState());
		// console.log(app.diffDecoder.getState().state);
		// console.log('pushing', diff);
		// console.log(app.fb);
    app.fb.child('diffs').push(diff);
	}


	// this function evaluates code based on the mode the app is in
	app.run = function (opt) {
		opt = opt || {};

		if (!app.readyToRun && !opt.force) return false;

		var codeRaw = opt.code || myCodeMirror.getValue();
		var code;
		var elemToRender;

		updateState({
			code: codeRaw
		});

		// run the code
		var mode = 'android-layout';
		if (mode === 'android-layout') {

			if (app.hash.slice(0,4) === 'test') {
				$('html').addClass('testing-mode');
				if (app.hash === 'test/android' || app.hash === 'test/android/') {
					forwardFillTestingHistory('#/test/android/', app.tests);
				}
			} else {
				$('html').removeClass('testing-mode');
			}

			// pre-processing hook
			code = app.androidLayout.prepareCodeForParsing( codeRaw );

			// catch easy-to-detect errors (like misaligned <>'s, quotes)
			app.androidLayout.xmlSanityCheck( codeRaw );

			// if we don't have code to render, exit early rather than throwing an error
			if (codeRaw === '') {
				return false;
			}

			// parse the XML
			try {
				app.parsedXML = jQuery.parseXML( code );
			} catch (e) {
				app.parsedXML = null;
			}


			if (app.parsedXML !== null) {
				// basic parsing and styling
				elemToRender = app.androidLayout.evaluateXML(app.parsedXML);

				// calculate all the layouts
				console.log('%c-------- layout pass at ' + Math.round(Date.now()/1000) + ' --------', 'color: #666');
				app.androidLayout.evaluateXMLPass2( app.parsedXML );
				if (app.errors().length > 0) {
					runFail({
						code: codeRaw
					});
				} else {
					runSuccess(codeRaw);
				}
			} else {

				runFail({
					code: codeRaw,
					errors: ['parseError']
				});

				$('html').removeClass('valid-code invalid-code')

			}
		}

		if (elemToRender) {
			$('.screen').html('').append(elemToRender);
		}

		renderErrors();

		renderHistoryLinkState();
		refreshEditorLayout();
		console.log('%c-------- end --------', 'color: #666');
	};


	function forwardFillTestingHistory (prefix, urls, startAtBeginning) {

		// add each test to the history
		urls.forEach(function(url){
			history.pushState({}, '', prefix + url);
		});

		// go to the first one
		if (startAtBeginning) {
			history.go((app.tests.length-1) * -1);
		}
	}


	// show the error list in the document
	function renderErrors () {
		var errors = app.errors();
		var errorStrArr = errors.map(function(error){ return error.value; });
		if (errors.length > 0) {
			$('.error-msg').show().html(errorStrArr.join('<hr>'));
			errors.forEach(function(error){
				if (error.line) {
					$('.CodeMirror-lines > div > div:last-child > pre:nth-child('+error.line+')').addClass('highlighted-code');
				}
			});
		} else {
			$('.error-msg').hide();
			$('.highlighted-code').removeClass('highlighted-code');
			console.log('%c No errors!', 'color: #393');
		}
	}


	// undo/redo history state UI
	function renderHistoryLinkState () {
		// console.debug(myCodeMirror.historySize());
		if (myCodeMirror.historySize().undo > 0) {
			$('.btn-undo').attr('disabled', false);
		} else {
			$('.btn-undo').attr('disabled', true);
		}
		if (myCodeMirror.historySize().redo > 0) {
			$('.btn-redo').attr('disabled', false);
		} else {
			$('.btn-redo').attr('disabled', true);
		}
	}

	// recalculate and resize the editor to the proper height
	function refreshEditorLayout () {
		var currentHeight = $('.CodeMirror').height();
		var containerHeight = $('.input-area-wrapper').outerHeight(true);
		var windowHeight = $(window).height();
		var wiggleRoom = 10;

		$('.CodeMirror-scroll').css('height', windowHeight - (containerHeight - currentHeight) - wiggleRoom);
		myCodeMirror.refresh();
	}


	$(window).bind('hashchange', function(e) {
		app.initPage();
	});

	// recalculate editor layout on resize
	$(window).resize(function(){
		refreshEditorLayout();
	});

	// auto-run on code mutation
	$('.code-input-area').on('input', function(){
	  app.run({ autorun: true });
	}, false);

	// manually run on Cmd-Enter / Ctrl-Enter
	$(document).on('keydown', '.code-input-area', function(e) {
	  if (e.keyCode === 13 && (e.metaKey || e.ctrlKey)) {
	    app.run();
	  }
	});

	// manually run when run btn is clicked
	$('.btn-run').on('click', function(){
	  app.run();
	}, false);

	// toggle checkbox states
	$('#toggle-element-outline').change(function(e){
		app.elementOutlinesEnabled = e.target.checked;
		app.run();
	});

	// reset code button
	$('.btn-reset-code').click(function(e) {
		if (!confirm('Press OK to reset your code to the default for this example.\n\nNote: This will overwrite your current code, but pressing Cmd/Ctrl Z will undo this change.')) {
			return false;
		}
		app.resetCodeToHashDefault();
	});

	// undo/redo
	$('.btn-undo').click(function(e) {
		myCodeMirror.undo();
		renderHistoryLinkState();
	});

	$('.btn-redo').click(function(e) {
		myCodeMirror.redo();
		renderHistoryLinkState();
	});



	// hooks for tablet mode
	if (sessionStorage.tabletMode === 'true') {
		$('#input-topbar').hide().parent().css('padding-top', '12px');
		$('.input-area').css('font-size', '120%');
		$('html').addClass('tablet-mode');
	}


	$('.input-area').mousemove(function(e){ updateMousePosition(e) });



	// report-an-issue modal event listener
	$('#issue-dialog').on('shown.bs.modal', function(e){
		// grab the code from our codeMirror instance
		$('#entry_440939498').val( myCodeMirror.getValue() );

		// grab the user's uid and path
		$('#entry_1934743275').val( JSON.parse(localStorage.uid) + '/' + app.hash + '/' + pageInstanceUID );
	});

  // report-an-issue submittal iframe
	$('#hidden_iframe').on('load', function(e){
		if (submitted) {
			$('#issue-dialog').modal('hide');
			$('#issue-submitted-dialog').modal('show');

			// clear everything
			$('#issue-dialog textarea').val('');
			$('#entry_1934743275').val('');
			$('#issue-dialog [type=radio]').prop('checked', false);

			// grab the user's uid and path
			$('#entry_1934743275').val( JSON.parse(localStorage.uid) + '/' + app.hash + '/' + pageInstanceUID );
			submitted = false;
		}
	});



	var timeOfLastUpdate;
	var updateDebounceThreshold = 1000;
	var lastDebouncedState = null;
	var finalStateUpdateTimeout;

	var updateMousePosition = function(e) {
    var offset = $('.CodeMirror').offset();
    var cmOffset = myCodeMirror.getScrollInfo();
    var mouse = [e.pageX - offset.left + cmOffset.left, e.pageY - offset.top + cmOffset.top];

		var state = lastDebouncedState || {};

		// I'm setting a floor of threshold/4 to give the actual state update
		// a chance to happen. Otherwise, it'd updateDebouncedState exactly on
		// time, not giving normal state updates a chance to happen (and therefore
		// resulting in stale data).
		var timeToUpdateWithFinalState = Math.max(updateDebounceThreshold / 4, updateDebounceThreshold - (Date.now() - timeOfLastUpdate));

		state.mouse = mouse;

		clearTimeout(finalStateUpdateTimeout);

		if (timeOfLastUpdate && (Date.now() - timeOfLastUpdate < updateDebounceThreshold)) {
			lastDebouncedState = state;
			finalStateUpdateTimeout = setTimeout(updateDebouncedState, timeToUpdateWithFinalState);
			return false;
		}

		timeOfLastUpdate = Date.now();
		lastDebouncedState = null;
		updateState(state);
	};

	function updateDebouncedState () {
		timeOfLastUpdate = Date.now();
		updateState(lastDebouncedState);
	}

	app.androidInit();

	app.initPage();

})();

