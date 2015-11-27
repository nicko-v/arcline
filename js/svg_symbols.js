function createSVGsymbol(x, y, n, s, c) { // Длина, высота, номер символа, толщина линий, цвет
	'use strict';
	var svg, deg45, deg135, deg225, deg315, xBgn, xEnd, yBgn, yEnd, hlX, hlY, qrX, qrY, width, height, radius, stroke, color;
	
	stroke = 1;
	color = '#008800';
	
	// Координаты, в которых можно рисовать, зависят от толщины линии (что бы не обрезалось по краям):
	xBgn = (s) ? s / 2 : stroke / 2;
	yBgn = (s) ? s / 2 : stroke / 2;
	xEnd = (s) ? (x - s).toFixed(3) : (x - stroke / 2).toFixed(3);
	yEnd = (s) ? (y - s).toFixed(3) : (y - stroke / 2).toFixed(3);
	
	// Сокращения для часто используемых точек:
	width = (xEnd - xBgn).toFixed(3);
	height = (yEnd - yBgn).toFixed(3);
	radius = ((xEnd - xBgn) / 2).toFixed(3);
	hlX = (x / 2).toFixed(3);
	hlY = (y / 2).toFixed(3);
	qrX = ((xEnd - xBgn) / 4).toFixed(3);
	qrY = ((yEnd - yBgn) / 4).toFixed(3);
	deg45  = [];
	deg135 = [];
	deg225 = [];
	deg315 = [];
	
	svg = '<svg width="' + x.toFixed(3) + 'px" height="' + y.toFixed(3) + 'px">' +
	      '<style>* {fill:none; stroke:' + (c || color) + '; stroke-width:' + (s || stroke) + '; stroke-linecap:round; stroke-linejoin:round;</style>';
	
	
	
	switch (n[0]) {
	case 'c':
		svg += '<defs><g id="c01">' +
		       '<circle cx="' + hlX + '"  cy="' + hlY + '"  r="' + radius + '" />' +
		       '<path d="M ' + xBgn + ' ' + hlY + ' H ' + xEnd + ' M ' + hlX + ' ' + yBgn + ' V ' + yEnd + '" />' +
		       '</g></defs>';
		break;
	case 'r':
		svg += '<defs><g id="r01">' +
		       '<rect x="' + xBgn + '" y="' + yBgn + '" width="' + width + '" height="' + height + '" />' +
		       '</g></defs>';
		break;
	}
	
	switch (n) {
	case 'c1':
		svg += '<use xlink:href="#c01" x="0" y="0" />';
		break;
	case 'c2':
		svg += '<use xlink:href="#c01" x="0" y="0" /><path d="M -17.677 -17.677 H 17.677 M -17.677 17.677 H 17.677" />';
		break;
	case 'c3':
		svg += '';
		break;
	case 'c4':
		svg += '';
		break;
	case 'c5':
		svg += '';
		break;
	case 'c6':
		svg += '';
		break;
	case 'c7':
		svg += '';
		break;
	case 'c8':
		svg += '';
		break;
	case 'c9':
		svg += '';
		break;
	case 'c10':
		svg += '';
		break;
	case 'c11':
		svg += '';
		break;
	case 'c12':
		svg += '';
		break;
	case 'c13':
		svg += '';
		break;
	case 'c14':
		svg += '';
		break;
	case 'c15':
		svg += '';
		break;
	case 'c16':
		svg += '';
		break;
	case 'c17':
		svg += '';
		break;
	case 'c18':
		svg += '';
		break;
	case 'c19':
		svg += '';
		break;
	case 'c20':
		svg += '';
		break;
	case 'c21':
		svg += '';
		break;
	case 'c22':
		svg += '';
		break;
	case 'c23':
		svg += '';
		break;
	case 'c24':
		svg += '';
		break;
	case 'c25':
		svg += '';
		break;
	case 'c26':
		svg += '';
		break;
	case 'c27':
		svg += '';
		break;
	case 'c28':
		svg += '';
		break;
	case 'c29':
		svg += '';
		break;
	case 'c30':
		svg += '';
		break;
	}
	
	svg += '</svg>';
	return svg;
}