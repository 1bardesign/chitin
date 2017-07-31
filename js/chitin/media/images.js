///////////////////////////////////////////////////////////////////////////////
//
//	images.js
//
//		image preloading and rendering onto the chitin canvas
//		handles flipping and many different rendering options
//		though could use extension for arbitrary rotations and the like
//
///////////////////////////////////////////////////////////////////////////////

var _g_images = {};

//ensuring everything we've asked for is loaded
var _img_loaded = true;
function check_images_loaded() {
	_img_loaded = true;
	for(path in _g_images) {
		if(!_g_images[path].loaded) {
			loaded = false;
			break;
		}
	}
	return _img_loaded;
}

function get_image_path(name) {
	return "./assets/"+name+".png";
}

function fetch_image(name) {
	if(_g_images.hasOwnProperty(name)) {
		return _g_images[name];
	}
	//else
	return null;
}

function image_flipped_id(flipx, flipy) {
	return (flipx ? 1 : 0) | (flipy ? 2 : 0);
}

function image_flipx_from_id(id) {
	return (id & 1) > 0;
}

function image_flipy_from_id(id) {
	return (id & 2) > 0;
}

function flipped_image(image, flipx, flipy) {
	var id = image_flipped_id(flipx, flipy);
	if(id == 0) {
		return image.element;
	} else if(image.flipcache.hasOwnProperty(id)) {
		return image.flipcache[id];
	}

	//otherwise generate it on the fly
	var flip_surface = document.createElement("canvas");
	flip_surface.width = image.width;
	flip_surface.height = image.height;
	var flip_context = flip_surface.getContext("2d");

	//determine scale
	var xscale = 1;
	var xoffset = 0;
	var yscale = 1;
	var yoffset = 0;
	if(flipx) {
		xscale = -1;
		xoffset = -image.width;
	}
	if(flipy) {
		yscale = -1;
		yoffset = -image.height;
	}
	flip_context.scale(xscale, yscale);

	flip_context.drawImage(image.element,
		0, 0, image.width, image.height,
		xoffset, yoffset,
		image.width, image.height
	);

	//write out to the cache
	image.flipcache[id] = flip_surface;
	//return it
	return flip_surface;
}

//add an external image from a dom element (img, canvas, whatever)
function add_external_image(name, element, generate_flipped) {
	var image = {};
	image.loaded = true;
	image.name = name;
	image.flipcache = {};

	image.element = element;
	image.width = element.width;
	image.height = element.height;

	//generate flipped versions ahead of time
	//(otherwise they will be lazy-loaded)
	if(generate_flipped) {
		flipped_image(image, true, false);
		flipped_image(image, false, true);
		flipped_image(image, true, true);
	}

	_g_images[name] = image;
	return image;
}

//load an image from the assets folder
function load_image(name, generate_flipped) {
	//possible early-out if we've already loaded it
	var fetched = fetch_image(name);
	if(fetched !== null) {
		return fetched;
	}

	//if we don't have it, better load it now
	_img_loaded = false;

	var image = {};
	image.loaded = false;
	image.name = name;
	image.flipcache = {};

	image.element = document.createElement("img");
	image.element.src = get_image_path(name);

	image.width = -1;
	image.height = -1;

	image.element.onload = function() {
		image.loaded = true;
		//read the true size
		image.width = image.element.width;
		image.height = image.element.height;
		//generate flipped versions ahead of time
		//(otherwise they will be lazy-loaded)
		if(generate_flipped) {
			flipped_image(image, true, false);
			flipped_image(image, false, true);
			flipped_image(image, true, true);
		}

		check_images_loaded();
	};

	_g_images[name] = image;

	return image;
}

//draw the whole image
function draw_image_simple(img, x, y) {
	if(!img.loaded) {
		return; //todo: maybe draw error sprite?
	}

	if(int_coords) {
		x = Math.round(x);
		y = Math.round(y);
	}

	get_context().drawImage(img.element, x, y);
}

//draw the whole image (optionally flipped)
function draw_image_simple_flipped(img, x, y, flipx, flipy)
{
	if(!img.loaded) {
		return; //todo: maybe draw error sprite?
	}

	if(int_coords) {
		x = Math.round(x);
		y = Math.round(y);
	}

	get_context().drawImage(flipped_image(img, flipx, flipy), x, y);
}

//draw a subsection of the image (optionally flipped)
function draw_image_ex(img, sx, sy, sw, sh, dx, dy, dw, dh, flipx, flipy)
{
	if(!img.loaded) {
		return; //todo: maybe draw error sprite?
	}

	if(int_coords) {
		sx = Math.round(sx);
		sy = Math.round(sy);
		sw = Math.round(sw);
		sh = Math.round(sh);
		dx = Math.round(dx);
		dy = Math.round(dy);
		dw = Math.round(dw);
		dh = Math.round(dh);
	}

	if(flipx) {
		sx = img.width - sx - sw;
	}
	if(flipy) {
		sy = img.height - sy - sh;
	}

	get_context().drawImage(flipped_image(img, flipx, flipy), sx, sy, sw, sh, dx, dy, dw, dh);
}

//draw a scaled subsection of the image defined by a 1d frame (optionally flipped)
function draw_image_frame_ex(img, x, y, frame, fw, fh, scalex, scaley, flipx, flipy)
{
	if(!img.loaded) {
		return; //todo: maybe draw error sprite?
	}

	frame = Math.floor(frame);
	var sx = frame * fw;
	var sy = Math.floor(sx / img.element.width) * fh;
	var sx = Math.floor(sx % img.element.width);
	draw_image_ex(img, sx, sy, fw, fh, x, y, fw*scalex, fw*scaley);
}

//draw a subsection of the image defined by a 1d frame (optionally flipped)
function draw_image_frame(img, x, y, frame, fw, fh, flipx, flipy)
{
	draw_image_frame_ex(img, x, y, frame, fw, fh, 1, 1, flipx, flipy);
}

//draw a scaled, centred subsection of the image defined by a 1d frame;
function draw_image_frame_centered_ex(img, x, y, frame, fw, fh, scalex, scaley, flipx, flipy)
{
	if(!img.loaded) {
		return; //todo: maybe draw error sprite?
	}

	frame = Math.floor(frame);
	var sx = frame * fw;
	var sy = Math.floor(sx / img.element.width) * fh;
	var sx = Math.floor(sx % img.element.width);
	var dw = fw*scalex;
	var dh = fh*scaley;
	draw_image_ex(img, sx, sy, fw, fh, x-(dw*0.5), y-(dh*0.5), dw, dh, flipx, flipy);
}

//draw a centred subsection of the image defined by a 1d frame;
function draw_image_frame_centered(img, x, y, frame, fw, fh, flipx, flipy)
{
	draw_image_frame_centered_ex(img, x, y, frame, fw, fh, 1, 1, flipx, flipy);
}
