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
		xhttp.open("GET", get_file_path(name), true);
		xhttp.onreadystatechange = function()
		{
			if (this.readyState == 4)
			{
				file.loaded = true;
				if(this.status == 200 || this.status == 0 || this.status == 304)
				{
					file.contents = this.responseText;
				}
				else
				{
					file.contents = "";
					file.error = true;
				}
			}
		};
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
