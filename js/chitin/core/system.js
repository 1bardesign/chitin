///////////////////////////////////////////////////////////////////////////////
//
//	system.js
//
//		system base code and container for all global systems
//		(ie systems components can use)
//
///////////////////////////////////////////////////////////////////////////////

"use strict"

///////////////////////////////////////////////////////////////////////////////
// system optional interface
//	(entirely duck-typed)
//	(if missing, default behaviour)
///////////////////////////////////////////////////////////////////////////////
//
//	update([data])							default: nop
//		called every logical frame
//
//	render([data])							default: nop
//		called every graphical frame
//
//	create([data])							default: nop
//		called upon being added to the registry
//
//	destroy([data])							default: nop
//		called upon being removed from the registry
//
//	create_component(args[, data])			default: return null
//		called when an entity (or some other code)
//		creates a component using system_create_component
//
//	destroy_component(component[, data])	default: nop
//		called when an entity (or some other code)
//		destroys a component using system_destroy_component
//
///////////////////////////////////////////////////////////////////////////////
// system optional properties
//	(if missing, default value)
///////////////////////////////////////////////////////////////////////////////
//
//	order 									default: 0 or <last-set-order + 1>
//		the order this system should be updated in
//		lower numbers are updated/rendered earlier
//		same number will be run in js-dependent order (unreliable)
//
//		a sensible starting point for ordering your systems:
//			pre-physics 	- responding to input, deciding what to do "this frame"
//			physics 		- iterate transforms, resolve collisions
//			post-physics 	- anything that must respond to physics before rendering
//			pre-render		- animation, and anything else that prepares final render state
//			render 			- anything involved primarily with putting stuff on-screen
//
//	data									default: null
//		if provided, will be passed to the
//		update, create, destroy functions
//		which allows "plain-old-object" systems
//		(systems with no "this") as well as
//		sharing global configuration stuff between
//		multiple systems
//
///////////////////////////////////////////////////////////////////////////////

//(internal)
var _systems = {};
var _systems_order_cache_refresh = false;
var _systems_order_update_cache = null;
var _systems_order_render_cache = null;
var _systems_next_order = 0;

//access to the systems registry
function system(name) {
	if (_systems[name] !== undefined) {
		return _systems[name];
	}
	alert("No system \""+name+"\" exists!");
	return null;
}

//add a system to the registry
function add_system(name, sys, order) {
	if(_systems[name] !== undefined) {
		alert("Duplicate system: "+name+" - second instance not added!");
		return;
	}
	//fill in missing properties
	if(sys.order === undefined) {
		sys.order = (order !== undefined) ? order : _systems_next_order;
	}
	//set the next order to one higher than this one
	_systems_next_order = sys.order + 1;

	if(sys.data === undefined) {
		sys.data = null;
	}

	//all systems start enabled
	sys._enabled = true;

	//tell the system its name
	if(sys.name === undefined) {
		sys.name = name;
	}

	//set it going
	_systems[name] = sys;
	if(typeof sys.create === "function") {
		sys.create(sys.data);
	}

	//rebuild the order cache
	reorder_systems();
}

// remove a system from the registry
function remove_system(name) {
	//check that it exists
	var sys = system(name);
	if(sys === null) {
		return;
	}
	//any clean up needed
	if(typeof sys.destroy === "function") {
		sys.destroy(sys.data);
	}
	//remove it from the sytems registry and rebuild the order cache
	delete _systems[name];
	reorder_systems();
}

// remove all matching systems from the registry, usually used to
// wipe out namespaces
function remove_systems_matching(name_frag) {
	//check that it exists
	var matching = [];
	for(var name in _systems) {
		if(name.indexOf(name_frag) != -1) {
			matching.push(name);
		}
	}
	while(matching.length > 0){
		var name = matching.pop();
		remove_system(name);
	}
}

// enable a system - it will be updated or rendered from now on
function enable_system(name) {
	//check that it exists
	var sys = system(name);
	if(sys === null) {
		return;
	}
	//enable it and rebuild the cache
	sys._enabled = true;
	reorder_systems();
}

// disable a system - it wont be updated or rendered from now on
function disable_system(name) {
	//check that it exists
	var sys = system(name);
	if(sys === null) {
		return;
	}
	//disable it and rebuild the cache
	sys._enabled = false;
	reorder_systems();
}

// create a component
function system_create_component(name, args) {
	var sys = system(name);
	if(sys === null || typeof sys.create_component !== "function") {
		return null;
	}
	return sys.create_component(args, sys.data);
}

// create a component
function system_destroy_component(name, component) {
	var sys = system(name);
	if(sys === null || typeof sys.destroy_component !== "function") {
		return;
	}
	return sys.destroy_component(component, sys.data);
}

// if a system that's already added changes its order,
// this needs to be called to re-establish the new order
function reorder_systems() {
	_systems_order_cache_refresh = true;
}

// (internal helper)
function _collect_sorted_systems(function_name) {
	var gather = [];
	//gather all systems anew
	for (var name in _systems) {
		var sys = _systems[name];
		//don't add if it's disabled
		//don't add if there's no update to perform
		if(!sys._enabled || typeof sys[function_name] !== "function") {
			continue;
		}
		//cache position - this is used to stabilise the sort
		sys._sort_position = gather.length;
		//
		gather.push(sys);
	}
	//sort
	gather.sort(function(a,b) {
		return a.order == b.order ?
			a._sort_position - b._sort_position :
			a.order - b.order;
	});
	//done
	return gather;
}

//internal helper
function _do_reorder_systems_as_needed() {
	// did someone ask us to nuke em out?
	if(_systems_order_cache_refresh) {
		//note: we invalidate it here instead of on request
		//		so that if someone asks for a refresh mid-iteration
		//		the cache isn't stomped and nothing goes skew
		_systems_order_update_cache = null;
		_systems_order_render_cache = null;
		_systems_order_cache_refresh = false;
	}
	// cache is just a array of the systems in order
	// with each function ensured present
	if (_systems_order_update_cache === null) {
		_systems_order_update_cache = _collect_sorted_systems("update");
	}
	if (_systems_order_render_cache === null) {
		_systems_order_render_cache = _collect_sorted_systems("render");
	}
}

//update all the systems in their proper order
function update_systems() {
	_do_reorder_systems_as_needed();
	//iterate the order cache
	for(var i = 0; i < _systems_order_update_cache.length; i++) {
		var sys = _systems_order_update_cache[i];
		sys.update(sys.data);
	}
}

//render all the systems in their proper order
function render_systems() {
	_do_reorder_systems_as_needed();
	//iterate the order cache
	for(var i = 0; i < _systems_order_render_cache.length; i++) {
		var sys = _systems_order_render_cache[i];
		sys.render(sys.data);
	}
}

///////////////////////////////////////////////////////////////////////////////
//
//	Args Standardisation
//
//		It's useful to not have to write out all the undefined checks
//		and whatnot, and to have some expectations of what an args object
//		might accept. These functions encode some soft conventions
//		commonly used through chitin for component arguments.
//
//		Arguments generally have an accepted name or a default value
//
//		The general pattern for the args functions is:
//			args, name[s], default value[s]
//
///////////////////////////////////////////////////////////////////////////////

//get any js value from standard args
function value_from_args(args, name, def) {
	if(args[name] !== undefined) {
		return args[name];
	} else {
		return def;
	}
}

//get scalar from standard args
function scalar_from_args(args, name, def) {
	if(args[name] !== undefined) {
		return Number(args[name]);
	} else {
		return Number(def);
	}
}

//get 2d vector from standard args - either full name, or per-component names
function vec2_from_args(args, full, xcomp, ycomp, defx, defy) {
	if(args[full] !== undefined) {
		return new vec2(args[full]);
	} else if( xcomp != undefined && xcomp != "" && args[xcomp] !== undefined &&
			   ycomp != undefined && ycomp != "" && args[ycomp] !== undefined) {
		return new vec2(args[xcomp], args[ycomp]);
	} else {
		return new vec2(defx, defy);
	}
}

//get the relevant image based on args
//(image, asset, or else assets/missing.png used)
function image_from_args(args) {
	if(args.image !== undefined) {
		//literal image provided
		return args.image;
	} else if(args.asset !== undefined) {
		//asset name provided
		return fetch_image(args.asset);
	} else {
		//missing asset
		return fetch_image("missing");
	}
}

//get the relevant sound based on args
//(sound, asset, or else assets/missing.ogg used)
function sound_from_args(args) {
	if(args.sound !== undefined) {
		//literal sound provided
		return args.sound;
	} else if(args.asset !== undefined) {
		//asset name provided
		return fetch_sound(args.asset);
	} else {
		//missing asset
		return fetch_sound("missing");
	}
}
