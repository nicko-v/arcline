function testCalcBrackets(string) {
	'use strict';
	var brackets = 0, quote = 0, i;
	for (i = 0; i < string.length; i += 1) {
		if (string[i] === '\"' && string[i - 1] !== '\\') { quote += 1; }
		if (quote % 2 === 0) {
			if (string[i] === '(') { brackets += 1; }
			if (string[i] === ')') { brackets -= 1; }
		}
	}
	return brackets;
}

function testAsArray(obj) {
	'use strict';
	var array = [];
	function walker(object) {
		var i;
		for (i = 0; i < Object.keys(object).length; i += 1) {
			if (object.hasOwnProperty(i)) {
				if (typeof object[i] === 'object') {
					array.push(object[i].header);
					walker(object[i]);
				} else {
					array.push(object[i]);
				}
			}
		}
	}
	walker(obj);
	return array;
}