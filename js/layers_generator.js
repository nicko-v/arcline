function generateLayers(lib) {
	'use strict';
	var x, y, w, h, rotation, side, symbol, d = {}, result = { top: [], bot: [], thru: [], skipped: 0 }, lineWidth = '(width 0.08) )', line = '(line ', arc = '(triplePointArc ';
	
	function baseRnd() {
		result[side].push(arc + d.rnd.x05y05() + d.rnd.x1y05() + d.rnd.x1y05() + lineWidth);
		result[side].push(line + d.rnd.x0y05() + d.rnd.x1y05() + lineWidth);
		result[side].push(line + d.rnd.x05y0() + d.rnd.x05y1() + lineWidth);
	}
	function baseRect() {
		result[side].push(line + d.rect.x0y0() + d.rect.x1y0() + lineWidth);
		result[side].push(line + d.rect.x1y0() + d.rect.x1y1() + lineWidth);
		result[side].push(line + d.rect.x1y1() + d.rect.x0y1() + lineWidth);
		result[side].push(line + d.rect.x0y1() + d.rect.x0y0() + lineWidth);
	}
	function draw(object) {
		var i, key, coords;
		
		for (key in object) {
			if (object.hasOwnProperty(key) && object[key].symbol) {
				for (i = 0; i < object[key].coords.length; i += 1) {
					coords = object[key].coords[i].split(' ');
					side = coords[2] || object[key].side;
					rotation = (coords[3]) ? (+coords[3] !== 90 && +coords[3] !== 270) : true; // true если поворот на 0/180 или отсутствует (via), false - 90/270
					x = +coords[0];
					y = +coords[1];
					w = (rotation) ? object[key].width : object[key].height;
					h = (rotation) ? object[key].height : object[key].width;
					
					if (!coords[3] || [0, 90, 180, 270, 360].indexOf(+coords[3]) + 1) { // Если КП повернута под прямым углом или вообще не повернута (via) - создаем для нее символ
						symbol[object[key].symbol]();
					} else { // Иначе увеличиваем число пропущенных
						result.skipped += 1;
					}
				}
			}
		}
	}
	function rnd(a) {
		return Math.round(a * 1000) / 1000;
	}
	
	d.rnd = {
		x05y05:   function () { return '(pt ' + rnd(x) + ' ' + rnd(y) + ') '; },
		x05y0:    function () { return '(pt ' + rnd(x) + ' ' + rnd(y + w / 2) + ') '; },
		x05y1:    function () { return '(pt ' + rnd(x) + ' ' + rnd(y - w / 2) + ') '; },
		x05y025:  function () { return '(pt ' + rnd(x) + ' ' + rnd(y + w / 4) + ') '; },
		x05y075:  function () { return '(pt ' + rnd(x) + ' ' + rnd(y - w / 4) + ') '; },
		x0y05:    function () { return '(pt ' + rnd(x - w / 2) + ' ' + rnd(y) + ') '; },
		x1y05:    function () { return '(pt ' + rnd(x + w / 2) + ' ' + rnd(y) + ') '; },
		x025y05:  function () { return '(pt ' + rnd(x - w / 4) + ' ' + rnd(y) + ') '; },
		x075y05:  function () { return '(pt ' + rnd(x + w / 4) + ' ' + rnd(y) + ') '; },
		x025y025: function () { return '(pt ' + rnd(x - w / 4) + ' ' + rnd(y + w / 4) + ') '; },
		x075y025: function () { return '(pt ' + rnd(x + w / 4) + ' ' + rnd(y + w / 4) + ') '; },
		x025y075: function () { return '(pt ' + rnd(x - w / 4) + ' ' + rnd(y - w / 4) + ') '; },
		x075y075: function () { return '(pt ' + rnd(x + w / 4) + ' ' + rnd(y - w / 4) + ') '; },
		deg45:    function () { return '(pt ' + rnd(x + Math.cos(Math.PI * 0.25) * (w / 2)) + ' ' + rnd(y + Math.sin(Math.PI * 0.25) * (w / 2)) + ') '; },
		deg135:   function () { return '(pt ' + rnd(x + Math.cos(Math.PI * 0.75) * (w / 2)) + ' ' + rnd(y + Math.sin(Math.PI * 0.75) * (w / 2)) + ') '; },
		deg225:   function () { return '(pt ' + rnd(x + Math.cos(Math.PI * 1.25) * (w / 2)) + ' ' + rnd(y + Math.sin(Math.PI * 1.25) * (w / 2)) + ') '; },
		deg315:   function () { return '(pt ' + rnd(x + Math.cos(Math.PI * 1.75) * (w / 2)) + ' ' + rnd(y + Math.sin(Math.PI * 1.75) * (w / 2)) + ') '; }
	};
	d.rect = {
		x05y05:   function () { return '(pt ' + rnd(x) + ' ' + rnd(y) + ') '; },
		x05y0:    function () { return (rotation) ? '(pt ' + rnd(x) + ' ' + rnd(y + h / 2) + ') ' : '(pt ' + rnd(x - w / 2) + ' ' + rnd(y) + ') '; },
		x05y1:    function () { return (rotation) ? '(pt ' + rnd(x) + ' ' + rnd(y - h / 2) + ') ' : '(pt ' + rnd(x + w / 2) + ' ' + rnd(y) + ') '; },
		x1y05:    function () { return (rotation) ? '(pt ' + rnd(x + w / 2) + ' ' + rnd(y) + ') ' : '(pt ' + rnd(x) + ' ' + rnd(y + h / 2) + ') '; },
		x0y05:    function () { return (rotation) ? '(pt ' + rnd(x - w / 2) + ' ' + rnd(y) + ') ' : '(pt ' + rnd(x) + ' ' + rnd(y - h / 2) + ') '; },
		x025y05:  function () { return (rotation) ? '(pt ' + rnd(x - w / 4) + ' ' + rnd(y) + ') ' : '(pt ' + rnd(x) + ' ' + rnd(y - h / 4) + ') '; },
		x075y05:  function () { return (rotation) ? '(pt ' + rnd(x + w / 4) + ' ' + rnd(y) + ') ' : '(pt ' + rnd(x) + ' ' + rnd(y + h / 4) + ') '; },
		x0y0:     function () { return (rotation) ? '(pt ' + rnd(x - w / 2) + ' ' + rnd(y + h / 2) + ') ' : '(pt ' + rnd(x - w / 2) + ' ' + rnd(y - h / 2) + ') '; },
		x1y0:     function () { return (rotation) ? '(pt ' + rnd(x + w / 2) + ' ' + rnd(y + h / 2) + ') ' : '(pt ' + rnd(x - w / 2) + ' ' + rnd(y + h / 2) + ') '; },
		x1y1:     function () { return (rotation) ? '(pt ' + rnd(x + w / 2) + ' ' + rnd(y - h / 2) + ') ' : '(pt ' + rnd(x + w / 2) + ' ' + rnd(y + h / 2) + ') '; },
		x0y1:     function () { return (rotation) ? '(pt ' + rnd(x - w / 2) + ' ' + rnd(y - h / 2) + ') ' : '(pt ' + rnd(x + w / 2) + ' ' + rnd(y - h / 2) + ') '; },
		x025y0:   function () { return (rotation) ? '(pt ' + rnd(x - w / 4) + ' ' + rnd(y + h / 2) + ') ' : '(pt ' + rnd(x - w / 2) + ' ' + rnd(y - h / 4) + ') '; },
		x075y0:   function () { return (rotation) ? '(pt ' + rnd(x + w / 4) + ' ' + rnd(y + h / 2) + ') ' : '(pt ' + rnd(x - w / 2) + ' ' + rnd(y + h / 4) + ') '; },
		x1y025:   function () { return (rotation) ? '(pt ' + rnd(x + w / 2) + ' ' + rnd(y + h / 4) + ') ' : '(pt ' + rnd(x - w / 4) + ' ' + rnd(y + h / 2) + ') '; },
		x1y075:   function () { return (rotation) ? '(pt ' + rnd(x + w / 2) + ' ' + rnd(y - h / 4) + ') ' : '(pt ' + rnd(x + w / 4) + ' ' + rnd(y + h / 2) + ') '; },
		x075y1:   function () { return (rotation) ? '(pt ' + rnd(x + w / 4) + ' ' + rnd(y - h / 2) + ') ' : '(pt ' + rnd(x + w / 2) + ' ' + rnd(y + h / 4) + ') '; },
		x025y1:   function () { return (rotation) ? '(pt ' + rnd(x - w / 4) + ' ' + rnd(y - h / 2) + ') ' : '(pt ' + rnd(x + w / 2) + ' ' + rnd(y - h / 4) + ') '; },
		x0y075:   function () { return (rotation) ? '(pt ' + rnd(x - w / 2) + ' ' + rnd(y - h / 4) + ') ' : '(pt ' + rnd(x + w / 4) + ' ' + rnd(y - h / 2) + ') '; },
		x0y025:   function () { return (rotation) ? '(pt ' + rnd(x - w / 2) + ' ' + rnd(y + h / 4) + ') ' : '(pt ' + rnd(x - w / 4) + ' ' + rnd(y - h / 2) + ') '; },
		x025y025: function () { return (rotation) ? '(pt ' + rnd(x - w / 4) + ' ' + rnd(y + h / 4) + ') ' : '(pt ' + rnd(x - w / 4) + ' ' + rnd(y - h / 4) + ') '; },
		x075y025: function () { return (rotation) ? '(pt ' + rnd(x + w / 4) + ' ' + rnd(y + h / 4) + ') ' : '(pt ' + rnd(x - w / 4) + ' ' + rnd(y + h / 4) + ') '; },
		x075y075: function () { return (rotation) ? '(pt ' + rnd(x + w / 4) + ' ' + rnd(y - h / 4) + ') ' : '(pt ' + rnd(x + w / 4) + ' ' + rnd(y + h / 4) + ') '; },
		x025y075: function () { return (rotation) ? '(pt ' + rnd(x - w / 4) + ' ' + rnd(y - h / 4) + ') ' : '(pt ' + rnd(x + w / 4) + ' ' + rnd(y - h / 4) + ') '; }
	};
	symbol = {
		rnd1: function () {
			baseRnd();
		},
		rnd2: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
		  result[side].push(line + d.rnd.deg225() + d.rnd.deg315() + lineWidth);
		},
		rnd3: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x0y05() + d.rnd.x05y025() + lineWidth);
		  result[side].push(line + d.rnd.x05y025() + d.rnd.x1y05() + lineWidth);
		},
		rnd4: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x025y05() + d.rnd.x05y1() + lineWidth);
		  result[side].push(line + d.rnd.x05y1() + d.rnd.x075y05() + lineWidth);
		},
		rnd5: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x025y05() + d.rnd.deg135() + lineWidth);
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
			result[side].push(line + d.rnd.deg45() + d.rnd.x075y05() + lineWidth);
		},
		rnd6: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
		  result[side].push(line + d.rnd.deg45() + d.rnd.x05y1() + lineWidth);
			result[side].push(line + d.rnd.x05y1() + d.rnd.deg135() + lineWidth);
		},
		rnd7: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x0y05() + d.rnd.x05y0() + lineWidth);
		  result[side].push(line + d.rnd.x05y1() + d.rnd.x1y05() + lineWidth);
			result[side].push(line + d.rnd.x025y025() + d.rnd.x075y075() + lineWidth);
		},
		rnd8: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x025y025() + d.rnd.x075y025() + lineWidth);
		  result[side].push(line + d.rnd.x075y025() + d.rnd.x075y075() + lineWidth);
			result[side].push(line + d.rnd.x075y075() + d.rnd.x025y075() + lineWidth);
			result[side].push(line + d.rnd.x025y075() + d.rnd.x025y025() + lineWidth);
		},
		rnd9: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
		  result[side].push(line + d.rnd.deg45() + d.rnd.deg315() + lineWidth);
			result[side].push(line + d.rnd.deg315() + d.rnd.deg225() + lineWidth);
			result[side].push(line + d.rnd.deg225() + d.rnd.deg135() + lineWidth);
		},
		rnd10: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x05y025() + d.rnd.x075y05() + lineWidth);
		  result[side].push(line + d.rnd.x075y05() + d.rnd.x05y075() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x025y05() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.x05y025() + lineWidth);
		},
		rnd11: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x05y0() + d.rnd.x1y05() + lineWidth);
		  result[side].push(line + d.rnd.x1y05() + d.rnd.x05y1() + lineWidth);
			result[side].push(line + d.rnd.x05y1() + d.rnd.x0y05() + lineWidth);
			result[side].push(line + d.rnd.x0y05() + d.rnd.x05y0() + lineWidth);
		},
		rnd12: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x0y05() + d.rnd.x05y025() + lineWidth);
		  result[side].push(line + d.rnd.x05y025() + d.rnd.x1y05() + lineWidth);
			result[side].push(line + d.rnd.x1y05() + d.rnd.x05y075() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x0y05() + lineWidth);
		},
		rnd13: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.x05y05() + lineWidth);
		  result[side].push(line + d.rnd.x05y05() + d.rnd.deg45() + lineWidth);
			result[side].push(line + d.rnd.deg45() + d.rnd.x05y1() + lineWidth);
			result[side].push(line + d.rnd.x05y1() + d.rnd.deg135() + lineWidth);
		},
		rnd14: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x0y05() + d.rnd.x05y025() + lineWidth);
		  result[side].push(line + d.rnd.x05y025() + d.rnd.x1y05() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.x05y1() + lineWidth);
			result[side].push(line + d.rnd.x05y1() + d.rnd.x075y05() + lineWidth);
		},
		rnd15: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
		  result[side].push(line + d.rnd.deg225() + d.rnd.deg315() + lineWidth);
			result[side].push(line + d.rnd.x0y05() + d.rnd.x05y025() + lineWidth);
			result[side].push(line + d.rnd.x05y025() + d.rnd.x1y05() + lineWidth);
		},
		rnd16: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x025y05() + d.rnd.x025y025() + lineWidth);
		  result[side].push(line + d.rnd.x025y025() + d.rnd.x05y025() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x075y075() + lineWidth);
			result[side].push(line + d.rnd.x075y075() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x025y025() + d.rnd.x075y075() + lineWidth);
		},
		rnd17: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
		  result[side].push(line + d.rnd.deg45() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x075y05() + d.rnd.x05y075() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x025y05() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.deg135() + lineWidth);
		},
		rnd18: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.x05y05() + lineWidth);
		  result[side].push(line + d.rnd.x05y05() + d.rnd.deg45() + lineWidth);
			result[side].push(line + d.rnd.deg45() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x075y05() + d.rnd.x05y075() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x025y05() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.deg135() + lineWidth);
		},
		rnd19: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
		  result[side].push(line + d.rnd.deg45() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x075y05() + d.rnd.deg315() + lineWidth);
			result[side].push(line + d.rnd.deg315() + d.rnd.deg225() + lineWidth);
			result[side].push(line + d.rnd.deg225() + d.rnd.x025y05() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.deg135() + lineWidth);
		},
		rnd20: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
		  result[side].push(line + d.rnd.deg45() + d.rnd.deg225() + lineWidth);
			result[side].push(line + d.rnd.deg225() + d.rnd.deg315() + lineWidth);
			result[side].push(line + d.rnd.deg315() + d.rnd.deg135() + lineWidth);
		},
		rnd21: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
		  result[side].push(line + d.rnd.deg225() + d.rnd.deg315() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.x025y025() + lineWidth);
			result[side].push(line + d.rnd.x025y025() + d.rnd.x05y025() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x075y075() + lineWidth);
			result[side].push(line + d.rnd.x075y075() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x025y025() + d.rnd.x075y075() + lineWidth);
		},
		rnd22: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x0y05() + d.rnd.x05y025() + lineWidth);
		  result[side].push(line + d.rnd.x05y025() + d.rnd.x1y05() + lineWidth);
			result[side].push(line + d.rnd.x1y05() + d.rnd.x05y075() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x0y05() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.x05y025() + lineWidth);
			result[side].push(line + d.rnd.x05y025() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x075y05() + d.rnd.x05y075() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x025y05() + lineWidth);
		},
		rnd23: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x0y05() + d.rnd.x05y0() + lineWidth);
		  result[side].push(line + d.rnd.x05y0() + d.rnd.x1y05() + lineWidth);
			result[side].push(line + d.rnd.x1y05() + d.rnd.x05y1() + lineWidth);
			result[side].push(line + d.rnd.x05y1() + d.rnd.x0y05() + lineWidth);
			result[side].push(line + d.rnd.x0y05() + d.rnd.x05y025() + lineWidth);
			result[side].push(line + d.rnd.x05y025() + d.rnd.x1y05() + lineWidth);
			result[side].push(line + d.rnd.x1y05() + d.rnd.x05y075() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x0y05() + lineWidth);
		},
		rnd24: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x0y05() + d.rnd.x05y0() + lineWidth);
		  result[side].push(line + d.rnd.x05y0() + d.rnd.x1y05() + lineWidth);
			result[side].push(line + d.rnd.x1y05() + d.rnd.x05y1() + lineWidth);
			result[side].push(line + d.rnd.x05y1() + d.rnd.x0y05() + lineWidth);
			result[side].push(line + d.rnd.x025y025() + d.rnd.x075y025() + lineWidth);
			result[side].push(line + d.rnd.x075y025() + d.rnd.x075y075() + lineWidth);
			result[side].push(line + d.rnd.x075y075() + d.rnd.x025y075() + lineWidth);
			result[side].push(line + d.rnd.x025y075() + d.rnd.x025y025() + lineWidth);
		},
		rnd25: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
		  result[side].push(line + d.rnd.deg45() + d.rnd.deg315() + lineWidth);
			result[side].push(line + d.rnd.deg315() + d.rnd.deg225() + lineWidth);
			result[side].push(line + d.rnd.deg225() + d.rnd.deg135() + lineWidth);
			result[side].push(line + d.rnd.x025y025() + d.rnd.x075y025() + lineWidth);
			result[side].push(line + d.rnd.x075y025() + d.rnd.x075y075() + lineWidth);
			result[side].push(line + d.rnd.x075y075() + d.rnd.x025y075() + lineWidth);
			result[side].push(line + d.rnd.x025y075() + d.rnd.x025y025() + lineWidth);
		},
		rnd26: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x025y025() + d.rnd.x075y025() + lineWidth);
		  result[side].push(line + d.rnd.x075y025() + d.rnd.x075y075() + lineWidth);
			result[side].push(line + d.rnd.x075y075() + d.rnd.x025y075() + lineWidth);
			result[side].push(line + d.rnd.x025y075() + d.rnd.x025y025() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.x05y025() + lineWidth);
			result[side].push(line + d.rnd.x05y025() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x075y05() + d.rnd.x05y075() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x025y05() + lineWidth);
		},
		rnd27: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
		  result[side].push(line + d.rnd.deg45() + d.rnd.deg315() + lineWidth);
			result[side].push(line + d.rnd.deg315() + d.rnd.deg225() + lineWidth);
			result[side].push(line + d.rnd.deg225() + d.rnd.deg135() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.x05y025() + lineWidth);
			result[side].push(line + d.rnd.x05y025() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x075y05() + d.rnd.x05y075() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x025y05() + lineWidth);
		},
		rnd28: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x0y05() + d.rnd.x05y0() + lineWidth);
		  result[side].push(line + d.rnd.x05y0() + d.rnd.x1y05() + lineWidth);
			result[side].push(line + d.rnd.x1y05() + d.rnd.x05y1() + lineWidth);
			result[side].push(line + d.rnd.x05y1() + d.rnd.x0y05() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.x05y025() + lineWidth);
			result[side].push(line + d.rnd.x05y025() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x075y05() + d.rnd.x05y075() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x025y05() + lineWidth);
		},
		rnd29: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.x0y05() + d.rnd.x05y0() + lineWidth);
		  result[side].push(line + d.rnd.x05y0() + d.rnd.x1y05() + lineWidth);
			result[side].push(line + d.rnd.x1y05() + d.rnd.x05y1() + lineWidth);
			result[side].push(line + d.rnd.x05y1() + d.rnd.x0y05() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.x025y025() + lineWidth);
			result[side].push(line + d.rnd.x025y025() + d.rnd.x05y025() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x075y075() + lineWidth);
			result[side].push(line + d.rnd.x075y075() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x025y025() + d.rnd.x075y075() + lineWidth);
		},
		rnd30: function () {
		  baseRnd();
		  result[side].push(line + d.rnd.deg135() + d.rnd.deg45() + lineWidth);
		  result[side].push(line + d.rnd.deg45() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x075y05() + d.rnd.deg315() + lineWidth);
			result[side].push(line + d.rnd.deg315() + d.rnd.deg225() + lineWidth);
			result[side].push(line + d.rnd.deg225() + d.rnd.x025y05() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.deg135() + lineWidth);
			result[side].push(line + d.rnd.x025y05() + d.rnd.x05y025() + lineWidth);
			result[side].push(line + d.rnd.x05y025() + d.rnd.x075y05() + lineWidth);
			result[side].push(line + d.rnd.x075y05() + d.rnd.x05y075() + lineWidth);
			result[side].push(line + d.rnd.x05y075() + d.rnd.x025y05() + lineWidth);
		},
		rect1: function () {
			baseRect();
		},
		rect2: function () {
			baseRect();
			result[side].push(line + d.rect.x0y0() + d.rect.x1y1() + lineWidth);
		},
		rect3: function () {
			baseRect();
			result[side].push(line + d.rect.x05y0() + d.rect.x05y1() + lineWidth);
		},
		rect4: function () {
			baseRect();
			result[side].push(line + d.rect.x0y0() + d.rect.x1y1() + lineWidth);
			result[side].push(line + d.rect.x0y1() + d.rect.x1y0() + lineWidth);
		},
		rect5: function () {
			baseRect();
			result[side].push(line + d.rect.x05y0() + d.rect.x05y1() + lineWidth);
			result[side].push(line + d.rect.x0y05() + d.rect.x1y05() + lineWidth);
		},
		rect6: function () {
			baseRect();
			result[side].push(line + d.rect.x0y05() + d.rect.x05y1() + lineWidth);
			result[side].push(line + d.rect.x05y1() + d.rect.x1y05() + lineWidth);
		},
		rect7: function () {
			baseRect();
			result[side].push(line + d.rect.x025y0() + d.rect.x05y05() + lineWidth);
			result[side].push(line + d.rect.x05y05() + d.rect.x075y0() + lineWidth);
		},
		rect8: function () {
			baseRect();
			result[side].push(line + d.rect.x0y0() + d.rect.x05y1() + lineWidth);
			result[side].push(line + d.rect.x05y1() + d.rect.x1y0() + lineWidth);
		},
		rect9: function () {
			baseRect();
			result[side].push(line + d.rect.x025y0() + d.rect.x025y1() + lineWidth);
			result[side].push(line + d.rect.x075y0() + d.rect.x075y1() + lineWidth);
		},
		rect10: function () {
			baseRect();
			result[side].push(line + d.rect.x0y0() + d.rect.x1y025() + lineWidth);
			result[side].push(line + d.rect.x0y075() + d.rect.x1y1() + lineWidth);
		},
		rect11: function () {
			baseRect();
			result[side].push(line + d.rect.x025y0() + d.rect.x025y1() + lineWidth);
			result[side].push(line + d.rect.x05y0() + d.rect.x05y1() + lineWidth);
			result[side].push(line + d.rect.x075y0() + d.rect.x075y1() + lineWidth);
		},
		rect12: function () {
			baseRect();
			result[side].push(line + d.rect.x025y0() + d.rect.x025y1() + lineWidth);
			result[side].push(line + d.rect.x075y0() + d.rect.x075y1() + lineWidth);
			result[side].push(line + d.rect.x0y05() + d.rect.x1y05() + lineWidth);
		},
		rect13: function () {
			baseRect();
			result[side].push(line + d.rect.x0y05() + d.rect.x05y1() + lineWidth);
			result[side].push(line + d.rect.x0y0() + d.rect.x1y1() + lineWidth);
			result[side].push(line + d.rect.x05y0() + d.rect.x1y05() + lineWidth);
		},
		rect14: function () {
			baseRect();
			result[side].push(line + d.rect.x1y025() + d.rect.x0y0() + lineWidth);
			result[side].push(line + d.rect.x0y0() + d.rect.x1y1() + lineWidth);
			result[side].push(line + d.rect.x1y1() + d.rect.x0y075() + lineWidth);
		},
		rect15: function () {
			baseRect();
			result[side].push(line + d.rect.x0y0() + d.rect.x05y05() + lineWidth);
			result[side].push(line + d.rect.x05y05() + d.rect.x1y0() + lineWidth);
			result[side].push(line + d.rect.x0y05() + d.rect.x1y05() + lineWidth);
		},
		rect16: function () {
			baseRect();
			result[side].push(line + d.rect.x0y025() + d.rect.x025y05() + lineWidth);
			result[side].push(line + d.rect.x025y05() + d.rect.x025y1() + lineWidth);
			result[side].push(line + d.rect.x1y025() + d.rect.x075y05() + lineWidth);
			result[side].push(line + d.rect.x075y05() + d.rect.x075y1() + lineWidth);
		},
		rect17: function () {
			baseRect();
			result[side].push(line + d.rect.x0y0() + d.rect.x1y025() + lineWidth);
			result[side].push(line + d.rect.x0y025() + d.rect.x1y05() + lineWidth);
			result[side].push(line + d.rect.x0y05() + d.rect.x1y075() + lineWidth);
			result[side].push(line + d.rect.x0y075() + d.rect.x1y1() + lineWidth);
		},
		rect18: function () {
			baseRect();
			result[side].push(line + d.rect.x0y025() + d.rect.x025y0() + lineWidth);
			result[side].push(line + d.rect.x075y0() + d.rect.x1y025() + lineWidth);
			result[side].push(line + d.rect.x1y075() + d.rect.x075y1() + lineWidth);
			result[side].push(line + d.rect.x025y1() + d.rect.x0y075() + lineWidth);
		},
		rect19: function () {
			baseRect();
			result[side].push(line + d.rect.x0y05() + d.rect.x05y0() + lineWidth);
			result[side].push(line + d.rect.x05y0() + d.rect.x1y05() + lineWidth);
			result[side].push(line + d.rect.x1y05() + d.rect.x05y1() + lineWidth);
			result[side].push(line + d.rect.x05y1() + d.rect.x0y05() + lineWidth);
		},
		rect20: function () {
			baseRect();
			result[side].push(line + d.rect.x075y0() + d.rect.x1y05() + lineWidth);
			result[side].push(line + d.rect.x1y05() + d.rect.x075y1() + lineWidth);
			result[side].push(line + d.rect.x025y1() + d.rect.x0y05() + lineWidth);
			result[side].push(line + d.rect.x0y05() + d.rect.x025y0() + lineWidth);
		},
		rect21: function () {
			baseRect();
			result[side].push(line + d.rect.x0y0() + d.rect.x025y05() + lineWidth);
			result[side].push(line + d.rect.x025y05() + d.rect.x0y1() + lineWidth);
			result[side].push(line + d.rect.x1y0() + d.rect.x075y05() + lineWidth);
			result[side].push(line + d.rect.x075y05() + d.rect.x1y1() + lineWidth);
		},
		rect22: function () {
			baseRect();
			result[side].push(line + d.rect.x0y0() + d.rect.x05y1() + lineWidth);
			result[side].push(line + d.rect.x05y1() + d.rect.x1y0() + lineWidth);
			result[side].push(line + d.rect.x025y0() + d.rect.x05y05() + lineWidth);
			result[side].push(line + d.rect.x05y05() + d.rect.x075y0() + lineWidth);
		},
		rect23: function () {
			baseRect();
			result[side].push(line + d.rect.x05y0() + d.rect.x1y05() + lineWidth);
			result[side].push(line + d.rect.x1y05() + d.rect.x05y1() + lineWidth);
			result[side].push(line + d.rect.x05y1() + d.rect.x0y05() + lineWidth);
			result[side].push(line + d.rect.x0y05() + d.rect.x05y0() + lineWidth);
			result[side].push(line + d.rect.x05y0() + d.rect.x05y1() + lineWidth);
		},
		rect24: function () {
			baseRect();
			result[side].push(line + d.rect.x05y0() + d.rect.x1y05() + lineWidth);
			result[side].push(line + d.rect.x1y05() + d.rect.x05y1() + lineWidth);
			result[side].push(line + d.rect.x05y1() + d.rect.x0y05() + lineWidth);
			result[side].push(line + d.rect.x0y05() + d.rect.x05y0() + lineWidth);
			result[side].push(line + d.rect.x05y0() + d.rect.x05y1() + lineWidth);
			result[side].push(line + d.rect.x0y05() + d.rect.x1y05() + lineWidth);
		},
		rect25: function () {
			baseRect();
			result[side].push(line + d.rect.x0y0() + d.rect.x025y05() + lineWidth);
			result[side].push(line + d.rect.x025y05() + d.rect.x0y1() + lineWidth);
			result[side].push(line + d.rect.x025y0() + d.rect.x025y1() + lineWidth);
			result[side].push(line + d.rect.x075y0() + d.rect.x075y1() + lineWidth);
			result[side].push(line + d.rect.x1y0() + d.rect.x075y05() + lineWidth);
			result[side].push(line + d.rect.x075y05() + d.rect.x1y1() + lineWidth);
		},
		rect26: function () {
			baseRect();
			result[side].push(line + d.rect.x0y0() + d.rect.x025y05() + lineWidth);
			result[side].push(line + d.rect.x025y05() + d.rect.x0y1() + lineWidth);
			result[side].push(line + d.rect.x025y0() + d.rect.x05y05() + lineWidth);
			result[side].push(line + d.rect.x05y05() + d.rect.x075y0() + lineWidth);
			result[side].push(line + d.rect.x1y0() + d.rect.x075y05() + lineWidth);
			result[side].push(line + d.rect.x075y05() + d.rect.x1y1() + lineWidth);
		},
		rect27: function () {
			baseRect();
			result[side].push(line + d.rect.x0y025() + d.rect.x025y0() + lineWidth);
			result[side].push(line + d.rect.x025y0() + d.rect.x05y05() + lineWidth);
			result[side].push(line + d.rect.x05y05() + d.rect.x075y0() + lineWidth);
			result[side].push(line + d.rect.x075y0() + d.rect.x1y025() + lineWidth);
			result[side].push(line + d.rect.x0y075() + d.rect.x025y1() + lineWidth);
			result[side].push(line + d.rect.x075y1() + d.rect.x1y075() + lineWidth);
		},
		rect28: function () {
			baseRect();
			result[side].push(line + d.rect.x0y025() + d.rect.x025y0() + lineWidth);
			result[side].push(line + d.rect.x025y0() + d.rect.x025y1() + lineWidth);
			result[side].push(line + d.rect.x025y1() + d.rect.x0y075() + lineWidth);
			result[side].push(line + d.rect.x1y025() + d.rect.x075y0() + lineWidth);
			result[side].push(line + d.rect.x075y0() + d.rect.x075y1() + lineWidth);
			result[side].push(line + d.rect.x075y1() + d.rect.x1y075() + lineWidth);
		},
		rect29: function () {
			baseRect();
			result[side].push(line + d.rect.x025y0() + d.rect.x0y025() + lineWidth);
			result[side].push(line + d.rect.x0y025() + d.rect.x1y075() + lineWidth);
			result[side].push(line + d.rect.x1y075() + d.rect.x075y1() + lineWidth);
			result[side].push(line + d.rect.x075y0() + d.rect.x1y025() + lineWidth);
			result[side].push(line + d.rect.x1y025() + d.rect.x0y075() + lineWidth);
			result[side].push(line + d.rect.x0y075() + d.rect.x025y1() + lineWidth);
		},
		rect30: function () {
			baseRect();
			result[side].push(line + d.rect.x025y0() + d.rect.x025y025() + lineWidth);
			result[side].push(line + d.rect.x025y025() + d.rect.x0y025() + lineWidth);
			result[side].push(line + d.rect.x075y0() + d.rect.x075y025() + lineWidth);
			result[side].push(line + d.rect.x075y025() + d.rect.x1y025() + lineWidth);
			result[side].push(line + d.rect.x1y075() + d.rect.x075y075() + lineWidth);
			result[side].push(line + d.rect.x075y075() + d.rect.x075y1() + lineWidth);
			result[side].push(line + d.rect.x0y075() + d.rect.x025y075() + lineWidth);
			result[side].push(line + d.rect.x025y075() + d.rect.x025y1() + lineWidth);
		}
	};
	
	draw(lib.vias);
	draw(lib.pads);
	if (result.top.length) { result.top = result.top.concat(result.thru); }
	if (result.bot.length) { result.bot = result.bot.concat(result.thru); }
	return result;
}