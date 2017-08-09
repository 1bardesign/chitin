///////////////////////////////////////////////////////////////////////////////
//
//	nbody.js
//
//		example state for a (slapdash) n-body particle system with some
//		interesting overlap effects to make a more interesting demo
//
///////////////////////////////////////////////////////////////////////////////

function NBodySimState() {
	//any non-init stuff?
}

NBodySimState.prototype.start = function() {

	/////////////////////////////////////////////
	//set up the game systems

	//basic physics
	add_system("nbody::transform", new TransformSystem(), 0);
	//arbitrary behaviours
	add_system("nbody::state_machine", new StateMachineSystem());
	add_system("nbody::behaviour", new BehaviourSystem());
	//(physics)
	add_system("nbody::collide", new PhysicsResolutionSystem());
	//sprites in the foreground
	add_system("nbody::sprite", new SpriteSystem("nbody::transform", false));

	//shared groups
	var temp_ents = new Group();
	var transforms = new Group();
	var shapes = new Group();

	/////////////////////////////////////////////
	//clamp transforms within an area
	var wrad = Math.min(get_canvas_halfwidth(), get_canvas_halfheight()) * 0.9;
	var wrad_squared = wrad*wrad;
	var atten = 0.2;
	function clamptransform(transform) {
		this.transform = transform;
		return this;
	}
	clamptransform.prototype.update = function() {
		//reset the frame
		var s = this.e.c("sprite", 0);
		if(s) {
			s.framepos.x = 0;
		}
		s = this.e.c("sprite", 1);
		if(s) {
			s.framepos.x = 0;
			s.z = 0;
		}
		s = this.e.c("collide", 0);
		if(s) {
			s.radius = Math.max(1, s.radius - 0.125);
		}

		var p = this.transform.pos;
		var v = this.transform.vel;
		var l = p.length_squared();
		if(p.length_squared() > wrad_squared) {
			var ov = v.length() * atten;
			v.set(0,0).subi(p).normalisei().smuli(ov + 1);
		}

		if(this.transform.mass < 2) {
			v.smuli(0.995);
		}
	}

	/////////////////////////////////////////////
	//n-body attraction
	function nbody_gravity(transform, transforms) {
		this.transform = transform;
		this.transform.mass = 1;
		this.transforms = transforms;
		return this;
	}
	var _grv_t = new vec2();
	nbody_gravity.prototype.update = function() {
		var t = this.transform;
		t.acc.set(0,0);
		var g = this.transforms;
		for(var i = 0; i < g.length; i++) {
			var t2 = g[i];
			t2.pos.subi(t.pos, _grv_t);
			var l = _grv_t.length() * 0.2;
			if(l > 0.1) {
				_grv_t.sdivi(l * l).smuli(t2.mass * 0.15);
				t.acc.addi(_grv_t);
			}
		}
	}

	/////////////////////////////////////////////////////////////////
	//collision - increase frame + some "interesting" effects
	function overlapped_particles(a, b) {
		//increase the radius
		a.radius = Math.min(4, a.radius + 0.125);
		//set the frame that we collided
		var as = a.e.c("sprite", 0);
		if(as) {
			as.framepos.x = Math.min(120, as.framepos.x + 8);
		}
		var as = a.e.c("sprite", 1);
		if(as) {
			as.framepos.x = Math.min(120, as.framepos.x + 8);
			as.z++;
		}
		//apply some drag
		a.transform.mass = a.radius;
		_grv_t.set(b.transform.vel).smuli(0.02*dt());
		a.transform.vel.addi(_grv_t);
	}

	system("nbody::collide").add_group_callback_separate(shapes, overlapped_particles);

	for(var i = 0; i < 100; i++)
	{
		var e = new Entity("nbody");

		var transform = e.add("transform");
		transform.vel.set(Math.random(), 0).smuli(10).rotli(Math.random() * Math.PI * 2);
		transform.pos.set(Math.random(), 0).smuli(50).rotli(Math.random() * Math.PI * 2);
		transforms.add(transform);

		e.add("behaviour", new clamptransform(transform));
		e.add("behaviour", new nbody_gravity(transform, transforms));

		e.add("sprite", {
			asset: "nbody",
			w: 8, h: 8,
			transform: transform,
			framepos: new vec2(0,0),
			z: -1
		});
		e.add("sprite", {
			asset: "nbody",
			w: 8, h: 8,
			transform: transform,
			framepos: new vec2(0,8)
		});

		var shape = e.add(
			"collide",
			new Circle(transform, 1)
		);

		shapes.push(shape);

		temp_ents.push(e);
	}
}

NBodySimState.prototype.end = function() {
	//tear down the game systems
	remove_systems_matching("nbody::");
}

NBodySimState.prototype.update = function() {

}

NBodySimState.prototype.render = function() {

}
