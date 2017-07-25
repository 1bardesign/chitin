///////////////////////////////////////////////////////////////////////////////
//
//	mouse.js
//
//		mouse handling code - once mouse is initialised, will be updated
//		as the mouse moves around
//
///////////////////////////////////////////////////////////////////////////////

"use strict"

var mouse;

function mouse_init() {
	//
	mouse = {
		x: 0,
		y: 0,
		clicked: false,
		oldclicked: false
	};
	//setup handlers since we cant directly access the mouse locally
	get_canvas().addEventListener('mousemove', _read_mousepos, false);
	get_canvas().addEventListener("mousedown", function() {
		mouse.clicked = true;
	});
	get_canvas().addEventListener("mouseup", function() {
		//todo: consider just flagging not clicked and applying during update
		//		so we always get 1 frame of click?
		mouse.clicked = false;
	});
};

//interface

function mouse_pressed() {
	return mouse.clicked;
}

function mouse_just_pressed() {
	return !mouse.oldclicked && mouse.clicked;
}

function mouse_released() {
	return !mouse.clicked;
}

function mouse_just_released() {
	return mouse.oldclicked && !mouse.clicked;
}

function mouse_x() {
	return mouse.x;
}

function mouse_y() {
	return mouse.y;
}

//called once per tick, after everything else is updated

function mouse_update() {
	mouse.oldclicked = mouse.clicked;
}

//helper

function _read_mousepos(evt) {
	var canvas = get_canvas();
	var rect = canvas.getBoundingClientRect(),
		scaleX = canvas.width / rect.width,
		scaleY = canvas.height / rect.height;

	mouse.x = Math.round(Math.max(0, Math.min((evt.clientX - rect.left) * scaleX, canvas.width)));
	mouse.y = Math.round(Math.max(0, Math.min((evt.clientY - rect.top) * scaleY, canvas.height)));
}
