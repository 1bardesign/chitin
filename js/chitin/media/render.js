///////////////////////////////////////////////////////////////////////////////
//
//	render.js
//
//		global canvas and webgl context sharing; handles some canvas-like
//		behaviour on top of twgl for stuff like textured quad "sprite" rendering
//		and camera control, blending and the like
//
//	TODO: be free of twgl - not quite compatible enough
//	TODO: shaders moved to disk
//	TODO: batching system for quads (static and dynamic)
//	TODO: fonts moved to textcache interface
//
///////////////////////////////////////////////////////////////////////////////

//shared globals

var _cg = {
	cnv: null,
	gl: null,
	int_coords: true,
	temps: {},
	textures: {},
	uniforms: {
		core: {},
		texture: {}
	},
	primitives: {},
	shaders: {
		src: {
			vs: "\n" +
				"precision mediump float;\n" +
				"\n" +
				"/*in*/ \n" +
				"attribute vec2 v_pos;\n" +
				"attribute vec2 v_uv;\n" +
				"attribute vec4 v_col;\n" +
				"\n" +
				"uniform vec2 c_pos;\n" +
				"uniform float c_rot;\n" +
				"uniform vec2 c_scale;\n" +
				"uniform vec2 c_size;\n" +
				"uniform vec4 c_col;\n" +
				"\n" +
				"uniform vec2 t_size;\n" +
				"\n" +
				"/*out*/ \n" +
				"varying vec2 uv;\n" +
				"varying vec4 col;\n" +
				"\n" +
				"vec2 transform(vec2 v, vec2 translation, float rotation, vec2 scale) {\n" +
				"	float s = sin(rotation);\n" +
				"	float c = cos(rotation);\n" +
				"	mat2 m = mat2(c, -s, s, c);\n" +
				"	return ((m * vec2(v.x, -v.y)) * scale) + translation;\n" +
				"}\n" +
				"\n" +
				"void main() {\n" +
				"	/*transform into camera space*/\n"+
				"	gl_Position = vec4(transform(v_pos, c_pos, c_rot, c_scale) / (c_size * 0.5), 0, 1);\n" +
				"	/*pull out of texture space*/\n"+
				"	uv = v_uv / t_size;\n" +
				"	/*apply global colour*/\n"+
				"	col = v_col * (c_col / 255.0);\n" +
				"}",

			fs: "\n" +
				"precision mediump float;\n" +
				"\n" +
				"/*in*/ \n" +
				"varying vec2 uv;\n" +
				"varying vec4 col;\n" +
				"\n" +
				"uniform sampler2D t_diffuse;\n" +
				"uniform vec2 t_size;\n" +
				"\n" +
				"void main() {\n" +
				"	/* avoid wrap issues on shitty gpus (tolerance) */\n"+
				"	vec2 clamped_uv = clamp(uv, 0.001, 0.999);\n" +
				"	vec4 texel = texture2D(t_diffuse, clamped_uv) * col;\n" +
				"	/* alpha cutout */\n"+
				"	if(texel.a < 0.05) {\n" +
				"		discard;\n" +
				"	}\n" +
				"	gl_FragColor = texel;\n" +
				"}"
		}
	}
}

function init_gl(width, height, int_coords, antialias) {
	if(_cg.gl !== null) {
		console.error("already initialised gl");
		return;
	}
	//grab and resize
	_cg.cnv = document.getElementById("canvas");
	_cg.cnv.width = width;
	_cg.cnv.height = height;

	//external option setup
	_cg.int_coords = int_coords;

	//gl context setup
	_cg.gl = twgl.getContext(_cg.cnv, {
		alpha: false,
		//depth: true,
		antialias: antialias,
		//preserveDrawingBuffer: true, //check if we actually want this :)
		premultipliedAlpha: false
	});

	var gl = _cg.gl;

	gl.clearColor(0, 0, 0, 1);

	gl.enable(gl.BLEND);
	gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

	//shader setup
	_cg.shaders.program_info = twgl.createProgramInfo(gl, [_cg.shaders.src.vs, _cg.shaders.src.fs]);
	_cg.shaders.program = _cg.shaders.program_info.program;

	//texture setup
	_cg.textures = twgl.createTextures(gl, {
		checker: {
			mag: gl.NEAREST,
			min: gl.LINEAR,
			src: [
				0xff,0xff,0xff,0xff, 0x00,0x00,0x00,0xff,
				0x00,0x00,0x00,0xff, 0xff,0xff,0xff,0xff,
			],
		},
		solid: {
			mag: gl.NEAREST,
			min: gl.NEAREST,
			src: [
				0xff,0xff,0xff,0xff, 0xff,0xff,0xff,0xff,
				0xff,0xff,0xff,0xff, 0xff,0xff,0xff,0xff,
			],
		}
	});

	//primitives setup
	_cg.primitives.quad_bufferinfo = twgl.createBufferInfoFromArrays(gl, {
		indices: new Uint16Array([0,1,2,0,2,3]),
		v_pos: { numComponents: 2, data: [0,0, 0,0, 0,0, 0,0], drawType: gl.DYNAMIC_DRAW },
		v_uv: { numComponents: 2, data: [0,0, 1,0, 1,1, 0,1], drawType: gl.DYNAMIC_DRAW },
		v_col: { numComponents: 4, data: [255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255], type: Uint8Array, drawType: gl.DYNAMIC_DRAW }
	});

	//temps
	_cg.temps.f32_8 = new Float32Array(8);
	_cg.temps.u8_16 = new Uint8Array(16);

	//uniforms
	//core uniforms setup
	_cg.uniforms.core.c_pos = new Float32Array([0, 0]);
	_cg.uniforms.core.c_rot = 0; //todo: sincos xy form, avoid trig in shader
	_cg.uniforms.core.c_scale = new Float32Array([1, 1]);
	_cg.uniforms.core.c_size = new Float32Array([_cg.cnv.width, _cg.cnv.height]);
	_cg.uniforms.core.c_col = new Uint8Array([255, 255, 255, 255]);
	//texture uniforms setup
	_cg.uniforms.texture.t_diffuse = _cg.textures.solid;
	_cg.uniforms.texture.t_size = new Float32Array([1, 1]); //todo: handle this properly

	//reset everything
	reset_render_translation();

	return gl;
}

function get_canvas() {
	if (_cg.cnv === null) {
		_cg.cnv = document.getElementById("canvas");
	}
	return _cg.cnv;
}

function get_context() {
	if(_cg.gl === null) {
		console.error("error getting context: call init_gl first!");
	}
	return _cg.gl;
}

//global rendering options

function set_int_coords(v) {
	_cg.int_coords = v;
}

function set_render_translation(x, y) {
	if(_cg.int_coords) {
		x = Math.round(x);
		y = Math.round(y);
	}
	_cg.uniforms.core.c_pos[0] = x;
	_cg.uniforms.core.c_pos[1] = y;
}

function set_colour(argb) {
	fill_u8a_with_col_argb(_cg.uniforms.core.c_col, argb);
}

function set_alpha(a) {
	_cg.uniforms.core.c_col[3] = a;
}

function set_texture(tex) {
	var w = 1;
	var h = 1;
	if(typeof tex === "string") {
		var img = fetch_image(tex);
		if(img == null) {
			console.log("failed to find texture "+tex);
			return;
		}
		tex = img.texture;
		w = img.width;
		h = img.height;
	}
	_cg.uniforms.texture.t_diffuse = tex;
	_cg.uniforms.texture.t_size[0] = w;
	_cg.uniforms.texture.t_size[1] = h;

	twgl.setUniforms(_cg.shaders.program_info, _cg.uniforms.texture);
}

function reset_render_translation() {
	set_render_translation(0, 0);
}

function reset_render() {
	reset_render_translation();
	set_colour("0xffffffff");
}

function clear_canvas(argb) {
	reset_render_translation();
	var gl = get_context();

	if(argb === undefined) {
		argb = 0xff000000;
	}

	var a = (argb >>> 24) & 0xff;
	var r = (argb >>> 16) & 0xff;
	var g = (argb >>> 8) & 0xff;
	var b = (argb >>> 0) & 0xff;

	gl.clearColor(
		r / 255.0,
		g / 255.0,
		b / 255.0,
		a / 255.0
	);
	gl.clear(gl.COLOR_BUFFER_BIT);

	reset_render();
}

//colour handling

function fill_u8a_with_col_argb(u8a, argb) {
	var a = (argb >>> 24) & 0xff;
	var r = (argb >>> 16) & 0xff;
	var g = (argb >>> 8) & 0xff;
	var b = (argb >>> 0) & 0xff;
	for(var i = 0; i < u8a.length; i += 4) {
		u8a[i+3] = a;
		u8a[i+0] = r;
		u8a[i+1] = g;
		u8a[i+2] = b;
	}
}

function start_chitin_render() {
	//bind uniforms, use program
	var gl = get_context();
	gl.useProgram(_cg.shaders.program);
	twgl.setUniforms(_cg.shaders.program_info, _cg.uniforms.core);
}

function end_chitin_render() {
	//do any batch flush or cleanup required
	var gl = get_context();
}

//immediate-mode quad rendering

function _do_draw_quad() {
	var gl = get_context();

	twgl.setBuffersAndAttributes(gl, _cg.shaders.program_info, _cg.primitives.quad_bufferinfo);
	twgl.drawBufferInfo(gl, _cg.primitives.quad_bufferinfo);
}

function render_quad(positions, uvs, colours) {
	var gl = get_context();

	//copy
	_cg.temps.f32_8.set(positions);
	twgl.setAttribInfoBufferFromArray(gl, _cg.primitives.quad_bufferinfo.attribs.v_pos, _cg.temps.f32_8);
	_cg.temps.f32_8.set(uvs);
	twgl.setAttribInfoBufferFromArray(gl, _cg.primitives.quad_bufferinfo.attribs.v_uv, _cg.temps.f32_8);
	_cg.temps.u8_16.set(colours);
	twgl.setAttribInfoBufferFromArray(gl, _cg.primitives.quad_bufferinfo.attribs.v_col, _cg.temps.u8_16);

	_do_draw_quad();
}

//standard quad vert generators
function quad_verts_tl_size(tl, size) {
	//todo: into arg
	return [
		tl.x, 			tl.y,
		tl.x + size.x, 	tl.y,
		tl.x + size.x, 	tl.y + size.y,
		tl.x, 			tl.y + size.y
	];
}

function quad_colours_argb(argb) {
	//todo: into arg
	var colours = new Uint8Array(16);
	if (argb === undefined) {
		argb = 0xffffffff;
	}
	fill_u8a_with_col_argb(colours, argb);
	return colours;
}

//(increasingly complicated quads)
//todo: autobatch?

//solid fill
function fill_rect(x, y, w, h) {
	if(_cg.int_coords) {
		x = Math.round(x);
		y = Math.round(y);
		w = Math.round(w);
		h = Math.round(h);
	}

	set_texture(_cg.textures.solid);
	render_quad(
		quad_verts_tl_size(new vec2(x, y), new vec2(w, h)),
		quad_verts_tl_size(new vec2(0, 0), new vec2(1, 1)),
		quad_colours_argb(0xffffffff)
	);
}

//outline fill
function draw_rect(x, y, w, h) {
	if(_cg.int_coords) {
		x = Math.round(x);
		y = Math.round(y);
		w = Math.round(w);
		h = Math.round(h);
	}

	fill_rect(x, y, 1, h);
	fill_rect(x, y, w, 1);
	fill_rect(x+w-1, y, 1, h);
	fill_rect(x, y+h-1, w, 1);
}

//sprites
function render_centred_angled_textured_quad(pos, halfsize, angle, framepos, framesize, argb) {
	//draw one sprite quad immediately (slow! :D)

	////////////////
	//vert position
	var horiz = new vec2(halfsize.x, 0).rotli(angle);
	var vert = new vec2(0, halfsize.y).rotli(angle);
	var tl = pos.sub(horiz).subi(vert);
	var tr = pos.add(horiz).subi(vert);
	var br = pos.add(horiz).add(vert);
	var bl = pos.sub(horiz).add(vert);

	var positions = [
		tl.x, tl.y,
		tr.x, tr.y,
		br.x, br.y,
		bl.x, bl.y
	];

	////////////////
	//vert uv

	var uvs = quad_verts_tl_size(framepos, framesize);

	////////////////
	//vert colours

	var colours = quad_colours_argb(argb);

	////////////////
	//draw
	render_quad(positions, uvs, colours);
}

//quad lines
function render_line_textured_quad(p1, p2, thickness, framepos, framesize, argb)
{
	var dif = p2.sub(p1);
	var ls = dif.length_squared();
	if(ls == 0) {
		//nothing to render
		return;
	}
	var norm = dif.sdivi(Math.sqrt(ls)).rot90li().smuli(thickness * 0.5);
	var tl = p2.sub(norm);
	var tr = p2.add(norm);
	var bl = p1.sub(norm);
	var br = p1.add(norm);

	var positions = [
		tl.x, tl.y,
		tr.x, tr.y,
		br.x, br.y,
		bl.x, bl.y
	];

	////////////////
	//vert uv

	var uvs = quad_verts_tl_size(framepos, framesize);

	////////////////
	//vert colours

	var colours = quad_colours_argb(argb);

	////////////////
	//draw
	render_quad(positions, uvs, colours);

}

//positions

function get_canvas_width() {
	return get_canvas().width;
}

function get_canvas_height() {
	return get_canvas().height;
}

function get_canvas_halfwidth() {
	return get_canvas().width * 0.5;
}

function get_canvas_halfheight() {
	return get_canvas().height * 0.5;
}

//used on loading and resizing the window
//not meant to be called by the user directly
function _resize_game_canvas_css() {
	var c = document.getElementById('canvas');
	var aspect = c.width / c.height;
	var w = c.width;
	var h = c.height;
	var ox = 0;
	var oy = 0;
	var p = c.parentNode;
	if(p) {
		if (p !== document.body) {
			//parent is some actual element
			w = p.clientWidth;
			h = p.clientHeight;
		} else {
			//parent is the whole document, fit to "screen"
			w = window.innerWidth;
			h = window.innerHeight;
		}
	}
	//(avoid issues with 0-dimensions)
	w = Math.max(1, w);
	h = Math.max(1, h);

	//calculate the letterbox stuff
	var new_aspect = w / h;
	if(new_aspect < aspect) {
		var full_h = h;
		h = w / aspect;
		oy = (full_h - h) * 0.5;
	} else {
		var full_w = w;
		w = h * aspect;
		ox = (full_w - w) * 0.5;
	}

	c.style.width = 	""+w+"px";
	c.style.height = 	""+h+"px";
	c.style.left = 		""+ox+"px";
	c.style.top = 		""+oy+"px";
};
