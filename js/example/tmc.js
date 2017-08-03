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
	//(physics)
	add_system("tmc::physics", new PhysicsResolutionSystem());
	//sprites
	add_system("tmc::sprite", new SpriteSystem("tmc::transform", false));
	//tilemap in front
	add_system("tmc::tilemap", new SharedTilemapSystem({
		asset: "sprites",
		transform: new Transform(),
		framesize: new vec2(8,8)
	}));
	var tiles = system("tmc::tilemap").tilemap;

	//load and build the tilemap
	tiles.load_csv(
		"1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1\n"+
		"1,0,0,0,0,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,0,1,1,1,0,0,0,0,0,0,1,0,0,0,0,0,1\n"+
		"1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,1,0,0,0,0,1\n"+
		"1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,1,0,0,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0,0,1\n"+
		"1,1,1,0,0,1,0,1,1,1,1,1,0,0,0,0,0,1,0,0,1\n"+
		"1,1,1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1\n"+
		"1,1,1,0,0,1,1,1,1,1,1,0,0,0,0,0,0,1,0,0,1\n"+
		"1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1"
	);
	//centre the tilemap
	tiles.transform.pos.sset(
		-(tiles.size.x / 2) * tiles.framesize.x,
		-(tiles.size.y / 2) * tiles.framesize.y
	);
	//collision flags
	tiles.set_flag(1, 1);

	//shared groups
	var temp_ents = new Group();
	var transforms = new Group();
	var shapes = new Group();

	system("tmc::physics").add_group_collide(shapes, callback_resolve, 0.50);
	system("tmc::physics").add_tilemap_vs_group(tiles, shapes, 1, 0.95);
	system("tmc::physics").add_react_bounce(shapes, 0.1, 1);

	function player_controls(transform) {
		this.transform = transform;
		return this;
	}
	var _walk = new vec2();
	player_controls.prototype.update = function() {
		var s = this.e.c("sprite");
		var framex = 0;
		_walk.sset(0,0);
		if(key_pressed("left")) {
			_walk.x -= 1;
		}
		if(key_pressed("right")) {
			_walk.x += 1;
		}
		_walk.smuli(100);
		_walk.smuli(dt());
		if(key_just_pressed("up")) {
			_walk.y -= 70;
			framex = 1;
		}
		s.set_frame_xy(framex,1);

		this.transform.vel.smuli(0.999).addi(_walk);
	}

	for(var i = 0; i < 1; i++)
	{
		var e = new Entity("tmc");

		var transform = e.add("transform");
		transform.pos.sset(Math.random() * 40, 0).rotli(Math.random()*Math.PI*2);
		transform.acc.sset(0,50);
		transforms.add(transform);

		e.add("behaviour", new player_controls(transform));

		e.add("sprite", {
			asset: "sprites",
			w: 8, h: 8,
			transform: transform,
			framepos: new vec2(0,8),
			z: 0
		});

		var shape = e.add(
			"physics",
			//new AABB(transform, new vec2(8,8))
			new Circle(transform, 4)
		);

		shapes.push(shape);

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