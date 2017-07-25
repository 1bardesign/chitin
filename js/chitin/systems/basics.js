///////////////////////////////////////////////////////////////////////////////
//
//	basics.js
//
//		Basic systems for building ad-hoc entities.
//		Generic game logic definition.
//
///////////////////////////////////////////////////////////////////////////////

"use strict"

///////////////////////////////////////////////////////////////////////////////
//
//	Behaviour
//
//		containers for ad-hoc code - can do literally anything you like but
//		generally used for defining entity behaviours that don't
//		warrant their own system - stuff like controls feedback, responding
//		to physics and so on.
//
///////////////////////////////////////////////////////////////////////////////
//
//	behaviour interface - all optional
//
//		create([data])
//			called as the behaviour is added to an entity
//		update([data])
//			called every tick
//		render([data])
//			called to render anything necessary
//		destroy([data])
//			called as the behaviour is removed, which may be
//			as the entity is being destroyed
//
//	behaviour properties
//
//		data
//			optional userdata passed into every callback, for
//			non-oo behaviours.
//
///////////////////////////////////////////////////////////////////////////////

//if copy_args is set, the will be copied out rather than inserted as-is,
//which allows shared configuration objects to be used to construct new
//behaviours. This is generally _not_ what you want, honestly.
function BehaviourSystem(copy_args) {
	this._c = [];
	this._copy = copy_args;
}

//update all the behaviours
BehaviourSystem.prototype.update = function() {
	for(var i = 0; i < this._c.length; i++) {
		var c = this._c[i];
		if(typeof c.update === "function") {
			c.update(c.data);
		}
	}
	push_debug_msg("Behaviours : "+this._c.length);
}

//render all the behaviours
BehaviourSystem.prototype.render = function() {
	for(var i = 0; i < this._c.length; i++) {
		var c = this._c[i];
		if(typeof c.render === "function") {
			c.render(c.data);
		}
	}
}

//create a behaviour
//depending on the system configuration may may insert the object as-is
//or copy out some portion of the arguments.
BehaviourSystem.prototype.create_component = function(args) {
	var c;
	if(this._copy) {
		//copy the args out
		c = {};
		c.data = args.data;
		c.update = args.update;
		c.render = args.render;
		c.destroy = args.destroy;
		c.create = args.create;
	} else {
		//use as-is
		c = args;
	}
	//create it before inserting
	if(typeof c.create === "function") {
		c.create(c.data);
	}
	//then put it in the system, ready to be updated/rendered
	//todo: consider sorting behaviours with no update to the end
	//		to prevent system having to iterate past them
	this._c.push(c);
	return c;
}

BehaviourSystem.prototype.destroy_component = function(comp) {
	//destroy as needed
	if(typeof comp.destroy === "function") {
		comp.destroy(comp.data);
	}
	remove_element(this._c, comp);
}

///////////////////////////////////////////////////////////////////////////////
//
//	State Machine
//
//		generic state machine code; accepts any states implementing the
//		state interface (and any that don't, but you can get stuck in a
//		bad place if they don't support any of it!)
//
///////////////////////////////////////////////////////////////////////////////
//
//	state interface
//
//		start([machine, data])
//			called as the state is entered, or reset
//		update([machine, data])
//			called every tick
//		render([machine, data])
//			called to render anything necessary
//		end([machine, data])
//			called as the state is exited, or reset
//
//	state properties
//
//		data
//			optional userdata passed into every callback
//			can be whatever type you like, but an object is probably smartest!
//
///////////////////////////////////////////////////////////////////////////////
//
//	example state - counts up based on dt, transitions to "another state" after
//					ten seconds have passed. supports reset().
//
//	{
//		data: {}, //defined in start to avoid repeating ourselves
//		start: function(m, d) {
//			d.time = 0;
//		},
//		update: function(m, d) {
//			d.time += dt();
//			if(d.time >= 10) {
//				m.set_state("another state");
//			}
//		}
//		//no end or render
//	}
//
///////////////////////////////////////////////////////////////////////////////
//
//	tips and tricks
//
//		all functions take an optional reference to the machine and their own
//		user data - the machine ref can be used to transition to other states
//		without storing that reference yourself.
//
//		you can inject userdata into the state machine itself if you're
//		confident of what you're doing, and this can allow sharing a single
//		state object between many machines.
//
///////////////////////////////////////////////////////////////////////////////

"use strict"

//constructor
function StateMachine() {
	this.states = {};
	this.current_state = null;
	this.current_state_name = "";
	return this;
}

//state construction; returns this for chaining
StateMachine.prototype.add_state = function(name, state) {
	this.states[name] = state;
	return this;
}

//cause a state transition by name
//ensures the current state is ended before the new one
//is started.
StateMachine.prototype.set_state = function(name) {
	//see the old state out
	if(this.current_state && typeof this.current_state.end === "function") {
		this.current_state.end(this, this.current_state.data);
	}

	this.current_state_name = name;
	this.current_state = this.states[name];

	if(this.current_state && typeof this.current_state.start === "function") {
		this.current_state.start(this, this.current_state.data);
	}
}

//reset the current state
StateMachine.prototype.reset = function()
{
	this.set_state(this.current_state_name);
}

//will make sure end is called on the current state
StateMachine.prototype.destroy = function()
{
	this.set_state("");
}

//update the current state
StateMachine.prototype.update = function()
{
	if(this.current_state && typeof this.current_state.update === "function") {
		this.current_state.update(this, this.current_state.data);
	}
}

//render the current state
StateMachine.prototype.render = function()
{
	if(this.current_state && typeof this.current_state.render === "function") {
		this.current_state.render(this, this.current_state.data);
	}
}

//state machine system
//	just handles creating/destroying statemachines and letting the
//	system keep them updated

function StateMachineSystem() {
	this._c = []
	return this;
}

StateMachineSystem.prototype.create_component = function() {
	var sm = new StateMachine();
	this._c.push(sm);
	return sm;
}

StateMachineSystem.prototype.destroy_component = function(c) {
	c.set_state("");
	remove_element(this._c, c);
}

StateMachineSystem.prototype.update = function() {
	for(var i = 0; i < this._c.length; i++) {
		this._c[i].update();
	}
}

StateMachineSystem.prototype.render = function() {
	for(var i = 0; i < this._c.length; i++) {
		this._c[i].render();
	}
	push_debug_msg("State Machines : "+this._c.length);
}

