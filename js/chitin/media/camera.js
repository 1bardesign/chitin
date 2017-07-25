///////////////////////////////////////////////////////////////////////////////
//
//	camera.js
//
//		camera related logic - moving the camera around and checking
//		if something is on screen or not.
//
///////////////////////////////////////////////////////////////////////////////

var camera = new vec2(0,0);

//move the camera around

function move_camera_to(x, y)
{
	camera.set(x,y);
}

function smooth_move_camera_to(x, y, amount)
{
	move_camera_to(camera.x * (1 - amount) + x * amount, camera.y * (1 - amount) + y * amount);
}

function apply_camera_translation()
{
	set_render_translation(get_canvas_halfwidth() - camera.x, get_canvas_halfheight() - camera.y);
}

//ensure the camera corners stay within these bounds as much as possible
function clip_camera_to(x1, y1, x2, y2)
{
	var hw = get_canvas_halfwidth();
	if(hw < x2 - x1)
	{
		camera.x = Math.max(x1 + hw, Math.min(camera.x, x2 - hw));
	}
	else
	{
		camera.x = (x1 + x2) * 0.5;
	}

	var hh = get_canvas_halfheight();
	if(hh < y2 - y1)
	{
		camera.y = Math.max(y1 + hh, Math.min(camera.y, y2 - hh));
	}
	else
	{
		camera.y = (y1 + y2) * 0.5;
	}
}


//bounds
function screen_topleft_x() {
	return camera.x - get_canvas_halfwidth();
}

function screen_topleft_y() {
	return camera.y - get_canvas_halfheight();
}

function screen_topleft() {
	return new vec2(screen_topleft_x(), screen_topleft_y());
}

function screen_bottomright_x() {
	return camera.x + get_canvas_halfwidth();
}

function screen_bottomright_y() {
	return camera.y + get_canvas_halfheight();
}

function screen_bottomright() {
	return new vec2(screen_bottomright_x(), screen_bottomright_y());
}

//bounds checks

function is_on_screen(x, y) {
	return Math.abs(camera.x - x) <= get_canvas_halfwidth() &&
		Math.abs(camera.y - y) <= get_canvas_halfheight();
}

function is_on_screen_aabb(cx, cy, hw, hh) {
	return Math.abs(camera.x - cx) <= get_canvas_halfwidth() + hw &&
		Math.abs(camera.y - cy) <= get_canvas_halfheight() + hh;
}

function is_on_screen_rect(x, y, w, h) {
	var hw = w * 0.5;
	var hh = h * 0.5;
	return is_on_screen_aabb(x+hw, y+hh, hw, hh);
}

