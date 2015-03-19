var app = app || {};

(function() {

	// this is the place the user codes
	var myCodeMirror;

	app.readyToRun = false;

	app.init = function() {
		// get the hash key
		app.hash = app.getHashKey();
		
		// create code input area
		app.initCodeMirror();
		
		// calculate editor layout
		refreshEditorLayout();

		// run the code
		app.run();

		// ensure CodeMirror code gets properly rendered
		requestAnimationFrame(function(){
			myCodeMirror.refresh();
		});

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
			mode: "xml",
			lineNumbers: true,
			fixedGutter: true,
			viewportMargin: Infinity,
			onChange: function() {
				app.run({ autorun: true });
			}
		});
	};

	app.getCodeForHash = function() {
		// this is for testing code (#/test/...)
		if (app.hash.slice(0,4) === 'test') {
			$.get('tests/android/' + app.hash.slice(9) + '.xml', function(data){
				myCodeMirror.setValue(data);
				myCodeMirror.refresh();
				app.run({
					code: data,
					force: true
				});
			}, 'text');
			$('.test-reference-image').attr('src', 'tests/android/' + app.hash.slice(9) + '.png');
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
		// save current student code
		if (app.hash.slice(0,4) === 'test') {
			return false;
		}
		localStorage['code-' + app.hash] = JSON.stringify(code);
	}

		
	// this function evaluates code based on the mode the app is in
	app.run = function (opt) {
		opt = opt || {};

		if (!app.readyToRun && !opt.force) return false;

		var codeRaw = opt.code || myCodeMirror.getValue();
		var code;
		var elemToRender;

		// run the code
		var mode = 'android-layout';
		if (mode === 'android-layout') {

			if (app.hash.slice(0,4) === 'test') {
				$('html').addClass('testing-mode');
				if (app.hash === 'test/and') {
					forwardFillTestingHistory('#/test/and/', app.tests);
				}
			} else {
				$('html').removeClass('testing-mode');
			}

			if (app.elementOutlinesEnabled) {
				$('html').addClass('element-outlines-enabled');
			} else {
				$('html').removeClass('element-outlines-enabled');
			}
			
			// try {
				// pre-processing hook
				code = app.androidLayout.prepareCodeForParsing( codeRaw );
				
				// catch easy-to-detect errors (like misaligned <>'s, quotes)
				app.androidLayout.xmlSanityCheck( codeRaw );

				// if we don't have code to render, exit early rather than throwing an error
				if (codeRaw === '') {
					return false;
				}

				// parse the XML
				app.parsedXML = jQuery.parseXML( code );
				
				// basic parsing and styling
				elemToRender = app.androidLayout.evaluateXML( app.parsedXML );
				
				// calculate all the layouts
				console.log('-------- layout pass --------');
				app.androidLayout.evaluateXMLPass2( app.parsedXML );

				// $('.output-area').removeClass('panel-warning');
				$('.code-saved-msg').removeClass('code-not-saved');
				runSuccess(codeRaw);
			// } catch (e) {
			// 	// $('.output-area').addClass('panel-warning');
			// 	$('.code-saved-msg').addClass('code-not-saved');
			// 	app.errors.push({
			// 		id: 'parseError'
			// 	});

			// 	// display the error (TODO: this should live in a method somewhere)
			// 	errors = app.errors();
			// 	if (errors.length > 0) {
			// 		$('.error-msg').show().html(errors.join('<br><br>'));
			// 	}

			// 	if (localStorage.debug) {
			// 		console.log('failed, but saving anyway since we\'re in debug mode');
			// 		runSuccess(codeRaw);
			// 	}
				
			// 	throw e;
			// }
		}

		if (elemToRender) {
			$('.screen').html('').append(elemToRender);
		}

		renderHistoryLinkState();
	};

	function forwardFillTestingHistory (prefix, urls) {
		// add each test to the history
		urls.forEach(function(url){
			history.pushState({}, '', prefix + url);
		});

		// go to the first one
		history.go((app.tests.length-1) * -1);
	}

	// undo/redo history state UI
	function renderHistoryLinkState () {
		console.log(myCodeMirror.historySize());
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


	function refreshEditorLayout () {
		$('.CodeMirror-scroll').css('height', $('.input-area').height());
	}

	$(window).bind('hashchange', function(e) {
		app.init();
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
	$('.link-reset-code').click(function(e) {
		if (!confirm('Press OK to reset your code to the default for this example.\n\nNote: This will overwrite your current code, but pressing Cmd/Ctrl Z will undo this change.')) {
			return false;
		}
		app.resetCodeToHashDefault();
	});

	$('.link-undo').click(function(e) {
		myCodeMirror.undo();
		renderHistoryLinkState();
	});

	$('.link-redo').click(function(e) {
		myCodeMirror.redo();
		renderHistoryLinkState();
	});



	if (localStorage.debug) {
		window.myCodeMirror = myCodeMirror;
	}

	app.androidInit();
	
	app.init();

})();

