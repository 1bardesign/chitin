///////////////////////////////////////////////////////////////////////////////
//
//	debug.js
//
//		helpful debugging layer; sits above
//
///////////////////////////////////////////////////////////////////////////////
//
//	todo: refactor into a system or entity and allow extension per-game
//
///////////////////////////////////////////////////////////////////////////////

var debug_state = 0;
var sysdebug_lines = [];

function update_debug()
{
	if(key_just_pressed("`"))
	{
		debug_state = (debug_state + 1) % 3
	}
}

function render_debug()
{
	if(debug_state == 0) return;
	reset_render_translation();
	//draw fps
	set_font("10px Monospace");
	set_font_left();
	set_font_top();
	set_fill("#fff");
	draw_text("FPS: "+fps, 10, 10);
	//render the transient
	if(debug_state == 1)
	{
		var sdb_y = 30;
		for(var i = 0; i < sysdebug_lines.length; i++) {
			draw_text(sysdebug_lines[i], 10, sdb_y);
			sdb_y += 10;
		}
		sysdebug_lines = [];
	}

	//mouse and position debug
	if(debug_state == 2)
	{
		function _pad(v) {
			return ("      "+v).substr(-6);
		}

		draw_text("Mouse:", 10, 30);
		draw_text(
			"screen ("+
			_pad(mouse.x)+" "+
			_pad(mouse.y)+
			")",
			20, 40
		);
		draw_text(
			"world  ("+
			_pad(mouse.x+(camera.x-get_canvas_halfwidth()))+" "+
			_pad(mouse.y+(camera.y-get_canvas_halfheight()))+
			")",
			20, 50
		);

		//draw low-alpha unit grid
		set_stroke("#fff");
		set_alpha(0.2);
		apply_camera_translation();
		var grid_size = 32;
		var start_x = Math.floor(screen_topleft_x() / grid_size) * grid_size;
		var start_y = Math.floor(screen_topleft_y() / grid_size) * grid_size;
		var end_x = Math.ceil(screen_bottomright_x() / grid_size) * grid_size;
		var end_y = Math.ceil(screen_bottomright_y() / grid_size) * grid_size;
		for(var x = start_x; x < end_x; x += grid_size) {
			draw_line(x, start_y, x, end_y);
		}
		for(var y = start_y; y < end_y; y += grid_size) {
			draw_line(start_x, y, end_x, y);
		}
		reset_render_translation();
		set_alpha(1.0);
	}
}

function push_debug_msg(s) {
	if(debug_state != 1) return;
	sysdebug_lines.push(s);
}
