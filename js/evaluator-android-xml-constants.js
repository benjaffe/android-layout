var app = app || {};

(function() {
	app.androidLayout = app.androidLayout || {};

	app.androidLayout.screenScaler = 0.75;

	// the higher the number, the wider the range of suggestions (and the less accurate)
	app.androidLayout.suggestionSensitivity = 3;

	// hash of error names and their full text
	app.androidLayout.errorList = {
		'parseError': 'The computer wasn\'t able to understand your XML. (If any of your code is colored red, the error might be just before it.)',
		'doubleOpenBracket': 'Did you forget to close the tag that you opened on line $lineNumInitialOpening?',
		'doubleCloseBracket': 'There are two >\'s in a row, on lines $lineNumInitialClosing and $lineNumSecondClosing. Double-check your tags to make sure you\'ve formed them properly. Remember, every tag or closing tag should be formed with < at the beginning, and a > at the end.',
		'doubleCloseBracketSameLine': 'There are two >\'s in a row on line $lineNum. Did you accidentally add two >\'s?',
		'unevenQuotesPerLine': 'Line $lineNum has an uneven number of quotes. Did you forget to open or close a quote?',
		'moreThanOneRootView': 'Your XML document has more than one root view. There can only be one root view, and it should enclose all of your other views.',
		'unclosedTag': 'It looks like you didn\'t close your $tag tag. Remember that every tag needs to be closed.',
		'invalidOpeningTag': 'Line $lineNum: Tag `$tag` is not a supported opening tag.',
		'invalidOpeningTagSuggestion': 'Line $lineNum: Tag `$tag` is not a supported opening tag. <br><strong>Did you mean to type $suggestion?</strong>',
		'invalidClosingTag': 'Line $lineNum: Tag `$tag` is not a supported closing tag.',
		'unclosedSelfClosingTag': 'The tag $tag should be self-closing. This means it should end with /> .',
		'mandatoryAttributeMissing': 'The mandatory attribute `$attribute` for the `$tagName` tag is missing.',
		'invalidAttribute': 'Line $lineNum: The attribute `$attribute` is not supported here.',
		'invalidAttributeSuggestion': 'Line $lineNum: The attribute `$attribute` is not supported here. <br><strong>Did you mean to type $suggestion?</strong>',
		'invalidAttributeValue': 'The attribute $attribute does not support the value <code>$attributeValue</code> (Line $lineNum)',
		'cannotFindID': 'Unable to find the id <code>$idValue</code> in the attribute <code>$attribute</code>',
		'androidSemicolon': 'Line $lineNum: You typed <pre>$property="..."</pre> You probably meant to type a colon, not a semi-colon. <pre>$propertyCorrected="..."</pre>',
		'androidNoColon': 'Line $lineNum: You typed <pre>$property="..."</pre> You probably forgot the colon after "android". <pre>$propertyCorrected="..."</pre>',
		'androidNoEquals': 'Did you forget an <code>=</code> in line $lineNum? You typed: <pre>$lineIncorrect</pre> Here it is with an = sign. <pre>$lineCorrected</pre>',
		'colorNotSupported': 'The color $color is not supported. Did you type it incorrectly?',
		'xmlnsValueInvalid': 'Line $lineNum: The xmlns:android attribute needs to have the value "http://schemas.android.com/apk/res/android"'
	};

	app.androidLayout.validTags = ['FrameLayout','LinearLayout','RelativeLayout','TextView','ImageView','Button', 'View'];
	app.androidLayout.selfClosingTags = ['TextView','ImageView','Button'];
	app.androidLayout.layoutTags = ['FrameLayout','LinearLayout','RelativeLayout'];

	app.androidLayout.validAttributes = [
		{
			name: 'xmlns:android',
			pattern: /^http\:\/\/schemas.android.com\/apk\/res\/android$/
		},

		{
			name: 'android:id',
			pattern: /^\@\+id\/[a-zA-Z][a-zA-Z_0-9]*?$/
		},
		{
			name: 'android:text',
			pattern: /.*/
		},


		{
			name: 'android:background',
			pattern: /^#(?:[0-9a-fA-F]{3,4})$|^#(?:[0-9a-fA-F]{6})$|^#(?:[0-9a-fA-F]{8})$|\@android:color\/[a-z_]+$/
		},
		{
			name: 'android:textColor',
			pattern: /^#(?:[0-9a-fA-F]{3,4})$|^#(?:[0-9a-fA-F]{6})$|^#(?:[0-9a-fA-F]{8})$|\@android:color\/[a-z_]+$/
		},


		{
			name: 'android:layout_width',
			pattern: /(^match_parent$|^wrap_content$|^\d*dp$)/
		},
		{
			name: 'android:layout_height',
			pattern: /(^match_parent$|^wrap_content$|^\d*dp$)/
		},

		{
			name: 'android:layout_weight',
			pattern: /^[0-9]+$/
		},

		{
			name: 'android:orientation',
			pattern: /(^horizontal$|^vertical$)/
		},

		{
			name: 'android:padding',
			pattern: /(^\d*dp$)/
		},
		{
			name: 'android:paddingTop',
			pattern: /(^\d*dp$)/
		},
		{
			name: 'android:paddingRight',
			pattern: /(^\d*dp$)/
		},
		{
			name: 'android:paddingBottom',
			pattern: /(^\d*dp$)/
		},
		{
			name: 'android:paddingLeft',
			pattern: /(^\d*dp$)/
		},

		{
			name: 'android:layout_margin',
			pattern: /(^\d*dp$)/
		},
		{
			name: 'android:layout_marginTop',
			pattern: /(^\d*dp$)/
		},
		{
			name: 'android:layout_marginRight',
			pattern: /(^\d*dp$)/
		},
		{
			name: 'android:layout_marginBottom',
			pattern: /(^\d*dp$)/
		},
		{
			name: 'android:layout_marginLeft',
			pattern: /(^\d*dp$)/
		},


		{
			name: 'android:layout_alignParentTop',
			pattern: /^(true|false)$/
		},
		{
			name: 'android:layout_alignParentBottom',
			pattern: /^(true|false)$/
		},
		{
			name: 'android:layout_alignParentRight',
			pattern: /^(true|false)$/
		},
		{
			name: 'android:layout_alignParentLeft',
			pattern: /^(true|false)$/
		},
		{
			name: 'android:layout_above',
			pattern: /^\@\id\/[a-zA-Z][a-zA-Z_0-9]*?$/
		},
		{
			name: 'android:layout_below',
			pattern: /^\@\id\/[a-zA-Z][a-zA-Z_0-9]*?$/
		},
		{
			name: 'android:layout_toRightOf',
			pattern: /^\@\id\/[a-zA-Z][a-zA-Z_0-9]*?$/
		},
		{
			name: 'android:layout_toLeftOf',
			pattern: /^\@\id\/[a-zA-Z][a-zA-Z_0-9]*?$/
		},

		{
			name: 'android:visibility',
			pattern: /^(?:invisible|visible|gone)$/
		},

		{
			name: 'android:gravity',
			pattern: /^(?:top|bottom|left|right|center_vertical|center_horizontal|center)(?:\|(top|bottom|left|right|center_vertical|center_horizontal|center))?$/
		},

		{
			name: 'android:layout_centerInParent',
			pattern: /^(true|false)$/
		},

		{
			name: 'android:layout_centerHorizontal',
			pattern: /^(true|false)$/
		},


		{
			name: 'android:textSize',
			pattern: /(^\d*sp$)/
		},
		{
			name: 'android:textAppearance',
			pattern: /^\?android:textAppearance(Small|Medium|Large)$/
		},
		{
			name: 'android:textStyle',
			pattern: /^(?:bold\|italic|italic\|bold|italic|bold|normal)$/
		},
		{
			name: 'android:textAllCaps',
			pattern: /^(true|false)$/
		},
		{
			name: 'android:fontFamily',
			pattern: /^sans-serif(-light|-condensed|-thin|-medium|-black)?$/
		},

		{
			name: 'android:src',
			pattern: /^\@drawable\/(?:ocean|fish|cake|android|mountains|rocks|cakesmall)+$/
		},
		{
			name: 'android:scaleType',
			pattern: /^(centerCrop|center)$/
		}
	];

	// hash of valid fonts, and their web equivalents
	app.androidLayout.fontFamilyList = {
		'sans-serif': {
			'fontFamily': 'Roboto, sans-serif',
			'fontWeight': '400'
		},
		'sans-serif-light': {
			'fontFamily': 'Roboto, sans-serif',
			'fontWeight': '300'
		},
		'sans-serif-condensed': {
			'fontFamily': '"Roboto Condensed", sans-serif',
			'fontWeight': '100'
		},
		'sans-serif-thin': {
			'fontFamily': 'Roboto, sans-serif',
			'fontWeight': '100'
		},
		'sans-serif-medium': {
			'fontFamily': 'Roboto, sans-serif',
			'fontWeight': '500'
		},
		'sans-serif-black': {
			'fontFamily': 'Roboto, sans-serif',
			'fontWeight': '900'
		}
	};

	// hash of color names and their rgba values
	app.androidLayout.COLOR = {
		"screen_background_light": "rgba(255,255,255,1)",
		"screen_background_dark": "rgba(0,0,0,1)",
		"status_bar_closed_default_background": "rgba(0,0,0,1)",
		"status_bar_opened_default_background": "rgba(0,0,0,1)",
		"search_bar_default_color": "rgba(0,0,0,1)",
		"safe_mode_background": "rgba(0,0,0,0.38)",
		"screen_background_dark_transparent": "rgba(0,0,0,0.5)",
		"screen_background_light_transparent": "rgba(255,255,255,0.5)",
		"safe_mode_text": "rgba(255,255,255,0.5)",
		"white": "rgba(255,255,255,1)",
		"black": "rgba(0,0,0,1)",
		"transparent": "rgba(0,0,0,0)",
		"background_dark": "rgba(0,0,0,1)",
		"background_light": "rgba(255,255,255,1)",
		"bright_foreground_dark": "rgba(0,0,0,1)",
		"bright_foreground_light": "rgba(255,255,255,1)",
		"bright_foreground_dark_disabled": "rgba(255,255,255,0.5)",
		"bright_foreground_light_disabled": "rgba(0,0,0,0.5)",
		"bright_foreground_dark_inverse": "rgba(255,255,255,1)",
		"bright_foreground_light_inverse": "rgba(0,0,0,1)",
		"dim_foreground_dark": "rgba(190,190,190,1)",
		"dim_foreground_dark_disabled": "rgba(190,190,190,0.5)",
		"dim_foreground_dark_inverse": "rgba(50,50,50,1)",
		"dim_foreground_dark_inverse_disabled": "rgba(50,50,50,0.5)",
		"hint_foreground_dark": "rgba(128,128,128,1)",
		"dim_foreground_light": "rgba(50,50,50,1)",
		"dim_foreground_light_disabled": "rgba(50,50,50,0.5)",
		"dim_foreground_light_inverse": "rgba(190,190,190,1)",
		"dim_foreground_light_inverse_disabled": "rgba(190,190,190,0.5)",
		"hint_foreground_light": "rgba(128,128,128,1)",
		"highlighted_text_dark": "rgba(131,204,57,0.6)",
		"highlighted_text_light": "rgba(131,204,57,0.6)",
		"link_text_dark": "rgba(92,92,255,1)",
		"link_text_light": "rgba(0,0,238,1)",
		"suggestion_highlight_text": "rgba(23,123,189,1)",
		"input_method_fullscreen_background": "rgba(249,249,249,1)",
		"input_method_fullscreen_background_holo": "rgba(0,0,0,0.5)",
		"selected_day_background": "rgba(0,146,244,1)",
		"lighter_gray": "rgba(221,221,221,1)",
		"darker_gray": "rgba(170,170,170,1)",
		"perms_dangerous_grp_color": "rgba(51,181,229,1)",
		"perms_dangerous_perm_color": "rgba(51,181,229,1)",
		"shadow": "rgba(34,34,34,0.8)",
		"search_url_text_normal": "rgba(127,168,127,1)",
		"search_url_text_selected": "rgba(0,0,0,1)",
		"search_url_text_pressed": "rgba(0,0,0,1)",
		"search_widget_corpus_item_background": "rgba(221,221,221,1)",
		"sliding_tab_text_color_active": "rgba(0,0,0,1)",
		"sliding_tab_text_color_shadow": "rgba(0,0,0,1)",
		"keyguard_text_color_normal": "rgba(255,255,255,1)",
		"keyguard_text_color_unlock": "rgba(167,216,76,1)",
		"keyguard_text_color_soundoff": "rgba(255,255,255,1)",
		"keyguard_text_color_soundon": "rgba(230,147,16,1)",
		"keyguard_text_color_decline": "rgba(254,10,90,1)",
		"lockscreen_clock_background": "rgba(255,255,255,1)",
		"lockscreen_clock_foreground": "rgba(255,255,255,1)",
		"lockscreen_clock_am_pm": "rgba(255,255,255,1)",
		"lockscreen_owner_info": "rgba(154,154,154,1)",
		"facelock_color_background": "rgba(0,0,0,1)",
		"screen_background_holo_light": "rgba(243,243,243,1)",
		"screen_background_holo_dark": "rgba(0,0,0,1)",
		"background_holo_dark": "rgba(0,0,0,1)",
		"background_holo_light": "rgba(243,243,243,1)",
		"bright_foreground_holo_dark": "rgba(243,243,243,1)",
		"bright_foreground_holo_light": "rgba(0,0,0,1)",
		"bright_foreground_disabled_holo_dark": "rgba(76,76,76,1)",
		"bright_foreground_disabled_holo_light": "rgba(178,178,178,1)",
		"bright_foreground_inverse_holo_dark": "rgba(0,0,0,1)",
		"bright_foreground_inverse_holo_light": "rgba(0,0,0,1)",
		"dim_foreground_holo_dark": "rgba(190,190,190,1)",
		"dim_foreground_disabled_holo_dark": "rgba(190,190,190,0.5)",
		"dim_foreground_inverse_holo_dark": "rgba(50,50,50,1)",
		"dim_foreground_inverse_disabled_holo_dark": "rgba(50,50,50,0.5)",
		"hint_foreground_holo_dark": "rgba(128,128,128,1)",
		"dim_foreground_holo_light": "rgba(50,50,50,1)",
		"dim_foreground_disabled_holo_light": "rgba(50,50,50,0.5)",
		"dim_foreground_inverse_holo_light": "rgba(190,190,190,1)",
		"dim_foreground_inverse_disabled_holo_light": "rgba(190,190,190,0.5)",
		"hint_foreground_holo_light": "rgba(128,128,128,1)",
		"highlighted_text_holo_dark": "rgba(51,181,229,0.4)",
		"highlighted_text_holo_light": "rgba(51,181,229,0.4)",
		"link_text_holo_dark": "rgba(92,92,255,1)",
		"link_text_holo_light": "rgba(0,0,238,1)",
		"group_button_dialog_pressed_holo_dark": "rgba(197,193,255,0.27)",
		"group_button_dialog_focused_holo_dark": "rgba(153,204,0,0.15)",
		"group_button_dialog_pressed_holo_light": "rgba(255,255,255,1)",
		"group_button_dialog_focused_holo_light": "rgba(153,204,0,0.27)",
		"legacy_pressed_highlight": "rgba(254,170,12,1)",
		"legacy_selected_highlight": "rgba(241,122,10,1)",
		"legacy_long_pressed_highlight": "rgba(255,255,255,1)",
		"holo_blue_light": "rgba(51,181,229,1)",
		"holo_green_light": "rgba(153,204,0,1)",
		"holo_red_light": "rgba(255,68,68,1)",
		"holo_blue_dark": "rgba(0,153,204,1)",
		"holo_green_dark": "rgba(102,153,0,1)",
		"holo_red_dark": "rgba(204,0,0,1)",
		"holo_purple": "rgba(170,102,204,1)",
		"holo_orange_light": "rgba(255,187,51,1)",
		"holo_orange_dark": "rgba(255,136,0,1)",
		"holo_blue_bright": "rgba(0,221,255,1)"
	};

	app.tests = [
		// deprecated tests
		// "test170",
		// "test240",
		// "test260",
		// "test270",

		// tests that currently pass
		"test10",
		"test20",
		"test40",
		"test50",
		"test60",
		"test70",
		"test80",
		"test90",
		"test100",
		"test110",
		"test120",
		"test130",
		"test140",
		"test150",
		"test160",
		"test180",
		"test200",
		"test210",
		"test220",
		"test230",
		"test250",
		"test280",
		"test290",
		"test300",
		"test310",
		"test320",
		"test330",
		"test340",
		"test350",
		"test370",
		"test380",
		"test390",
		"test400",
		"test410",
		"test420",
		"test430",
		"test460",
		"test470",
		"test480",
		"test510",
		"test520",
		"test530",
		"test540",
		"test550",

		// broken!
		"test30",
		"test570",
		"test190",
		"test360",
		"test560"
	];
})();
