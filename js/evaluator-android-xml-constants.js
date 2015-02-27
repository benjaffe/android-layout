var app = app || {};

(function() {
	app.androidLayout = app.androidLayout || {};

	// hash of error names and their full text
	app.androidLayout.errorList = {
		'doubleOpenBracket': 'Did you forget to close the tag that you opened on line $lineNumInitialOpening?',
		'doubleCloseBracket': 'There are two >\'s in a row, on lines $lineNumInitialClosing and $lineNumSecondClosing. Double-check your tags to make sure you\'ve formed them properly. Remember, every tag or closing tag should be formed with < at the beginning, and a > at the end.',
		'doubleCloseBracketSameLine': 'There are two >\'s in a row on line $lineNum. Did you accidentally add two >\'s?',
		'unevenQuotesPerLine': 'Line $lineNum has an uneven number of quotes. Did you forget to open or close a quote?',
		'invalidOpeningTag': 'Line $lineNum: Tag `$tag` is not a supported opening tag.',
		'invalidClosingTag': 'Line $lineNum: Tag `$tag` is not a supported closing tag.'
	};

	app.androidLayout.validTags = ['FrameLayout','LinearLayout','RelativeLayout','TextView','ImageView','Button'];

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
})();