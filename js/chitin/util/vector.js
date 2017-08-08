///////////////////////////////////////////////////////////////////////////////
//
//	vector.js
//
//		2d vector maths helpers
//
///////////////////////////////////////////////////////////////////////////////
//
//		provides i-suffix "into" functions which write their
//		result into the second argument (defaults to this) to
//		reduce gc pressure. no-suffix versions that return a
//		vector will allocate.
//
//		overloading with different types mostly avoided for speed
//
//		in cases where the no-prefix version "figured out" types
//		there is a (v)ector and (s)calar prefixed version which doesn't.
//
//		in other cases the vector version is no-prefix, scalar is s-prefix.
//
///////////////////////////////////////////////////////////////////////////////

function vec2(x,y) {
	return this.set(x,y);
}

vec2.prototype.set = function(x,y) {
	if(typeof x === "undefined") {
		x = 0;
	}
	if(typeof x === "number") {
		if(typeof y === "undefined") {
			this.x = x;
			this.y = x;
		} else {
			this.x = x;
			this.y = y;
		}
	} else {
		this.x = x.x;
		this.y = x.y;
	}
	return this;
}

vec2.prototype.vset = function(other) {
	this.x = other.x;
	this.y = other.y;
	return this;
}

vec2.prototype.sset = function(x,y) {
	this.x = x;
	this.y = y;
	return this;
}

//vector arithmetic
//prefer immediate mode where possible to reduce garbage

vec2.prototype.addi = function(other, into) {
	if(into === undefined) {
		into = this;
	}
	into.x = this.x + other.x;
	into.y = this.y + other.y;
	return into;
}

vec2.prototype.add = function(other) {
	return this.addi(other, new vec2(this));
}

vec2.prototype.subi = function(other, into) {
	if(into === undefined) {
		into = this;
	}
	into.x = this.x - other.x;
	into.y = this.y - other.y;
	return into;
}

vec2.prototype.sub = function(other) {
	return this.subi(other, new vec2(this));
}

vec2.prototype.muli = function(other, into) {
	if(into === undefined) {
		into = this;
	}
	into.x = this.x * other.x;
	into.y = this.y * other.y;
	return into;
}

vec2.prototype.mul = function(other) {
	return this.muli(other, new vec2(this));
}

vec2.prototype.divi = function(other, into) {
	if(into === undefined) {
		into = this;
	}
	into.x = this.x / other.x;
	into.y = this.y / other.y;
	return into;
}

vec2.prototype.div = function(other) {
	return this.divi(other, new vec2(this));
}

//scalar arithmetic

vec2.prototype.saddi = function(scal, into) {
	if(into === undefined) {
		into = this;
	}
	into.x = this.x + scal;
	into.y = this.y + scal;
	return into;
}

vec2.prototype.sadd = function(scal) {
	return this.saddi(scal, new vec2(this));
}

vec2.prototype.ssubi = function(scal, into) {
	if(into === undefined) {
		into = this;
	}
	into.x = this.x - scal;
	into.y = this.y - scal;
	return into;
}

vec2.prototype.ssub = function(scal) {
	return this.ssubi(scal, new vec2(this));
}

vec2.prototype.smuli = function(scal, into) {
	if(into === undefined) {
		into = this;
	}
	into.x = this.x * scal;
	into.y = this.y * scal;
	return into;
}

vec2.prototype.smul = function(scal) {
	return this.smuli(scal, new vec2(this));
}

vec2.prototype.sdivi = function(scal, into) {
	if(into === undefined) {
		into = this;
	}
	into.x = this.x / scal;
	into.y = this.y / scal;
	return into;
}

vec2.prototype.sdiv = function(scal) {
	return this.sdivi(scal, new vec2(this));
}

//length, normalising

vec2.prototype.length_squared = function() {
	return this.x * this.x + this.y * this.y;
}

vec2.prototype.length = function() {
	//(saves a call over using length_squared)
	return Math.sqrt(this.x * this.x + this.y * this.y);
}

vec2.prototype.distance_squared = function(other) {
	var dx = this.x - other.x;
	var dy = this.y - other.y;
	return dx * dx + dy * dy;
}

vec2.prototype.distance = function(other) {
	var dx = this.x - other.x;
	var dy = this.y - other.y;
	return Math.sqrt(dx * dx + dy * dy);
}

vec2.prototype.normalisei = function(into) {
	if(into === undefined) {
		into = this;
	}
	var len = this.length();
	if(len == 0) {
		into.x = 0;
		into.y = 0;
	} else {
		into.x = this.x / len;
		into.y = this.y / len;
	}
	return into;
}

vec2.prototype.normalisei_len = function(into) {
	if(into === undefined) {
		into = this;
	}
	var len = this.length();
	if(len == 0) {
		into.x = 0;
		into.y = 0;
	} else {
		into.x = this.x / len;
		into.y = this.y / len;
	}
	return len;
}


vec2.prototype.normalised = function() {
	return this.normalisei(new vec2(0));
}

vec2.prototype.normalise = function() {
	return this.normalisei(this);
}

//inverse

vec2.prototype.inversei = function() {
	return this.smuli(-1);
}

vec2.prototype.inverse = function() {
	return this.inversei(new vec2(0));
}

//abs, minmax, clamp

vec2.prototype.absi = function(into) {
	if(into === undefined) {
		into = this;
	}
	into.x = Math.abs(this.x);
	into.y = Math.abs(this.y);
	return into;
}

vec2.prototype.abs = function() {
	return this.absi(new vec2());
}

vec2.prototype.mini = function(v, into) {
	if(into === undefined) {
		into = this;
	}
	into.x = Math.min(v, this.x);
	into.y = Math.min(v, this.y);
	return into;
}

vec2.prototype.min = function(v) {
	return this.mini(v, new vec2());
}

vec2.prototype.maxi = function(v, into) {
	if(into === undefined) {
		into = this;
	}
	into.x = Math.max(v, this.x);
	into.y = Math.max(v, this.y);
	return into;
}

vec2.prototype.max = function(v) {
	return this.maxi(v, new vec2());
}

vec2.prototype.clampi = function(min, max, into) {
	if(into === undefined) {
		into = this;
	}
	into.x = clamp(v, this.x);
	into.y = clamp(v, this.y);
	return into;
}

vec2.prototype.clamp = function(min, max) {
	return this.clampi(min, max, new vec2());
}

vec2.prototype.clamp01i = function(into) {
	return this.clampi(0, 1, into);
}

vec2.prototype.clamp01 = function() {
	return this.clampi(0, 1, new vec2());
}

//dot

vec2.prototype.dot = function(other) {
	return this.x * other.y + this.y * other.x;
}

//cross
//strictly speaking "doesn't exist", but
//useful for a few 3d->2d algorithms
vec2.prototype.cross = function(other)
{
	return this.x * other.y - this.y * other.x;
}

//projections

vec2.prototype.sproj = function(other) {
	return (this.x * other.x + this.y * other.y) / other.length();
}

vec2.prototype.vproji = function(other, into) {
	if(into === undefined) {
		into = this;
	}
	//(a dot b / b dot b) * b
	var dotdiv = this.dot(other) / other.dot(other);
	into.set(other).smuli(dotdiv);
	return into;
}

vec2.prototype.vproj = function(other) {
	return this.vproji(other, new vec2());
}

//rotations
//todo: implement rotations around a point (trig is going to dominate anyway)

vec2.prototype.rotri = function(angle, into) {
	if(into === undefined) {
		into = this;
	}
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var nx = this.x * c - this.y * s;
	var ny = this.x * s + this.y * c;
	into.x = nx;
	into.y = ny;
	return into;
}

vec2.prototype.rotr = function(angle) {
	return this.rotri(angle, new vec2());
}

vec2.prototype.rotrdi = function(angle, into) {
	return this.rotri(angle * (Math.PI / 180.0), into);
}

vec2.prototype.rotrd = function(angle) {
	return this.rotrdi(angle, new vec2());
}

vec2.prototype.rotli = function(angle, into) {
	return this.rotri(-angle, into);
}

vec2.prototype.rotl = function(angle) {
	return this.rotli(angle, new vec2());
}

vec2.prototype.rotldi = function(angle, into) {
	return this.rotli(angle * (Math.PI / 180.0), into);
}

vec2.prototype.rotld = function(angle) {
	return this.rotldi(angle, new vec2());
}

//rot90/180
vec2.prototype.rot90li = function(into) {
	if(into === undefined) {
		into = this;
	}
	var nx = this.y;
	var ny = -this.x;
	into.x = nx;
	into.y = ny;
	return into;
}

vec2.prototype.rot90l = function() {
	return this.rot90li(new vec2());
}

vec2.prototype.rot90ri = function() {
	if(into === undefined) {
		into = this;
	}
	var nx = -this.y;
	var ny = this.x;
	into.x = nx;
	into.y = ny;
	return into;
}

vec2.prototype.rot90r = function() {
	return this.rot90ri(new vec2());
}

vec2.prototype.rot180i = function(into) {
	if(into === undefined) {
		into = this;
	}
	into.x = -this.x;
	into.y = -this.y;
	return into;
}

vec2.prototype.rot180 = function() {
	return this.rot180i(new vec2());
}

//todo: lerp

//todo: clamp

//winding test
function is_counter_clockwise(a, b, c)
{
	return (c.y - a.y) * (b.x - a.x) > (b.y - a.y) * (c.x - a.x);
}

