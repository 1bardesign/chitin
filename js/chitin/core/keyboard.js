///////////////////////////////////////////////////////////////////////////////
//
//	keyboard.js
//
//		keyboard handling code - tries to mask browser quirks as much as
//		possible and allows telling how long since something was
//		pressed or released. prevents default keyboard behaviour
//		for most keys.
//
///////////////////////////////////////////////////////////////////////////////

var key_codes = {
	8	: "backspace",
	9	: "tab",
	13	: "enter",
	16	: "shift",
	17	: "ctrl",
	18	: "alt",
	19	: "break",
	20	: "caps lock",
	27	: "escape",
	32	: "space",
	33	: "pgup",
	34	: "pgdn",
	35	: "end",
	36	: "home",
	37	: "left",
	38	: "up",
	39	: "right",
	40	: "down",
	45	: "insert",
	46	: "delete",
	48	: "0",
	49	: "1",
	50	: "2",
	51	: "3",
	52	: "4",
	53	: "5",
	54	: "6",
	55	: "7",
	56	: "8",
	57	: "9",
	65	: "a",
	66	: "b",
	67	: "c",
	68	: "d",
	69	: "e",
	70	: "f",
	71	: "g",
	72	: "h",
	73	: "i",
	74	: "j",
	75	: "k",
	76	: "l",
	77	: "m",
	78	: "n",
	79	: "o",
	80	: "p",
	81	: "q",
	82	: "r",
	83	: "s",
	84	: "t",
	85	: "u",
	86	: "v",
	87	: "w",
	88	: "x",
	89	: "y",
	90	: "z",
	91	: "left super",
	92	: "right super",
	93	: "select",
	96	: "num 0",
	97	: "num 1",
	98	: "num 2",
	99	: "num 3",
	100	: "num 4",
	101	: "num 5",
	102	: "num 6",
	103	: "num 7",
	104	: "num 8",
	105	: "num 9",
	106	: "multiply",
	107	: "add",
	109	: "subtract",
	110	: "decimal",
	111	: "divide",
	/* these are disabled so they dont interfere with the browser console, refreshing etc
		you can re-enable them if you've got some specific use of course :)
	112	: "f1",
	113	: "f2",
	114	: "f3",
	115	: "f4",
	116	: "f5",
	117	: "f6",
	118	: "f7",
	119	: "f8",
	120	: "f9",
	121	: "f10",
	122	: "f11",
	123	: "f12",*/
	144	: "num lock",
	145	: "scroll lock",
	186	: ";",
	59	: ";",
	187	: "=",
	61	: "=",
	188	: ",",
	189	: "-",
	173	: "-",
	190	: ".",
	191	: "/",
	192	: "`",
	219	: "[",
	220	: "\\",
	221	: "]",
	222	: "'",
};

var keyboard_state = {};
var key_names = {};
for(var code in key_codes) {
	key_names[key_codes[code]] = code;
}

function update_keyboard() {
	for(var name in keyboard_state) {
		if(keyboard_state[name] > 0) {
			keyboard_state[name]++;
		} else {
			keyboard_state[name]--;
		}
	}
}

function code_to_name(code) {
	if(key_codes.hasOwnProperty(code))
	{
		return key_codes[code];
	}
	return "";
}

//note: this isn't lossless - there can be more than one keycode per name
//		because some browsers disagree on what code it should be (hooray)
function name_to_code(name) {
	if(key_names.hasOwnProperty(name)) {
		return key_names[name];
	}
	return 0;
}

function key_pressed(name) {
	return keyboard_state.hasOwnProperty(name) && keyboard_state[name] > 0;
}

function key_held_for(name, frames) {
	return keyboard_state.hasOwnProperty(name) && keyboard_state[name] > frames;
}

function key_just_pressed(name) {
	return keyboard_state.hasOwnProperty(name) && keyboard_state[name] == 1;
}

function key_released(name) {
	return keyboard_state.hasOwnProperty(name) && keyboard_state[name] < 0;
}

function key_released_for(name, frames) {
	return keyboard_state.hasOwnProperty(name) && keyboard_state[name] < -frames;
}

function key_just_released(name) {
	return keyboard_state.hasOwnProperty(name) && keyboard_state[name] == -1;
}

function handle_keypress(e) {
	var name = code_to_name(e.which);
	//some code we dont know about? bail
	if(!keyboard_state.hasOwnProperty(name)) {
		return;
	}

	if(e.type == "keydown") {
		if(keyboard_state[name] <= 0) {
			keyboard_state[name] = 1;
		}
	} else {
		if(keyboard_state[name] >= 0) {
			keyboard_state[name] = -1;
		}
	}

	//prevent default key behaviour except in some special cases
	//todo: consider "allowed default"
	//		map passed into init_keyboard
	if(
		//refresh page
		!(name == "r" && key_pressed("ctrl"))
	) {
        e.preventDefault();
    }

}

//initialise the subsystem

function init_keyboard() {
	for(var name in key_names) {
		keyboard_state[name] = -1;
	}

	window.onkeydown = handle_keypress;
	window.onkeyup = handle_keypress;
}
