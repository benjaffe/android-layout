var app = app || {};

(function() {
	app.androidLayout = {
		evaluateXML: evaluateXML
	};

	fontFamilyList = {
		'sans-serif-light': "Arial, 'Helvetica Neue', Helvetica, sans-serif"
	};

	function evaluateXML (elem, parent) {

		// console.log((elem && elem.tagName) + (parent && parent.tagName ? ', parent of ' + parent.tagName : ''));
		var domElem = $('<div>');
		var type = elem.tagName;
		var attributes = elem.attributes;
		// console.log(attributes);

		$(elem).children().each(function(i, child) {
			var parent = elem;
			var childDomElem = evaluateXML(child, parent);
			$(domElem).append(childDomElem);
		});

		
		// if we're the xml document itself, return early
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
			console.log('\n\n',domElem,colorOrig, color);
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