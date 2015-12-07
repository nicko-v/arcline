function generateLayers(lib) {
	'use strict';
	var i, x, y, w, h, key, curr, coords, symbol, side, d = {}, result = { top: [], bot: [], thru: [] }, lineWidth = '(width 0.05) )', line = '(line ', arc = '(triplePointArc ';
	
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
	
	d.rnd = {
		x05y05:   function () { return '(pt ' + x + ' ' + y + ') '; },
		x0y05:    function () { return '(pt ' + (x - w / 2) + ' ' + y + ') '; },
		x1y05:    function () { return '(pt ' + (x + w / 2) + ' ' + y + ') '; },
		x05y0:    function () { return '(pt ' + x + ' ' + (y + w / 2) + ') '; },
		x05y1:    function () { return '(pt ' + x + ' ' + (y - w / 2) + ') '; },
		x025y05:  function () { return '(pt ' + (x - w / 4) + ' ' + y + ') '; },
		x075y05:  function () { return '(pt ' + (x + w / 4) + ' ' + y + ') '; },
		x05y025:  function () { return '(pt ' + x + ' ' + (y + w / 4) + ') '; },
		x05y075:  function () { return '(pt ' + x + ' ' + (y - w / 4) + ') '; },
		x025y025: function () { return '(pt ' + (x - w / 4) + ' ' + (y + w / 4) + ') '; },
		x075y025: function () { return '(pt ' + (x + w / 4) + ' ' + (y + w / 4) + ') '; },
		x025y075: function () { return '(pt ' + (x - w / 4) + ' ' + (y - w / 4) + ') '; },
		x075y075: function () { return '(pt ' + (x + w / 4) + ' ' + (y - w / 4) + ') '; },
		deg45:    function () { return '(pt ' + Math.round((x + Math.cos(Math.PI / 4) * (w / 2)) * 1000) / 1000 + ' ' + Math.round((x + Math.sin(Math.PI / 4) * (w / 2)) * 1000) / 1000 + ') '; },
		deg135:   function () { return '(pt ' + Math.round((x + Math.cos(3 * Math.PI / 4) * (w / 2)) * 1000) / 1000 + ' ' + Math.round((x + Math.sin(3 * Math.PI / 4) * (w / 2)) * 1000) / 1000 + ') '; },
		deg225:   function () { return '(pt ' + Math.round((x + Math.cos(5 * Math.PI / 4) * (w / 2)) * 1000) / 1000 + ' ' + Math.round((x + Math.sin(5 * Math.PI / 4) * (w / 2)) * 1000) / 1000 + ') '; },
		deg315:   function () { return '(pt ' + Math.round((x + Math.cos(7 * Math.PI / 4) * (w / 2)) * 1000) / 1000 + ' ' + Math.round((x + Math.sin(7 * Math.PI / 4) * (w / 2)) * 1000) / 1000 + ') '; }
	};
	d.rect = {
		x0y0:     function () { return (x - w / 2) + ' ' + (y + h / 2); },
		x1y0:     function () { return (x + w / 2) + ' ' + (y + h / 2); },
		x1y1:     function () { return (x + w / 2) + ' ' + (y - h / 2); },
		x0y1:     function () { return (x - w / 2) + ' ' + (y - h / 2); },
		x05y0:    function () { return x + ' ' + (y + h / 2); },
		x1y05:    function () { return (x + w / 2) + ' ' + y; },
		x05y1:    function () { return x + ' ' + (y - h / 2); },
		x0y05:    function () { return (x - w / 2) + ' ' + y; },
		x05y05:   function () { return x + ' ' + y; },
		x025y0:   function () { return (x - w / 4) + ' ' + (y + h / 2); },
		x075y0:   function () { return (x + w / 4) + ' ' + (y + h / 2); },
		x1y025:   function () { return (x + w / 2) + ' ' + (y + h / 4); },
		x1y075:   function () { return (x + w / 2) + ' ' + (y - h / 4); },
		x075y1:   function () { return (x + w / 4) + ' ' + (y + h / 2); },
		x025y1:   function () { return (x - w / 4) + ' ' + (y - h / 2); },
		x0y075:   function () { return (x - w / 2) + ' ' + (y - h / 4); },
		x0y025:   function () { return (x - w / 2) + ' ' + (y + h / 4); },
		x025y05:  function () { return (x - w / 4) + ' ' + y; },
		x075y05:  function () { return (x + w / 4) + ' ' + y; }
	};
	symbol = {
		rnd1:   function () { baseRnd(); },
		rnd2:   function () {
			
		},
		rnd3:   function () {
			
		},
		rnd4:   function () {
			
		},
		rnd5:   function () {
			
		},
		rnd6:   function () {
			
		},
		rnd7:   function () {
			
		},
		rnd8:   function () {
			
		},
		rnd9:   function () {
			
		},
		rnd10:  function () {
			
		},
		rnd11:  function () {
			
		},
		rnd12:  function () {
			
		},
		rnd13:  function () {
			
		},
		rnd14:  function () {
			
		},
		rnd15:  function () {
			
		},
		rnd16:  function () {
			
		},
		rnd17:  function () {
			
		},
		rnd18:  function () {
			
		},
		rnd19:  function () {
			
		},
		rnd20:  function () {
			
		},
		rnd21:  function () {
			
		},
		rnd22:  function () {
			
		},
		rnd23:  function () {
			
		},
		rnd24:  function () {
			
		},
		rnd25:  function () {
			
		},
		rnd26:  function () {
			
		},
		rnd27:  function () {
			
		},
		rnd28:  function () {
			
		},
		rnd29:  function () {
			
		},
		rnd30:  function () {
			
		},
		rect1:  function () {
			
		},
		rect2:  function () {
			
		},
		rect3:  function () {
			
		},
		rect4:  function () {
			
		},
		rect5:  function () {
			
		},
		rect6:  function () {
			
		},
		rect7:  function () {
			
		},
		rect8:  function () {
			
		},
		rect9:  function () {
			
		},
		rect10: function () {
			
		},
		rect11: function () {
			
		},
		rect12: function () {
			
		},
		rect13: function () {
			
		},
		rect14: function () {
			
		},
		rect15: function () {
			
		},
		rect16: function () {
			
		},
		rect17: function () {
			
		},
		rect18: function () {
			
		},
		rect19: function () {
			
		},
		rect20: function () {
			
		},
		rect21: function () {
			
		},
		rect22: function () {
			
		},
		rect23: function () {
			
		},
		rect24: function () {
			
		},
		rect25: function () {
			
		},
		rect26: function () {
			
		},
		rect27: function () {
			
		},
		rect28: function () {
			
		},
		rect29: function () {
			
		},
		rect30: function () {
			
		}
	};
	
	for (key in lib.vias) {
		if (lib.vias.hasOwnProperty(key)) {
			curr = lib.vias[key];
			w = curr.width;
			h = curr.height;
			for (i = 0; i < curr.coords.length; i += 1) {
				coords = curr.coords[i].split(' ');
				side = coords[2] || curr.side;
				x = +coords[0];
				y = +coords[1];
				symbol[curr.symbol]();
			}
		}
	}
	for (key in lib.pads) {
		if (lib.pads.hasOwnProperty(key)) {
			curr = lib.pads[key];
			w = curr.width;
			h = curr.height;
			for (i = 0; i < lib.pads[key].coords.length; i += 1) {
				coords = curr.coords[i].split(' ');
				side = coords[2] || curr.side;
				x = +coords[0];
				y = +coords[1];
				symbol[curr.symbol]();
			}
		}
	}
	return result;
}