///////////////////////////////////////////////////////////////////////////////
//
//	files.js
//
//		data file loading and handling
//		supports async loading from assets/ and also manually
//		adding external content into the file registry
//
///////////////////////////////////////////////////////////////////////////////

var files = {};

//ensuring everything we've asked for is loaded
var _files_loaded = true;
function check_files_loaded()
{
	_files_loaded = true;
	for(path in files)
	{
		if(!files[path].loaded)
		{
			loaded = false;
			break;
		}
	}
	return _files_loaded;
}

function get_file_path(name)
{
	return "./assets/"+name;
}

function fetch_file(name)
{
	if(files.hasOwnProperty(name))
	{
		return files[name];
	}
	//else
	return null;
}

function add_external_file(name, contents)
{
	var file = {
		name: name,
		error: false,
		loaded: true,
		contents: contents
	};
	files[name] = file;
	return file;
}

function load_file(name)
{
	//possible early-out if we've already loaded it
	var fetched = fetch_file(name);
	if(fetched !== null)
	{
		return fetched;
	}

	//if we don't have it, better load it now
	_files_loaded = false;

	var file = {
		name: name,
		error: false,
		loaded: false,
		contents: null
	};
	try {
		var xhttp = new XMLHttpRequest();
		xhttp.addEventListener("loadend", function(e) {
			file.loaded = true;
			file.contents = this.responseText;
			if(file.contents == null) //failure?
			{
				file.contents = "";
				file.error = true;
			}
		})
		xhttp.open("GET", get_file_path(name), true);
		xhttp.overrideMimeType('text/plain');
		xhttp.send(null);
	}
	catch(e)
	{
		file.error = true;
		file.loaded = true;
		file.contents = "";
	}

	files[name] = file;

	return file;
}

//contents parsing helpers

//csv
//	handles converting a csv file into a 2d array
//	including removing blank lines
//args:
//	raw: true to not trim or process each line and element
//	parse_numbers; true to run everything through Number()
//	parse_ints; true to run everything through parseInt()
function csv_to_2d_array(contents, args) {
	if(args === undefined) {
		args = {};
	}
	var lines = contents.split("\n");
	for(var i = 0; i < lines.length; i++) {
		if(args.raw !== true) {
			lines[i] = lines[i].trim();
		}
		//blank line?
		if(lines[i] == "" || lines[i] == "\r") {
			//remove
			lines.splice(i, 1);
			i--;
			continue;
		}
		lines[i] = lines[i].split(",");
		if(args.raw !== true) {
			for(var j = 0; j < lines[i].length; j++) {
				if(args.parse_numbers === true) {
					lines[i][j] = Number(lines[i][j]);
				} else if(args.parse_ints === true) {
					lines[i][j] = parseInt(lines[i][j]);
				} else {
					lines[i][j] = lines[i][j].trim();
				}
			}
		}
	}
	return lines;
}

