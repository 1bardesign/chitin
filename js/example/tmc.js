///////////////////////////////////////////////////////////////////////////////
//
//	tmc.js
//
//		example state for tilemap collision
//
///////////////////////////////////////////////////////////////////////////////

function TilemapCollisionState() {
	//any non-init stuff?
}

TilemapCollisionState.prototype.start = function() {


	/////////////////////////////////////////////
	//set up the game systems

	//basic physics
	add_system("tmc::transform", new TransformSystem(), 0);
	//arbitrary behaviours
	add_system("tmc::state_machine", new StateMachineSystem());
	add_system("tmc::behaviour", new BehaviourSystem());
	add_system("tmc::anim", new AnimatorSystem());
	//(physics)
	add_system("tmc::physics", new PhysicsResolutionSystem());
	//sprites
	add_system("tmc::sprite", new SpriteSystem("tmc::transform", false));
	//tilemap in front
	add_system("tmc::tilemap", new SharedTilemapSystem({
		asset: "platformer_tilemap",
		transform: new Transform(),
		framesize: new vec2(8,8)
	}));
	var tiles = system("tmc::tilemap").tilemap;

	//load and build the tilemap
	tiles.load_csv(fetch_file("platformer.csv").contents);
	//centre the tilemap
	tiles.transform.pos.sset(
		-(tiles.size.x / 2) * tiles.framesize.x,
		-(tiles.size.y / 2) * tiles.framesize.y
	);
	//collision flags
	for (var i = 24; i < 64; i++)
		tiles.set_flag(i, 1);

	//shared groups
	var temp_ents = new Group();
	var transforms = new Group();
	var shapes = new Group();

	//add collision stuff
	system("tmc::physics").add_group_collide(shapes, callback_resolve, 0.50);
	system("tmc::physics").add_tilemap_vs_group(tiles, shapes, 1, 0.95);
	system("tmc::physics").add_react_bounce(shapes, 0, 1);
	system("tmc::physics").add_react_collision_info(shapes);

	var beetle_idle = new FrameXYAnimation(
		0,
		[0,0],
		true
	);

	var beetle_run = new FrameXYAnimation(
		15,
		[
			1,0,
			2,0,
			3,0,
			4,0,
		],
		true
	);

	var beetle_jump = new FrameXYAnimation(
		15,
		[
			0,1,
			1,1,
			2,1
		],
		false
	);

	var beetle_flap = new FrameXYAnimation(
		20,
		[
			0,2,
			1,2,
			0,2,
			1,2
		],
		false
	);

	//

	function on_ground(shape) {
		this.shape = shape;
		this.last_time = -1;
	}
	on_ground.prototype.update = function() {
		if(this.shape.has_collided_side(COLLIDED_BOTTOM)) {
			this.last_time = run_time_scaled;
		}
	}
	on_ground.prototype.within = function(seconds) {
		return (run_time_scaled - this.last_time) <= seconds;
	}

	//

	function player_controls(transform, onground) {
		this.transform = transform;
		this.onground = onground;
		return this;
	}
	var _walk = new vec2();
	player_controls.prototype.update = function() {
		//gather
		var s = this.e.c("sprite");
		var t = this.transform;
		//
		var pressed_left = key_pressed("left");
		var pressed_right = key_pressed("right")
		var pressed_jump = key_just_pressed("up");
		var currently_on_ground = this.onground.within(0.1);
		//jumps!
		var jumped = false;
		if(currently_on_ground) {
			this.jumps = 2;
		}
		//config
		var walk_speed = 50;
		var walk_amount = 200;

		//do walking
		_walk.sset(0,0);
		var not_pressed = !(pressed_left || pressed_right);
		if(pressed_left && t.vel.x > -walk_speed) {
			_walk.x -= 1;
		}
		if(pressed_right && t.vel.x < walk_speed) {
			_walk.x += 1;
		}
		_walk.smuli(walk_amount);
		//do slowing
		var limit = 1;
		var av = Math.abs(t.vel.x);
		var stop = false;
		var slow = false;
		if(not_pressed ||
			(av > limit &&
			(pressed_right && t.vel.x < -limit) ||
			(pressed_left && t.vel.x > limit))) {
			slow = true;
		}

		if(slow) {
			_walk.x = 0;
			t.vel.x *= 0.5;
		}
		//
		_walk.smuli(dt());
		//add movement vel
		if(!stop) {
			t.vel.addi(_walk);
		} else {
			t.vel.x = 0;
		}

		//jumping
		if(currently_on_ground || this.jumps > 0)
		{
			if(pressed_jump) {
				t.vel.y = -60;
				this.jumps--;
				jumped = true;
			}
		}

		//(reused)
		av = Math.abs(t.vel.x);

		//sort out animation
		var anim = this.e.c("anim");
		var anim_name = "idle";
		var force = false;
		if(currently_on_ground && !jumped) {
			if(av > 1) {
				anim_name = "run";
			}
		} else {
			anim_name = "jump";
			if(jumped) {
				force = true;
				anim_name = "flap";
			}
		}

		if(anim.finished() || force) {
			anim.set(anim_name);
		}

		//flip dir
		if(av > 5) {
			s.flipx = (t.vel.x < 0);
		}
	}

	for(var i = 0; i < 1; i++)
	{
		var e = new Entity("tmc");

		var transform = e.add("transform");
		transform.pos.sset(Math.random() * 40, 0).rotli(Math.random()*Math.PI*2);
		transform.acc.sset(0,120);
		transforms.add(transform);

		var shape = e.add(
			"physics",
			//new AABB(transform, new vec2(12,8))
			new Circle(transform, 6)
		);

		shapes.push(shape);

		var sprite = e.add("sprite", {
			asset: "beetle",
			w: 32, h: 32,
			transform: transform,
			framepos: new vec2(0,0),
			z: 0
		});

		var anim = e.add("anim", new Animator({sprite: sprite}));
		anim.add("idle", beetle_idle);
		anim.add("run", beetle_run);
		anim.add("jump", beetle_jump);
		anim.add("flap", beetle_flap);

		var onground = e.add("behaviour", new on_ground(shape));
		var pc = e.add("behaviour", new player_controls(transform, onground));


		temp_ents.push(e);
	}
}

TilemapCollisionState.prototype.end = function() {
	//tear down the game systems
	remove_systems_matching("tmc::");
}

TilemapCollisionState.prototype.update = function() {

}

TilemapCollisionState.prototype.render = function() {

}
