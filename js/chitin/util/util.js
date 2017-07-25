///////////////////////////////////////////////////////////////////////////////
//
// util.js
//
//	miscellaneous utility functions not worth their own file
//
///////////////////////////////////////////////////////////////////////////////

"use strict"

///////////////////////////////////////////////////////////////////////////////
// maths
///////////////////////////////////////////////////////////////////////////////

function wrap(val, min, max) {
	var range = max - min;
	val = (val - min) % range;
	if (val < 0) {
		return min + val + range;
	} else {
		return min + val;
	}
}

function clamp(val, min, max) {
	return Math.max(min, Math.min(val, max));
}

///////////////////////////////////////////////////////////////////////////////
// url parsing
///////////////////////////////////////////////////////////////////////////////

function getParameterByName(name, url) {
	if (!url) {
		url = window.location.href;
	}
	name = name.replace(/[\[\]]/g, "\\$&");
	var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	results = regex.exec(url);
	if (!results) {
		return null;
	}
	if (!results[2]) {
		return ''
	};
	return decodeURIComponent(results[2].replace( /\+/g, " "));
}

///////////////////////////////////////////////////////////////////////////////
// array functions
///////////////////////////////////////////////////////////////////////////////

// find the index before the location of this element
//	(can be used for sorted insertion)
function search_location_generic(array, element, compare, start, end) {
	if (array.length === 0) {
		return -1;
	}

	//default in arguments
	start = start || 0;
	end = end || array.length;
	var pivot = Math.floor((start + end) / 2);

	//sample comparison
	var c = compare(element, array[pivot]);

	//have we split down to 1?
	if (end - start <= 1) {
		if(c < 0) {
			return pivot - 1
		} else {
			return pivot;
		}
	}

	//otherwise normal binary search
	if(c < 0) {
		return search_location_generic(array, element, compare, start, pivot);
	} else if(c > 0) {
		return search_location_generic(array, element, compare, pivot, end);
	} else {
		return pivot;
	}
}

// insert this element at the position specified by the compare function
function insert_sorted_generic(array, element, compare) {
	array.splice(search_location_generic(array, element, compare) + 1, 0, element);
	return array;
}

//remove an element from an array if it exists
function remove_element(array, element) {
	var i = array.indexOf(element);
	if(i != -1) {
		array.splice(i, 1);
	}
}

///////////////////////////////////////////////////////////////////////////////
// time
///////////////////////////////////////////////////////////////////////////////

function current_time()
{
	return Date.now() / 1000;
}

function current_time_int()
{
	return Math.floor(current_time());
}

