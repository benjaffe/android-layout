var app = app || {};

(function() {
	app.androidLayout = app.androidLayout || {};

	var fontFamilyList = app.androidLayout.fontFamilyList;
	var errorList = app.androidLayout.errorList;

	$.extend(app.androidLayout, {
		evaluateXML: evaluateXML,
		evaluateXMLPass2: evaluateXMLPass2,
		xmlSanityCheck: xmlSanityCheck,
		prepareCodeForParsing: prepareCodeForParsing
	});
	
	
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
		var i, width, widthOrig, height, heightOrig, vals, colorOrig, color, sizeOrig, size, style, styleArr, bold, italic, fontFamilyOrig, fontFamilyObj;

		// console.log((elem && elem.tagName) + (parent && parent.tagName ? ', parent of ' + parent.tagName : ''));
		var domElem = $('<div>');
		var type = elem.tagName;
		var attributes = elem.attributes;

		// associate the DOM element with the XML element
		elem.domElem = domElem;

		// a bit of recursive fun here to get this going for every XML element in the document
		$(elem).children().each(function(i, child) {
			var childDomElem = evaluateXML(child, elem);
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
		if (checkAttr('android:layout_width', 'match_parent')) {
			domElem.addClass('layout_width-match_parent');
		} else if (checkAttr('android:layout_width', 'wrap_content')) {
			domElem.addClass('layout_width-wrap_content');
		} else if (checkAttr('android:layout_width')) {
			widthOrig = attributes['android:layout_width'].value;
			width = parseInt(widthOrig)+'px';
			domElem.css('width', width);
		}

		if (checkAttr('android:layout_height', 'match_parent')) {
			domElem.addClass('layout_height-match_parent');
		} else if (checkAttr('android:layout_height', 'wrap_content')) {
			domElem.addClass('layout_height-wrap_content');
		} else if (checkAttr('android:layout_height')) {
			heightOrig = attributes['android:layout_height'].value;
			height = parseInt(heightOrig)+'px';
			domElem.css('height', height);
		}


		// layout_gravity
		if (checkAttr('android:layout_gravity')) {
			vals = attributes['android:layout_gravity'].value.split('|');
			for (i = 0; i < vals.length; i++) {
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


		// background styling
		if (checkAttr('android:background')) {
			colorOrig = attributes['android:background'].value;
			color;
			if (colorOrig[0] === '#') {
				if (colorOrig.length === 9) {
					color = '#' + colorOrig.substr(-6);
				} else {
					color = colorOrig;
				}
			} else {
				color = app.androidLayout.COLOR[colorOrig.split('@android:color/')[1]];
			}
			domElem.css('background-color', color);
		}


		// text styling
		if (checkAttr('android:textColor')) {
			colorOrig = attributes['android:textColor'].value;
			color = (colorOrig[0] === '#' ? '#'+colorOrig.substr(3) : app.androidLayout.COLOR[colorOrig.split('@android:color/')[1]]);
			domElem.css('color', color);
		}

		if (checkAttr('android:textSize')) {
			sizeOrig = attributes['android:textSize'].value;
			size = parseInt(sizeOrig) + 'px';
			domElem.css('font-size', size); // we should be checking units rather than assuming
		}

		if (checkAttr('android:textStyle')) {
			style = attributes['android:textStyle'].value;
			styleArr = style.split('|');
			bold = (styleArr.indexOf('bold') !== -1);
			italic = (styleArr.indexOf('italic') !== -1);
			
			if (bold)
				domElem.css('font-weight', 'bold');

			if (italic)
				domElem.css('font-style', 'italic');
		}

		if (checkAttr('android:fontFamily')) {
			fontFamilyOrig = attributes['android:fontFamily'].value;
			fontFamilyObj = fontFamilyList[fontFamilyOrig];
			console.log(fontFamilyObj, fontFamilyOrig);
			domElem.css('font-family', fontFamilyObj.fontFamily);

			// 'sans-serif' and 'sans-serif-condensed' are allowed to be bold.
			// They should retain their calculated font-weight from above
			if (fontFamilyOrig !== 'sans-serif' && fontFamilyOrig !== 'sans-serif-condensed') {
				domElem.css('font-weight', fontFamilyObj.fontWeight);
			}
		}




		return domElem;
	}

	// This is the second pass, where any layout relative to other 
	// elements is calculated.
	function evaluateXMLPass2 (elem, parent) {
		var domElem = elem.domElem;

		layoutElem(elem);

		$(elem).children().each(function(i, child) {
			var childDomElem = evaluateXMLPass2(child, parent);
		});

	}

	// Gets the element that matches the id passed
	function getElemById (id) {
		console.log('looking for elem ' + id);
		var elem = $(app.parsedXML).find('[android:id='+id+']');
		if (elem) console.log(elem);
		return elem;
	}

	// This function calculates the positioning of an element.
	// If the elem is relative to another, it calls layoutElem
	// on the elem it's positioned relative to.
	function layoutElem (xmlElem) {
		var idOfRelativeElem, relativeElem, attributes;
		var domElem = xmlElem.domElem;

		if (xmlElem.domElemLayout) {
			console.log('\tSweet, we\'ve already layed out this');
			return xmlElem.domElemLayout;
		}

		attributes = xmlElem.attributes;
		checkAttr = checkAttributesOnThis.bind(attributes);
		console.log('laying out', (xmlElem.tagName || '') + ' ' + ($(xmlElem).attr('android:id')||''));

		if (xmlElem.domElemLayout) {
			console.log('Hey, we\'re already layed out!', xmlElem);
		}

		// check for alignParent (absolute positioning to parent)
		if (checkAttr('android:layout_alignParentTop', 'true')) {
			domElem.css('top', layoutElem(xmlElem.parentNode).top);
		}
		if (checkAttr('android:layout_alignParentBottom', 'true')) {
			domElem.css('bottom', layoutElem(xmlElem.parentNode).bottom);
		}
		if (checkAttr('android:layout_alignParentLeft', 'true')) {
			domElem.css('left', layoutElem(xmlElem.parentNode).left);
		}
		if (checkAttr('android:layout_alignParentRight', 'true')) {
			domElem.css('right', layoutElem(xmlElem.parentNode).right);
		}


		// check for alignment relative to other views
		if (checkAttr('android:layout_toStartOf')) {
			idOfRelativeElem = elem.attributes('android:layout_toStartOf');
			relativeElem = getElemById(idOfRelativeElem);
			console.log('aww shit!');
			positionOfRelativeElem = layoutElem(relativeElem);
		}

		if (checkAttr('android:layout_toEndOf')) {
			idOfRelativeElem = elem.attributes('android:layout_toEndOf');
			relativeElem = getElemById(idOfRelativeElem);
			console.log('aww shit!');
			positionOfRelativeElem = layoutElem(relativeElem);
		}

		if (checkAttr('android:layout_toLeftOf')) {
			idOfRelativeElem = elem.attributes('android:layout_toLeftOf');
			relativeElem = getElemById(idOfRelativeElem);
			console.log('aww shit!');
			positionOfRelativeElem = layoutElem(relativeElem);
		}

		if (checkAttr('android:layout_toRightOf')) {
			idOfRelativeElem = elem.attributes('android:layout_toRightOf');
			relativeElem = getElemById(idOfRelativeElem);
			console.log('aww shit!');
			positionOfRelativeElem = layoutElem(relativeElem);
		}

		xmlElem.domElemLayout = getOffsetAll(xmlElem.domElem);

		return xmlElem.domElemLayout;
	}

	// takes a jQuery object and gets all offsets and dimensions
	function getOffsetAll (elem) {
		var dim = elem.offset();
		
		dim.width = elem.width();
		dim.height = elem.height();
		dim.right = dim.left + dim.width;
		dim.bottom = dim.top + dim.height;

		return dim;
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