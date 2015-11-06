function drawRoundSymbol(canvas, symbol) {
	'use strict';
	var
		ctx = canvas.getContext('2d'),
		x = canvas.clientWidth,
		y = canvas.clientHeight,
		radius = x / 2;
	
	ctx.strokeStyle = '#000';
	ctx.lineJoin = 'round';
	ctx.lineWidth = 1;
	
	/* Основа - круг с крестом внутри */
	ctx.beginPath();
	ctx.arc(x / 2, y / 2, (x / 2), 0, Math.PI * 2);
	ctx.moveTo(x / 2, 0);
	ctx.lineTo(x / 2, y);
	ctx.moveTo(0, y / 2);
	ctx.lineTo(x, y / 2);
	ctx.stroke();
	ctx.clip();
	/* -=-=-=-=- */
	
	switch (symbol) {
	case 1:
		ctx.beginPath();
		ctx.moveTo(Math.cos(5 * Math.PI / 4) * radius + x / 2,
							 Math.sin(5 * Math.PI / 4) * radius + y / 2);
		ctx.lineTo(Math.cos(7 * Math.PI / 4) * radius + x / 2,
							 Math.sin(7 * Math.PI / 4) * radius + y / 2);
		ctx.moveTo(Math.cos(3 * Math.PI / 4) * radius + x / 2,
							 Math.sin(3 * Math.PI / 4) * radius + y / 2);
		ctx.lineTo(Math.cos(Math.PI / 4) * radius + x / 2,
							 Math.sin(Math.PI / 4) * radius + y / 2);
		ctx.stroke();
		break;
	case 2:
		ctx.beginPath();
		ctx.moveTo(0, y / 2);
		ctx.lineTo(x / 2, y / 2 - radius / 2);
		ctx.lineTo(x, y / 2);
		ctx.stroke();
		break;
	case 3:
		ctx.beginPath();
		ctx.moveTo(x / 2 - radius / 2, y / 2);
		ctx.lineTo(x / 2, y);
		ctx.lineTo(x / 2 + radius / 2, y / 2);
		ctx.stroke();
		break;
	case 4:
		ctx.beginPath();
		ctx.moveTo(x / 2 - radius / 2, y / 2);
		ctx.lineTo(Math.cos(5 * Math.PI / 4) * radius + x / 2,
							 Math.sin(5 * Math.PI / 4) * radius + y / 2);
		ctx.lineTo(Math.cos(7 * Math.PI / 4) * radius + x / 2,
							 Math.sin(7 * Math.PI / 4) * radius + y / 2);
		ctx.lineTo(x / 2 + radius / 2, y / 2);
		ctx.stroke();
		break;
	case 5:
		ctx.beginPath();
		ctx.moveTo(Math.cos(5 * Math.PI / 4) * radius + x / 2,
							 Math.sin(5 * Math.PI / 4) * radius + y / 2);
		ctx.lineTo(Math.cos(7 * Math.PI / 4) * radius + x / 2,
							 Math.sin(7 * Math.PI / 4) * radius + y / 2);
		ctx.lineTo(x / 2, y);
		ctx.closePath();
		ctx.stroke();
		break;
	case 6:
		ctx.beginPath();
		ctx.moveTo(0, y / 2);
		ctx.lineTo(x / 2, 0);
		ctx.moveTo(x / 2, y);
		ctx.lineTo(x, y / 2);
		ctx.moveTo(x / 2 - radius / 2, y / 2 - radius / 2);
		ctx.lineTo(x / 2 + radius / 2, y / 2 + radius / 2);
		ctx.stroke();
		break;
	case 7:
		ctx.beginPath();
		ctx.moveTo(x / 2 - radius / 2, y / 2 - radius / 2);
		ctx.strokeRect(x / 2 - radius / 2, y / 2 - radius / 2, radius, radius);
		break;
	}
}