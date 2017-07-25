///////////////////////////////////////////////////////////////////////////////
//
//	animation.js
//
//		a system of time-independent actions, with builtins for sprite
//		frame animation
//
///////////////////////////////////////////////////////////////////////////////

//generic animation

function Animator(data) {
	//init
	this.animations = {};
	this.current_animation_name = "";
	//timing
	this.current_time = 0;
	this.action_every = 0;
	//shared data
	this.data = data;
	return this;
}

Animator.prototype.add = function(name, anim) {
	this.animations[name] = anim;
}

Animator.prototype.set = function(name) {
	if (this.current_animation_name == name) {
		return;
	}
	this.current_animation_name = name;
	this.current_time = 0;
	this.action_every = 0;
	//check if we've actually got an animation
	var anim = this.playing();
	if(anim == undefined) {
		return;
	}
	this.action_every = 1 / anim.fps;
	anim.start(this.data);
}

Animator.prototype.reset = function() {
	this.current_time = 0;
	anim.start(this.data);
}

Animator.prototype.playing = function() {
	if (this.current_animation_name == "") {
		return undefined;
	}
	return this.animations[this.current_animation_name];
}

Animator.prototype.update = function(_dt) {
	if(this.action_every == 0) {
		return;
	}
	if(_dt === undefined) {
		_dt = dt();
	}
	this.current_time += _dt;
	while(this.current_time >= this.action_every) {
		this.current_time -= this.action_every;
		var anim = this.playing();
		if(anim !== undefined) {
			anim.update(this.data);
		}
	}
}

//built in animation types

//1d frame index animation

function FrameAnimation1D(frames, loop) {
	this.frames = frames;
	this.loop = loop;
	return this;
}

FrameAnimation1D.prototype.set_frame = function(data) {
	data.sprite.set_frame_index(this.frames[data.index]);
}

FrameAnimation1D.prototype.start = function(data) {
	data.index = 0;
	set_frame();
}

FrameAnimation1D.prototype.update = function(data) {
	if(data.index == this.frames.length - 1) {
		if(loop) {
			data.index = 0;
		}
	} else {
		data.index++;
	}
	set_frame();
}

//2d x,y frame animation

function FrameAnimation2D(frames, loop) {
	this.frames = frames;
	this.loop = loop;
	return this;
}

FrameAnimation2D.prototype.set_frame = function(data) {
	data.sprite.set_frame_xy(this.frames[data.index], this.frames[data.index+1]);
}

FrameAnimation2D.prototype.start = function(data) {
	data.index = 0;
	set_frame();
}

FrameAnimation2D.prototype.update = function(data) {
	if(data.index >= this.frames.length - 2) {
		if(loop) {
			data.index = 0;
		}
	} else {
		data.index += 2;
	}
	set_frame();
}

//system for updating animators

function AnimatorSystem() {
	this._c = [];
	return this;
}

AnimatorSystem.prototype.update = function() {
	var _dt = dt();
	for(var i = 0; i < this._c.length; i++) {
		var c = this._c[i];
		c.update(_dt);
	}
}

AnimatorSystem.prototype.render = function() {
	push_debug_msg("Animators : "+this._c.length);
}

AnimatorSystem.prototype.create_component = function(args) {
	this._c.push(args);
	return args;
}

AnimatorSystem.prototype.destroy_component = function(comp) {
	remove_element(this._c, comp);
}
