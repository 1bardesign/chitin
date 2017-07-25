///////////////////////////////////////////////////////////////////////////////
//
//	audio.js
//
//		audio preloading and playing in a global shared context
//		handles global and per-sound volume, looping and provides
//		a simple interface for handling background music.
//
///////////////////////////////////////////////////////////////////////////////

//get the audio context
var context = null;
var final_mix_node = null;
//(Fix up prefixing)
window.AudioContext = window.AudioContext || window.webkitAudioContext;
if(getParameterByName("nosound") != "true")
{
	try
	{
		context = new AudioContext();
		final_mix_node = context.createGain();
		final_mix_node.gain.value = 0.5;
		final_mix_node.connect(context.destination);
	}
	catch(e)
	{
		alert('Web Audio is not supported in this browser - sounds will not be played!');
	}
}

var focus_factor = 0.2;
var master_volume = 0.5;

function set_volume(v)
{
	master_volume = v;
	if(final_mix_node !== null)
	{
		final_mix_node.gain.value = 0.5;
	}
}

function update_sounds()
{
	if(context == null || final_mix_node == null) return;

	final_mix_node.gain.value = master_volume * (document.hasFocus() ? 1 : focus_factor);
}

var sounds = {};

var _snd_loaded = true;
function check_sounds_loaded()
{
	_snd_loaded = true;
	for(name in sounds)
	{
		if(!sounds[name].loaded)
		{
			loaded = false;
			break;
		}
	}
	return _snd_loaded;
}

function get_sound_path(name)
{
	return "./assets/"+name+".ogg";
}

function fetch_sound(name)
{
	//no sound?
	if(context == null) return null;

	//exists?
	if(sounds.hasOwnProperty(name))
	{
		return sounds[name];
	}
	return null;
}

function load_sound(name)
{
	//no sound?
	if(context == null) return null;

	//cached?
	var fetched = fetch_sound(name);
	if(fetched !== null)
	{
		return fetched;
	}

	//nope, time to do some dirty work :)
	var sound = {
		loaded: false,
		buffer: null,
		name: name
	};

	//async request
	var request = new XMLHttpRequest();
	request.open('GET', get_sound_path(name), true);
	request.responseType = 'arraybuffer';
	request.onload = function()
	{
		context.decodeAudioData(request.response, function(buffer)
		{
			sound.buffer = buffer;
		}, function(e)
		{
			//todo: probably warn the user
			console.log("couldn't decode "+get_sound_path(name));
		});
		sound.loaded = true;
	}
	request.send();

	//store
	sounds[name] = sound;

	return sound;
}

function play_sound(sound, gain)
{
	if(!sound || !sound.loaded || !sound.buffer) return;

	gain = (typeof gain !== "undefined") ? gain : 1.0;

	var source = context.createBufferSource();
	source.buffer = sound.buffer;
	if(gain == 1)
	{
		//no need for gain!
		source.connect(final_mix_node);
	}
	else
	{
		var gain_node = context.createGain();
		gain_node.gain.value = gain;
		source.connect(gain_node);
		gain_node.connect(final_mix_node);
	}
	source.start(0);

	return source;
}

//simple music system;
//set the music track and it manages a looping background audio
//if you re-set the same music name, nothing happens (so no bad loop)

var current_music_name = "";
var current_music = null;

function set_music_track(name)
{
	if(current_music_name != name)
	{
		//stop old track (should consider fade out)
		if(current_music)
		{
			current_music.stop();
		}

		current_music = null;

		//start new track
		current_music_name = name;
		if(name != "")
		{
			current_music = play_sound(fetch_sound(name), 0.5);
			if(current_music)
			{
				current_music.loop = true;
			}
		}
	}
}

