///////////////////////////////////////////////////////////////////////////////
//
//	collection.js
//
//		collection types for holding and managing objects
//
///////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////
//
// Group
//
//		Simple array wrapper with some convenience functions to make things
//		a little more set-like and a little more entity-like
//
//		As a kicker, most group-expecting functionality will also accept
//		an array at a pinch.
//
///////////////////////////////////////////////////////////////////////////////

function Group() {}
Group.prototype = Object.create(Array.prototype);

Group.prototype.add = function(o) {
	if (this.indexOf(o) == -1) {
		this.push(o);
	}
}

Group.prototype.remove = function(o) {
	remove_element(this, o);
}

Group.prototype.destroy_all = function() {
	for(var i = 0; i < this.length; i++) {
		this[i].destroy();
	}
}

//(I'm conflicted about this because forEach is in most browsers
// and "works" but is reported as much slower than this loop in some
// places and chitin naming is inconsistent with builtins..)
Group.prototype.foreach = function(f) {
	for(var i = 0; i < this.length; i++) {
		f(this[i]);
	}
}

///////////////////////////////////////////////////////////////////////////////
//
//	Object Pool
//
//		simple object pooling in an array
//		can be used to avoid gc strain if you're happy doing memory
//		management yourself. Make sure you measure that this is
//		a real problem before complicating things.
//
//		accepts an optional type (pushed objects are checked) and
//		a flag to indicate if the type is default-constructable
//
//		if a type is indeed default-constructable, pop() will return
//		a new object instead of null when the pool is exhausted
//
///////////////////////////////////////////////////////////////////////////////

function ObjectPool(type, default_constructable) {
	this._pool = [];
	this._type = type;
	this._skipcheck = (typeof this._type === "undefined");
	this._default_constructable = Boolean(default_constructable);
	return this;
}

ObjectPool.prototype.pop = function() {
	if(this._pool.length == 0) {
		if(this._default_constructable) {
			return new (this._type)();
		} else {
			return null;
		}
	}
	return this._pool.pop();
}

ObjectPool.prototype.push = function(obj) {
	if(this._skipcheck || obj instanceof this._type)
		this._pool.push(obj);
	else
		alert("Tried to push mismatched object to ")
}
