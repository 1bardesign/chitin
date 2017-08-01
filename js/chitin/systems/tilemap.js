///////////////////////////////////////////////////////////////////////////////
//
//	tilemap.js
//
//		System that manages tilemaps; which can be created separately if
//		need be. As always, an entity can have any number of them
//
///////////////////////////////////////////////////////////////////////////////
//
//		todo: separate physics tilemaps?
//
///////////////////////////////////////////////////////////////////////////////

"use strict"

function Tilemap(args) {
	//
	this.img = image_from_args(args);
	//(todo: args parsing for transforms)
	this.transform = args.transform;
	//
	this.size = vec2_from_args(args, "size", "w", "h", 0, 0);
	//
	this.framesize = vec2_from_args(args, "framesize", "fw", "fh", this.img.framex, this.img.framey);
	//
	this.tiles = [];
	this.tiles.length = this.size.x * this.size.y;
	for(var i = 0; i < this.tiles.length; i++) {
		this.tiles[i] = 0;
	}

	//init the flags for the right number of tiles
	this.flags = [];
	this.num_tiles = scalar_from_args(args, "num_tiles", 1);
	while(this.flags.length < this.num_tiles) {
		this.flags.push(0);
	}

	//special
	this.skip_null_tile = value_from_args(args, "skip_null_tile", true);
	this.screenspace = value_from_args(args, "screenspace", false);

	return this;
}

Tilemap.prototype.destroy = function() {
	//(release any resources needed)
}

//transform between spaces

Tilemap.prototype.world_to_tile_x = function(x) {
	return Math.floor((x - this.transform.pos.x)/this.framesize.x);
}

Tilemap.prototype.world_to_tile_y = function(y) {
	return Math.floor((y - this.transform.pos.y)/this.framesize.y);
}

Tilemap.prototype.world_to_tile = function(v, into) {
	if(into === undefined) {
		into = new vec2();
	}
	into.sset(
		this.world_to_tile_x(v.x),
		this.world_to_tile_y(v.y)
	);

	return into;
}

Tilemap.prototype.tile_to_world_x = function(x) {
	return (x + 0.5) * this.framesize.x + this.transform.pos.x;
}

Tilemap.prototype.tile_to_world_y = function(y) {
	return (y + 0.5) * this.framesize.y + this.transform.pos.y;
}

Tilemap.prototype.tile_to_world = function(v, into) {
	if(into === undefined) {
		into = new vec2();
	}
	into.sset(
		this.tile_to_world_x(v.x),
		this.tile_to_world_y(v.y)
	);

	return into;
}

Tilemap.prototype.index_to_tile_x = function(index) {
	return index % this.size.x;
}

Tilemap.prototype.index_to_tile_y = function(index) {
	return Math.floor(index / this.size.x);
}

Tilemap.prototype.index_to_tile = function(i, into) {
	if(into === undefined) {
		into = new vec2();
	}
	into.sset(
		this.index_to_tile_x(i),
		this.index_to_tile_y(i)
	);

	return into;
}

Tilemap.prototype.tile_to_index_xy = function(x, y) {
	return Math.floor(x) + Math.floor(y) * this.size.x;
}

Tilemap.prototype.tile_to_index = function(v) {
	return Math.floor(v.x) + Math.floor(v.y) * this.size.x;
}

//get tiles (in tile space)
Tilemap.prototype.get = function(x, y) {
	return this.tiles[this.tile_to_index_xy(x, y)];
}

Tilemap.prototype.get_wrapped = function(x, y) {
	return this.get(wrap(x, 0, this.size.x), wrap(y, 0, this.size.y));
}

Tilemap.prototype.get_clamped = function(x, y) {
	return this.get(clamp(x, 0, this.size.x-1), clamp(y, 0, this.size.y-1));
}

//get tiles (in world space)
Tilemap.prototype.get_worldspace = function(x, y) {
	return this.get(this.world_to_tile_x(x), this.world_to_tile_y(y));
}

Tilemap.prototype.get_wrapped_worldspace = function(x, y) {
	return this.get_wrapped(this.world_to_tile_x(x), this.world_to_tile_y(y));
}

Tilemap.prototype.get_clamped_worldspace = function(x, y) {
	return this.get_clamped(this.world_to_tile_x(x), this.world_to_tile_y(y));
}

//setting tiles

Tilemap.prototype.set = function(x, y, t) {
	return this.tiles[this.tile_to_index_xy(x, y)] = t;
}

Tilemap.prototype.set_wrapped = function(x, y, t) {
	return this.set(wrap(x, 0, this.size.x), wrap(y, 0, this.size.y), t);
}

Tilemap.prototype.tilemap_set_clamped = function(x, y, t) {
	return this.set(clamp(x, 0, this.size.x-1), clamp(y, 0, this.size.y-1), t);
}

//get tiles (in world space)
Tilemap.prototype.tilemap_set_worldspace = function(x, y, t) {
	return this.set(this.world_to_tile_x(x), this.world_to_tile_y(y), t);
}

Tilemap.prototype.tilemap_set_wrapped_worldspace = function(x, y, t) {
	return this.set_wrapped(this.world_to_tile_x(x), this.world_to_tile_y(y), t);
}

Tilemap.prototype.tilemap_set_clamped_worldspace = function(x, y, t) {
	return this.set_clamped(this.world_to_tile_x(x), this.world_to_tile_y(y), t);
}

Tilemap.prototype.tilemap_fill = function(x1, y1, x2, y2, t) {
	for(var y = y1; y <= y2; y++) {
		for(var x = x1; x <= x2; x++) {
			this.set(x, y, t);
		}
	}
}

//get flags for a given tile
Tilemap.prototype.get_flags = function(tile) {
	return this.flags[tile];
}

Tilemap.prototype.set_flags = function(tile, flags) {
	this.flags[tile] = flags;
}

Tilemap.prototype.get_flag = function(tile, flag) {
	return (this.flags[tile] & (1 << flag)) != 0;
}

Tilemap.prototype.set_flag = function(tile, flag) {
	this.flags[tile] |= (1 << flag);
}

Tilemap.prototype.unset_flag = function(tile, flag) {
	this.flags[tile] &= ~(1 << flag);
}

//getting tiles matching (tile space)
//returns list of matching indices

Tilemap.prototype.get_tiles_matching_in = function(match, x1, y1, x2, y2) {
	var ret = [];

	//clamp range
	y1 = Math.max(0, y1);
	y2 = Math.min(y2, this.size.y-1);
	x1 = Math.max(0, x1);
	x2 = Math.min(x2, this.size.x-1);

	for(var y = y1; y <= y2; y++) {
		for(var x = x1; x <= x2; x++) {
			if(match(this.get(x, y))) {
				ret.push(this.tile_to_index_xy(x, y));
			}
		}
	}
	return ret;
}

Tilemap.prototype.get_tiles_matching = function(match) {
	return this.get_tiles_matching_in(match, 0, 0, this.size.x - 1, this.size.y - 1);
}

Tilemap.prototype.get_tiles_matching_flag_in = function(flag, x1, y1, x2, y2) {
	//TODO: optimise to avoid fn creation
	var tiles = this;
	return this.get_tiles_matching_in(
		function(t) {
			return tiles.get_flag(t, flag);
		},
		x1, y1,
		x2, y2
	);
}

Tilemap.prototype.get_tiles_matching_flag = function(flag) {
	return this.get_tiles_matching_flag_in(flag, 0, 0, this.size.x-1, this.size.y -1);
}

Tilemap.prototype.get_tiles_matching_type_in = function(t, x1, y1, x2, y2) {
	//TODO: optimise to avoid fn creation
	return get_tiles_matching_in(
		function(_t) {
			return t == _t;
		},
		x1, y1,
		x2, y2
	);
}

Tilemap.prototype.get_tiles_matching_type = function(t) {
	return this.get_tiles_matching_type_in(t, 0, 0, this.size.x-1, this.size.y -1);
}

//render tiles on screen

Tilemap.prototype._render_tilemap = function(x1, y1, x2, y2, ox, oy) {
	if(this.tiles.length == 0) return;
	//ensure in correct space
	x1 = Math.floor((x1 - ox) / this.framesize.x);
	x2 = Math.ceil((x2 - ox) / this.framesize.x);

	y1 = Math.floor((y1 - oy) / this.framesize.y);
	y2 = Math.ceil((y2 - oy) / this.framesize.y);

	for(var y = y1; y < y2; y++) {
		if(y < 0 || y >= this.size.y) {
			continue;
		}
		for(var x = x1; x < x2; x++) {
			if(x < 0 || x >= this.size.x) {
				continue;
			}
			var i = x + (y * this.size.x);
			var t = this.tiles[i];
			if(t == 0 && this.skip_null_tile) {
				continue;
			}
			var _x = (x * this.framesize.x) + ox;
			var _y = (y * this.framesize.y) + oy;
			draw_image_frame(this.img, _x, _y, t, this.framesize.x, this.framesize.y, false, false);
		}
	}
}

Tilemap.prototype.render_screenspace = function() {
	this._render_tilemap(
		0, 0,
		get_canvas_width(), get_canvas_height(),
		this.transform.pos.x, this.transform.pos.y
	);
}

Tilemap.prototype.render_worldspace = function() {
	this._render_tilemap(
		screen_topleft_x(), screen_topleft_y(),
		screen_bottomright_x(), screen_bottomright_y(),
		this.transform.pos.x, this.transform.pos.y
	);
}

Tilemap.prototype.render = function() {
	if(this.screenspace) {
		this.render_screenspace();
	} else {
		this.render_worldspace();
	}
}


Tilemap.prototype.resize = function(w, h) {
	this.size.x = w;
	this.size.y = h;
	this.tiles = [];
	this.tiles.length = this.w * this.h;
	for(var i = 0; i < this.tiles.length; i++) {
		this.tiles[i] = 0;
	}
}

Tilemap.prototype.load_csv = function(str) {
	this.tiles = [];
	str = str.trim();
	var csv = csv_to_2d_array(str, {parse_ints: true});
	this.size.y = csv.length;
	for(var i = 0; i < csv.length; i++) {
		var row = csv[i];
		this.size.x = row.length;
		for(var j = 0; j < row.length; j++) {
			var t = row[j];
			if(isNaN(t)) {
				t = 0;
			}
			this.tiles.push(t);
		}
	}
}

///////////////////////////////////////////////////////////////////////////////
//
//	TilemapSystem
//
//		Tilemap component manager for entities
//
///////////////////////////////////////////////////////////////////////////////

function TilemapSystem() {
	this._c = [];
	return this;
}

TilemapSystem.prototype.create_component = function(args) {
	var tm = new Tilemap(args);
	this._c.push(tm);
	return tm;
}

TilemapSystem.prototype.destroy_component = function(comp) {
	remove_element(this._c, comp);
}

TilemapSystem.prototype.update = function() {
	//todo: use this to "render" out to sprites for
	//		sprite-based depth-sorted tilemaps based on the screen
	/*for(var i = 0; i < this._c.length; i++) {
		var c = this._c[i];
		c.update();
	}*/
	push_debug_msg("Tilemaps : "+this._c.length);
}

TilemapSystem.prototype.render = function() {
	for(var i = 0; i < this._c.length; i++) {
		var c = this._c[i];
		if(c.screenspace) {
			reset_render_translation();
		} else {
			apply_camera_translation();
		}

		c.render();
	}
}

///////////////////////////////////////////////////////////////////////////////
//
//	SharedTilemapSystem
//
//		System to manage updating and access to single shared tilemap
//
///////////////////////////////////////////////////////////////////////////////

function SharedTilemapSystem(args) {
	this.tilemap = new Tilemap(args);
	return this;
}

SharedTilemapSystem.prototype.update = function() {
	//todo: use this to "render" out to sprites for
	//		sprite-based depth-sorted tilemaps based on the screen
	//this.tilemap.update();
}

SharedTilemapSystem.prototype.render = function() {
	if(this.tilemap.screenspace) {
		reset_render_translation();
	} else {
		apply_camera_translation();
	}

	this.tilemap.render();
}
