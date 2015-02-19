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

		checkAttr.bind(attributes);

		// add content
		if (attributes['android:text']) domElem.text(attributes['android:text'].value);

		// hidden content
		if (checkAttr('android:visibility', 'gone')) domElem.hide();

		// convert widths and heights
		// console.log(attributes);
		if (checkAttr('android:layout_width', 'match_parent')) domElem.addClass('layout_width-match_parent');
		if (checkAttr('android:layout_width', 'wrap_content')) domElem.addClass('layout_width-wrap_content');
		if (checkAttr('android:layout_height', 'match_parent')) domElem.addClass('layout_height-match_parent');
		if (checkAttr('android:layout_height', 'wrap_content')) domElem.addClass('layout_height-wrap_content');



		// padding
		if (attributes['android:padding']) domElem.css("padding", parseInt(attributes['android:padding'].value)+'px');




		return domElem;
	}

	function checkAttr (name, value) {
		if (this[name] && 
			this[name].value === value) {
			console.log(this[name].value);
			return true;
		} else {
			return false;
		}	
	}
})();