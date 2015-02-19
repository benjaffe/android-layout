
function renderAppUI (xml) {
	
	var data = parseXMLIntoHTML(xml);

}


function parseXMLIntoHTML (xml) {
	$('.screen').append(convertToHTML(xml, null));

}

function convertToHTML (elem, parent) {
	
	console.log((elem && elem.tagName) + (parent && parent.tagName ? ', parent of ' + parent.tagName : ''));
	var domElem = $('<div>');
	var type = elem.tagName;
	var attributes = elem.attributes;
	// console.log(attributes);

	$(elem).children().each(function(i, child) {
		var parent = elem;
		var childDomElem = convertToHTML(child, parent);
		$(domElem).append(childDomElem);
	});

	// case for the xml document itself
	if (!type) {
		domElem.addClass('screen-wrapper');
		return domElem;
	}

	// add a type class so we can style based on it
	domElem.addClass(type);

	// add content
	if (attributes['android:text']) domElem.text(attributes['android:text'].value);

	// hidden content
	if (checkAttr(attributes, 'android:visibility', 'gone')) domElem.hide();

	// convert widths and heights
	// console.log(attributes);
	if (attributes['android:layout_width'].value === 'match_parent') domElem.addClass('layout_width-match_parent');
	if (attributes['android:layout_width'].value === 'wrap_content') domElem.addClass('layout_width-wrap_content');
	if (attributes['android:layout_height'].value === 'match_parent') domElem.addClass('layout_height-match_parent');
	if (attributes['android:layout_height'].value === 'wrap_content') domElem.addClass('layout_height-wrap_content');


	// padding
	if (attributes['android:padding']) domElem.css("padding", parseInt(attributes['android:padding'].value)+'px');




	return domElem;
}

function checkAttr (attributes, name, value) {
	if (attributes[name] && 
		attributes[name].value === value) {
		console.log(attributes[name].value);
		return true;
	} else {
		return false;
	}
	
}

function contains(a, obj) {
    for (var i = 0; i < a.length; i++) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}



function run (opt) {
	opt = opt || {};

	var prog = myCodeMirror.getValue();

	// run the code
	var xml = jQuery.parseXML(prog);
	console.log(xml);
	renderAppUI(xml);
}


var myCodeMirror = CodeMirror(document.querySelector('.input-area'), {
	value: "<LinearLayout xmlns:android=\"http://schemas.android.com/apk/res/android\"\n    xmlns:tools=\"http://schemas.android.com/tools\"\n    android:layout_width=\"match_parent\"\n    android:layout_height=\"match_parent\"\n    android:orientation=\"vertical\">\n\n    <Button\n        android:id=\"@+id/guess_who_button\"\n        android:layout_width=\"match_parent\"\n        android:layout_height=\"wrap_content\"\n        style=\"?android:attr/borderlessButtonStyle\"\n        android:text=\"Guess who?\"\n        android:textSize=\"20sp\"\n        android:textColor=\"#ff2773b2\"\n        android:padding=\"20dp\"/>\n        \n    <RelativeLayout\n        android:layout_width=\"match_parent\"\n        android:layout_height=\"0dp\"\n        android:layout_weight=\"1\">\n\n        <ImageView\n            android:layout_width=\"match_parent\"\n            android:layout_height=\"match_parent\"\n            android:scaleType=\"centerCrop\"\n            android:src=\"@drawable/water\"/>\n\n        <TextView\n            android:id=\"@+id/birthday_message\"\n            android:text=\"Happy Birthday, Kristine!\"\n            android:layout_width=\"match_parent\"\n            android:layout_height=\"wrap_content\"\n            android:textSize=\"36sp\"\n            android:fontFamily=\"sans-serif-light\"\n            android:textColor=\"@android:color/white\"\n            android:gravity=\"center\"\n            android:padding=\"20dp\"/>\n\n        <TextView\n            android:id=\"@+id/from_message\"\n            android:layout_width=\"match_parent\"\n            android:layout_height=\"wrap_content\"\n            android:layout_alignParentBottom=\"true\"\n            android:gravity=\"center_horizontal\"\n            android:text=\"Love, Katherine\"\n            android:textSize=\"36sp\"\n            android:fontFamily=\"sans-serif-light\"\n            android:textColor=\"@android:color/white\"\n            android:padding=\"20dp\"\n            android:visibility=\"gone\"/>\n\n        <ImageView\n            android:id=\"@+id/photo\"\n            android:layout_width=\"match_parent\"\n            android:layout_height=\"200dp\"\n            android:scaleType=\"centerCrop\"\n            android:layout_above=\"@+id/from_message\"\n            android:src=\"@drawable/xmas\"\n            android:padding=\"50dp\"\n            android:visibility=\"gone\"/>\n\n    </RelativeLayout>\n\n    <Button\n        android:id=\"@+id/guess_who_button\"\n        android:layout_width=\"match_parent\"\n        android:layout_height=\"wrap_content\"\n        style=\"?android:attr/borderlessButtonStyle\"\n        android:text=\"Guess who?\"\n        android:textSize=\"20sp\"\n        android:textColor=\"#ff2773b2\"\n        android:padding=\"20dp\"/>\n</LinearLayout>",
	mode: "xml",
	onChange: function() {
		run({ autorun: true });
	}
});



// Event Listener Time!

$('.code-input-area').on('input', function(){
  run({ autorun: true });
}, false);

$(document).on('keydown', '.code-input-area', function(e) {
  console.log(e);
  if (e.keyCode === 13 && (e.metaKey || e.ctrlKey)) {
    run();
  }
});

// buttonElem.addEventListener('click', function(){
//   run();
// }, false);

run({ autorun: true });