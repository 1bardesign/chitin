///////////////////////////////////////////////////////////////////////////////
//
//	physics.js
//
//		routines and data structures for collision detection and response
//
///////////////////////////////////////////////////////////////////////////////

//shape constructors

function Shape() {
	this.type = "";
	this.collided_side = 0;
	this.last_normal = new vec2();
	return this;
}

var COLLIDED_TOP = (1 << 0);
var COLLIDED_BOTTOM = (1 << 1);
var COLLIDED_LEFT = (1 << 2);
var COLLIDED_RIGHT = (1 << 3);
var COLLIDED_HORIZONTAL = COLLIDED_LEFT | COLLIDED_RIGHT;
var COLLIDED_VERTICAL = COLLIDED_TOP | COLLIDED_BOTTOM;

Shape.prototype.set_collision_info = function(normal) {
	this.last_normal.vset(normal);
	if(normal.y > 0.5) {
		this.collided_side |= COLLIDED_TOP;
	}
	if (normal.y < -0.5) {
		this.collided_side |= COLLIDED_BOTTOM;
	}
	if (normal.x > 0.5) {
		this.collided_side |= COLLIDED_LEFT;
	}
	if (normal.x < -0.5) {
		this.collided_side |= COLLIDED_RIGHT;
	}
}

Shape.prototype.has_collided_side = function(side_constant) {
	return (this.collided_side & side_constant) != 0;
}

//bounds - generally used for broadphase stuff; should contain the entire object
//	(override per-shape)
Shape.prototype.bounds_tl = function(into) {
	into.vset(this.transform.pos);
	return into;
}

Shape.prototype.bounds_br = function(into) {
	into.vset(this.transform.pos);
	return into;
}

Shape.prototype.get_bounds = function(tl, br) {
	this.bounds_tl(tl);
	this.bounds_br(br);
}

//circle

function Circle(transform, radius) {
	Shape.call(this);
	this.transform = transform;
	this.radius = radius;
	this.type = "circle";
	return this;
}
Circle.prototype = Object.create(Shape.prototype);

Circle.prototype.bounds_tl = function(into) {
	into.vset(this.transform.pos);
	into.x -= this.radius;
	into.y -= this.radius;
	return into;
}

Circle.prototype.bounds_br = function(into) {
	into.vset(this.transform.pos);
	into.x += this.radius;
	into.y += this.radius;
	return into;
}

//aabb

function AABB(transform, size) {
	Shape.call(this);
	this.transform = transform;
	this.halfsize = size.smul(0.5);
	this.type = "aabb";
	return this;
}
AABB.prototype = Object.create(Shape.prototype);

AABB.prototype.bounds_tl = function(into) {
	into.vset(this.transform.pos).subi(this.halfsize);
	return into;
}

AABB.prototype.bounds_br = function(into) {
	into.vset(this.transform.pos).addi(this.halfsize);
	return into;
}

//line

function Line(start, end) {
	Shape.call(this);
	this.transform = start;
	this.end = end;
	this.type = "line";
	return this;
}
Line.prototype = Object.create(Shape.prototype);

Line.prototype.bounds_tl = function(into) {
	into.vset(this.transform.pos).mini(this.end.pos);
	return into;
}

Line.prototype.bounds_br = function(into) {
	into.vset(this.transform.pos).maxi(this.end.pos);
	return into;
}

///////////////////////////////////////////////////////////////////////////////
//physics implementation globals

var _phys_temps = {
	//shared vector pool
	//	todo: consider breaking these out into their own variables
	//	 so there's not even push/pop
	vpool: new ObjectPool(vec2, true),

	//shared shapes for complex collisions
	shapes: {
		aabb: new AABB(new Transform(), new vec2(0,0)),
		circle: new Circle(new Transform(), 0)
		//todo: line
	}
};

///////////////////////////////////////////////////////////////////////////////
//minimum separating vector tests
//take 2 shapes and a vector to write into
//impl note: for asymmetrical versions of these we need both versions

function _msv_aabb_aabb(a, b, into) {
	//alloc
	var d = _phys_temps.vpool.pop(); //difference
	var t = _phys_temps.vpool.pop(); //total

	//load
	a.transform.pos.subi(b.transform.pos, d);
	a.halfsize.addi(b.halfsize, t);

	//compare
	if (Math.abs(d.x) > t.x || Math.abs(d.y) > t.y) {
		//no penetration on one axis
		into.sset(0,0);
	} else {
		var p = _phys_temps.vpool.pop(); //penetration
		p.vset(d).absi();
		t.subi(p, p);

		//decide min-sep
		if(p.x <= p.y) {
			into.sset((d.x < 0) ? -p.x : p.x, 0);
		} else {
			into.sset(0, (d.y < 0) ? -p.y : p.y);
		}

		_phys_temps.vpool.push(p);
	}

	//free
	_phys_temps.vpool.push(d);
	_phys_temps.vpool.push(t);

	return into;
}

function _msv_circle_circle(a, b, into) {
	//alloc
	var d = _phys_temps.vpool.pop();
	var t = 0;

	//load
	a.transform.pos.subi(b.transform.pos, d);
	t = a.radius + b.radius;

	//compare
	var len = d.length();
	var pen = t - len;
	if(pen <= 0) {
		into.sset(0,0);
	} else {
		if(len == 0) {
			d.sset(0,1);
			len = 1;
		}
		into.vset(d.sdivi(len).smul(pen));
	}

	//free
	_phys_temps.vpool.push(d);

	return into;
}

function _msv_circle_aabb(a, b, into) {
	//alloc
	var d = _phys_temps.vpool.pop();
	var ad = _phys_temps.vpool.pop();
	//load
	d.vset(a.transform.pos).subi(b.transform.pos);
	d.absi(ad);
	//compare
	if(ad.x <= b.halfsize.x || ad.y <= b.halfsize.y) {
		//inside edge region - aabb
		var _temp = _phys_temps.shapes.aabb;
		_temp.transform.pos.vset(a.transform.pos);
		_temp.halfsize.sset(a.radius, a.radius);
		_msv_aabb_aabb(_temp, b, into);
	} else {
		//inside corner region
		//collide corner point
		var _temp = _phys_temps.shapes.circle;
		_temp.transform.pos.vset(b.transform.pos);
		_temp.radius = 0;
		//save
		var offset_x = ((d.x < 0) ? -1 : 1) * b.halfsize.x;
		var offset_y = ((d.y < 0) ? -1 : 1) * b.halfsize.y;

		_temp.transform.pos.x += offset_x;
		_temp.transform.pos.y += offset_y;

		_msv_circle_circle(a, _temp, into);
	}
	//free
	_phys_temps.vpool.push(d);
	_phys_temps.vpool.push(ad);

	return into;
}

function _msv_aabb_circle(a, b, into) {
	return _msv_circle_aabb(b, a, into).smuli(-1);
}

//lines

function _msv_line_line(a, b, into)
{
	var a_dir = a.end.pos.sub(a.transform.pos);
	var b_dir = b.end.pos.sub(b.transform.pos);

	var cross_dir = a_dir.cross(b_dir);

	if (cross_dir != 0)
	{
		//not parallel -> maybe overlapping

		//todo: adapt for capsules; get the distance between them
		// 		by using normalised directions & "real" distances

		var offset = b.transform.pos.sub(a.transform.pos);
		var t = offset.cross(b_dir.sdiv(cross_dir));
		var u = offset.cross(a_dir.sdiv(cross_dir));

		if (t > 0 && t < 1 && u > 0 && u < 1)
		{
			if (t < 0.5)
				return into.vset(a_dir).smul(t);
			else
				return into.vset(a_dir).smul(-1.0 + t);
		}
	}

	return into.sset(0, 0);
}

//mixed checks

function _msv_circle_line(a, b, into)
{
	var line_dir = b.end.pos.sub(b.transform.pos);
	var line_len = line_dir.normalisei_len();

	//check if we're within the segment
	var relpos = a.transform.pos.sub(b.transform.pos);
	var online = relpos.dot(line_dir);

	//past the start edge; collide with start
	if (online <= 0.0)
	{
		var circ = new Circle(b.transform, 0.0);
		return msv_circle_circle(a, circ);
	}
	//past the end edge; collide with end
	else if (online >= line_len)
	{
		var circ = new Circle(b.end, 0.0);
		return msv_circle_circle(a, circ);
	}

	//on the line segment; collide with the line
	var normal = line_dir.rot90l();

	//use dot rather than proj to avoid normalising again
	var dist = relpos.dot(normal);
	if (Math.abs(dist) < a.radius)
	{
		if(dist > 0)
			dist = -(a.radius - dist);
		else
			dist = a.radius + dist;
		return into.vset(normal.smuli(dist));
	}

	return into.sset(0, 0);
}

function _msv_line_circle(a, b, into)
{
	return msv_circle_line(b, a, into).smuli(-1.0);
}

//todo: line-aabb

function _get_msv_for(a, b) {
	//same type? easier tests
	if(a.type == b.type) {
		if(a.type == "aabb") {
			return _msv_aabb_aabb;
		} else if(a.type == "circle") {
			return _msv_circle_circle;
		}
	} else {
		//circle vs aabb
		if(a.type == "aabb" && b.type == "circle") {
			return _msv_aabb_circle;
		} else if(a.type == "circle" && b.type == "aabb") {
			return _msv_circle_aabb;
		}
	}
	//otherwise, we dont have a suitable comparison
	alert("missing msv function for "+a.type+" vs "+b.type);
	return null;
}

//collide two shapes
function collide_shapes(a, b, into) {
	return (_get_msv_for(a, b))(a, b, into);
}

//(generic implementation of callback_separate and callback_together overlap fns)

function _collide_shapes_generic(a, b, callback, callback_separate) {
	//alloc
	var into = _phys_temps.vpool.pop();

	var result = collide_shapes(a, b, into).length_squared() > 0;
	if(result) {
		//a, b is always required
		callback(a, b, into);
		if(callback_separate) {
			//b,a only for callback_separate mode
			into.inversei();
			callback(b, a, into);
		}
	}
	//free
	_phys_temps.vpool.push(into);
	return result;
}

//collide within group
function _collide_group_generic(group, callback, callback_separate) {
	var len = group.length;
	var overall = false;
	for (var i = 0; i < len; i++) {
		var a = group[i];
		for(var j = i+1; j < len; j++) {
			var b = group[j];
			if(_collide_shapes_generic(a, b, callback, callback_separate)) {
				overall = true;
			}
		}
	}
	return overall;
}

//collide between groups
function _collide_groups_generic(group_a, group_b, callback, callback_separate) {
	if(group_a == group_b) {
		return _collide_group_generic(group_a, callback, callback_separate);
	}

	var len_a = group_a.length;
	var len_b = group_b.length;
	var overall = false;
	for (var i = 0; i < len_a; i++) {
		var a = group_a[i];
		for(var j = 0; j < len_b; j++) {
			var b = group_b[j];
			if(a == b) {
				continue;
			}
			if(_collide_shapes_generic(a, b, callback, callback_separate)) {
				overall = true;
			}
		}
	}
	return overall;
}


//callback_separate function family
//for each collide, a callback gets called twice
//once for each body involved (with the other body passed in section)

function collide_shapes_callback_separate(a, b, callback) {
	return _collide_shapes_generic(a, b, callback, true);
}

function collide_group_callback_separate(group, callback) {
	return _collide_group_generic(group, callback, true);
}

function collide_groups_callback_separate(a, b, callback) {
	return _collide_groups_generic(a, b, callback, true);
}

//callback_together function family
//for each collide, the callback is called once
//with both bodies passed as arguments

function collide_shapes_callback_together(a, b, callback) {
	return _collide_shapes_generic(a, b, callback, false);
}

function collide_group_callback_together(group, callback) {
	return _collide_group_generic(group, callback, false);
}

function collide_groups_callback_together(a, b, callback) {
	return _collide_groups_generic(a, b, callback, false);
}

///////////////////////////////////////////////////////////////////////////////
//overlap tests

//(function to convert msv to overlap boolean
// this is always slower than a tailor-made test
// but means we don't have to repeat ourselves to
// get off the ground)
function _msv_to_overlap(a, b, f) {
	//alloc
	var into = _phys_temps.vpool.pop();

	//check
	var result = f(a, b, into).length_squared() > 0;

	//free
	_phys_temps.vpool.push(into);

	return result;
}

function _overlap_aabb_aabb(a, b) {
	return _msv_to_overlap(a, b, _msv_aabb_aabb);
}

function _overlap_circle_circle(a, b) {
	return _msv_to_overlap(a, b, _msv_circle_circle);
}

function _overlap_aabb_circle(a, b) {
	return _msv_to_overlap(a, b, _msv_aabb_circle);
}

function _overlap_circle_aabb(a, b) {
	return _msv_to_overlap(a, b, _msv_circle_aabb);
}

//note; not true for co-incident lines, which arguably overlap
//      but when used for polygon intersection, that means that "touching" edges aren't "crossing"
function _overlap_line_line(a, b)
{
	return is_counter_clockwise(a.transform.pos, b.transform.pos, b.end.pos) != is_counter_clockwise(a.end.pos, b.transform.pos, b.end.pos) &&
	       is_counter_clockwise(a.transform.pos, a.end.pos, b.transform.pos) != is_counter_clockwise(a.transform.pos, a.end.pos, b.end);
}

function _get_overlap_for(a, b) {
	//same type? easier tests
	if(a.type == b.type) {
		if(a.type == "aabb") {
			return _overlap_aabb_aabb;
		} else if(a.type == "circle") {
			return _overlap_circle_circle;
		}
	} else {
		if(a.type == "aabb" && b.type == "circle") {
			return _overlap_aabb_circle;
		} else if(a.type == "circle" && b.type == "aabb") {
			return _overlap_circle_aabb;
		}
	}
	//otherwise, we dont have a suitable comparison
	alert("missing overlap function for "+a.type+" vs "+b.type);
	return null;
}

//overlap two shapes
function overlapped_shapes(a, b) {
	return (_get_overlap_for(a, b))(a, b);
}

//(generic implementation of callback_separate and callback_together overlap fns)

function _overlap_shapes_generic(a, b, callback, callback_separate) {
	var result = overlapped_shapes(a, b);
	if(result) {
		//a, b is always required
		callback(a, b);
		if(callback_separate) {
			//b,a only for callback_separate mode
			callback(b, a);
		}
	}
	return result;
}

//overlap within group
function _overlap_group_generic(group, callback, callback_separate) {
	var len = group.length;
	var overall = false;
	for (var i = 0; i < len; i++) {
		var a = group[i];
		for(var j = i+1; j < len; j++) {
			var b = group[j];
			if(_overlap_shapes_generic(a, b, callback, callback_separate)) {
				overall = true;
			}
		}
	}
	return overall;
}

//overlap between groups
function _overlap_groups_generic(group_a, group_b, callback, callback_separate) {
	if(group_a == group_b) {
		return _overlap_group_generic(group_a, callback, callback_separate);
	}

	var len_a = group_a.length;
	var len_b = group_b.length;
	var overall = false;
	for (var i = 0; i < len_a; i++) {
		var a = group_a[i];
		for(var j = 0; j < len_b; j++) {
			var b = group_b[j];
			if(a == b) {
				continue;
			}
			if(_overlap_shapes_generic(a, b, callback, callback_separate)) {
				overall = true;
			}
		}
	}
	return overall;
}


//callback_separate function family
//for each overlap, a callback gets called twice
//once for each body involved (with the other body passed in section)

function overlap_shapes_callback_separate(a, b, callback) {
	return _overlap_shapes_generic(a, b, callback, true);
}

function overlap_group_callback_separate(group, callback) {
	return _overlap_group_generic(group, callback, true);
}

function overlap_groups_callback_separate(a, b, callback) {
	return _overlap_groups_generic(a, b, callback, true);
}

//callback_together function family
//for each overlap, the callback is called once
//with both bodies passed as arguments

function overlap_shapes_callback_together(a, b, callback) {
	return _overlap_shapes_generic(a, b, callback, false);
}

function overlap_group_callback_together(group, callback) {
	return _overlap_group_generic(group, callback, false);
}

function overlap_groups_callback_together(a, b, callback) {
	return _overlap_groups_generic(a, b, callback, false);
}


///////////////////////////////////////////////////////////////////////////////
//collision builtins
//	useful collision behaviours to be passed as a callback into the usual
//	collision functions

//"resolve" behaviour - simply move the shapes equally apart, completely or partially
var _resolve_scale = 1.0;
function callback_resolve(a, b, msv) {
	msv.smuli(0.5 * _resolve_scale);
	a.transform.pos.addi(msv);
	b.transform.pos.subi(msv);
}
//customising the resolve behaviour
function set_resolve_scale(scale) {
	if(scale === undefined) {
		scale = 1;
	}
	_resolve_scale = scale;
}

//resolve in only one direction; the first shape or group is moved
//completely out of the second, which isn't touched
function callback_resolve_only_a(a, b, msv) {
	msv.smuli(_resolve_scale);
	a.transform.pos.addi(msv);
}

//tilemap collisions helpers
//interim solution before we have tilemap collision "shapes" working

function _sort_tile_indices_distance(tilemap, tiles, x, y) {
	tiles.sort(function(a, b) {
		var ax = tilemap.tile_to_world_x(tilemap.index_to_tile_x(a));
		var ay = tilemap.tile_to_world_y(tilemap.index_to_tile_y(a));
		var bx = tilemap.tile_to_world_x(tilemap.index_to_tile_x(b));
		var by = tilemap.tile_to_world_y(tilemap.index_to_tile_y(b));
		var dx = ax - bx;
		var dy = ay - by;
		var adist_sq = (dx*dx + dy*dy);
		var bdist_sq = (dx*dx + dy*dy);
		return (adist_sq < bdist_sq ? -1 : (adist_sq == bdist_sq ? 0 : 1));
	})
	return tiles;
}

function _collide_shape_against_tile_indices(shape, tilemap, indices, callback) {
	//collect pos in tilespace
	var sp = new vec2();
	sp.vset(shape.transform.pos);
	tilemap.world_to_tile(sp, sp);
	//sort closest to shape
	_sort_tile_indices_distance(tilemap, indices, sp.x, sp.y);
	//create dummy shape for the tilemap
	var _tempshape = new AABB(new Transform(), tilemap.framesize);
	var result = false;
	for(var i = 0; i < indices.length; i++) {
		var index = indices[i];
		_tempshape.transform.pos.x = tilemap.tile_to_world_x(tilemap.index_to_tile_x(index));
		_tempshape.transform.pos.y = tilemap.tile_to_world_y(tilemap.index_to_tile_y(index));
		if(collide_shapes_callback_together(shape, _tempshape, callback)) {
			result = true;
		}
	}
	return result;
}

function _collide_shape_against_tilemap_generic(shape, tilemap, solid_flag, callback) {
	//todo: pool these
	var tl = new vec2();
	var br = new vec2();
	//collect bounds in tilespace
	shape.get_bounds(tl, br);
	tilemap.world_to_tile(tl, tl);
	tilemap.world_to_tile(br, br);
	//collect tiles as needed
	var solid = tilemap.get_tiles_matching_flag_in(solid_flag, tl.x, tl.y, br.x, br.y);
	//resolve in order
	return _collide_shape_against_tile_indices(shape, tilemap, solid, callback);
}

function _collide_group_against_tilemap_generic(group, tilemap, solid_flag, f) {
	var result = false;
	for(var i = 0; i < group.length; i++) {
		if(f(group[i], tilemap, solid_flag)) {
			result = true;
		}
	}
	return result;
}

function resolve_shape_against_tilemap(shape, tilemap, solid_flag) {
	return _collide_shape_against_tilemap_generic(shape, tilemap, solid_flag, callback_resolve_only_a);
}

function resolve_group_against_tilemap(group, tilemap, solid_flag) {
	return _collide_group_against_tilemap_generic(group, tilemap, solid_flag, resolve_shape_against_tilemap);
}

// systems

function PhysicsResolutionSystem() {
	this._work = [];
	this._reacts = [];
	this._shapes = 0;
}

////////////////////
// overlaps

PhysicsResolutionSystem.prototype.add_pair_callback_separate = function(a, b, callback) {
	this._work.push({
		type: "pair_separate",
		a: a,
		b: b,
		callback: callback
	});
}

PhysicsResolutionSystem.prototype.add_group_callback_separate = function(group, callback) {
	this._work.push({
		type: "single_separate",
		group: group,
		callback: callback
	});
}

PhysicsResolutionSystem.prototype.add_groups_callback_separate = function(group_a, group_b, callback) {
	this._work.push({
		type: "multi_separate",
		a: group_a,
		b: group_b,
		callback: callback
	});
}

PhysicsResolutionSystem.prototype.add_pair_callback_together = function(a, b, callback) {
	this._work.push({
		type: "pair_together",
		a: a,
		b: b,
		callback: callback
	});
}

PhysicsResolutionSystem.prototype.add_group_callback_together = function(group, callback) {
	this._work.push({
		type: "single_together",
		group: group,
		callback: callback
	});
}

PhysicsResolutionSystem.prototype.add_groups_callback_together = function(group_a, group_b, callback) {
	this._work.push({
		type: "multi_together",
		a: group_a,
		b: group_b,
		callback: callback
	});
}

////////////////////
// collisions

PhysicsResolutionSystem.prototype.add_pair_collide = function(a, b, callback) {
	this._work.push({
		type: "pair_collide",
		a: a,
		b: b,
		callback: callback
	});
}

PhysicsResolutionSystem.prototype.add_group_collide = function(group, callback) {
	this._work.push({
		type: "single_collide",
		group: group,
		callback: callback
	});
}

PhysicsResolutionSystem.prototype.add_groups_collide = function(group_a, group_b, callback) {
	this._work.push({
		type: "multi_collide",
		a: group_a,
		b: group_b,
		callback: callback
	});
}

//builtin - resolve overlaps
// (scaled by some amount)

PhysicsResolutionSystem.prototype.add_pair_resolve = function(a, b, amount) {
	this._work.push({
		type: "pair_resolve",
		a: a,
		b: b,
		amount: amount
	});
}

PhysicsResolutionSystem.prototype.add_group_resolve = function(group, amount) {
	this._work.push({
		type: "single_resolve",
		group: group,
		amount: amount
	});
}

PhysicsResolutionSystem.prototype.add_groups_resolve = function(group_a, group_b, amount) {
	this._work.push({
		type: "multi_resolve",
		a: group_a,
		b: group_b,
		amount: amount
	});
}

PhysicsResolutionSystem.prototype.add_tilemap_vs_group = function(tilemap, group, flag, amount) {
	this._work.push({
		type: "tilemap_group",
		t: tilemap,
		g: group,
		flag: flag,
		amount: amount
	});
}

////////////////////////////////////////
// reactions (to collisions)

//call a callback for any collisions that recieves the object and the collision normal
PhysicsResolutionSystem.prototype.add_react_cb = function(group, cb) {
	this._reacts.push({
		type: "react_cb",
		group: group,
		callback: cb
	});
}

//note down which side was collided
PhysicsResolutionSystem.prototype.add_react_collision_info = function(group) {
	this._reacts.push({
		type: "react_collision_info",
		group: group
	});
}

//add a bounce reaction
PhysicsResolutionSystem.prototype.add_react_bounce = function(group, bounce, slide) {
	this._reacts.push({
		type: "react_bounce",
		group: group,
		bounce: bounce,
		slide: slide
	});
}

//(book-keeping)

PhysicsResolutionSystem.prototype.create_component = function(args) {
	this._shapes++;
	return args;
}

PhysicsResolutionSystem.prototype.destroy_component = function(comp) {
	this._shapes--;
	if(this._shapes < 0) console.error("Too many shapes were destroyed in overlap system: "+this.name);
}

// (actually doing the work)
PhysicsResolutionSystem.prototype.update = function() {
	for(var i = 0; i < this._reacts.length; i++)
	{
		var r = this._reacts[i];
		if(r.type == "react_bounce" ||
			r.type == "react_cb" ||
			r.type == "react_collision_info") {
			r.group.foreach(function(v) {
				if(r.type == "react_collision_info") {
					v.collided_side = 0;
				}
				if (v._oldpos === undefined) {
					v._oldpos = new vec2();
				}
				v._oldpos.vset(v.transform.pos);
			});
		}
	}

	for(var i = 0; i < this._work.length; i++)
	{
		var w = this._work[i];
		//callbacks separate
		if(w.type == "pair_separate") {
			overlap_shapes_callback_separate(w.a, w.b, w.callback);
		}
		if(w.type == "single_separate") {
			overlap_group_callback_separate(w.group, w.callback);
		}
		if(w.type == "multi_separate") {
			overlap_groups_callback_separate(w.a, w.b, w.callback);
		}
		//callbacks together
		if(w.type == "pair_together") {
			overlap_shapes_callback_together(w.a, w.b, w.callback);
		}
		if(w.type == "single_together") {
			overlap_group_callback_together(w.group, w.callback);
		}
		if(w.type == "multi_together") {
			overlap_groups_callback_together(w.a, w.b, w.callback);
		}

		//collisions
		if(w.type == "pair_collide") {
			collide_shapes_callback_together(w.a, w.b, w.callback);
		}
		if(w.type == "single_collide") {
			collide_group_callback_together(w.group, w.callback);
		}
		if(w.type == "multi_collide") {
			collide_groups_callback_together(w.a, w.b, w.callback);
		}

		//resolve
		if(w.type == "pair_resolve") {
			set_resolve_scale(w.amount);
			collide_shapes_callback_together(w.a, w.b, callback_resolve);
		}
		if(w.type == "single_resolve") {
			set_resolve_scale(w.amount);
			collide_group_callback_together(w.group, callback_resolve);
		}
		if(w.type == "multi_resolve") {
			set_resolve_scale(w.amount);
			collide_groups_callback_together(w.a, w.b, callback_resolve);
		}

		//tilemap related
		if(w.type == "tilemap_group") {
			set_resolve_scale(w.amount);
			resolve_group_against_tilemap(w.g, w.t, w.flag);
		}
	}

	for(var i = 0; i < this._reacts.length; i++)
	{
		var r = this._reacts[i];
		var _normal = new vec2();
		var _tangent = new vec2();
		if(r.type == "react_cb") {
			r.group.foreach(function(v) {
				_normal.vset(v.transform.pos).subi(v._oldpos);
				var lensq = _normal.length_squared();
				if(lensq == 0) return;
				_normal.sdivi(Math.sqrt(lensq));
				r.callback(v, _normal);
			});
		} else if(r.type == "react_collision_info") {
			r.group.foreach(function(v) {
				_normal.vset(v.transform.pos).subi(v._oldpos);
				var lensq = _normal.length_squared();
				if(lensq == 0) return;
				_normal.sdivi(Math.sqrt(lensq));
				v.set_collision_info(_normal);
			});
		} else if(r.type == "react_bounce") {
			r.group.foreach(function(v) {
				_normal.vset(v.transform.pos).subi(v._oldpos);
				var lensq = _normal.length_squared();
				//normalise
				if(lensq == 0) return;
				_normal.sdivi(Math.sqrt(lensq));
				//generate tangent
				_normal.rotli(Math.PI * 0.5, _tangent);
				//figure restitution vars
				var bounce = r.bounce;
				var slide = r.slide;
				//project
				var vert = v.transform.vel.sproj(_normal);
				var hori = v.transform.vel.sproj(_tangent);
				if(vert <= 0) {
					vert *= -1;
				} else {
					bounce = 1;
				}
				//apply
				_normal.smuli(bounce * vert);
				_tangent.smuli(slide * hori);
				v.transform.vel.vset(_normal).addi(_tangent);
			});
		}
	}

}
