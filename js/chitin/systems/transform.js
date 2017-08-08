///////////////////////////////////////////////////////////////////////////////
//
//	transform.js
//
//	system that manages transforms - particles in space that can move, spin
//	and be accelerated. often shared by other systems.
//
///////////////////////////////////////////////////////////////////////////////
//
//	todo: parenting, but it should probably be a separate system
//
///////////////////////////////////////////////////////////////////////////////

"use strict"

//

function Transform(args) {
	if(args === undefined) args = {}

	this.pos = new vec2(args.pos);
	this.vel = new vec2(args.vel);
	this.acc = new vec2(args.acc);
	this.ang = (args.ang === undefined ? 0 : args.ang);
	this.avel = (args.avel === undefined ? 0 : args.avel);
	return this;
}

//

function TransformSystem() {
	this._c = [];
	//temp storage to avoid gc
	this._vmt = new vec2();
	this._amt = new vec2();
	return this;
}

TransformSystem.prototype.update = function() {
	var _dt = dt();

	for(var i = 0; i < this._c.length; i++) {
		var c = this._c[i];
		//dt mul
		c.acc.smuli(_dt, this._amt);
		c.vel.smuli(_dt, this._vmt);
		//integrate
		c.vel.addi(this._amt);
		c.pos.addi(this._vmt);
		c.ang += c.avel * _dt;
	}
	push_debug_msg("Transforms : "+this._c.length);
}

TransformSystem.prototype.create_component = function(args) {
	//we could use the args as the component directly
	//but then re-using args would create duplicate references
	//so we copy the args out here
	var c = new Transform(args);
	//and put it in the system
	this._c.push(c);
	return c;
}

TransformSystem.prototype.destroy_component = function(comp) {
	//just pull it out of the array
	remove_element(this._c, comp);
}
