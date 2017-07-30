///////////////////////////////////////////////////////////////////////////////
//
//	anim.js
//
//		an example state showing off different ways of animating sprites
//
///////////////////////////////////////////////////////////////////////////////

function AnimatedSpriteState() {
	//any non-init stuff?
}

AnimatedSpriteState.prototype.start = function() {

	/////////////////////////////////////////////
	//set up the game systems

	//basic physics
	add_system("anim::transform", new TransformSystem(), 0);
	//animation
	add_system("anim::anim", new AnimatorSystem());
	//sprites in the foreground
	add_system("anim::sprite", new SpriteSystem("anim::transform", false));

	//shared groups
	var ents = new Group();
	var shared_fps = 1;
	var test_index = new FrameIndexAnimation(shared_fps, [1,2,3,4,5,6,7,8], true);
	var test_xy = new FrameXYAnimation(
		shared_fps,
		[
			0,3,
			1,3,
			2,3,
			3,3,
			4,3,
			5,3,
			6,3,
			7,3
		],
		true
	);
	for(var i = 0; i < 100; i++)
	{
		var e = new Entity("anim");

		var transform = e.add("transform");
		transform.pos.set(20 + Math.random() * 50).rotli(Math.random() * Math.PI * 2);

		var sprite = e.add("sprite", {
			asset: "sprites",
			w: 8, h: 8,
			transform: transform,
			framepos: new vec2(0,24),
			z: -1
		});

		var anim = e.add("anim", new Animator({sprite: sprite}));

		anim.add("index", test_index);
		anim.add("xy", test_xy);

		anim.set(Math.random() < 0.5 ? "index" : "xy");
		anim.scrub_to(Math.random() * 10);
		anim.set_timescale(0.5 + Math.random() * 19.5);

		ents.push(e);
	}
}

AnimatedSpriteState.prototype.end = function() {
	//tear down the game systems
	remove_systems_matching("anim::");
}

AnimatedSpriteState.prototype.update = function() {

}

AnimatedSpriteState.prototype.render = function() {

}