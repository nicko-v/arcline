function generateSVG(x, y, n, stroke, color) { // Длина, высота, номер символа[, толщина линий, цвет]
	'use strict';
	var svg, radius, center, width, height, d, symbol, base, style;
	
	x = Math.round(x * 1000) / 1000; // Округление до трех знаков
	y = Math.round(y * 1000) / 1000;
	stroke = stroke || 1;
	style = 'stroke-width="' + stroke + '" stroke="' + (color || '#008800') + '"';
	
	// Сокращения для часто используемых точек:
	if (n[0] === 'c') {
		center = x / 2;
		radius = (x - stroke) / 2;
		d = {
			x0y05: stroke / 2 + ',' + center + ' ',
			x1y05: x - stroke / 2 + ',' + center + ' ',
			x05y0: center + ',' + stroke / 2 + ' ',
			x05y1: center + ',' + (y - stroke / 2) + ' ',
			x05y05: center + ',' + center + ' ',
			x025y05: radius * 0.5 + stroke / 2 + ',' + center + ' ',
			x075y05: radius * 1.5 + stroke / 2 + ',' + center + ' ',
			x05y025: center + ',' + (radius * 0.5 + stroke / 2) + ' ',
			x05y075: center + ',' + (radius * 1.5 + stroke / 2) + ' ',
			x025y025: radius * 0.5 + stroke / 2 + ',' + (radius * 0.5 + stroke / 2) + ' ',
			x075y025: radius * 1.5 + stroke / 2 + ',' + (radius * 0.5 + stroke / 2) + ' ',
			x025y075: radius * 0.5 + stroke / 2 + ',' + (radius * 1.5 + stroke / 2) + ' ',
			x075y075: radius * 1.5 + stroke / 2 + ',' + (radius * 1.5 + stroke / 2) + ' ',
			deg45:  Math.round((center + Math.cos(Math.PI / 4) * radius) * 1000) / 1000 + ',' +
			        Math.round((center + Math.sin(Math.PI / 4) * radius) * 1000) / 1000 + ' ',
			deg135: Math.round((center + Math.cos(3 * Math.PI / 4) * radius) * 1000) / 1000 + ',' +
			        Math.round((center + Math.sin(3 * Math.PI / 4) * radius) * 1000) / 1000 + ' ',
			deg225: Math.round((center + Math.cos(5 * Math.PI / 4) * radius) * 1000) / 1000 + ',' +
			        Math.round((center + Math.sin(5 * Math.PI / 4) * radius) * 1000) / 1000 + ' ',
			deg315: Math.round((center + Math.cos(7 * Math.PI / 4) * radius) * 1000) / 1000 + ',' +
		          Math.round((center + Math.sin(7 * Math.PI / 4) * radius) * 1000) / 1000 + ' '
		};
		symbol = {
			c1:  function () { return base + '" />'; },
			c2:  function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + 'M' + d.deg135 + 'L' + d.deg45 + '" />'; },
			c3:  function () { return base + 'M' + d.x0y05 + 'L' + d.x05y025 + d.x1y05 + '" />'; },
			c4:  function () { return base + 'M' + d.x025y05 + 'L' + d.x05y1 + d.x075y05 + '" />'; },
			c5:  function () { return base + 'M' + d.x025y05 + 'L' + d.deg225 + d.deg315 + d.x075y05 + '" />'; },
			c6:  function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.x05y1 + 'z" />'; },
			c7:  function () { return base + 'M' + d.x0y05 + 'L' + d.x05y0 + 'M' + d.x05y1 + 'L' + d.x1y05 + 'M' + d.x025y025 + 'L' + d.x075y075 + '" />'; },
			c8:  function () { return base + 'M' + d.x025y025 + 'L' + d.x075y025 + d.x075y075 + d.x025y075 + 'z" />'; },
			c9:  function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.deg45 + d.deg135 + 'z" />'; },
			c10: function () { return base + 'M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			c11: function () { return base + 'M' + d.x05y0 + 'L' + d.x1y05 + d.x05y1 + d.x0y05 + 'z" />'; },
			c12: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y025 + d.x1y05 + d.x05y075 + 'z" />'; },
			c13: function () { return base + 'M' + d.x025y05 + 'L' + d.x025y025 + d.x05y025 + 'M' + d.x05y075 + 'L' + d.x075y075 + d.x075y05 + 'M' + d.x025y025 + 'L' + d.x075y075 + '" />'; },
			c14: function () { return base + 'M' + d.deg225 + 'L' + d.x05y05 + d.deg315 + d.x05y1 + 'z" />'; },
			c15: function () { return base + 'M' + d.deg225 + 'L' + d.x05y05 + d.deg315 + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			c16: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			c17: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.x075y05 + d.deg45 + d.deg135 + d.x025y05 + 'z" />'; },
			c18: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.deg135 + d.deg45 + 'z" />'; },
			c19: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + 'M' + d.deg135 + 'L' + d.deg45 + 'M' + d.x0y05 + 'L' + d.x05y025 + d.x1y05 + '" />'; },
			c20: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y025 + d.x1y05 + 'M' + d.x025y05 + 'L' + d.x05y1 + d.x075y05 + '" />'; },
			c21: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + 'M' + d.deg135 + 'L' + d.deg45 + 'M' + d.x025y05 + 'L' + d.x025y025 + d.x05y025 + 'M' + d.x05y075 + 'L' + d.x075y075 + d.x075y05 + 'M' + d.x025y025 + 'L' + d.x075y075 + '" />'; },
			c22: function () { return base + 'M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + d.x05y025 + d.x1y05 + d.x05y075 + d.x0y05 + 'z" />'; },
			c23: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y025 + d.x1y05 + d.x05y075 + d.x0y05 + d.x05y0 + d.x1y05 + d.x05y1 + 'z" />'; },
			c24: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y0 + d.x1y05 + d.x05y1 + 'z M' + d.x025y025 + 'L' + d.x075y025 + d.x075y075 + d.x025y075 + 'z" />'; },
			c25: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.deg45 + d.deg135 + 'z M' + d.x025y025 + 'L' + d.x075y025 + d.x075y075 + d.x025y075 + 'z" />'; },
			c26: function () { return base + 'M' + d.x025y025 + 'L' + d.x075y025 + d.x075y075 + d.x025y075 + 'z M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			c27: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.deg45 + d.deg135 + 'z M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			c28: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y0 + d.x1y05 + d.x05y1 + 'z M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; },
			c29: function () { return base + 'M' + d.x0y05 + 'L' + d.x05y0 + d.x1y05 + d.x05y1 + 'z M' + d.x025y05 + 'L' + d.x025y025 + d.x05y025 + 'M' + d.x05y075 + 'L' + d.x075y075 + d.x075y05 + 'M' + d.x025y025 + 'L' + d.x075y075 + '" />'; },
			c30: function () { return base + 'M' + d.deg225 + 'L' + d.deg315 + d.x075y05 + d.deg45 + d.deg135 + d.x025y05 + 'z M' + d.x05y025 + 'L' + d.x075y05 + d.x05y075 + d.x025y05 + 'z" />'; }
		};
		base = '<path class="svg-path" ' + style + ' d="M' + d.x0y05 + 'A' + radius + ',' + radius + ' 360 1 1 ' + (stroke / 2) + ',' + (center + 0.1) + ' M' + d.x0y05 + 'L' + d.x1y05 + 'M' + d.x05y0 + 'L' + d.x05y1;
	} else if (n[0] === 'r') {
		width = x - stroke;
		height = y - stroke;
		d = {
			x0y0: stroke / 2 + ',' + stroke / 2 + ' ',
			x1y0: x - stroke / 2 + ',' + stroke / 2 + ' ',
			x1y1: x - stroke / 2 + ',' + (y - stroke / 2) + ' ',
			x0y1: stroke / 2 + ',' + (y - stroke / 2) + ' ',
			x05y0: x / 2 + ',' + stroke / 2 + ' ',
			x1y05: x - stroke / 2 + ',' + y / 2 + ' ',
			x05y1: x / 2 + ',' + (y - stroke / 2) + ' ',
			x0y05: stroke / 2 + ',' + y / 2 + ' ',
			x05y05: x / 2 + ',' + y / 2 + ' ',
			x025y0: width * 0.25 + stroke / 2 + ',' + stroke / 2 + ' ',
			x075y0: width * 0.75 + stroke / 2 + ',' + stroke / 2 + ' ',
			x1y025: x - stroke / 2 + ',' + (height * 0.25 + stroke / 2) + ' ',
			x1y075: x - stroke / 2 + ',' + (height * 0.75 + stroke / 2) + ' ',
			x075y1: width * 0.75 + stroke / 2 + ',' + (y - stroke / 2) + ' ',
			x025y1: width * 0.25 + stroke / 2 + ',' + (y - stroke / 2) + ' ',
			x0y075: stroke / 2 + ',' + (height * 0.75 + stroke / 2) + ' ',
			x0y025: stroke / 2 + ',' + (height * 0.25 + stroke / 2) + ' ',
			x025y05: width * 0.25 + stroke / 2 + ',' + y / 2 + ' ',
			x075y05: width * 0.75 + stroke / 2 + ',' + y / 2 + ' '
		};
		symbol = {
			r1:  function () { return base + '" />'; },
			r2:  function () { return base + 'M' + d.x0y0 + 'L' + d.x1y1 + '" />'; },
			r3:  function () { return base + 'M' + d.x0y0 + 'L' + d.x1y1 + 'M' + d.x0y1 + 'L' + d.x1y0 + '" />'; },
			r4:  function () { return base + 'M' + d.x025y0 + 'L' + d.x05y05 + d.x075y0 + '" />'; },
			r5:  function () { return base + 'M' + d.x0y0 + 'L' + d.x05y1 + d.x1y0 + '" />'; },
			r6:  function () { return base + 'M' + d.x0y05 + 'L' + d.x05y1 + d.x1y05 + '" />'; },
			r7:  function () { return base + 'M' + d.x0y0 + 'L' + d.x1y025 + 'M' + d.x0y075 + 'L' + d.x1y1 + '" />'; },
			r8:  function () { return base + 'M' + d.x0y025 + 'L' + d.x1y075 + 'M' + d.x0y075 + 'L' + d.x1y025 + '" />'; },
			r9:  function () { return base + 'M' + d.x0y1 + 'A' + (width / 2) + ',' + (height / 2) + ' 180 1 1 ' + d.x1y1 + '" />'; },
			r10: function () { return base + 'M' + d.x0y0 + 'A' + (width / 4) + ',' + (height / 2) + ' 180 1 1 ' + d.x0y1 + 'M' + d.x1y0 + 'A' + (width / 4) + ',' + (height / 2) + ' 180 1 0 ' + d.x1y1 + '" />'; },
			r11: function () { return base + 'M' + d.x025y0 + 'L' + d.x025y1 + 'M' + d.x075y0 + 'L' + d.x075y1 + '" />'; },
			r12: function () { return base + 'M' + d.x025y0 + 'L' + d.x025y1 + 'M' + d.x05y0 + 'L' + d.x05y1 + 'M' + d.x075y0 + 'L' + d.x075y1 + '" />'; },
			r13: function () { return base + 'M' + d.x05y0 + 'L' + d.x1y05 + 'M' + d.x0y0 + 'L' + d.x1y1 + 'M' + d.x0y05 + 'L' + d.x05y1 + '" />'; },
			r14: function () { return base + 'M' + d.x0y0 + 'L' + d.x1y025 + 'M' + d.x0y025 + 'L' + d.x1y05 + 'M' + d.x0y05 + 'L' + d.x1y075 + 'M' + d.x0y075 + 'L' + d.x1y1 + '" />'; },
			r15: function () { return base + 'M' + d.x075y0 + 'L' + d.x1y025 + 'M' + d.x1y075 + 'L' + d.x075y1 + 'M' + d.x025y1 + 'L' + d.x0y075 + 'M' + d.x0y025 + 'L' + d.x025y0 + '" />'; },
			r16: function () { return base + 'M' + d.x05y0 + 'L' + d.x1y05 + d.x05y1 + d.x0y05 + 'z" />'; },
			r17: function () { return base + 'M' + d.x075y0 + 'L' + d.x1y05 + d.x075y1 + 'M' + d.x025y1 + 'L' + d.x0y05 + d.x025y0 + '" />'; },
			r18: function () { return base + 'M' + d.x0y0 + 'L' + d.x025y05 + d.x0y1 + 'M' + d.x1y0 + 'L' + d.x075y05 + d.x1y1 + '" />'; },
			r19: function () { return base + 'M' + d.x0y0 + 'A' + (width / 2) + ',' + (height / 2) + ' 180 1 0 ' + d.x1y0 + 'M' + d.x0y05 + 'L' + d.x05y1 + d.x1y05 + '" />'; },
			r20: function () { return base + 'M' + d.x025y0 + 'L' + d.x05y05 + d.x075y0 + 'M' + d.x0y1 + 'A' + (width / 2) + ',' + (height / 2) + ' 180 1 1 ' + d.x1y1 + '" />'; },
			r21: function () { return base + 'M' + d.x0y0 + 'L' + d.x05y1 + d.x1y0 + 'M' + d.x025y0 + 'L' + d.x05y05 + d.x075y0 + '" />'; },
			r22: function () { return base + 'M' + d.x025y1 + 'L' + d.x025y0 + d.x05y05 + d.x075y0 + d.x075y1 + '" />'; },
			r23: function () { return base + 'M' + d.x0y0 + 'A' + (width / 4) + ',' + (height / 2) + ' 180 1 1 ' + d.x0y1 + 'M' + d.x025y0 + 'L' + d.x025y1 + 'M' + d.x075y0 + 'L' + d.x075y1 + 'M' + d.x1y0 + 'A' + (width / 4) + ',' + (height / 2) + ' 180 1 0 ' + d.x1y1 + '" />'; },
			r24: function () { return base + 'M' + d.x0y0 + 'A' + (width / 4) + ',' + (height / 2) + ' 180 1 1 ' + d.x0y1 + 'M' + d.x025y0 + 'L' + d.x05y05 + d.x075y0 + 'M' + d.x1y0 + 'A' + (width / 4) + ',' + (height / 2) + ' 180 1 0 ' + d.x1y1 + '" />'; },
			r25: function () { return base + 'M' + d.x0y0 + 'L' + d.x025y05 + d.x0y1 + 'M' + d.x025y0 + 'L' + d.x025y1 + 'M' + d.x075y0 + 'L' + d.x075y1 + 'M' + d.x1y0 + 'L' + d.x075y05 + d.x1y1 + '" />'; },
			r26: function () { return base + 'M' + d.x0y0 + 'L' + d.x025y05 + d.x0y1 + 'M' + d.x025y0 + 'L' + d.x05y05 + d.x075y0 + 'M' + d.x1y0 + 'L' + d.x075y05 + d.x1y1 + '" />'; },
			r27: function () { return base + 'M' + d.x0y025 + 'L' + d.x025y0 + d.x05y05 + d.x075y0 + d.x1y025 + 'M' + d.x0y075 + 'L' + d.x025y1 + 'M' + d.x075y1 + 'L' + d.x1y075 + '" />'; },
			r28: function () { return base + 'M' + d.x0y025 + 'L' + d.x025y0 + d.x025y1 + d.x0y075 + 'M' + d.x1y025 + 'L' + d.x075y0 + d.x075y1 + d.x1y075 + '" />'; },
			r29: function () { return base + 'M' + d.x075y0 + 'L' + d.x1y025 + 'M' + d.x1y075 + 'L' + d.x075y1 + 'M' + d.x025y1 + 'L' + d.x0y075 + 'M' + d.x0y025 + 'L' + d.x025y0 + 'M' + d.x05y0 + 'L' + d.x1y05 + d.x05y1 + d.x0y05 + 'z" />'; },
			r30: function () { return base + 'M' + d.x025y0 + 'L' + d.x0y025 + d.x1y075 + d.x075y1 + 'M' + d.x075y0 + 'L' + d.x1y025 + d.x0y075 + d.x025y1 + '" />'; }
		};
		base = '<path class="svg-path" ' + style + ' d="M' + d.x0y0 + d.x1y0 + d.x1y1 + d.x0y1 + 'z ';
	} else { return; }
	
	svg = '<svg width="' + x + 'px" height="' + y + 'px">';
	svg += symbol[n]();
	svg += '</svg>';
	return svg;
}