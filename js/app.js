var app = app || {};

(function() {

	// this is the place the user codes
	var myCodeMirror = CodeMirror(document.querySelector('.input-area'), {
		value: "<LinearLayout xmlns:android=\"http://schemas.android.com/apk/res/android\"\n    xmlns:tools=\"http://schemas.android.com/tools\"\n    android:layout_width=\"match_parent\"\n    android:layout_height=\"match_parent\"\n    android:orientation=\"vertical\">\n\n        <RelativeLayout\n        android:layout_width=\"match_parent\"\n        android:layout_height=\"0dp\"\n        android:layout_weight=\"1\">\n\n        <ImageView\n            android:layout_width=\"match_parent\"\n            android:layout_height=\"match_parent\"\n            android:scaleType=\"centerCrop\"\n            android:src=\"@drawable/water\"/>\n\n        <TextView\n            android:id=\"@+id/birthday_message\"\n            android:text=\"Happy Birthday, Kristine!\"\n            android:layout_width=\"match_parent\"\n            android:layout_height=\"wrap_content\"\n            android:textSize=\"36sp\"\n            android:fontFamily=\"sans-serif-light\"\n            android:textColor=\"@android:color/white\"\n            android:gravity=\"center\"\n            android:padding=\"20dp\"/>\n\n        <TextView\n            android:id=\"@+id/from_message\"\n            android:layout_width=\"match_parent\"\n            android:layout_height=\"wrap_content\"\n            android:layout_alignParentBottom=\"true\"\n            android:gravity=\"center_horizontal\"\n            android:text=\"Love, Katherine\"\n            android:textSize=\"36sp\"\n            android:fontFamily=\"sans-serif-light\"\n            android:textColor=\"@android:color/white\"\n            android:padding=\"20dp\"\n            android:visibility=\"gone\"/>\n\n        <ImageView\n            android:id=\"@+id/photo\"\n            android:layout_width=\"match_parent\"\n            android:layout_height=\"200dp\"\n            android:scaleType=\"centerCrop\"\n            android:layout_above=\"@+id/from_message\"\n            android:src=\"@drawable/xmas\"\n            android:padding=\"50dp\"\n            android:visibility=\"gone\"/>\n\n    </RelativeLayout>\n\n    <Button\n        android:id=\"@+id/guess_who_button\"\n        android:layout_width=\"match_parent\"\n        android:layout_height=\"wrap_content\"\n        style=\"?android:attr/borderlessButtonStyle\"\n        android:text=\"Guess who?\"\n        android:textSize=\"20sp\"\n        android:textColor=\"#ff2773b2\"\n        android:padding=\"20dp\"/>\n</LinearLayout>",
		mode: "xml",
		lineNumbers: true,
		fixedGutter: true,
		onChange: function() {
			run({ autorun: true });
		}
	});


	// this function evaluates code based on the mode the app is in
	function run (opt) {
		opt = opt || {};

		var prog = myCodeMirror.getValue();
		var elemToRender, parsedXML;

		// run the code
		var mode = 'android-layout';
		if (mode === 'android-layout') {
			
			try {
				parsedXML = jQuery.parseXML(prog);
				elemToRender = app.androidLayout.evaluateXML( parsedXML );
				$('.output-area').removeClass('disabled');
			} catch (e) {
				console.error(e);
				$('.output-area').addClass('disabled');
			}
		}

		if (elemToRender) {
			$('.screen').html('').append(elemToRender);
		}
	}


	// auto-run on code mutation
	$('.code-input-area').on('input', function(){
	  run({ autorun: true });
	}, false);

	// manually run on Cmd-Enter / Ctrl-Enter
	$(document).on('keydown', '.code-input-area', function(e) {
	  if (e.keyCode === 13 && (e.metaKey || e.ctrlKey)) {
	    run();
	  }
	});

	// manually run when run btn is clicked
	$('.btn-run').on('click', function(){
	  run();
	}, false);

	// run (auto) once to get us going
	run({ autorun: true });
	
})();

