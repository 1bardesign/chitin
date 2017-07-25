//"physics"

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

//overlap tests

var _phys_temps = {
	//todo: consider breaking these out so there's not even push/pop
	vpool: new ObjectPool(vec2, true)
};

function _overlap_aabb_aabb(a,b) {
	//alloc
	var d = _phys_temps.vpool.pop();
	var t = _phys_temps.vpool.pop();

	//load
	a.transform.pos.subi(b.transform.pos, d).absi();
	a.halfsize.addi(b.halfsize, t);

	//compare
	var result = (d.x < t.x && d.y < t.y);

	//free
	_phys_temps.vpool.push(d);
	_phys_temps.vpool.push(t);

	return result;
}

function _overlap_circle_circle(a,b) {
	//alloc
	var d = _phys_temps.vpool.pop();
	var t = 0;

	//load
	a.transform.pos.subi(b.transform.pos, d);
	t = a.radius + b.radius;

	//compare
	var result = (d.length_squared() < (t * t));

	//free
	_phys_temps.vpool.push(d);

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
	//consider maybe rasterisation-based collision fallback?
	return null;
}

//overlap two shapes
function overlapped_shapes(a, b) {
	return (_get_overlap_for(a, b))(a, b);
}

function overlap_shapes(a, b, callback) {
	var result = overlapped_shapes(a,b);
	if(result) {
		callback(a, b);
		callback(b, a);
	}
	return result;
}

//overlap within group
function overlap_group(group, callback) {
	var len = group.length;
	var overall = false;
	for (var i = 0; i < len; i++) {
		var a = group[i];
		for(var j = i+1; j < len; j++) {
			var b = group[j];
			var result = overlapped_shapes(a, b);
			if(result) {
				callback(a, b);
				callback(b, a);
				overall = true;
			}
		}
	}
	return overall;
}

//overlap between groups
function overlap_groups(group_a, group_b, callback) {
	if(group_a == group_b) {
		return overlap_group(group_a, callback);
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
			var result = overlapped_shapes(a, b);
			if(result) {
				callback(a, b);
				callback(b, a);
				overall = true;
			}
		}
	}
	return overall;
}


//bouncing based on a resolution
function _do_bounce(body, ox, oy, bounce, friction)
{
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
			overlap_group(w.group, w.callback);
		if(w.type == "multi")
			overlap_groups(w.a, w.b, w.callback);

	}
}
