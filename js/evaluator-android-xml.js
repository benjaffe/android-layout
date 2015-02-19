var app = app || {};

(function() {
	app.androidLayout = {
		evaluateXML: evaluateXML
	};

	function evaluateXML (elem, parent) {
		console.log((elem && elem.tagName) + (parent && parent.tagName ? ', parent of ' + parent.tagName : ''));
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
})();