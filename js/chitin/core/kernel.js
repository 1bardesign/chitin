///////////////////////////////////////////////////////////////////////////////
//
//	kernel.js
//
//		handles the main loop establishment for chitin. definition of
//		what needs to happen each tick and render is usually done in main.js
//
///////////////////////////////////////////////////////////////////////////////

"use strict"

//config
var target_fps = 30;
var timescale = 1;

//time management

function dt() {
	return _base_dt * timescale;
}

function dt_ms() {
	return _base_dt * timescale * 1000;
}

var run_time = 0;
var run_time_scaled = 0;

var fps = 0;
var tick_time = 0;

//internal
var _base_dt = 1/target_fps;
var _dt_limit = _base_dt;
var _last_time = -1;
var _loop_interval;
var _kernel_frames = 0;

//(encapsulate)
(function() {
	function main_loop()
	{
		//tick over fps
		_kernel_frames++;
		var t = current_time();
		if(Math.floor(_last_time) != Math.floor(t))
		{
			fps = _kernel_frames;
			_kernel_frames = 0;
		}
		//calculate dt
		_base_dt = Math.min(t - _last_time, _dt_limit);
		_last_time = t;

		tick_time++;
		run_time += _base_dt;
		run_time_scaled += dt();

		//step the game (with or without dt)
		//todo: consider multiple ticks with hard dt
		//(pre-update)
		update_sounds();

		//user update
		update();
		//debug update
		update_debug();

		//(post-update)
		update_keyboard(); //late so that you get the the currently-existing button state
		mouse_update();

		//user render
		render();
		//debug render
		render_debug();
	}

	function _start_main_loop()
	{
		_last_time = current_time();
		start();
		_loop_interval = setInterval(main_loop, dt_ms());
	}

	function _render_load_screen(progress)
	{
		if(typeof render_load_screen === "function") {
			render_load_screen(progress);
			return;
		}
		clear_canvas("#000");
		set_font("16px monospace");
		set_font_middle();
		set_font_center();
		draw_text("LOADING", cnv.width/2, cnv.height/2);
	}

	function _all_loaded()
	{
		return check_images_loaded() && check_sounds_loaded() && check_files_loaded();
	}

	function _ensure_loaded_then_start()
	{
		if(!_all_loaded())
		{
			window.setTimeout(_ensure_loaded_then_start, 100);
			_render_load_screen(0.0);
		}
		else
		{
			_start_main_loop();
		}
	}

	window.addEventListener("load", function()
	{
		init_keyboard();
		mouse_init();
		setup();
		_render_load_screen(0.0);
		window.setTimeout(_ensure_loaded_then_start, 100);
	});
})();
