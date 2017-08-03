///////////////////////////////////////////////////////////////////////////////
//
//	main.js
//
//		chitin demos main file
//
///////////////////////////////////////////////////////////////////////////////

//kernel hooks

function setup()
{
	/////////////////////////////////////////////
	//kernel setup
	init_chitin({
		fps: 60,
		width: 480, height: 270
	})

	/////////////////////////////////////////////
	//preloading/system startup

	//data files
	//load_file("some_data_file.csv");

	//load images
	load_image("sprites", false);
	load_image("nbody", false);

	//audio setup
	set_volume(0.5);
	//load_sound("sad_backing");
}

var global_sm;

function start()
{
	global_sm = new StateMachine();

	global_sm.add_state("nbody", new NBodySimState());
	global_sm.add_state("anim", new AnimatedSpriteState());
	global_sm.add_state("tmc", new TilemapCollisionState());

	global_sm.set_state("tmc");
}

function update()
{
	update_systems();

	//state machine management
	if(key_just_pressed("r")) {
		//reset state
		global_sm.reset();
	}
	var key_to_state = {
		a: "anim",
		t: "tmc",
		n: "nbody"
	}
	for (var button in key_to_state) {
		if(key_just_pressed(button)) {
			global_sm.set_state(key_to_state[button]);
		}
	}
	global_sm.update();
}

function render()
{
	clear_canvas("#1e1817");
	set_fill("#ead9d7");

	render_systems();
	global_sm.render();
}
