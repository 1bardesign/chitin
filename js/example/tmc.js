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
	add_system("tmc::collide", new ShapeOverlapSystem());
	//tilemap behind
	var tiles = new Tilemap({
		asset: "sprites",
		transform: new Transform(),
		framesize: new vec2(8,8)
	});
	add_system("tmc::tilemap", new SharedTilemapSystem(tiles));
	//sprites in the foreground
	add_system("tmc::sprite", new SpriteSystem("tmc::transform", false));

	//load and build the tilemap
	tiles.load_csv(
		"1,1,1,1,1,1,1,1,1,1,1,1,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,1,1,0,0,0,0,0,0,1\n"+
		"1,0,0,0,1,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,1,0,0,0,1,0,0,0,1\n"+
		"1,0,0,0,1,1,1,1,1,0,0,0,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,0,0,0,0,0,0,0,0,0,0,0,1\n"+
		"1,1,1,1,1,1,1,1,1,1,1,1,1"
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

	set_resolve_scale(0.5);
	system("tmc::collide").add_group_collide(shapes, callback_resolve);
	system("tmc::collide").add_tilemap_vs_group(tiles, shapes, 1);

	function walk_transform(transform) {
		this.transform = transform;
		return this;
	}
	var _walk = new vec2();
	walk_transform.prototype.update = function() {
		_walk.sset(0,0);
		if(key_pressed("left")) {
			_walk.x -= 1;
		}
		if(key_pressed("right")) {
			_walk.x += 1;
		}
		if(key_pressed("up")) {
			_walk.y -= 1;
		}
		if(key_pressed("down")) {
			_walk.y += 1;
		}
		if(_walk.length_squared() > 0) {
			_walk.normalisei().smuli(key_pressed("shift") ? 100 : 20);
		}

		this.transform.vel.vset(_walk);
	}

	for(var i = 0; i < 50; i++)
	{
		var e = new Entity("tmc");

		var transform = e.add("transform");
		transform.pos.sset(Math.random() * 40, 0).rotli(Math.random()*Math.PI*2);
		transforms.add(transform);

		e.add("behaviour", new walk_transform(transform));

		e.add("sprite", {
			asset: "sprites",
			w: 8, h: 8,
			transform: transform,
			framepos: new vec2(0,8),
			z: 0
		});

		var shape = e.add(
			"collide",
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