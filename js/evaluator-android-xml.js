var app = app || {};

(function() {
	app.androidLayout = {
		evaluateXML: evaluateXML,
		xmlSanityCheck: xmlSanityCheck,
		prepareCodeForParsing: prepareCodeForParsing
	};

	fontFamilyList = {
		'sans-serif-light': "Arial, 'Helvetica Neue', Helvetica, sans-serif"
	};

	errorList = {
		'tooManyOpenBrackets': '<strong>You have more \'<\'s than \'>\'s:</strong><br>Did you accidentally write an incomplete tag?',
		'tooManyCloseBrackets': '<strong>You have more \'>\'s than \'<\'s:</strong><br>Check to see if you added an unneccesary \'>\', or accidentally deleted the beginning of a tag.',
		'oddNumQuotes': '<strong>There are an odd number of "\'s in the document:</strong><br>Did you forget to close a quote?'
	};

	
	// add the schema links if they are missing
	function prepareCodeForParsing (rawCode) {
		var code = rawCode;
		var startPos = rawCode.indexOf('<');
		var insertPos = rawCode.indexOf(' ', startPos);

		if (rawCode.split('xmlns:android').length === 1) {
			pos = rawCode.indexOf(' ');
			code = code.substr(0, insertPos) + '\txmlns:android="http://schemas.android.com/apk/res/android"\n' + code.substr(insertPos);
		}
		if (rawCode.split('xmlns:tools').length === 1) {
			
			code = code.substr(0, insertPos) + '\txmlns:tools="http://schemas.android.com/tools"\n' + code.substr(insertPos);
		}
		console.log(startPos, insertPos, code);
		return code;
	}


	function xmlSanityCheck (code) {
		// check for equal numbers of angle brackets
		var errors = [];
		var aOpen = code.split('<').length-1;
		var aClose = code.split('>').length-1;
		var dqNum = code.split('"').length-1;
		
		if (aOpen > aClose)
			errors.push(errorList.tooManyOpenBrackets);
		
		if (aClose > aOpen)
			errors.push(errorList.tooManyCloseBrackets);
		
		if (dqNum % 2 !== 0)
			errors.push(errorList.oddNumQuotes);
		
		if (errors.length > 0) {
			$('.error-msg').show().html(errors.join('<br><br>'));
			throw new Error('XML Parsing Error');
		} else {
			$('.error-msg').hide();
			console.log('No errors!');
		}
	}

	function evaluateXML (elem, parent) {

		// console.log((elem && elem.tagName) + (parent && parent.tagName ? ', parent of ' + parent.tagName : ''));
		var domElem = $('<div>');
		var type = elem.tagName;
		var attributes = elem.attributes;
		// console.log(attributes);

		// a bit of recursive fun here to get this going for every XML element in the document
		$(elem).children().each(function(i, child) {
			var parent = elem;
			var childDomElem = evaluateXML(child, parent);
			$(domElem).append(childDomElem);
		});

		
		// If elem is the xml document itself, return early
		// Otherwise, let's do some parsing!
		if (!type) {

			domElem.addClass('screen-wrapper');
			return domElem;
		}


		// add a type class so we can style based on it
		domElem.addClass(type);

		checkAttr = checkAttributesOnThis.bind(attributes);

		// add content
		if (attributes['android:text']) domElem.text(attributes['android:text'].value);

		// hidden content
		if (checkAttr('android:visibility', 'gone')) domElem.hide();

		// convert widths and heights
		// console.log(attributes);
		if (checkAttr('android:layout_width', 'match_parent')) domElem.addClass('layout_width-match_parent');
		else if (checkAttr('android:layout_width', 'wrap_content')) domElem.addClass('layout_width-wrap_content');
		else if (checkAttr('android:layout_width')) {
			var widthOrig = attributes['android:layout_width'].value;
			var width = parseInt(widthOrig)+'px';
			domElem.css('width', width);
		}
		if (checkAttr('android:layout_height', 'match_parent')) domElem.addClass('layout_height-match_parent');
		else if (checkAttr('android:layout_height', 'wrap_content')) domElem.addClass('layout_height-wrap_content');
		else if (checkAttr('android:layout_height')) {
			var heightOrig = attributes['android:layout_height'].value;
			var height = parseInt(heightOrig)+'px';
			domElem.css('height', height);
		}

		// check for alignParent (absolute positioning to parent)
		if (checkAttr('android:layout_alignParentTop', 'true')) domElem.css('top','0');
		if (checkAttr('android:layout_alignParentBottom', 'true')) domElem.css('bottom','0');
		if (checkAttr('android:layout_alignParentLeft', 'true')) domElem.css('left','0');
		if (checkAttr('android:layout_alignParentRight', 'true')) domElem.css('right','0');


		// layout_gravity
		if (checkAttr('android:layout_gravity')) {
			var vals = attributes['android:layout_gravity'].value.split('|');
			for (var i = 0; i < vals.length; i++) {
				domElem.css( vals[i] , 0);
			}
		}

		// check for center (this will probably have to get better and use flex)
		if (checkAttr('android:gravity', ['center', 'center_horizontal'])) domElem.addClass('gravity-center');

		// add images
		if (attributes['android:src']) {
			t = attributes['android:src'].value.split('/')[1];
			if (t) {
				domElem.css({'background-image': 'url(images/'+t+'.jpg)'});
			}
		}

		if (checkAttr('android:scaleType', 'centerCrop')) domElem.addClass('scaleType-centerCrop');
		if (checkAttr('android:scaleType', 'centerInside')) domElem.addClass('scaleType-centerInside');



		// padding
		if (attributes['android:padding']) domElem.css('padding', parseInt(attributes['android:padding'].value)+'px');


		// text styling
		if (checkAttr('android:textColor')) {
			var colorOrig = attributes['android:textColor'].value;
			var color = (colorOrig[0] === '#' ? '#'+colorOrig.substr(3) : colorOrig.split('@android:color/')[1]);
			domElem.css('color', color);
		}

		if (checkAttr('android:textSize')) {
			var sizeOrig = attributes['android:textSize'].value;
			var size = parseInt(sizeOrig) + 'px';
			domElem.css('font-size', size); // we should be checking units rather than assuming
		}

		if (checkAttr('android:fontFamily')) {
			var fontFamilyOrig = attributes['android:fontFamily'].value;
			var fontFamily = fontFamilyList[fontFamilyOrig] || 'Roboto, sans-serif';
			domElem.css('font-family', fontFamily); // we should be checking units rather than assuming
		}
		


		return domElem;
	}

	function checkAttributesOnThis (name, value) {
		// check for existence
		if (value === undefined) {
			return !!this[name];
		}
		
		if (typeof value === 'string') {
			return (this[name] && this[name].value === value);
		} else if (value instanceof Array) {
			// we have to test all the potential values given to us
			for (var i = 0; i < value.length; i++) {
				if (this[name] && 
					this[name].value === value[i]) {
					return true;
				}
			}
		}

		return false;
	}
})();