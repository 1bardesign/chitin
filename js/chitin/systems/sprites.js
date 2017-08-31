///////////////////////////////////////////////////////////////////////////////
//
//	sprites.js
//
//		a system of sorted sprites that can be linked to a transform;
//		the basic graphical building block of chitin.
//
///////////////////////////////////////////////////////////////////////////////

function Sprite(args, transforms_from) {
	//assign the image or asset (or missing)
	this.image = image_from_args(args);

	//size (default 0,0)
	this.size = vec2_from_args(args, "size", "w", "h", 0, 0);
	//cache halves
	this.halfsize = this.size.smul(0.5);

	//frame size (default size)
	this.framesize = vec2_from_args(args, "framesize", "", "", this.size);

	//frame position (default 0,0)
	this.framepos = vec2_from_args(args, "framepos");

	//depth (default 0)
	this.z = scalar_from_args(args, "z", 0);

	//flips (default false)
	this.flipx = value_from_args(args, "flipx", false);
	this.flipy = value_from_args(args, "flipy", false);

	//assign the transform one way or another
	if (args.transform !== undefined) {
		//reference to transform
		this.transform = args.transform;
		this.own_transform = false;
	} else {
		//create own transform
		this.own_transform = true;
		if (args.x !== undefined && args.y !== undefined) {
			//literal style position
			this.transform = system_create_component(transforms_from, {pos: new vec2(args.x, args.y)});
		} else if (args.pos !== undefined) {
			//vector position
			this.transform = system_create_component(transforms_from, {pos: args.pos});
		} else if (args.copy_transform !== undefined) {
			//copy transform values
			this.transform = system_create_component(transforms_from, args.copy_transform);
		} else {
			//create blank transform
			this.transform = system_create_component(transforms_from, {});
		}
	}
}

Sprite.prototype._width_in_frames = function(x, y) {
	return this.image.width / this.framesize.x;
}

Sprite.prototype.get_frame_index = function() {
	return this.get_frame_x() + (this.get_frame_y() * this._width_in_frames());
}

Sprite.prototype.get_frame_x = function() {
	return this.framepos.x / this.framesize.x;
}

Sprite.prototype.get_frame_y = function() {
	return this.framepos.y / this.framesize.y;
}

Sprite.prototype.set_frame_x = function(x) {
	this.framepos.x = Math.floor(x) * this.framesize.x;
}

Sprite.prototype.set_frame_y = function(y) {
	this.framepos.y = Math.floor(y) * this.framesize.y;
}

Sprite.prototype.set_frame_xy = function(x, y) {
	this.set_frame_x(x);
	this.set_frame_y(y);
}

Sprite.prototype.set_frame_index = function(i) {
	var width_in_frames = this._width_in_frames();
	var y = (i / width_in_frames);
	var x = (i % width_in_frames);

	this.set_frame_xy(x, y);
}

//system

function SpriteSystem(transforms_from, screen_space) {
	this.transforms_from = transforms_from;
	this.screen_space = screen_space;
	this._c = [];
	return this;
}

SpriteSystem.prototype.create_component = function(args) {
	var c = new Sprite(args, this.transforms_from);
	this._c.push(c);
	return c;
}

SpriteSystem.prototype.destroy_component = function(comp) {
	if(comp.own_transform) {
		system_destroy_component(this.transforms_from, comp.transform);
	}
	remove_element(this._c, comp);
}

function sprite_depth_less(a, b)
{
	return a.z < b.z ? -1 : (a.z > b.z ? 1 : 0);
}

SpriteSystem.prototype.update = function()
{
	for(var i = 0; i < this._c.length; i++)
	{
		var sprite = this._c[i];
		//do whatever needs to be updated
	}
}

SpriteSystem.prototype.render = function()
{
	//camera space
	if(!this.screen_space) {
		apply_camera_translation();
	} else {
		reset_render_translation()
	}

	start_chitin_render();

	//insert sprites on screen into render list in depth order
	var render_list = [];
	for(var i = 0; i < this._c.length; i++)
	{
		var sprite = this._c[i];
		var pos = sprite.transform.pos;
		var hsize = sprite.halfsize;

		if(is_on_screen_aabb(pos.x, pos.y, hsize.x, hsize.y))
		{
			insert_sorted_generic(render_list, sprite, sprite_depth_less);
		}
	}

	//render the render list out
	for (var i = 0; i < render_list.length; i++)
	{
		var sprite = render_list[i];

		//destination position
		var pos = sprite.transform.pos;
		var size = sprite.size;

		//source position
		var fpos = sprite.framepos;
		var fsize = sprite.framesize;

		//scale
		var scalex = 1;
		var scaley = 1;
		var dx = pos.x - sprite.halfsize.x * scalex;
		var dy = pos.y - sprite.halfsize.y * scaley;
		var dw = size.x * scalex;
		var dh = size.y * scaley;

		//draw out
		/*draw_rect(
			dx, dy, dw, dh
		);*/
		draw_image_ex(
			sprite.image,
			fpos.x, fpos.y, fsize.x, fsize.y,
			dx, dy, dw, dh,
			sprite.flipx, sprite.flipy
		);
	}

	end_chitin_render();

	push_debug_msg("Sprites : "+this._c.length);
}
