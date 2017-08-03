///////////////////////////////////////////////////////////////////////////////
//
//	main.js
//
//		canonical home for setup(), start(), update() and render()
//		normal implementation is to choose and initialise your systems here,
//		handle any game-global initialisation, and finally pass control
//		off to somewhere else for actual game logic.
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

	//(recommended ordering)

	//network setup if applicable (get it going asap)

	//loading data files
	//check out media/files.js:load_file

	//loading images
	//check out media/images.js:load_image

	//loading audio
	//check out media/audios.js:load_audio

	//also recommended to chomp down the audio here
	//1.0 is that "overloud" default volume setting many indie games have
	set_volume(0.5);
}

function start()
{
	//do whatever you need to get your game going

	//probably set up some systems or initialise a global state machine
	//that will handle that stuff
}

function update()
{
	//do whatever needs doing every frame

	//probably at least update the systems
	//and maybe your global state machine
	update_systems();
}

function render()
{
	//(as above)
	clear_canvas("black");

	render_systems();

	//just putting _something_ on the screen to say hi!
	set_fill("white");
	set_font_center();
	set_font_middle();
	draw_text("hello chitin!", get_canvas_halfwidth(), get_canvas_halfheight());
}
