///////////////////////////////////////////////////////////////////////////////
//
//	canvas.js
//
//		global canvas and context sharing; supports basic rendering onto
//		the shared canvas without having to pass in the context every time.
//
///////////////////////////////////////////////////////////////////////////////

//shared globals
var cnv = null;
var ctx = null;
var int_coords = true;

function get_canvas()
{
	if (cnv === null)
		cnv = document.getElementById("canvas");
	return cnv;
}

function get_context()
{
	if(ctx === null)
		ctx = get_canvas().getContext("2d", {alpha: false});
	return ctx;
}

function set_int_coords(v)
{
	int_coords = v;
}

function set_fill(col)
{
	get_context().fillStyle = col;
}

function set_alpha(a)
{
	get_context().globalAlpha = a;
}

function set_stroke(col)
{
	get_context().strokeStyle = col;
}

function set_font(font)
{
	get_context().font = font;
}

function set_font_left()
{
	get_context().textAlign = "left";
}

function set_font_center()
{
	get_context().textAlign = "center";
}

function set_font_right()
{
	get_context().textAlign = "right";
}

function set_font_top()
{
	get_context().textBaseline = "top";
}
function set_font_middle()
{
	get_context().textBaseline = "middle";
}
function set_font_bottom()
{
	get_context().textBaseline = "bottom";
}

function set_render_translation(x, y)
{
	if(int_coords)
	{
		x = Math.round(x);
		y = Math.round(y);
	}
	get_context().setTransform(1, 0, 0, 1, x, y);
}

function reset_render_translation()
{
	set_render_translation(0,0);
}

function reset_render()
{
	set_font_top();
	set_font_left();
	set_fill("white");
	set_stroke("white");
	ctx.lineWidth=1;
	set_font("16px monospace");
	set_alpha(1.0)
}

function clear_canvas(col)
{
	get_context();
	reset_render_translation();
	ctx.fillStyle = (typeof col !== 'undefined') ? col : "#000";
	ctx.fillRect(0,0,cnv.width,cnv.height);
	reset_render();
}

function fill_rect(x, y, w, h)
{
	if(int_coords)
	{
		x = Math.round(x);
		y = Math.round(y);
		w = Math.round(w);
		h = Math.round(h);
	}

	get_context().fillRect(x, y, w, h);
}

function draw_rect(x, y, w, h)
{
	if(int_coords)
	{
		x = Math.round(x);
		y = Math.round(y);
		w = Math.round(w);
		h = Math.round(h);
	}

	get_context().strokeRect(x, y, w, h);
}

function draw_text(text, x, y, maxwidth)
{
	if(int_coords)
	{
		x = Math.round(x);
		y = Math.round(y);
	}

	get_context().fillText(text, x, y, maxwidth);
}

function draw_line(x1, y1, x2, y2)
{
	ctx.beginPath();

	if(int_coords)
	{
		x1 = Math.round(x1);
		x2 = Math.round(x2);
		y1 = Math.round(y1);
		y2 = Math.round(y2);
	}

	x1 += 0.5;
	x2 += 0.5;
	y1 += 0.5;
	y2 += 0.5;
	get_context().moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.stroke();
}

//much, much faster for long lines
function _gfx_do_move(points)
{
	if(int_coords)
	{
		for(var i = 0; i < points.length; i++)
		{
			points[i] = Math.round(points[i]) + 0.5;
		}
	}
	else
	{
		for(var i = 0; i < points.length; i++)
		{
			points[i] = points[i] + 0.5;
		}
	}

	get_context().moveTo(points[0], points[1]);
	for(var i = 2; i < points.length; i+=2)
	{
		ctx.lineTo(points[i], points[i+1]);
	}
}

function draw_path(points)
{
	ctx.beginPath();

	_gfx_do_move(points);

	ctx.stroke();
}

function fill_path(points)
{
	ctx.beginPath();

	_gfx_do_move(points);

	ctx.fill();
}

function draw_circle(x, y, rad)
{
	var points = [];
	for(var theta = 0; theta < Math.PI * 2; theta += Math.PI / 16 / (rad + 1) )
	{
		points.push(x + v2_rot_x(rad, 0, theta));
		points.push(y + v2_rot_y(rad, 0, theta));
	}
	draw_path(points);
}

function fill_circle(x, y, rad)
{
	var points = [];
	for(var theta = 0; theta < Math.PI * 2; theta += Math.PI / 16 / (rad + 1) )
	{
		points.push(x + v2_rot_x(rad, 0, theta));
		points.push(y + v2_rot_y(rad, 0, theta));
	}
	fill_path(points);
}

//positions

function get_canvas_width()
{
	return get_canvas().width;
}

function get_canvas_height()
{
	return get_canvas().height;
}

function get_canvas_halfwidth()
{
	return get_canvas().width * 0.5;
}

function get_canvas_halfheight()
{
	return get_canvas().height * 0.5;
}

