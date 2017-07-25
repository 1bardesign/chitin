///////////////////////////////////////////////////////////////////////////////
//
//	entity.js
//
//		the "entity" part of the entity component system
//
///////////////////////////////////////////////////////////////////////////////
//
//	component access through c(name[, i])
//
//	components get an entity reference "e" written when they are added
//
//	entity-global properties are best stored in the properties (p) object
//
//	entities can be optionally namespaced - this lets them be conveniently
//	isolated to a set of systems that can be cleaned up in one fell swoop
//	which is very convenient for separating game and ui, for example.
//
///////////////////////////////////////////////////////////////////////////////

"use strict"

///////////////////////////////////////////////////////////////////////////////
//	entity
///////////////////////////////////////////////////////////////////////////////

function Entity(namespace) {
	this._components = {};
	this.p = {};
	if(namespace !== undefined && namespace.length > 0) {
		this.namespace = namespace;
		if(this.namespace.substr(-2) != "::") {
			this.namespace = this.namespace + "::";
		}
		if(this.namespace.substr(0,2) != "::") {
			this.namespace = this.namespace;
		}
	} else {
		this.namespace = "";
	}

	return this;
}

//get the global name relative to this entity's namespace
Entity.prototype._namespaced = function(name) {
	//escaped namespace?
	if(name.charAt(0) == ":" && name.charAt(1) == ":") {
		return name.substr(2);
	}
	//dont append if unnecessary
	if(this.namespace.length == 0) {
		return name;
	}
	//otherwise join em up
	return this.namespace + name;
}

//destruction
Entity.prototype.destroy = function() {
	this.remove_all();
}

//component access
Entity.prototype.c = function(name, i) {
	if (i === undefined) {
		i = 0;
	}
	name = this._namespaced(name);
	var comps = this._components[name];
	if (comps === undefined) {
		return null;
	}
	if(i >= comps.length) {
		//too high? nothing there
		return null;
	} else if (i < 0) {
		//allow negative indexing
		i = comps.length + i;
		if(i < 0) {
			//too low? nothing there
			return null;
		}
	}
	return comps[i];
};

//get the number of components of a given type
//useful for iterating over the collection of components
Entity.prototype.nc = function(name) {
	name = this._namespaced(name);
	var comps = this._components[name];
	if (comps === undefined) {
		return 0;
	}
	return comps.length;
}

//component add
Entity.prototype.add_existing = function(name, existing_comp) {
	//grab or create components array
	name = this._namespaced(name);
	var comps = this._components[name];
	if (comps === undefined) {
		this._components[name] = [];
		comps = this._components[name];
	}
	//note down that we're the owner of this component
	existing_comp.e = this;
	//add the component to the array
	comps.push(existing_comp);
	return existing_comp;
}

Entity.prototype.add = function(name, args) {
	//create component (deferred to system)
	if (args === undefined) {
		//todo: consider making this some internal recycled object?
		args = {};
	}
	var global_name = this._namespaced(name);
	var comp = system_create_component(global_name, args);
	if(comp === null) {
		return null;
	}
	return this.add_existing(name, comp);
}

//component destruction
Entity.prototype.remove_i = function(name, i) {
	this.remove_c(name, this.c(name, i));
}

Entity.prototype.remove_c = function(name, component) {
	if (component === null) {
		return;
	}
	name = this._namespaced(name);
	var comps = this._components[name];
	if (comps === undefined) {
		return;
	}
	//remove from our array
	remove_element(comps, component);
	//then destroy it system-side
	system_destroy_component(name, component);
}

Entity.prototype.remove_all = function(name) {
	if(name !== undefined || name == "") {
		//remove all components absolutely
		for (var sname in this._components) {
			this.remove_all(sname);
		}
	} else {
		//shred all this entity's components
		name = this._namespaced(name);
		var comps = this._components[name];
		for (var i = 0; i < comps.length; i++) {
			system_destroy_component(name, comps[i]);
		}
		//(do not delete the array as that causes problems
		// iterating over our components above -
		// there's a slight memory cost to this but
		// we usually only want to do this on destroying
		// an entity, or to recreate the components we've
		// got for a system, so it shouldn't matter)
	}
}