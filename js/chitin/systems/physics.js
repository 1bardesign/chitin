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
	this.last_collision = {
		time: -1,
		sys: ""
	};
	return this;
}

Shape.prototype.collided_within = function(time) {
	return (this.last_collision.time - tick_time) <= time;
}

Shape.prototype.just_collided = function() {
	return this.collided_within(1);
}

Shape.prototype.collided_system = function() {
	return this.last_collision.sys;
}

function Circle(transform, radius) {
	this.transform = transform;
	this.radius = radius;
	this.type = "circle";
	return this;
}
Circle.prototype = Object.create(Shape.prototype);

function AABB(transform, size) {
	this.transform = transform;
	this.halfsize = size.smul(0.5);
	this.type = "aabb";
	return this;
}
AABB.prototype = Object.create(Shape.prototype);

///////////////////////////////////////////////////////////////////////////////
//physics implementation globals

var _phys_temps = {
	//shared vector pool
	//	todo: consider breaking these out into their own variables
	//	 so there's not even push/pop
	vpool: new ObjectPool(vec2, true)
};

///////////////////////////////////////////////////////////////////////////////
//minimum separating vector tests
//take 2 shapes and a vector to write into

function _msv_aabb_aabb(a, b, into) {
	//alloc
	var d = _phys_temps.vpool.pop(); //difference
	var t = _phys_temps.vpool.pop(); //total

	//load
	a.transform.pos.subi(b.transform.pos, d).absi();
	a.halfsize.addi(b.halfsize, t);

	//compare
	if (d.x > t.x || d.y > t.y) {
		//no penetration on one axis
		into.set(0,0);
	} else {
		var p = _phys_temps.vpool.pop(); //penetration
		d.absi(p).subi(t);

		//decide min-sep
		if(p.x <= p.y) {
			into.set((d.x < 0) ? -p.x : p.x, 0);
		} else {
			into.set(0, (d.y < 0) ? -p.y : p.y, 0);
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

function _get_msv_for(a, b) {
	//same type? easier tests
	if(a.type == b.type) {
		if(a.type == "aabb") {
			return _msv_aabb_aabb;
		} else if(a.type == "circle") {
			return _msv_circle_circle;
		}
	}
	//otherwise, we dont have a suitable comparison
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
		//a,b is always required
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
//	these use the msv tests for now to cut down on code size
//	special-cases of them should be written as an optimisation

function _overlap_aabb_aabb(a,b) {
	//alloc
	var into = _phys_temps.vpool.pop();

	//check
	var result = _msv_aabb_aabb(a, b, into).length() > 0;

	//free
	_phys_temps.vpool.push(into);

	return result;
}

function _overlap_circle_circle(a,b) {
	//alloc
	var into = _phys_temps.vpool.pop();

	//check
	var result = _msv_circle_circle(a, b, into).length() > 0;

	//free
	_phys_temps.vpool.push(into);

	return result;
}

function _get_overlap_for(a, b) {
	//same type? easier tests
	if(a.type == b.type) {
		if(a.type == "aabb") {
			return _overlap_aabb_aabb;
		} else if(a.type == "circle") {
			return _overlap_circle_circle;
		}
	}
	//otherwise, we dont have a suitable comparison
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
		//a,b is always required
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
//	useful collision behaviours

//"resolve" behaviour - simply move the shapes apart, completely or partially
var _resolve_scale = 1.0;
function _callback_resolve(a, b, msv) {
	msv.smuli(0.5 * _resolve_scale);
	a.transform.pos.addi(msv);
	b.transform.pos.subi(msv);
}

function collide_shapes_resolve_completely(a, b) {
	_resolve_scale = 1.0;
	return collide_shapes_callback_together(a, b, _callback_resolve)
}

function collide_group_resolve_completely(group) {
	_resolve_scale = 1.0;
	return collide_group_callback_together(group, _callback_resolve)
}

function collide_groups_resolve_completely(a, b) {
	_resolve_scale = 1.0;
	return collide_groups_callback_together(a, b, _callback_resolve)
}

function collide_shapes_resolve_partial(a, b, amount) {
	_resolve_scale = amount;
	return collide_shapes_callback_together(a, b, _callback_resolve)
}

function collide_group_resolve_partial(group, amount) {
	_resolve_scale = amount;
	return collide_group_callback_together(group, _callback_resolve)
}

function collide_groups_resolve_partial(a, b, amount) {
	_resolve_scale = amount;
	return collide_groups_callback_together(a, b, _callback_resolve)
}

//todo: adapt old bounce behaviour
//bouncing based on a resolution
function _do_bounce(body, ox, oy, bounce, friction) {
	//get normalised surface normal
	//or else bail on the bounce (no movement)
	var nx = ox - body.x;
	var ny = oy - body.y;
	var len = v2_length(nx, ny);
	if(len == 0) return;
	nx /= len;
	ny /= len;
	//get tangent
	var tx = v2_rot90_x(nx, ny);
	var ty = v2_rot90_y(nx, ny);
	//project in each direction
	var perp = v2_scalar_projection(body.vx, body.vy, nx, ny);
	var par = v2_scalar_projection(body.vx, body.vy, tx, ty);
	//scale and actually bounce
	bounce *= perp;
	friction *= par;
	if(bounce > 0)
		bounce *= -1;
	//finally apply it as new velocity
	body.vx = nx * bounce + tx * friction;
	body.vy = ny * bounce + ty * friction;
}

// systems

function ShapeOverlapSystem() {
	this._work = [];
	this._shapes = 0;
}

ShapeOverlapSystem.prototype.add_group = function(group, callback) {
	this._work.push({
		type: "single",
		group: group,
		callback: callback
	});
}

ShapeOverlapSystem.prototype.add_groups = function(group_a, group_b, callback) {
	this._work.push({
		type: "multi",
		a: group_a,
		b: group_b,
		callback: callback
	});
}

ShapeOverlapSystem.prototype.create_component = function(args) {
	this._shapes++;
	return args;
}

ShapeOverlapSystem.prototype.destroy_component = function(comp) {
	this._shapes--;
	if(this._shapes < 0) console.error("Too many shapes were destroyed in collision system");
}

ShapeOverlapSystem.prototype.update = function() {
	for(var i = 0; i < this._work.length; i++)
	{
		var w = this._work[i];
		if(w.type == "single")
			overlap_group_callback_separate(w.group, w.callback);
		if(w.type == "multi")
			overlap_groups_callback_separate(w.a, w.b, w.callback);

	}
}
