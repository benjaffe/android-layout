var app = app || {};

(function() {
	// "use strict";
	app.androidLayout = app.androidLayout || {};

	var numFontsLoaded = 0;
	var webFontConfig = {
	    google: {
	    	// TODO: this is causing a super slow page load time. Other options, rather than loading all upfront and blocking?
	    	families: ['Roboto:100,300,400,500,900', 'Roboto Condensed:100']
	    },
	    fontactive: function(familyName, fvd) {
	    	numFontsLoaded++;
	    	if (numFontsLoaded === webFontConfig.google.families.length) {
		    	console.log('fonts loaded');
		    	app.readyToRun = true;
				app.run({ autorun: true });
	    	}
		}
	};
	var fontFamilyList = app.androidLayout.fontFamilyList;
	// var errorList = app.androidLayout.errorList;
	var layoutInvalidated = true;
	var count;

	$.extend(app.androidLayout, {
		evaluateXML: evaluateXML,
		evaluateXMLPass2: evaluateXMLPass2,
		xmlSanityCheck: xmlSanityCheck,
		prepareCodeForParsing: prepareCodeForParsing
	});

	// load fonts
	app.androidInit = function() {
		WebFont.load(webFontConfig);
	};
	
	
	/**
	 * add the schema links if they are missing
	 * @param  {[str]} rawCode [code to be processed]
	 * @return {[str]}         [code with schema links]
	 */
	function prepareCodeForParsing (rawCode) {
		var code = rawCode;
		var startPos, insertPos;

		// if there's no tag wrapping everything, let's add one so we don't get a parsing error
		// REMOVED for now, to avoid diverging from Android Studio
		
		// if (code.indexOf('/>') < code.indexOf('>')) {
		// 	code = '<LinearLayout>\n' + code + '\n</LinearLayout>';
		// }


		// calculate our start positions for adding schema bits if needed
		startPos = code.indexOf('<');
		insertPos = code.search(/(>|\/>)/);
		
		// if there aren't schema bits, let's add them
		if (code.split('xmlns:android').length === 1) {
			code = code.substr(0, insertPos) + '\n\txmlns:android="http://schemas.android.com/apk/res/android"' + code.substr(insertPos);
		}
		if (code.split('xmlns:tools').length === 1) {
			code = code.substr(0, insertPos) + '\n\txmlns:tools="http://schemas.android.com/tools"' + code.substr(insertPos);
		}

		return code;
	}


	/**
	 * Check for common errors
	 * @param  {[str]} code [code to be processed]
	 */
	function xmlSanityCheck (code) {
		var errors;
		app.errors.clear();
		// var aOpen = code.split('<').length-1;
		// var aClose = code.split('>').length-1;
		// var dqNum = code.split('"').length-1;
		var codeLines = code.split('\n');

		checkForImproperAngleBracketOrder(code);
		checkForUnclosedSelfClosingTags(code);
		
		codeLines.forEach(function(line, i, code) {
			checkForUnsupportedTags(line, i+1);
			checkForUnsupportedAttributesAndValues(line, i+1);
			checkForUnevenQuotes(line, i+1);
		});
		
		errors = app.errors();
		if (errors.length > 0) {
			$('.error-msg').show().html(errors.join('<br><br>'));
			// throw new Error('XML Parsing Error');
		} else {
			$('.error-msg').hide();
			console.log('No errors!');
		}
	}

	/**
	 * Throws errors if <'s aren't closed by >'s
	 * @param  {[string]} code [code to be processed]
	 */
	function checkForImproperAngleBracketOrder (code) {
		var len = code.length;
		var openingBracketHasHappenedLast = false;
		var lineNum = 1;
		var lineNumBracketOpen, lineNumBracketClose;

		for (var i = 0; i < len; i++) {
			if (code[i] === '\n') {
				lineNum++;
			}

			if (code[i] === '<') {
				if (openingBracketHasHappenedLast) {
					app.errors.push({
						id: 'doubleOpenBracket',
						$lineNumInitialOpening: lineNumBracketOpen
					});
				}
				lineNumBracketOpen = lineNum;
				openingBracketHasHappenedLast = true;
			}

			if (code[i] === '>') {
				if (!openingBracketHasHappenedLast) {
					if (lineNumBracketClose === lineNum) {
						app.errors.push({
							id: 'doubleCloseBracketSameLine',
							$lineNum: lineNum
						});
					} else {
						app.errors.push({
							id: 'doubleCloseBracket',
							$lineNumInitialClosing: lineNumBracketClose,
							$lineNumSecondClosing: lineNum
						});
					}
				}
				lineNumBracketClose = lineNum;
				openingBracketHasHappenedLast = false;
			}
		}
		
		// check for unclosed tag at the end of code
		if (openingBracketHasHappenedLast) {
			app.errors.push({
				id: 'doubleOpenBracket',
				$lineNumInitialOpening: lineNumBracketOpen
			});
		}
	}

	/**
	 * Throws errors if lines have an uneven number of quotes
	 * @param  {[string]} line    [line of code to be processed]
	 * @param  {[number]} lineNum [the line number]
	 */
	function checkForUnevenQuotes (line, lineNum) {
		var numQuotes = line.split('"').length - 1;
		if (numQuotes % 2 !== 0) {
			app.errors.push({
				id: 'unevenQuotesPerLine',
				$lineNum: lineNum
			});
		}
	}

	/**
	 * Throws errors on tags that are not supported in this editor
	 * @param  {[str]} line [line of code to be processed]
	 */
	function checkForUnsupportedTags (line, lineNum) {
		var reOpen = /<(?!\/)([^\s>\/]*) */g;
		var reClose = /(<\/)(\S*) */g;
		var validTags = app.androidLayout.validTags;
		var openTags, closeTags;

		openTags = line.match(reOpen) || [];
		var tagsOpen = openTags.map(function(item){
			return item.trim().replace(/(\<|\>)/g, '');
		});

		closeTags = line.match(reClose) || [];
		var tagsClose = closeTags.map(function(item){
			return item.trim().replace(/(\<\/|\>)/g, '');
		});


		tagsOpen.forEach(function(tag) {
			if (validTags.indexOf(tag) === -1) {
				app.errors.push({
					id: 'invalidOpeningTag',
					$tag: tag,
					$lineNum: lineNum
				});
			}
		});

		tagsClose.forEach(function(tag) {
			if (validTags.indexOf(tag) === -1) {
				app.errors.push({
					id: 'invalidClosingTag',
					$tag: tag,
					$lineNum: lineNum
				});
			}
		});
	}


	function checkForUnclosedSelfClosingTags (code) {
		var selfClosingTags = app.androidLayout.selfClosingTags;
		
		selfClosingTags.forEach(function(tagType) {
			var segments = code.split('<'+tagType);
			
			// we don't care about the first one
			segments.shift();
			// console.log(segments);
			
			if (segments.length === 0) {
				return false;
			}

			segments.forEach(function(segment){
				if (segment.indexOf('/>') === -1 || segment.indexOf('>') < segment.indexOf('/>')) {
					console.log(segment);
					console.debug(tagType, segment.indexOf('>'), segment.indexOf('/>'));
					app.errors.push({
						id: 'unclosedSelfClosingTag',
						$tag: tagType
					});
				}
			});

			return true;
		});
	}

	/**
	 * Throws errors on attributes and attributevalues that are not supported in this editor
	 * @param  {[str]} line [line of code to be processed]
	 */
	function checkForUnsupportedAttributesAndValues (line, lineNum) {
		var validAttributes = app.androidLayout.validAttributes;
		var attrMatcher = /android:(\S*)=/g;
		var attrValueMatcher = /="(\S*)"/g;
		var attributes = line.match(attrMatcher);
		var attributeValues = line.match(attrValueMatcher);
		
		var attrSemicolonMatcher = /(android;(?:\S*))=/g;
		var attrSemicolonValues = attrSemicolonMatcher.exec(line);
		var attrNoColonMatcher = /(android[^:](\S*))=/;
		var attrNoColonValues = attrNoColonMatcher.exec(line);
		var attrNoEqualsMatcher = /(android:(\S*))[^=]"(\S*)"/;
		var attrNoEqualsValues = attrNoEqualsMatcher.exec(line);

		
		if (attrSemicolonValues) {
			app.errors.push({
				id: 'androidSemicolon',
				$property: attrSemicolonValues[1],
				$propertyCorrected: attrSemicolonValues[1].replace(';',':'),
				$lineNum: lineNum
			});
			return false;
		}

		if (attrNoColonValues) {
			app.errors.push({
				id: 'androidNoColon',
				$property: attrNoColonValues[1],
				$propertyCorrected: attrNoColonValues[1].replace('android','android:'),
				$lineNum: lineNum
			});
			return false;
		}

		if (attrNoEqualsValues) {
			app.errors.push({
				id: 'androidNoEquals',
				$lineIncorrect: attrNoEqualsValues[0],
				$lineCorrected: attrNoEqualsValues[0].replace(/"(\S*)"/, '="'+attrNoEqualsValues[3])+'"',
				$lineNum: lineNum
			});
			return false;
		}

		if (!attributes || !attributeValues) {
			return false;
		}

		// remove the inclusive characters TODO: fix the RegExps
		attributes = attributes.map(function(str){
			return str.slice(0, -1);
		});

		attributeValues = attributeValues.map(function(str){
			return str.slice(2, -1);
		});

		attributes.forEach(function(attributeName, i) {
			var attributeObj = validAttributes.filter(function(attributeItem){
				// console.log(attributeItem.name, attributeName);
				if (attributeItem.name === attributeName) {
					return true;
				} else {
					return false;
				}
			})[0];

			var attributeValue = attributeValues[i];
			
			// console.log(attributeObj);

			if (!attributeObj) {
				app.errors.push({
					id: 'invalidAttribute',
					$attribute: attributeName,
					$lineNum: lineNum
				});
				return false;
			}

			if (!attributeObj.pattern) {
				return false;
			}

			// console.log(attributeValue);
			if (!attributeObj.pattern.test(attributeValue)) {
				app.errors.push({
					id: 'invalidAttributeValue',
					$attribute: attributeName,
					$attributeValue: attributeValue,
					$lineNum: lineNum
				});
				return false;
			}
			
			
		});
	}


	/**
	 * Convert XML element to DOM element (sans positioning)
	 * @param  {[XML element]} elem   [element to be processed]
	 * @param  {[XML element]} parent [the element's parent]
	 * @return {[DOM element]}        [the DOM element representing the original XML element]
	 */
	function evaluateXML (elem, parent) {
		console.debug('evaluateXML() on ' + elem.tagName);
		var i, t, width, widthOrig, height, heightOrig, vals, colorOrig, color, sizeOrig, size, style, styleArr, bold, italic, fontFamilyOrig, fontFamilyObj, parentLayout, checkAttr;

		// console.log((elem && elem.tagName) + (parent && parent.tagName ? ', parent of ' + parent.tagName : ''));
		var domElem = $('<div>');
		var type = elem.tagName;
		var attributes = elem.attributes;

		// associate the DOM element with the XML element
		elem.domElem = domElem;
		domElem[0].xmlElem = elem;

		console.log(elem.tagName + ' has a parent of ' + elem.nearestParentLayoutType);

		// a bit of recursive fun here to get this going for every XML element in the document
		$(elem).children().each(function(i, child) {
			var childDomElem;
			if (app.androidLayout.layoutTags.indexOf(type) !== -1) {
				child.nearestParentLayoutType = type;
			}

			childDomElem = evaluateXML(child, elem);
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

		// add id for easier accessing later
		if (attributes['android:id']) {
			elem.id = attributes['android:id'].value;
			domElem.attr('id', elem.id);
		}

		// add content
		if (attributes['android:text']) {
			domElem.text(attributes['android:text'].value);
		}

		// hidden content
		if (checkAttr('android:visibility', 'gone')) {
			domElem.hide();
		} else if (checkAttr('android:visibility', 'invisible')) {
			domElem.css('visibility', 'hidden');
		}

		// convert widths and heights
		if (checkAttr('android:layout_width', 'match_parent')) {
			domElem.addClass('layout_width-match_parent');
		} else if (checkAttr('android:layout_width', 'wrap_content')) {
			domElem.addClass('layout_width-wrap_content');
		} else if (checkAttr('android:layout_width')) {
			widthOrig = attributes['android:layout_width'].value;
			if (parseInt(widthOrig) === 0) {
				height = 'auto';
			} else {
				width = dpToPx(widthOrig)+'px';
			}
			domElem.css('width', width);
		}

		if (checkAttr('android:layout_height', 'match_parent')) {
			domElem.addClass('layout_height-match_parent');
		} else if (checkAttr('android:layout_height', 'wrap_content')) {
			domElem.addClass('layout_height-wrap_content');
		} else if (checkAttr('android:layout_height')) {
			heightOrig = attributes['android:layout_height'].value;
			if (parseInt(heightOrig) === 0) {
				height = 'auto';
			} else {
				height = dpToPx(heightOrig)+'px';
			}
			domElem.css('height', height);
		}


		if (checkAttr('android:orientation', 'vertical')) {
			domElem.addClass('orientation-vertical');
		} else if (checkAttr('android:orientation', 'horizontal')) {
			domElem.addClass('orientation-horizontal');
		}

		// In this particular case, we MUST set the width/height
		// of the parent elem manually based on its children.
		// Because the children are not layed out yet, we're
		// deferring layout of the parent until the next tick.
		if (type === 'LinearLayout' && checkAttr('android:layout_height', 'wrap_content') && checkAttr('android:orientation','vertical')) {
			setTimeout(function(){
				var heights = [];
				domElem.children().each(function(i, child){
					heights.push($(child).offset().top, $(child).offset().top+$(child).outerHeight());
				});
				height = Math.max.apply(null, heights) - Math.min.apply(null, heights);
				console.log(heights, height);
				domElem.height(height);
			});
		} else if (type === 'LinearLayout' && checkAttr('android:layout_width', 'wrap_content') && !checkAttr('android:orientation','vertical')) {
			setTimeout(function(){
				var widths = [];
				domElem.children().each(function(i, child){
					widths.push($(child).offset().left, $(child).offset().left+$(child).outerWidth());
				});
				width = Math.max.apply(null, widths) - Math.min.apply(null, widths);
				console.log(widths, width);
				domElem.width(width);
			});
		}


		if (checkAttr('android:layout_weight')) {
			domElem.addClass('hidden-pending-setTimeout');
			setTimeout(function(domElem) {
				return function(){
					var elemWeight = parseInt( domElem[0].xmlElem.attributes['android:layout_weight'].value );
					var totalWeight = elemWeight; // sibling weights will be added
					var elemWidthPercent;

					if (checkAttr('android:orientation','vertical') && checkAttr('android:layout_weight')) {
						domElem.parent().children().each(function(i, elem) {
							console.log(elem.xmlElem);
						});

					} else {
						domElem.siblings().each(function(i, elem) {
							totalWeight += parseInt( elem.xmlElem.attributes['android:layout_weight'].value );
						});

						elemWidthPercent = 100 * elemWeight / totalWeight;
					}
					domElem.css({
						'width': elemWidthPercent + '%'
					});
					domElem.removeClass('hidden-pending-setTimeout');
				};
			}(domElem));
		}


		// layout_gravity
		// TODO: Migrate this to the second layout pass
		// if (checkAttr('android:layout_gravity')) {
		// 	vals = attributes['android:layout_gravity'].value.split('|');
		// 	for (i = 0; i < vals.length; i++) {
		// 		domElem.css( vals[i] , 0);
		// 	}
		// }

		// check for center (this will probably have to get better and use flex)
		if (checkAttr('android:gravity')) {
			vals = attributes['android:gravity'].value.split('|');
			for (i = 0; i < vals.length; i++) {
				domElem.addClass('gravity-' + vals[i]);
				if (vals[i] === 'bottom' || vals[i] === 'center' || vals[i] === 'center_vertical') {
					var helperChild = $('<div class="helper-child"></div>');
					helperChild.html(domElem.html());
					domElem.html('').append(helperChild);
				}
			}
		}

		// add images
		if (attributes['android:src']) {
			t = attributes['android:src'].value.split('/')[1];
			if (t) {
				domElem.css({'background-image': 'url(images/'+t+'.jpg)'});
				
				// handle height and width
				var myImage = new Image();
				myImage.src = 'images/'+t+'.jpg';
			    myImage.onload = function() {

					if (checkAttr('android:layout_height', 'wrap_content')) {
						domElem.css({ 
							height: this.height + 'px'
						});
					}
					if (checkAttr('android:layout_width', 'wrap_content')) {
						domElem.css({ 
							width: this.width + 'px',
							maxWidth: domElem.parent().width() + 'px'
						});
					}
				};
			}
			
		}

		if (checkAttr('android:scaleType', 'centerCrop')) {
			domElem.addClass('scaleType-centerCrop');
		} else if (checkAttr('android:scaleType', 'centerInside')) {
			domElem.addClass('scaleType-centerInside');
		}



		// padding
		if (attributes['android:padding']) {
			domElem.css('padding', dpToPx(attributes['android:padding'].value)+'px');
		}


		// background styling
		if (checkAttr('android:background')) {
			color = getColor(attributes['android:background'].value);
			domElem.css('background-color', color);
		}


		// text styling
		if (checkAttr('android:textColor')) {
			color = getColor(attributes['android:textColor'].value);
			domElem.css('color', color);
		}


		if (checkAttr('android:textSize')) {
			sizeOrig = attributes['android:textSize'].value;
		} else {
			sizeOrig = '14sp';
		}
		size = dpToPx(sizeOrig) + 'px';
		domElem.css('font-size', size); // we should be checking units rather than assuming


		if (checkAttr('android:textStyle')) {
			style = attributes['android:textStyle'].value;

			bold = (style === 'bold' || style === 'italic|bold' || style === 'bold|italic');
			italic = (style === 'italic' || style === 'italic|bold' || style === 'bold|italic');
			
			if (bold) {
				domElem.css('font-weight', 'bold');
			}

			if (italic) {
				domElem.css('font-style', 'italic');
			}
		}

		if (checkAttr('android:fontFamily')) {
			fontFamilyOrig = attributes['android:fontFamily'].value;
			fontFamilyObj = fontFamilyList[fontFamilyOrig];
			domElem.css('font-family', fontFamilyObj.fontFamily);

			// 'sans-serif' and 'sans-serif-condensed' are allowed to be bold.
			// They should retain their calculated font-weight from above
			if (fontFamilyOrig !== 'sans-serif' && fontFamilyOrig !== 'sans-serif-condensed') {
				domElem.css('font-weight', fontFamilyObj.fontWeight);
			}
		} else {
			domElem.css('font-family', fontFamilyList['sans-serif'].fontFamily);
		}

		return domElem;
	}

	/**
	 * This method calculates any layout relative to other elements
	 * @param  {[xml element]} elem             [the element being layed out]
	 * @param  {[xml element]} parent           [the parent of the element being layed out]
	 * @param  {[boolean]} inRelativeLayout [if true, this element is a child of a RelativeLayout]
	 */
	function evaluateXMLPass2 (elem, parent, inRelativeLayout) {
		// var domElem = elem.domElem;

		if (elem.tagName === 'RelativeLayout') {
			inRelativeLayout = true;
		}

		layoutInvalidated = true;
		// if (inRelativeLayout) {
			layoutElem(elem);
		// }
		layoutInvalidated = false;

		$(elem).children().each(function(i, child) {
			var childDomElem = evaluateXMLPass2(child, elem, inRelativeLayout);
		});

	}

	/**
	 * Gets the xml element that matches the id passed
	 * @param  {[str]} id   [description]
	 * @param  {[xml element]} elem [xml element to look in]
	 * @return {[xml element]}      [xml element with the provided id]
	 */
	function getElemById (id, elem) {
		var idRegex = /^\@\+id\/[a-z_]+$/;
		var idPointerRegex = /^\@id\/[a-z_]+$/;

		if (!idRegex.test(id) && !idPointerRegex.test(id)) {
			throw new Error('Malformed ID: ' + id)
		}

		// if we have an id pointer (without the '+'), fix it.
		if (idPointerRegex.test(id)) {
			id = '@+' + id.slice(1);
		}

		if (!elem) {
			count = 0;
		}
		count++;
		if (count > 100) {
			console.error('couldn\'t find element with id ' + id);
			return null;
		}
		
		elem = elem || app.parsedXML;

		if (elem.id === id) {
			return elem;
		}

		var children = $(elem).children();

		for (var i = 0; i < children.length; i++) {
			var returned = getElemById(id, children[i]);
			if (returned) {
				return returned;
			}
		}

		return null;
	}

	/**
	 * Translates android colors into web colors
	 * @param  {string} colorOrig [the value of the color string in the XML]
	 * @return {string}           [the hex or rgba color value]
	 */
	function getColor (colorOrig) {
		var color;
		if (colorOrig[0] === '#') {
			if (colorOrig.length === 9) {
				color = '#' + colorOrig.substr(-6);
			} else {
				color = colorOrig;
			}
		} else {
			color = app.androidLayout.COLOR[colorOrig.split('@android:color/')[1]];
		}
		return color;
	}

	// This function calculates the positioning of an element.
	// If the elem is relative to another, it calls layoutElem
	// on the elem it's positioned relative to.
	function layoutElem (xmlElem) {
		console.debug('layoutElem()');
		var idOfRelativeElem, relativeElem, attributes, checkAttr, parentLayout, positionOfRelativeElem;
		var domElem = xmlElem.domElem;

		if (xmlElem.currentlyLayingOut){
			throw Error('Circular Dependency! Laying out ' + xmlElem.tagName + ' ' + xmlElem.id);
		}

		xmlElem.currentlyLayingOut = true;

		// if we're already layed out, return early
		// TODO: This isn't running because layoutInvalidated is true too often
		if (xmlElem.domElemLayout && !layoutInvalidated) {
			console.log('\tSweet, we\'ve already layed out ' + xmlElem.id);
			xmlElem.currentlyLayingOut = false;
			return xmlElem.domElemLayout;
		}

		attributes = xmlElem.attributes;
		checkAttr = checkAttributesOnThis.bind(attributes);

		console.debug('laying out', (xmlElem.tagName || 'root') + ' ' + ($(xmlElem).attr('android:id')||''));

		// check for alignParent (absolute positioning to parent)
		if (checkAttr('android:layout_alignParentTop', 'true')) {
			parentLayout = layoutElem(xmlElem.parentNode);
			domElem.addClass('absolute').css({
				'top': (parentLayout.top + parentLayout.paddingTop) + 'px'
			});
		}
		if (checkAttr('android:layout_alignParentBottom', 'true')) {
			parentLayout = layoutElem(xmlElem.parentNode);
			domElem.addClass('absolute').css({
				'bottom': (parentLayout.bottom - parentLayout.paddingBottom) + 'px'
			});
		}
		if (checkAttr('android:layout_alignParentLeft', 'true')) {
			parentLayout = layoutElem(xmlElem.parentNode);
			domElem.addClass('absolute').css({
				'left': (parentLayout.left + parentLayout.paddingLeft) + 'px'
			});
		}
		if (checkAttr('android:layout_alignParentRight', 'true')) {
			parentLayout = layoutElem(xmlElem.parentNode);
			domElem.addClass('absolute').css({
				'right': (parentLayout.right - parentLayout.paddingRight) + 'px'
			});
		}

		if (checkAttr('android:layout_centerInParent', 'true')) {
			domElem.addClass('layout_centerInParent');
			setTimeout(function(domElem){
				return function() {
					domElem.css({
						'position':'absolute',
						'top': '50%',
						'left': '50%',
						'margin-left': -1*domElem.outerWidth()/2+'px',
						'margin-top': -1*domElem.outerHeight()/2+'px'
					});
					console.log(domElem.width());
				};
			}(domElem));
		}

		// TODO: Simplify the following four conditionals into a single conditional in a loop
		// check for alignment relative to other views
		if (checkAttr('android:layout_toStartOf')) {
			idOfRelativeElem = attributes['android:layout_toStartOf'].value;
			if (idOfRelativeElem === xmlElem.id) {
				throw new Error('This element cannot position itself relative to itself.');
			} else {
				relativeElem = getElemById(idOfRelativeElem);
				positionOfRelativeElem = layoutElem(relativeElem);
				console.log('\tFound the necessary relative element called ' + idOfRelativeElem + ' at ' + positionOfRelativeElem.top);
				domElem.css('bottom', positionOfRelativeElem.top+'px');
			}
		}

		if (checkAttr('android:layout_below')) {
			idOfRelativeElem = attributes['android:layout_below'].value;
			if (idOfRelativeElem === xmlElem.id) {
				throw new Error('You are creating a circular reference. This element cannot position itself relative to itself.');
			} else {
				// console.log(idOfRelativeElem);
				relativeElem = getElemById(idOfRelativeElem);
				positionOfRelativeElem = layoutElem(relativeElem);
				console.log('\tFound the necessary relative element called ' + idOfRelativeElem + ' at ' + positionOfRelativeElem.bottom);
				domElem.css('top', positionOfRelativeElem.bottom+'px');
			}
		}

		if (checkAttr('android:layout_above')) {
			idOfRelativeElem = attributes['android:layout_above'].value;
			if (idOfRelativeElem === xmlElem.id) {
				throw new Error('You are creating a circular reference. This element cannot position itself relative to itself.');
			} else {
				relativeElem = getElemById(idOfRelativeElem);
				positionOfRelativeElem = layoutElem(relativeElem);
				console.log('\tFound the necessary relative element called ' + idOfRelativeElem + ' at ' + positionOfRelativeElem.right);
				domElem.css('left', positionOfRelativeElem.right+'px');
			}
		}

		if (checkAttr('android:layout_toRightOf')) {
			idOfRelativeElem = attributes['android:layout_toRightOf'].value;
			if (idOfRelativeElem === xmlElem.id) {
				throw new Error('You are creating a circular reference. This element cannot position itself relative to itself.');
			} else {
				relativeElem = getElemById(idOfRelativeElem);
				positionOfRelativeElem = layoutElem(relativeElem);
				console.log('\tFound the necessary relative element called ' + idOfRelativeElem + ' at ' + positionOfRelativeElem.left);
				domElem.css('right', positionOfRelativeElem.left+'px');
			}
		}

		xmlElem.domElemLayout = getOffsetAllFromPhone(xmlElem.domElem);
		xmlElem.currentlyLayingOut = false;
		return xmlElem.domElemLayout;
	}

	// takes a jQuery element and gets all offsets and dimensions
	function getOffsetAllFromPhone (elem) {
		var dim = elem.offset();
		var dimPhone = $('.phone').offset();
		
		// the following is handled by the position:absolute on the screen-wrapper
		// dim.left = dim.left - dimPhone.left;
		// dim.top = dim.top - dimPhone.top;
		
		dim.width = elem.outerWidth();
		dim.height = elem.outerHeight();
		dim.right = dim.left + dim.width;
		dim.bottom = dim.top + dim.height;
		dim.paddingLeft = parseInt(elem.css('paddingLeft'));
		dim.paddingRight = parseInt(elem.css('paddingRight'));
		dim.paddingTop = parseInt(elem.css('paddingTop'));
		dim.paddingBottom = parseInt(elem.css('paddingBottom'));
		
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

	function dpToPx (num) {
		return parseInt(num);
	}
})();
