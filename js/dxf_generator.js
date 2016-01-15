/*
* Используемые коды:
*		7 - стиль текста
*		8 - имя слоя
*		10 - x
*		11 - x1
*		12 - центр вьюпорта по X
*		20 - y
*		21 - y1
*		22 - центр вьюпорта по y
*		40 - высота текста / высота вьюпорта / радиус круга
*		41 - коэффициент сжатия текста / соотношение сторон вьюпорта
*		50 - угол наклона текста
*		62 - цвет линии (1 - red, 2 - yellow, 3 - green, 256 - ByLayer)
*		72 - горизонтальное выравнивание текста (0 - left, 1 - center, 2 - right)
*		73 - вертикальное выравнивание текста (0 - baseline, 1 - bottom, 2 - middle, 3 - top)
*   Используемые заголовки:
*   [0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2] - желтый текст высотой 3.5
*   [0, 'LINE', 8, 'Drill_Table', 62, 1] - красная линия для таблицы или платы
*   [0, 'LINE', 8, 'Drill_Table', 62, 3] - зеленая линия для символов
*   [0, 'LINE', 8, 'Grid', 62, 4] - бирюзовая линия для сетки
*/
function generateDXF(lib, outline, drillViews) {
	'use strict';
	var
		pth = Object.keys(lib.metallized).length,
		npth = Object.keys(lib.nonMetallized).length + Object.keys(lib.holes).length,
		colHeight = 15,
		colWidth = 25,
		rows = 6,
		columns = pth + npth,
		hw = 42, // Длина ячейки заголовков
		tw = colWidth * columns,
		th = colHeight * rows, // Общая высота таблицы
		dashSize = colWidth / 2,
		result = [0, 'SECTION',
		          2, 'HEADER',
		          9, '$ACADVER',
		          1, 'AC1009',
		          0, 'ENDSEC',
		          0, 'SECTION',
		          2, 'TABLES',
		          0, 'TABLE',
		          2, 'VPORT',
		          0, 'VPORT',
		          2, '*ACTIVE',
		          12, (tw / 2 - hw / 2), // Длина таблицы без столбца заголовков (т.к. он слева от нуля по X) - половина столбца заголовков = центр
		          22, (th / 2),
		          40, (th + 15),
		          41, ((tw + hw) / 100),
		          70, 0,
		          10, 0,
		          20, 0,
		          11, 1,
		          21, 1,
		          13, 0,
		          23, 0,
		          14, 1,
		          24, 1,
		          15, 0,
		          25, 0,
		          16, 0,
		          26, 0,
		          36, 1,
		          17, 0,
		          27, 0,
		          37, 0,
		          42, 1,
		          43, 0,
		          44, 0,
		          50, 0,
		          51, 0,
		          71, 0,
		          72, 100,
		          73, 2,
		          74, 1,
		          75, 0,
		          76, 0,
		          77, 0,
		          78, 0,
		          0, 'ENDTAB',
		          0, 'TABLE',
		          2, 'LAYER',
		          70, 3,
		          0, 'LAYER',
		          2, 'Drill_Table',
		          70, 64,
		          62, 1,
		          6, 'CONTINUOUS',
		          0, 'LAYER',
		          2, 'Drill_Symbols',
		          70, 64,
		          62, 3,
		          6, 'CONTINUOUS',
		          0, 'LAYER',
		          2, 'Board',
		          70, 64,
		          62, 1,
		          6, 'CONTINUOUS',
		          0, 'LAYER',
		          2, 'Grid',
		          70, 64,
		          62, 4,
		          6, 'CONTINUOUS',
		          0, 'ENDTAB',
		          0, 'TABLE',
		          2, 'STYLE',
		          0, 'STYLE',
		          2, 'win_eskd',
		          70, 64,
		          40, 0,
		          41, 1,
		          50, 15,
		          71, 0,
		          42, 0.2,
		          3, 'win_eskd.shx',
		          4, '',
		          0, 'ENDTAB',
		          0, 'ENDSEC',
		          0, 'SECTION',
		          2, 'ENTITIES'],
		headers = ['\\U+041E\\U+0431\\U+043E\\U+0437\\U+043D\\U+0430\\U+0447\\U+0435\\U+043D\\U+0438\\U+0435', // [0] Обозначение
							 '\\U+041A\\U+043E\\U+043B\\U+0438\\U+0447\\U+0435\\U+0441\\U+0442\\U+0432\\U+043E', // [1] Количество
							 '\\U+0414\\U+0438\\U+0430\\U+043C\\U+0435\\U+0442\\U+0440', // [2] Диаметр
							 '\\U+043E\\U+0442\\U+0432\\U+0435\\U+0440\\U+0441\\U+0442\\U+0438\\U+044F, \\U+043C\\U+043C', // [3] отверстия, мм
							 '\\U+0420\\U+0430\\U+0437\\U+043C\\U+0435\\U+0440\\U+044B', // [4] Размеры
							 '\\U+043A\\U+043E\\U+043D\\U+0442. \\U+043F\\U+043B\\U+043E\\U+0449., \\U+043C\\U+043C', // [5] конт. площ., мм
							 '\\U+043C\\U+043E\\U+043D\\U+0442. \\U+043E\\U+043A\\U+043D\\U+0430, \\U+043C\\U+043C', // [6] монт. окна, мм
							 '\\U+0423\\U+043A\\U+0430\\U+0437\\U+0430\\U+043D\\U+0438\\U+0435', // [7] Указание
							 '\\U+043E \\U+043C\\U+0435\\U+0442\\U+0430\\U+043B\\U+043B\\U+0438\\U+0437\\U+0430\\U+0446\\U+0438\\U+0438', // [8] о металлизации
							 '\\U+0415\\U+0441\\U+0442\\U+044C', // [9] Есть
							 '\\U+041D\\U+0435\\U+0442', // [10] Нет
							 '\\U+0422\\U+0410\\U+0411\\U+041B\\U+0418\\U+0426\\U+0410 2' // [11] ТАБЛИЦА 2
							 ],
		cellPadding = 3, // Расстояние от границы ячейки до символа
		y = (th - colHeight / 2), // Центр символа в ячейке
		views = 0, // Количество нарисованных видов, от него зависит смещение нового чертежа по X
		space = 50, // Расстояние между чертежами
		shiftX = (outline.length) ? outline[outline.length - 1].shiftX : 0, // Смещение левого нижнего края платы относительно нуля
		shiftY = (outline.length) ? outline[outline.length - 1].shiftY : 0,
		currCol = 0, d = {}, symbol, skippedCells, boardWidth = 0, boardHeight = 0, radius, rotation, i, j, w, h, x;
	
	function baseRnd() {
		result.push(0, 'CIRCLE', 8, 'Drill_Symbols', 62, 3, 10, x, 20, y, 40, radius);
		d.rnd.x0y05(0);
		d.rnd.x1y05(1);
		d.rnd.x05y0(0);
		d.rnd.x05y1(1);
	}
	function baseRect() {
		d.rect.x0y0(0);
		d.rect.x1y0(1);
		d.rect.x1y0(0);
		d.rect.x1y1(1);
		d.rect.x1y1(0);
		d.rect.x0y1(1);
		d.rect.x0y1(0);
		d.rect.x0y0(1);
	}
	function fillTheTable(object) {
		var startPoint, lineStart, key;
		
		for (key in object) { // Проставляет значения
			if (object.hasOwnProperty(key)) {
				if (object[key].mount) { result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, (colWidth * currCol), 20, (colHeight), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 1.5), 1, object[key].mount); }
				if (object[key].pad) {   result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, (colWidth * currCol), 20, (colHeight * 2), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 2.5), 1, object[key].pad); }
				if (object[key].hole) {  result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, (colWidth * currCol), 20, (colHeight * 3), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 3.5), 1, object[key].hole); }
				result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, (colWidth * currCol), 20, (colHeight * 4), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 4.5), 1, object[key].amount);
				
				if (object[key].ratio >= (colWidth - cellPadding * 2) / (colHeight - cellPadding * 2)) {
					w = colWidth - cellPadding * 2;
					h = w / object[key].ratio;
				} else {
					h = colHeight - cellPadding * 2;
					w = h * object[key].ratio;
				}
				x = currCol * colWidth + colWidth / 2;
				symbol[key]();
				
				currCol += 1;
			}
		}
		skippedCells.row1.forEach(function (position, i, arr) { // Проставляет прочерки где нет значений (размеры КП и окна)
			if (!startPoint && startPoint !== 0) { startPoint = position; }
			if (position + 1 !== arr[i + 1]) {
				lineStart = (position - startPoint + 1) * colWidth / 2 - dashSize / 2 + startPoint * colWidth;
				result.push(0, 'LINE', 8, 'Drill_Table', 62, 2, 10, lineStart, 20, (colHeight * 2), 11, (lineStart + dashSize), 21, (colHeight * 2));
				startPoint = false;
			}
		});
		startPoint = false;
		skippedCells.row3.forEach(function (position, i, arr) { // Проставляет прочерки где нет значений (диаметр отверстия)
			if (!startPoint && startPoint !== 0) { startPoint = position; }
			if (position + 1 !== arr[i + 1]) {
				lineStart = (position - startPoint + 1) * colWidth / 2 - colWidth / 4 + startPoint * colWidth;
				result.push(0, 'LINE', 8, 'Drill_Table', 62, 2, 10, lineStart, 20, (colHeight * 3.5), 11, (lineStart + dashSize), 21, (colHeight * 3.5));
				startPoint = false;
			}
		});
	}
	function determineEmptyCells(object) {
		var position = 0, result = { row1: [], row2: [], row3: [] };
		
		function checkLib(obj) {
			var key;
			
			for (key in obj) {
				if (obj.hasOwnProperty(key)) {
					if (!obj[key].hole) { result.row3.push(position); }
					if (!obj[key].pad) { result.row2.push(position); }
					if (!obj[key].mount) { result.row1.push(position); }
					position += 1;
				}
			}
		}
		
		checkLib(object.metallized);
		checkLib(object.nonMetallized);
		checkLib(object.holes);
		return result;
	}
	function drawBoardGrid(x, y, mirrored) {
		var dashes = 0, dashWidth, i;
		
		function drawHorizontalElems() {
			if (dashes % 4 === 0) {
				dashWidth = 2.5;
				result.push(0, 'TEXT', 8, 'Grid', 62, 4, 7, 'win_eskd', 40, 1.25, 51, 15, 72, 1, 73, 2, 10, i, 20, (y - dashWidth - 2), 11, i, 21, (y - dashWidth - 2), 1, dashes);
				result.push(0, 'TEXT', 8, 'Grid', 62, 4, 7, 'win_eskd', 40, 1.25, 51, 15, 72, 1, 73, 2, 10, i, 20, (y + boardHeight + dashWidth + 2), 11, i, 21, (y + boardHeight + dashWidth + 2), 1, dashes);
			} else { dashWidth = 1.25; }
			result.push(0, 'LINE', 8, 'Grid', 62, 4, 10, i, 20, y, 11, i, 21, y - dashWidth);
			result.push(0, 'LINE', 8, 'Grid', 62, 4, 10, i, 20, y + boardHeight, 11, i, 21, y + boardHeight + dashWidth);
			dashes += 1;
		}
		
		result.push(0, 'LINE', 8, 'Grid', 62, 4, 10, x, 20, y, 11, x + boardWidth, 21, y);
		result.push(0, 'LINE', 8, 'Grid', 62, 4, 10, x + boardWidth, 20, y, 11, x + boardWidth, 21, y + boardHeight);
		result.push(0, 'LINE', 8, 'Grid', 62, 4, 10, x + boardWidth, 20, y + boardHeight, 11, x, 21, y + boardHeight);
		result.push(0, 'LINE', 8, 'Grid', 62, 4, 10, x, 20, y + boardHeight, 11, x, 21, y);
		
		if (mirrored) {
			result.push(0, 'POLYLINE', 8, 'Grid', 66, 1, 10, 0, 20, 0, 40, 1, 41, 1, 0, 'VERTEX', 8, 'Grid', 10, (x + boardWidth + 0.25), 20, y, 42, 1, 0, 'VERTEX', 8, 'Grid', 10, (x + boardWidth - 0.25), 20, y, 42, 1, 0, 'VERTEX', 8, 'Grid', 10, (x + boardWidth + 0.25), 20, y, 42, 1, 0, 'SEQEND', 8, 'Grid');
			for (i = x + boardWidth; i >= x; i -= 1.25) {
				drawHorizontalElems();
			}
		} else {
			result.push(0, 'POLYLINE', 8, 'Grid', 66, 1, 10, 0, 20, 0, 40, 1, 41, 1, 0, 'VERTEX', 8, 'Grid', 10, (x + 0.25), 20, y, 42, 1, 0, 'VERTEX', 8, 'Grid', 10, (x - 0.25), 20, y, 42, 1, 0, 'VERTEX', 8, 'Grid', 10, (x + 0.25), 20, y, 42, 1, 0, 'SEQEND', 8, 'Grid');
			for (i = x; i <= x + boardWidth; i += 1.25) {
				drawHorizontalElems();
			}
		}
		dashes = 0;
		for (i = y; i <= y + boardHeight; i += 1.25) {
			if (dashes % 4 === 0) {
				dashWidth = 2.5;
				result.push(0, 'TEXT', 8, 'Grid', 62, 4, 7, 'win_eskd', 40, 1.25, 51, 15, 72, 1, 73, 2, 10, (x - dashWidth - 2), 20, i, 11, (x - dashWidth - 2), 21, i, 1, dashes);
				result.push(0, 'TEXT', 8, 'Grid', 62, 4, 7, 'win_eskd', 40, 1.25, 51, 15, 72, 1, 73, 2, 10, (x + boardWidth + dashWidth + 2), 20, i, 11, (x + boardWidth + dashWidth + 2), 21, i, 1, dashes);
			} else { dashWidth = 1.25; }
			result.push(0, 'LINE', 8, 'Grid', 62, 4, 10, x, 20, i, 11, x - dashWidth, 21, i);
			result.push(0, 'LINE', 8, 'Grid', 62, 4, 10, x + boardWidth, 20, i, 11, x + boardWidth + dashWidth, 21, i);
			dashes += 1;
		}
	}
	function drawBoardOutline(mirrored, grid) {
		var shift; // Смещение по X в зависимости от количества уже созданных видов
		
		shift = (views) ? views * boardWidth - hw + space : -hw;
		outline.forEach(function (coords) {
			var start, end, radius, box, x1, x2, x3;
			// Набор координат в массиве выглядит так: 
			// [0, 1, 2, 3] для линий. Первая пара - x и y начала, вторая - конца.
			// [0, 1, 2, 3, 4, 5] для арок. Первая и вторая пара как у линий, последняя - центр.
			
			if (coords.length === 4) {
				x1 = (mirrored) ? shift + boardWidth - coords[0] : coords[0] + shift;
				x2 = (mirrored) ? shift + boardWidth - coords[2] : coords[2] + shift;
				result.push(0, 'LINE', 8, 'Board', 62, 1, 10, x1, 20, (coords[1] + th + space), 11, x2, 21, (coords[3] + th + space));
			} else if (coords.length === 6) {
				radius = Math.abs(coords[4] - coords[0]) || Math.abs(coords[4] - coords[2]);
				start  = Math.round(Math.acos((coords[0] - coords[4]) / radius) * 180 / Math.PI * 10000) / 10000;
				end    = Math.round(Math.acos((coords[2] - coords[4]) / radius) * 180 / Math.PI * 10000) / 10000;
				if (mirrored) {
					box = start;
					start = 180 - end;
					end = 180 - box;
					x3 = shift + boardWidth - coords[4];
				} else { x3 = coords[4] + shift; }
				result.push(0, 'ARC', 8, 'Board', 62, 1, 10, x3, 20, (coords[5] + th + space), 40, radius, space, start, 51, end);
			}
		});
		views += 1;
		drawBoardGrid(shift, th + space, mirrored);
	}
	function drawSymbolsOnBoard(object) {
		var key, i, side;
		
		for (key in object) {
			if (object.hasOwnProperty(key)) {
				for (i = 0; i < object[key].coords.length; i += 1) {
					y = object[key].coords[i].y - shiftY + th + space;
					rotation = (object[key].coords[i].rotation / 90 % 2 > 0) ? true : false;
					side = object[key].coords[i].side;
					
					if (object[key].width > object[key].height && rotation) { // Изначально горизонатльная КП, но повернута на 90/270
						w = object[key].height;
						h = object[key].width;
					} else if (object[key].width < object[key].height) { // Изначально вертикальная
						if (rotation) { // Если повернута на 90/270 - меняем длину с высотой, но флаг поворота уже не нужен
							w = object[key].height;
							h = object[key].width;
							rotation = false;
						} else { // Если не повернута или повернута на 180 - сохраняем значения длины и высоты и добавляем поворот
							w = object[key].width;
							h = object[key].height;
							rotation = true;
						}
					} else { // Длина больше ширины и нет поворота либо длина равна ширине - сохраняем значения как есть
						w = object[key].width;
						h = object[key].height;
						radius = w / 2;
					}
					
					if (side === 'top') {
						x = object[key].coords[i].x - shiftX - hw;
					} else if (side === 'bot') {
						x = boardWidth * 2 - hw + space - object[key].coords[i].x + shiftX;
					} else if (side === 'thru') {
						x = object[key].coords[i].x - shiftX - hw;
						if (drillViews === 2) {
							symbol[key]();
							x = boardWidth * 2 - hw + space - object[key].coords[i].x + shiftX;
						}
					}
					symbol[key]();
				}
			}
		}
	}
	
	d.rnd = { // Аргумент p - точка, для которой нужны координаты. 0 - первая, 1 - вторая. Для первой добавляется заголовок блока
		x05y05:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x, 20 + p, y); },
		x05y0:    function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x, 20 + p, y + radius); },
		x05y1:    function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x, 20 + p, y - radius); },
		x0y05:    function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x - radius, 20 + p, y); },
		x1y05:    function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x + radius, 20 + p, y); },
		x05y025:  function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x, 20 + p, y + radius / 2); },
		x05y075:  function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x, 20 + p, y - radius / 2); },
		x025y05:  function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x - radius / 2, 20 + p, y); },
		x075y05:  function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x + radius / 2, 20 + p, y); },
		x025y025: function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x - radius / 2, 20 + p, y + radius / 2); },
		x075y025: function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x + radius / 2, 20 + p, y + radius / 2); },
		x025y075: function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x - radius / 2, 20 + p, y - radius / 2); },
		x075y075: function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x + radius / 2, 20 + p, y - radius / 2); },
		deg45:    function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x + Math.cos(Math.PI * 0.25) * radius, 20 + p, y + Math.sin(Math.PI * 0.25) * radius); },
		deg135:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x + Math.cos(Math.PI * 0.75) * radius, 20 + p, y + Math.sin(Math.PI * 0.75) * radius); },
		deg225:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x + Math.cos(Math.PI * 1.25) * radius, 20 + p, y + Math.sin(Math.PI * 1.25) * radius); },
		deg315:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x + Math.cos(Math.PI * 1.75) * radius, 20 + p, y + Math.sin(Math.PI * 1.75) * radius); }
	};
	d.rect = {
		x05y05:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } result.push(10 + p, x, 20 + p, y); },
		x05y0:    function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x,         20 + p, y + h / 2); } else { result.push(10 + p, x - w / 2, 20 + p, y); } },
		x05y1:    function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x,         20 + p, y - h / 2); } else { result.push(10 + p, x + w / 2, 20 + p, y); } },
		x1y05:    function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x + w / 2, 20 + p, y);         } else { result.push(10 + p, x,         20 + p, y + h / 2); } },
		x0y05:    function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x - w / 2, 20 + p, y);         } else { result.push(10 + p, x,         20 + p, y - h / 2); } },
		x025y05:  function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x - w / 4, 20 + p, y);         } else { result.push(10 + p, x,         20 + p, y - h / 4); } },
		x075y05:  function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x + w / 4, 20 + p, y);         } else { result.push(10 + p, x,         20 + p, y + h / 4); } },
		x0y0:     function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x - w / 2, 20 + p, y + h / 2); } else { result.push(10 + p, x - w / 2, 20 + p, y - h / 2); } },
		x1y0:     function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x + w / 2, 20 + p, y + h / 2); } else { result.push(10 + p, x - w / 2, 20 + p, y + h / 2); } },
		x1y1:     function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x + w / 2, 20 + p, y - h / 2); } else { result.push(10 + p, x + w / 2, 20 + p, y + h / 2); } },
		x0y1:     function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x - w / 2, 20 + p, y - h / 2); } else { result.push(10 + p, x + w / 2, 20 + p, y - h / 2); } },
		x025y0:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x - w / 4, 20 + p, y + h / 2); } else { result.push(10 + p, x - w / 2, 20 + p, y - h / 4); } },
		x075y0:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x + w / 4, 20 + p, y + h / 2); } else { result.push(10 + p, x - w / 2, 20 + p, y + h / 4); } },
		x1y025:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x + w / 2, 20 + p, y + h / 4); } else { result.push(10 + p, x - w / 4, 20 + p, y + h / 2); } },
		x1y075:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x + w / 2, 20 + p, y - h / 4); } else { result.push(10 + p, x + w / 4, 20 + p, y + h / 2); } },
		x075y1:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x + w / 4, 20 + p, y - h / 2); } else { result.push(10 + p, x + w / 2, 20 + p, y + h / 4); } },
		x025y1:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x - w / 4, 20 + p, y - h / 2); } else { result.push(10 + p, x + w / 2, 20 + p, y - h / 4); } },
		x0y075:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x - w / 2, 20 + p, y - h / 4); } else { result.push(10 + p, x + w / 4, 20 + p, y - h / 2); } },
		x0y025:   function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x - w / 2, 20 + p, y + h / 4); } else { result.push(10 + p, x - w / 4, 20 + p, y - h / 2); } },
		x025y025: function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x - w / 4, 20 + p, y + h / 4); } else { result.push(10 + p, x - w / 4, 20 + p, y - h / 4); } },
		x075y025: function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x + w / 4, 20 + p, y + h / 4); } else { result.push(10 + p, x - w / 4, 20 + p, y + h / 4); } },
		x075y075: function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x + w / 4, 20 + p, y - h / 4); } else { result.push(10 + p, x + w / 4, 20 + p, y + h / 4); } },
		x025y075: function (p) { if (!p) { result.push(0, 'LINE', 8, 'Drill_Symbols', 62, 3); } if (!rotation) { result.push(10 + p, x - w / 4, 20 + p, y - h / 4); } else { result.push(10 + p, x + w / 4, 20 + p, y - h / 4); } }
	};
	
	symbol = {
		rnd1: function () {
			baseRnd();
		},
		rnd2: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
		  d.rnd.deg225(0);
			d.rnd.deg315(1);
		},
		rnd3: function () {
		  baseRnd();
		  d.rnd.x0y05(0);
			d.rnd.x05y025(1);
		  d.rnd.x05y025(0);
			d.rnd.x1y05(1);
		},
		rnd4: function () {
		  baseRnd();
		  d.rnd.x025y05(0);
			d.rnd.x05y1(1);
		  d.rnd.x05y1(0);
			d.rnd.x075y05(1);
		},
		rnd5: function () {
		  baseRnd();
		  d.rnd.x025y05(0);
			d.rnd.deg135(1);
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
			d.rnd.deg45(0);
			d.rnd.x075y05(1);
		},
		rnd6: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
		  d.rnd.deg45(0);
			d.rnd.x05y1(1);
			d.rnd.x05y1(0);
			d.rnd.deg135(1);
		},
		rnd7: function () {
		  baseRnd();
		  d.rnd.x0y05(0);
			d.rnd.x05y0(1);
		  d.rnd.x05y1(0);
			d.rnd.x1y05(1);
			d.rnd.x025y025(0);
			d.rnd.x075y075(1);
		},
		rnd8: function () {
		  baseRnd();
		  d.rnd.x025y025(0);
			d.rnd.x075y025(1);
		  d.rnd.x075y025(0);
			d.rnd.x075y075(1);
			d.rnd.x075y075(0);
			d.rnd.x025y075(1);
			d.rnd.x025y075(0);
			d.rnd.x025y025(1);
		},
		rnd9: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
		  d.rnd.deg45(0);
			d.rnd.deg315(1);
			d.rnd.deg315(0);
			d.rnd.deg225(1);
			d.rnd.deg225(0);
			d.rnd.deg135(1);
		},
		rnd10: function () {
		  baseRnd();
		  d.rnd.x05y025(0);
			d.rnd.x075y05(1);
		  d.rnd.x075y05(0);
			d.rnd.x05y075(1);
			d.rnd.x05y075(0);
			d.rnd.x025y05(1);
			d.rnd.x025y05(0);
			d.rnd.x05y025(1);
		},
		rnd11: function () {
		  baseRnd();
		  d.rnd.x05y0(0);
			d.rnd.x1y05(1);
		  d.rnd.x1y05(0);
			d.rnd.x05y1(1);
			d.rnd.x05y1(0);
			d.rnd.x0y05(1);
			d.rnd.x0y05(0);
			d.rnd.x05y0(1);
		},
		rnd12: function () {
		  baseRnd();
		  d.rnd.x0y05(0);
			d.rnd.x05y025(1);
		  d.rnd.x05y025(0);
			d.rnd.x1y05(1);
			d.rnd.x1y05(0);
			d.rnd.x05y075(1);
			d.rnd.x05y075(0);
			d.rnd.x0y05(1);
		},
		rnd13: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.x05y05(1);
		  d.rnd.x05y05(0);
			d.rnd.deg45(1);
			d.rnd.deg45(0);
			d.rnd.x05y1(1);
			d.rnd.x05y1(0);
			d.rnd.deg135(1);
		},
		rnd14: function () {
		  baseRnd();
		  d.rnd.x0y05(0);
			d.rnd.x05y025(1);
		  d.rnd.x05y025(0);
			d.rnd.x1y05(1);
			d.rnd.x025y05(0);
			d.rnd.x05y1(1);
			d.rnd.x05y1(0);
			d.rnd.x075y05(1);
		},
		rnd15: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
		  d.rnd.deg225(0);
			d.rnd.deg315(1);
			d.rnd.x0y05(0);
			d.rnd.x05y025(1);
			d.rnd.x05y025(0);
			d.rnd.x1y05(1);
		},
		rnd16: function () {
		  baseRnd();
		  d.rnd.x025y05(0);
			d.rnd.x025y025(1);
		  d.rnd.x025y025(0);
			d.rnd.x05y025(1);
			d.rnd.x05y075(0);
			d.rnd.x075y075(1);
			d.rnd.x075y075(0);
			d.rnd.x075y05(1);
			d.rnd.x025y025(0);
			d.rnd.x075y075(1);
		},
		rnd17: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
		  d.rnd.deg45(0);
			d.rnd.x075y05(1);
			d.rnd.x075y05(0);
			d.rnd.x05y075(1);
			d.rnd.x05y075(0);
			d.rnd.x025y05(1);
			d.rnd.x025y05(0);
			d.rnd.deg135(1);
		},
		rnd18: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.x05y05(1);
		  d.rnd.x05y05(0);
			d.rnd.deg45(1);
			d.rnd.deg45(0);
			d.rnd.x075y05(1);
			d.rnd.x075y05(0);
			d.rnd.x05y075(1);
			d.rnd.x05y075(0);
			d.rnd.x025y05(1);
			d.rnd.x025y05(0);
			d.rnd.deg135(1);
		},
		rnd19: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
		  d.rnd.deg45(0);
			d.rnd.x075y05(1);
			d.rnd.x075y05(0);
			d.rnd.deg315(1);
			d.rnd.deg315(0);
			d.rnd.deg225(1);
			d.rnd.deg225(0);
			d.rnd.x025y05(1);
			d.rnd.x025y05(0);
			d.rnd.deg135(1);
		},
		rnd20: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
		  d.rnd.deg45(0);
			d.rnd.deg225(1);
			d.rnd.deg225(0);
			d.rnd.deg315(1);
			d.rnd.deg315(0);
			d.rnd.deg135(1);
		},
		rnd21: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
		  d.rnd.deg225(0);
			d.rnd.deg315(1);
			d.rnd.x025y05(0);
			d.rnd.x025y025(1);
			d.rnd.x025y025(0);
			d.rnd.x05y025(1);
			d.rnd.x05y075(0);
			d.rnd.x075y075(1);
			d.rnd.x075y075(0);
			d.rnd.x075y05(1);
			d.rnd.x025y025(0);
			d.rnd.x075y075(1);
		},
		rnd22: function () {
		  baseRnd();
		  d.rnd.x0y05(0);
			d.rnd.x05y025(1);
		  d.rnd.x05y025(0);
			d.rnd.x1y05(1);
			d.rnd.x1y05(0);
			d.rnd.x05y075(1);
			d.rnd.x05y075(0);
			d.rnd.x0y05(1);
			d.rnd.x025y05(0);
			d.rnd.x05y025(1);
			d.rnd.x05y025(0);
			d.rnd.x075y05(1);
			d.rnd.x075y05(0);
			d.rnd.x05y075(1);
			d.rnd.x05y075(0);
			d.rnd.x025y05(1);
		},
		rnd23: function () {
		  baseRnd();
		  d.rnd.x0y05(0);
			d.rnd.x05y0(1);
		  d.rnd.x05y0(0);
			d.rnd.x1y05(1);
			d.rnd.x1y05(0);
			d.rnd.x05y1(1);
			d.rnd.x05y1(0);
			d.rnd.x0y05(1);
			d.rnd.x0y05(0);
			d.rnd.x05y025(1);
			d.rnd.x05y025(0);
			d.rnd.x1y05(1);
			d.rnd.x1y05(0);
			d.rnd.x05y075(1);
			d.rnd.x05y075(0);
			d.rnd.x0y05(1);
		},
		rnd24: function () {
		  baseRnd();
		  d.rnd.x0y05(0);
			d.rnd.x05y0(1);
		  d.rnd.x05y0(0);
			d.rnd.x1y05(1);
			d.rnd.x1y05(0);
			d.rnd.x05y1(1);
			d.rnd.x05y1(0);
			d.rnd.x0y05(1);
			d.rnd.x025y025(0);
			d.rnd.x075y025(1);
			d.rnd.x075y025(0);
			d.rnd.x075y075(1);
			d.rnd.x075y075(0);
			d.rnd.x025y075(1);
			d.rnd.x025y075(0);
			d.rnd.x025y025(1);
		},
		rnd25: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
		  d.rnd.deg45(0);
			d.rnd.deg315(1);
			d.rnd.deg315(0);
			d.rnd.deg225(1);
			d.rnd.deg225(0);
			d.rnd.deg135(1);
			d.rnd.x025y025(0);
			d.rnd.x075y025(1);
			d.rnd.x075y025(0);
			d.rnd.x075y075(1);
			d.rnd.x075y075(0);
			d.rnd.x025y075(1);
			d.rnd.x025y075(0);
			d.rnd.x025y025(1);
		},
		rnd26: function () {
		  baseRnd();
		  d.rnd.x025y025(0);
			d.rnd.x075y025(1);
		  d.rnd.x075y025(0);
			d.rnd.x075y075(1);
			d.rnd.x075y075(0);
			d.rnd.x025y075(1);
			d.rnd.x025y075(0);
			d.rnd.x025y025(1);
			d.rnd.x025y05(0);
			d.rnd.x05y025(1);
			d.rnd.x05y025(0);
			d.rnd.x075y05(1);
			d.rnd.x075y05(0);
			d.rnd.x05y075(1);
			d.rnd.x05y075(0);
			d.rnd.x025y05(1);
		},
		rnd27: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
		  d.rnd.deg45(0);
			d.rnd.deg315(1);
			d.rnd.deg315(0);
			d.rnd.deg225(1);
			d.rnd.deg225(0);
			d.rnd.deg135(1);
			d.rnd.x025y05(0);
			d.rnd.x05y025(1);
			d.rnd.x05y025(0);
			d.rnd.x075y05(1);
			d.rnd.x075y05(0);
			d.rnd.x05y075(1);
			d.rnd.x05y075(0);
			d.rnd.x025y05(1);
		},
		rnd28: function () {
		  baseRnd();
		  d.rnd.x0y05(0);
			d.rnd.x05y0(1);
		  d.rnd.x05y0(0);
			d.rnd.x1y05(1);
			d.rnd.x1y05(0);
			d.rnd.x05y1(1);
			d.rnd.x05y1(0);
			d.rnd.x0y05(1);
			d.rnd.x025y05(0);
			d.rnd.x05y025(1);
			d.rnd.x05y025(0);
			d.rnd.x075y05(1);
			d.rnd.x075y05(0);
			d.rnd.x05y075(1);
			d.rnd.x05y075(0);
			d.rnd.x025y05(1);
		},
		rnd29: function () {
		  baseRnd();
		  d.rnd.x0y05(0);
			d.rnd.x05y0(1);
		  d.rnd.x05y0(0);
			d.rnd.x1y05(1);
			d.rnd.x1y05(0);
			d.rnd.x05y1(1);
			d.rnd.x05y1(0);
			d.rnd.x0y05(1);
			d.rnd.x025y05(0);
			d.rnd.x025y025(1);
			d.rnd.x025y025(0);
			d.rnd.x05y025(1);
			d.rnd.x05y075(0);
			d.rnd.x075y075(1);
			d.rnd.x075y075(0);
			d.rnd.x075y05(1);
			d.rnd.x025y025(0);
			d.rnd.x075y075(1);
		},
		rnd30: function () {
		  baseRnd();
		  d.rnd.deg135(0);
			d.rnd.deg45(1);
		  d.rnd.deg45(0);
			d.rnd.x075y05(1);
			d.rnd.x075y05(0);
			d.rnd.deg315(1);
			d.rnd.deg315(0);
			d.rnd.deg225(1);
			d.rnd.deg225(0);
			d.rnd.x025y05(1);
			d.rnd.x025y05(0);
			d.rnd.deg135(1);
			d.rnd.x025y05(0);
			d.rnd.x05y025(1);
			d.rnd.x05y025(0);
			d.rnd.x075y05(1);
			d.rnd.x075y05(0);
			d.rnd.x05y075(1);
			d.rnd.x05y075(0);
			d.rnd.x025y05(1);
		},
		rect1: function () {
			baseRect();
		},
		rect2: function () {
			baseRect();
			d.rect.x0y0(0);
			d.rect.x1y1(1);
		},
		rect3: function () {
			baseRect();
			d.rect.x05y0(0);
			d.rect.x05y1(1);
		},
		rect4: function () {
			baseRect();
			d.rect.x0y0(0);
			d.rect.x1y1(1);
			d.rect.x0y1(0);
			d.rect.x1y0(1);
		},
		rect5: function () {
			baseRect();
			d.rect.x05y0(0);
			d.rect.x05y1(1);
			d.rect.x0y05(0);
			d.rect.x1y05(1);
		},
		rect6: function () {
			baseRect();
			d.rect.x0y05(0);
			d.rect.x05y1(1);
			d.rect.x05y1(0);
			d.rect.x1y05(1);
		},
		rect7: function () {
			baseRect();
			d.rect.x025y0(0);
			d.rect.x05y05(1);
			d.rect.x05y05(0);
			d.rect.x075y0(1);
		},
		rect8: function () {
			baseRect();
			d.rect.x0y0(0);
			d.rect.x05y1(1);
			d.rect.x05y1(0);
			d.rect.x1y0(1);
		},
		rect9: function () {
			baseRect();
			d.rect.x025y0(0);
			d.rect.x025y1(1);
			d.rect.x075y0(0);
			d.rect.x075y1(1);
		},
		rect10: function () {
			baseRect();
			d.rect.x0y0(0);
			d.rect.x1y025(1);
			d.rect.x0y075(0);
			d.rect.x1y1(1);
		},
		rect11: function () {
			baseRect();
			d.rect.x025y0(0);
			d.rect.x025y1(1);
			d.rect.x05y0(0);
			d.rect.x05y1(1);
			d.rect.x075y0(0);
			d.rect.x075y1(1);
		},
		rect12: function () {
			baseRect();
			d.rect.x025y0(0);
			d.rect.x025y1(1);
			d.rect.x075y0(0);
			d.rect.x075y1(1);
			d.rect.x0y05(0);
			d.rect.x1y05(1);
		},
		rect13: function () {
			baseRect();
			d.rect.x0y05(0);
			d.rect.x05y1(1);
			d.rect.x0y0(0);
			d.rect.x1y1(1);
			d.rect.x05y0(0);
			d.rect.x1y05(1);
		},
		rect14: function () {
			baseRect();
			d.rect.x1y025(0);
			d.rect.x0y0(1);
			d.rect.x0y0(0);
			d.rect.x1y1(1);
			d.rect.x1y1(0);
			d.rect.x0y075(1);
		},
		rect15: function () {
			baseRect();
			d.rect.x0y0(0);
			d.rect.x05y05(1);
			d.rect.x05y05(0);
			d.rect.x1y0(1);
			d.rect.x0y05(0);
			d.rect.x1y05(1);
		},
		rect16: function () {
			baseRect();
			d.rect.x0y025(0);
			d.rect.x025y05(1);
			d.rect.x025y05(0);
			d.rect.x025y1(1);
			d.rect.x1y025(0);
			d.rect.x075y05(1);
			d.rect.x075y05(0);
			d.rect.x075y1(1);
		},
		rect17: function () {
			baseRect();
			d.rect.x0y0(0);
			d.rect.x1y025(1);
			d.rect.x0y025(0);
			d.rect.x1y05(1);
			d.rect.x0y05(0);
			d.rect.x1y075(1);
			d.rect.x0y075(0);
			d.rect.x1y1(1);
		},
		rect18: function () {
			baseRect();
			d.rect.x0y025(0);
			d.rect.x025y0(1);
			d.rect.x075y0(0);
			d.rect.x1y025(1);
			d.rect.x1y075(0);
			d.rect.x075y1(1);
			d.rect.x025y1(0);
			d.rect.x0y075(1);
		},
		rect19: function () {
			baseRect();
			d.rect.x0y05(0);
			d.rect.x05y0(1);
			d.rect.x05y0(0);
			d.rect.x1y05(1);
			d.rect.x1y05(0);
			d.rect.x05y1(1);
			d.rect.x05y1(0);
			d.rect.x0y05(1);
		},
		rect20: function () {
			baseRect();
			d.rect.x075y0(0);
			d.rect.x1y05(1);
			d.rect.x1y05(0);
			d.rect.x075y1(1);
			d.rect.x025y1(0);
			d.rect.x0y05(1);
			d.rect.x0y05(0);
			d.rect.x025y0(1);
		},
		rect21: function () {
			baseRect();
			d.rect.x0y0(0);
			d.rect.x025y05(1);
			d.rect.x025y05(0);
			d.rect.x0y1(1);
			d.rect.x1y0(0);
			d.rect.x075y05(1);
			d.rect.x075y05(0);
			d.rect.x1y1(1);
		},
		rect22: function () {
			baseRect();
			d.rect.x0y0(0);
			d.rect.x05y1(1);
			d.rect.x05y1(0);
			d.rect.x1y0(1);
			d.rect.x025y0(0);
			d.rect.x05y05(1);
			d.rect.x05y05(0);
			d.rect.x075y0(1);
		},
		rect23: function () {
			baseRect();
			d.rect.x05y0(0);
			d.rect.x1y05(1);
			d.rect.x1y05(0);
			d.rect.x05y1(1);
			d.rect.x05y1(0);
			d.rect.x0y05(1);
			d.rect.x0y05(0);
			d.rect.x05y0(1);
			d.rect.x05y0(0);
			d.rect.x05y1(1);
		},
		rect24: function () {
			baseRect();
			d.rect.x05y0(0);
			d.rect.x1y05(1);
			d.rect.x1y05(0);
			d.rect.x05y1(1);
			d.rect.x05y1(0);
			d.rect.x0y05(1);
			d.rect.x0y05(0);
			d.rect.x05y0(1);
			d.rect.x05y0(0);
			d.rect.x05y1(1);
			d.rect.x0y05(0);
			d.rect.x1y05(1);
		},
		rect25: function () {
			baseRect();
			d.rect.x0y0(0);
			d.rect.x025y05(1);
			d.rect.x025y05(0);
			d.rect.x0y1(1);
			d.rect.x025y0(0);
			d.rect.x025y1(1);
			d.rect.x075y0(0);
			d.rect.x075y1(1);
			d.rect.x1y0(0);
			d.rect.x075y05(1);
			d.rect.x075y05(0);
			d.rect.x1y1(1);
		},
		rect26: function () {
			baseRect();
			d.rect.x0y0(0);
			d.rect.x025y05(1);
			d.rect.x025y05(0);
			d.rect.x0y1(1);
			d.rect.x025y0(0);
			d.rect.x05y05(1);
			d.rect.x05y05(0);
			d.rect.x075y0(1);
			d.rect.x1y0(0);
			d.rect.x075y05(1);
			d.rect.x075y05(0);
			d.rect.x1y1(1);
		},
		rect27: function () {
			baseRect();
			d.rect.x0y025(0);
			d.rect.x025y0(1);
			d.rect.x025y0(0);
			d.rect.x05y05(1);
			d.rect.x05y05(0);
			d.rect.x075y0(1);
			d.rect.x075y0(0);
			d.rect.x1y025(1);
			d.rect.x0y075(0);
			d.rect.x025y1(1);
			d.rect.x075y1(0);
			d.rect.x1y075(1);
		},
		rect28: function () {
			baseRect();
			d.rect.x0y025(0);
			d.rect.x025y0(1);
			d.rect.x025y0(0);
			d.rect.x025y1(1);
			d.rect.x025y1(0);
			d.rect.x0y075(1);
			d.rect.x1y025(0);
			d.rect.x075y0(1);
			d.rect.x075y0(0);
			d.rect.x075y1(1);
			d.rect.x075y1(0);
			d.rect.x1y075(1);
		},
		rect29: function () {
			baseRect();
			d.rect.x025y0(0);
			d.rect.x0y025(1);
			d.rect.x0y025(0);
			d.rect.x1y075(1);
			d.rect.x1y075(0);
			d.rect.x075y1(1);
			d.rect.x075y0(0);
			d.rect.x1y025(1);
			d.rect.x1y025(0);
			d.rect.x0y075(1);
			d.rect.x0y075(0);
			d.rect.x025y1(1);
		},
		rect30: function () {
			baseRect();
			d.rect.x025y0(0);
			d.rect.x025y025(1);
			d.rect.x025y025(0);
			d.rect.x0y025(1);
			d.rect.x075y0(0);
			d.rect.x075y025(1);
			d.rect.x075y025(0);
			d.rect.x1y025(1);
			d.rect.x1y075(0);
			d.rect.x075y075(1);
			d.rect.x075y075(0);
			d.rect.x075y1(1);
			d.rect.x0y075(0);
			d.rect.x025y075(1);
			d.rect.x025y075(0);
			d.rect.x025y1(1);
		}
	};
	
	/* Построение таблицы */
	// Ячейки заголовков
	result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10,   0, 20,  0, 11, -hw,  21, 0);
	result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10, -hw, 20,  0, 11, -hw,  21, th);
	result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10, -hw, 20, th, 11,   0,  21, th);
	result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10,   0, 20, th, 11,   0,  21, 0);
	result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10, -hw, 20, 15, 11,   0,  21, 15);
	result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10, -hw, 20, 30, 11,   0,  21, 30);
	result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10, -hw, 20, 45, 11,   0,  21, 45);
	result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10, -hw, 20, 60, 11,   0,  21, 60);
	result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10, -hw, 20, 75, 11,   0,  21, 75);
	
	// Ячейки данных
	skippedCells = determineEmptyCells(lib); // Ячейки без значений
	for (i = 0; i < columns; i += 1) {
		for (j = 0; j <= rows; j += 1) { // Горизонатльные
			if (!(j === 2 && skippedCells.row1.indexOf(i) + 1 && skippedCells.row2.indexOf(i) + 1)) { // Не рисовать линию если эта ячейка и та, что под ней, пусты
				result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10, (colWidth * i), 20, (colHeight * j), 11, (colWidth * i) + colWidth, 21, (colHeight * j));
			}
		}
		for (j = 1; j < rows; j += 1) { // Вертикальные
			if (!(j > 0 && j < 4 && skippedCells['row' + j].indexOf(i) + 1 && skippedCells['row' + j].indexOf(i + 1) + 1)) {
				result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10, (colWidth * i + colWidth), 20, (colHeight * j), 11, (colWidth * i + colWidth), 21, (colHeight * j) + colHeight);
			}
		}
	}
	result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10, (colWidth * pth), 20, 0, 11, (colWidth * pth), 21, colHeight);
	result.push(0, 'LINE', 8, 'Drill_Table', 62, 1, 10, tw, 20, 0, 11, tw, 21, colHeight);
	/* -=-=-=- */
	
	/* Заполнение таблицы */
	// Название таблицы
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 5, 51, 15, 72, 2, 73, 1, 10, (tw - colWidth * 2), 20, (th + colHeight), 11, tw, 21, (th + 5), 1, headers[11]);
	
	// Тексты заголовков
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, -hw, 20, th,                   11, -hw / 2, 21, th - colHeight * 0.5, 1, headers[0]);
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, -hw, 20, th - colHeight,       11, -hw / 2, 21, th - colHeight * 1.5, 1, headers[1]);
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, -hw, 20, th - colHeight * 2,   11, -hw / 2, 21, th - colHeight * 2.33, 1, headers[2]);
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, -hw, 20, th - colHeight * 2.5, 11, -hw / 2, 21, th - colHeight * 2.66, 1, headers[3]);
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, -hw, 20, th - colHeight * 3,   11, -hw / 2, 21, th - colHeight * 3.33, 1, headers[4]);
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, -hw, 20, th - colHeight * 3.5, 11, -hw / 2, 21, th - colHeight * 3.66, 1, headers[5]);
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, -hw, 20, th - colHeight * 4,   11, -hw / 2, 21, th - colHeight * 4.33, 1, headers[4]);
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, -hw, 20, th - colHeight * 4.5, 11, -hw / 2, 21, th - colHeight * 4.66, 1, headers[6]);
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, -hw, 20, th - colHeight * 5,   11, -hw / 2, 21, th - colHeight * 5.33, 1, headers[7]);
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, -hw, 20, th - colHeight * 5.5, 11, -hw / 2, 21, th - colHeight * 5.66, 1, headers[8]);
	
	// Значения ячеек
	if (pth) {  result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, 0, 20, 0, 11, (pth * colWidth / 2), 21, (colHeight / 2), 1, headers[9]); } // Металлизация - "Есть"
	if (npth) { result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2, 10, 0, 20, 0, 11, (pth * colWidth + npth * colWidth / 2), 21, (colHeight / 2), 1, headers[10]); } // Металлизация - "Нет"
	
	radius = (colHeight / 2 - cellPadding);
	
	fillTheTable(lib.metallized);
	fillTheTable(lib.nonMetallized);
	fillTheTable(lib.holes);
	/* -=-=-=- */
	
	/* Построение сборочного чертежа */
	if (outline.length) {
		// Контуры платы
		outline.forEach(function (coords, index) {
			var i;
			
			for (i = 0; i < coords.length; i += 1) {
				if (i % 2 && coords[i] > boardHeight) {
					boardHeight = coords[i];
				} else if (i % 2 === 0 && coords[i] > boardWidth) {
					boardWidth = coords[i];
				}
			}
		});
		drawBoardOutline(false, true);
		if (drillViews === 2) { drawBoardOutline(true, true); }
		
		// Символы на плате
		drawSymbolsOnBoard(lib.holes);
		drawSymbolsOnBoard(lib.metallized);
		drawSymbolsOnBoard(lib.nonMetallized);
	} else { document.getElementById('tabDXF').innerHTML = 'Таблица'; }
	/* -=-=-=- */
	
	result.push(0, 'ENDSEC', 0, 'EOF');
	return result;
}
