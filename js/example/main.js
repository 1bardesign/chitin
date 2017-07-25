///////////////////////////////////////////////////////////////////////////////
//
//	main.js
//
//		canonical home for setup(), start(), update() and render()
//		normal implementation is to choose and initialise your systems here,
//		then handle any game-global initialisation, and finally pass control
//		off to a game state for actual game logic.
//
///////////////////////////////////////////////////////////////////////////////

//kernel hooks

function setup()
{
	/////////////////////////////////////////////
	//setup the screen
	init_canvas(480, 270);

	/////////////////////////////////////////////
	//setup the preloading

	//network setup if applicable (get it going asap)

	//data files
	load_file("map.csv");

	//load images
	load_image("sprites", true, 8, 8, false);

	//audio setup
	set_volume(0.5);
	//load_sound("sad_backing");
}

var global_sm;

function start()
{
	global_sm = new StateMachine();
	global_sm.add_state("nbody", new NBodySimState());
	global_sm.set_state("nbody");
}

function update()
{
	update_systems();
	global_sm.update();
}

function render()
{
	clear_canvas("#1e1817");
	set_fill("#ead9d7");

	render_systems();
	global_sm.render();
}
