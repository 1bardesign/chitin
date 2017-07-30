///////////////////////////////////////////////////////////////////////////////
//
//	animation.js
//
//		a system of time-independent actions, with builtins for sprite
//		frame animation
//
///////////////////////////////////////////////////////////////////////////////

//animator component
//handles updating and swapping between animations
//todo: support reverse animations?

function Animator(data) {
	//init
	this.animations = {};
	this.current_animation_name = "";
	//timing
	this.current_time = 0;
	this.action_every = 0;
	this.timescale = 1;
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
	var anim = this.playing();
	if(anim == undefined) {
		return;
	}
	anim.start(this.data);
}

Animator.prototype.playing = function() {
	if (this.current_animation_name == "") {
		return undefined;
	}
	return this.animations[this.current_animation_name];
}

Animator.prototype.fast_forward = function(time) {
	if(this.action_every == 0) {
		return;
	}
	this.current_time += time;
	//todo: let animations report wrap and clamp times
	//		to avoid looping forward here
	while(this.current_time >= this.action_every) {
		this.current_time -= this.action_every;
		var anim = this.playing();
		if(anim !== undefined) {
			anim.update(this.data);
		}
	}
}

Animator.prototype.scrub_to = function(time) {
	this.reset();
	this.fast_forward(time);
}

Animator.prototype.update = function(_dt) {
	if(_dt === undefined) {
		_dt = dt();
	}
	this.fast_forward(_dt * this.timescale);
}

Animator.prototype.finished = function() {
	if(this.action_every == 0) {
		return true;
	}
	var anim = this.playing();
	if(anim !== undefined && typeof anim.finished === "function") {
		return anim.finished(this.data);
	}
	return true;
}

Animator.prototype.set_timescale = function(scale) {
	this.timescale = Math.max(0, scale);
}

//built in animation types

//1d frame index animation

function FrameIndexAnimation(fps, frames, loop) {
	this.fps = fps;
	this.frames = frames;
	this.loop = loop;
	return this;
}

FrameIndexAnimation.prototype._write_frame = function(data) {
	data.sprite.set_frame_index(this.frames[data.index]);
}

FrameIndexAnimation.prototype.start = function(data) {
	data.index = 0;
	this._write_frame(data);
}

FrameIndexAnimation.prototype.update = function(data) {
	if(this.finished(data)) {
		if(this.loop) {
			data.index = 0;
		}
	} else {
		data.index++;
	}
	this._write_frame(data);
}

FrameIndexAnimation.prototype.finished = function(data) {
	return data.index >= this.frames.length - 1;
}

//2d x,y frame animation

function FrameXYAnimation(fps, frames, loop) {
	this.fps = fps;
	this.frames = frames;
	this.loop = loop;
	return this;
}

FrameXYAnimation.prototype._write_frame = function(data) {
	data.sprite.set_frame_xy(this.frames[data.index], this.frames[data.index+1]);
}

FrameXYAnimation.prototype.start = function(data) {
	data.index = 0;
	this._write_frame(data);
}

FrameXYAnimation.prototype.update = function(data) {
	if(this.finished(data)) {
		if(this.loop) {
			data.index = 0;
		}
	} else {
		data.index += 2;
	}
	this._write_frame(data);
}

FrameXYAnimation.prototype.finished = function(data) {
	return data.index >= this.frames.length - 2;
}

//sprite frame position animation

function FrameposAnimation(fps, frames, loop) {
	this.fps = fps;
	this.frames = frames;
	this.loop = loop;
	return this;
}

FrameposAnimation.prototype._write_frame = function(data) {
	data.sprite.framepos.vset(this.frames[data.index]);
}

FrameposAnimation.prototype.start = function(data) {
	data.index = 0;
	this._write_frame(data);
}

FrameposAnimation.prototype.update = function(data) {
	if(this.finished(data)) {
		if(this.loop) {
			data.index = 0;
		}
	} else {
		data.index++;
	}
	this._write_frame(data);
}

FrameposAnimation.prototype.finished = function(data) {
	return data.index >= this.frames.length - 1;
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
