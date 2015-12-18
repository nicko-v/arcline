function generateSVG(x, y, n, stroke, color) { // Длина, высота, номер символа[, толщина линий, цвет]
	'use strict';
	var svg, radius, center, width, height, d, symbol, base, style;
	
	function rnd(a) {
		return Math.round(a * 1000) / 1000;
	}
	
	stroke = stroke || 1;
	style = 'stroke-width="' + stroke + '" stroke="' + (color || '#008800') + '"';
	
	// Сокращения для часто используемых точек:
	if (n.match(/rnd/i)) {
		center = x / 2;
		radius = (x - stroke) / 2;
		d = {
			x05y05:   rnd(center) + ',' + rnd(center) + ' ',
			x05y0:    rnd(center) + ',' + rnd(stroke / 2) + ' ',
			x05y1:    rnd(center) + ',' + rnd((y - stroke / 2)) + ' ',
			x05y025:  rnd(center) + ',' + rnd(radius * 0.5 + stroke / 2) + ' ',
			x05y075:  rnd(center) + ',' + rnd(radius * 1.5 + stroke / 2) + ' ',
			x0y05:    rnd(stroke / 2) + ',' + rnd(center) + ' ',
			x1y05:    rnd(x - stroke / 2) + ',' + rnd(center) + ' ',
			x025y05:  rnd(radius * 0.5 + stroke / 2) + ',' + rnd(center) + ' ',
			x075y05:  rnd(radius * 1.5 + stroke / 2) + ',' + rnd(center) + ' ',
			x025y025: rnd(radius * 0.5 + stroke / 2) + ',' + rnd(radius * 0.5 + stroke / 2) + ' ',
			x075y025: rnd(radius * 1.5 + stroke / 2) + ',' + rnd(radius * 0.5 + stroke / 2) + ' ',
			x025y075: rnd(radius * 0.5 + stroke / 2) + ',' + rnd(radius * 1.5 + stroke / 2) + ' ',
			x075y075: rnd(radius * 1.5 + stroke / 2) + ',' + rnd(radius * 1.5 + stroke / 2) + ' ',
			deg45:    rnd(center + Math.cos(Math.PI * 0.25) * radius) + ',' + rnd(center + Math.sin(Math.PI * 0.25) * radius) + ' ',
			deg135:   rnd(center + Math.cos(Math.PI * 0.75) * radius) + ',' + rnd(center + Math.sin(Math.PI * 0.75) * radius) + ' ',
			deg225:   rnd(center + Math.cos(Math.PI * 1.25) * radius) + ',' + rnd(center + Math.sin(Math.PI * 1.25) * radius) + ' ',
			deg315:   rnd(center + Math.cos(Math.PI * 1.75) * radius) + ',' + rnd(center + Math.sin(Math.PI * 1.75) * radius) + ' '
		};
		symbol = {
			rnd1:  function () { return base + '" />'; },
			rnd2:  function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + 'M' + d.deg135 + 'L' + d.deg45 + '" />'; },
			rnd3:  function () { return base + 'M' + d.x0y05 + 'L' + d.x05y025 + d.x1y05 + '" />'; },
			rnd4:  function () { return base + 'M' + d.x025y05 + 'L' + d.x05y1 + d.x075y05 + '" />'; },
			rnd5:  function () { return base + 'M' + d.x025y05 + 'L' + d.deg225 + d.deg315 + d.x075y05 + '" />'; },
			rnd6:  function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.x05y1 + 'z" />'; },
			rnd7:  function () { return base + 'M' + d.x0y05 + 'L' + d.x05y0 + 'M' + d.x05y1 + 'L' + d.x1y05 + 'M' + d.x025y025 + 'L' + d.x075y075 + '" />'; },
			rnd8:  function () { return base + 'M' + d.x025y025 + 'L' + d.x075y025 + d.x075y075 + d.x025y075 + 'z" />'; },
			rnd9:  function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.deg45 + d.deg135 + 'z" />'; },
			rnd10: function () { return base + 'M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			rnd11: function () { return base + 'M' + d.x05y0 + 'L' + d.x1y05 + d.x05y1 + d.x0y05 + 'z" />'; },
			rnd12: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y025 + d.x1y05 + d.x05y075 + 'z" />'; },
			rnd13: function () { return base + 'M' + d.deg225 + 'L' + d.x05y05 + d.deg315 + d.x05y1 + 'z" />'; },
			rnd14: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y025 + d.x1y05 + 'M' + d.x025y05 + 'L' + d.x05y1 + d.x075y05 + '" />'; },
			rnd15: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + 'M' + d.deg135 + 'L' + d.deg45 + 'M' + d.x0y05 + 'L' + d.x05y025 + d.x1y05 + '" />'; },
			rnd16: function () { return base + 'M' + d.x025y05 + 'L' + d.x025y025 + d.x05y025 + 'M' + d.x05y075 + 'L' + d.x075y075 + d.x075y05 + 'M' + d.x025y025 + 'L' + d.x075y075 + '" />'; },
			rnd17: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			rnd18: function () { return base + 'M' + d.deg225 + 'L' + d.x05y05 + d.deg315 + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			rnd19: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.x075y05 + d.deg45 + d.deg135 + d.x025y05 + 'z" />'; },
			rnd20: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.deg135 + d.deg45 + 'z" />'; },
			rnd21: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + 'M' + d.deg135 + 'L' + d.deg45 + 'M' + d.x025y05 + 'L' + d.x025y025 + d.x05y025 + 'M' + d.x05y075 + 'L' + d.x075y075 + d.x075y05 + 'M' + d.x025y025 + 'L' + d.x075y075 + '" />'; },
			rnd22: function () { return base + 'M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + d.x05y025 + d.x1y05 + d.x05y075 + d.x0y05 + 'z" />'; },
			rnd23: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y025 + d.x1y05 + d.x05y075 + d.x0y05 + d.x05y0 + d.x1y05 + d.x05y1 + 'z" />'; },
			rnd24: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y0 + d.x1y05 + d.x05y1 + 'z M' + d.x025y025 + 'L' + d.x075y025 + d.x075y075 + d.x025y075 + 'z" />'; },
			rnd25: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.deg45 + d.deg135 + 'z M' + d.x025y025 + 'L' + d.x075y025 + d.x075y075 + d.x025y075 + 'z" />'; },
			rnd26: function () { return base + 'M' + d.x025y025 + 'L' + d.x075y025 + d.x075y075 + d.x025y075 + 'z M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			rnd27: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.deg45 + d.deg135 + 'z M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			rnd28: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y0 + d.x1y05 + d.x05y1 + 'z M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			rnd29: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y0 + d.x1y05 + d.x05y1 + 'z M' + d.x025y05 + 'L' + d.x025y025 + d.x05y025 + 'M' + d.x05y075 + 'L' + d.x075y075 + d.x075y05 + 'M' + d.x025y025 + 'L' + d.x075y075 + '" />'; },
			rnd30: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.x075y05 + d.deg45 + d.deg135 + d.x025y05 + 'z M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; }
		};
		base = '<path class="svg-path" ' + style + ' d="M' + d.x0y05 + 'A' + radius + ',' + radius + ' 360 1 1 ' + (stroke / 2) + ',' + (center + 0.1) + ' M' + d.x0y05 + 'L' + d.x1y05 + 'M' + d.x05y0 + 'L' + d.x05y1;
	} else if (n.match(/rect/i)) {
		width = x - stroke;
		height = y - stroke;
		d = {
			x05y0:    rnd(x / 2) + ',' + rnd(stroke / 2) + ' ',
			x05y05:   rnd(x / 2) + ',' + rnd(y / 2) + ' ',
			x05y1:    rnd(x / 2) + ',' + rnd(y - stroke / 2) + ' ',
			x0y0:     rnd(stroke / 2) + ',' + rnd(stroke / 2) + ' ',
			x0y1:     rnd(stroke / 2) + ',' + rnd(y - stroke / 2) + ' ',
			x0y05:    rnd(stroke / 2) + ',' + rnd(y / 2) + ' ',
			x0y075:   rnd(stroke / 2) + ',' + rnd(height * 0.75 + stroke / 2) + ' ',
			x0y025:   rnd(stroke / 2) + ',' + rnd(height * 0.25 + stroke / 2) + ' ',
			x1y0:     rnd(x - stroke / 2) + ',' + rnd(stroke / 2) + ' ',
			x1y1:     rnd(x - stroke / 2) + ',' + rnd(y - stroke / 2) + ' ',
			x1y05:    rnd(x - stroke / 2) + ',' + rnd(y / 2) + ' ',
			x1y025:   rnd(x - stroke / 2) + ',' + rnd(height * 0.25 + stroke / 2) + ' ',
			x1y075:   rnd(x - stroke / 2) + ',' + rnd(height * 0.75 + stroke / 2) + ' ',
			x025y0:   rnd(width * 0.25 + stroke / 2) + ',' + rnd(stroke / 2) + ' ',
			x075y0:   rnd(width * 0.75 + stroke / 2) + ',' + rnd(stroke / 2) + ' ',
			x075y1:   rnd(width * 0.75 + stroke / 2) + ',' + rnd(y - stroke / 2) + ' ',
			x025y1:   rnd(width * 0.25 + stroke / 2) + ',' + rnd(y - stroke / 2) + ' ',
			x025y05:  rnd(width * 0.25 + stroke / 2) + ',' + rnd(y / 2) + ' ',
			x075y05:  rnd(width * 0.75 + stroke / 2) + ',' + rnd(y / 2) + ' ',
			x025y025: rnd(width * 0.25 + stroke / 2) + ',' + rnd(height * 0.25 + stroke / 2) + ' ',
			x075y025: rnd(width * 0.75 + stroke / 2) + ',' + rnd(height * 0.25 + stroke / 2) + ' ',
			x075y075: rnd(width * 0.75 + stroke / 2) + ',' + rnd(height * 0.75 + stroke / 2) + ' ',
			x025y075: rnd(width * 0.25 + stroke / 2) + ',' + rnd(height * 0.75 + stroke / 2) + ' '
			
		};
		symbol = {
			rect1:  function () { return base + '" />'; },
			rect2:  function () { return base + 'M' + d.x0y0 + 'L' + d.x1y1 + '" />'; },
			rect3:  function () { return base + 'M' + d.x05y0 + 'L' + d.x05y1 + '" />'; },
			rect4:  function () { return base + 'M' + d.x0y0 + 'L' + d.x1y1 + 'M' + d.x0y1 + 'L' + d.x1y0 + '" />'; },
			rect5:  function () { return base + 'M' + d.x05y0 + 'L' + d.x05y1 + 'M' + d.x0y05 + 'L' + d.x1y05 + '" />'; },
			rect6:  function () { return base + 'M' + d.x0y05 + 'L' + d.x05y1 + d.x1y05 + '" />'; },
			rect7:  function () { return base + 'M' + d.x025y0 + 'L' + d.x05y05 + d.x075y0 + '" />'; },
			rect8:  function () { return base + 'M' + d.x0y0 + 'L' + d.x05y1 + d.x1y0 + '" />'; },
			rect9:  function () { return base + 'M' + d.x025y0 + 'L' + d.x025y1 + 'M' + d.x075y0 + 'L' + d.x075y1 + '" />'; },
			rect10: function () { return base + 'M' + d.x0y0 + 'L' + d.x1y025 + 'M' + d.x0y075 + 'L' + d.x1y1 + '" />'; },
			rect11: function () { return base + 'M' + d.x025y0 + 'L' + d.x025y1 + 'M' + d.x05y0 + 'L' + d.x05y1 + 'M' + d.x075y0 + 'L' + d.x075y1 + '" />'; },
			rect12: function () { return base + 'M' + d.x025y0 + 'L' + d.x025y1 + 'M' + d.x075y0 + 'L' + d.x075y1 + 'M' + d.x0y05 + 'L' + d.x1y05 + '" />'; },
			rect13: function () { return base + 'M' + d.x05y0 + 'L' + d.x1y05 + 'M' + d.x0y0 + 'L' + d.x1y1 + 'M' + d.x0y05 + 'L' + d.x05y1 + '" />'; },
			rect14: function () { return base + 'M' + d.x1y025 + 'L' + d.x0y0 + d.x1y1 + d.x0y075 + '" />'; },
			rect15: function () { return base + 'M' + d.x0y0 + 'L' + d.x05y05 + d.x1y0 + 'M' + d.x0y05 + 'L' + d.x1y05 + '" />'; },
			rect16: function () { return base + 'M' + d.x0y025 + 'L' + d.x025y05 + d.x025y1 + 'M' + d.x1y025 + 'L' + d.x075y05 + d.x075y1 + '" />'; },
			rect17: function () { return base + 'M' + d.x0y0 + 'L' + d.x1y025 + 'M' + d.x0y025 + 'L' + d.x1y05 + 'M' + d.x0y05 + 'L' + d.x1y075 + 'M' + d.x0y075 + 'L' + d.x1y1 + '" />'; },
			rect18: function () { return base + 'M' + d.x075y0 + 'L' + d.x1y025 + 'M' + d.x1y075 + 'L' + d.x075y1 + 'M' + d.x025y1 + 'L' + d.x0y075 + 'M' + d.x0y025 + 'L' + d.x025y0 + '" />'; },
			rect19: function () { return base + 'M' + d.x05y0 + 'L' + d.x1y05 + d.x05y1 + d.x0y05 + 'z" />'; },
			rect20: function () { return base + 'M' + d.x075y0 + 'L' + d.x1y05 + d.x075y1 + 'M' + d.x025y1 + 'L' + d.x0y05 + d.x025y0 + '" />'; },
			rect21: function () { return base + 'M' + d.x0y0 + 'L' + d.x025y05 + d.x0y1 + 'M' + d.x1y0 + 'L' + d.x075y05 + d.x1y1 + '" />'; },
			rect22: function () { return base + 'M' + d.x0y0 + 'L' + d.x05y1 + d.x1y0 + 'M' + d.x025y0 + 'L' + d.x05y05 + d.x075y0 + '" />'; },
			rect23: function () { return base + 'M' + d.x05y0 + 'L' + d.x1y05 + d.x05y1 + d.x0y05 + d.x05y0 + d.x05y1 + '" />'; },
			rect24: function () { return base + 'M' + d.x05y0 + 'L' + d.x1y05 + d.x05y1 + d.x0y05 + d.x05y0 + d.x05y1 + 'M' + d.x0y05 + 'L' + d.x1y05 + '" />'; },
			rect25: function () { return base + 'M' + d.x0y0 + 'L' + d.x025y05 + d.x0y1 + 'M' + d.x025y0 + 'L' + d.x025y1 + 'M' + d.x075y0 + 'L' + d.x075y1 + 'M' + d.x1y0 + 'L' + d.x075y05 + d.x1y1 + '" />'; },
			rect26: function () { return base + 'M' + d.x0y0 + 'L' + d.x025y05 + d.x0y1 + 'M' + d.x025y0 + 'L' + d.x05y05 + d.x075y0 + 'M' + d.x1y0 + 'L' + d.x075y05 + d.x1y1 + '" />'; },
			rect27: function () { return base + 'M' + d.x0y025 + 'L' + d.x025y0 + d.x05y05 + d.x075y0 + d.x1y025 + 'M' + d.x0y075 + 'L' + d.x025y1 + 'M' + d.x075y1 + 'L' + d.x1y075 + '" />'; },
			rect28: function () { return base + 'M' + d.x0y025 + 'L' + d.x025y0 + d.x025y1 + d.x0y075 + 'M' + d.x1y025 + 'L' + d.x075y0 + d.x075y1 + d.x1y075 + '" />'; },
			rect29: function () { return base + 'M' + d.x025y0 + 'L' + d.x0y025 + d.x1y075 + d.x075y1 + 'M' + d.x075y0 + 'L' + d.x1y025 + d.x0y075 + d.x025y1 + '" />'; },
			rect30: function () { return base + 'M' + d.x025y0 + 'L' + d.x025y025 + d.x0y025 + 'M' + d.x075y0 + 'L' + d.x075y025 + d.x1y025 + 'M' + d.x1y075 + 'L' + d.x075y075 + d.x075y1 + 'M' + d.x0y075 + 'L' + d.x025y075 + d.x025y1 + '" />'; }
		};
		base = '<path class="svg-path" ' + style + ' d="M' + d.x0y0 + d.x1y0 + d.x1y1 + d.x0y1 + 'z ';
	} else { return; }
	
	svg = '<svg width="' + x + 'px" height="' + y + 'px">';
	svg += symbol[n]();
	svg += '</svg>';
	return svg;
}



