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
*/
function generateDXF(lib) {
	'use strict';
	var
		pth = Object.keys(lib.metallized).length,
		npth = Object.keys(lib.nonMetallized).length + Object.keys(lib.holes).length,
		colHeight = 15,
		colWidth = 25,
		rows = 6,
		columns = pth + npth,
		tw = colWidth * columns,
		th = colHeight * rows, // Общая высота таблицы
		dashSize = colWidth / 2,
		result = [0, 'SECTION',
						2, 'TABLES',
						0, 'TABLE',
						2, 'VPORT',
						0, 'VPORT',
						2, '*ACTIVE',
						12, (tw / 2 - 21), // Длина таблицы без столбца заголовков (т.к. он слева от нуля по X) - половина столбца заголовков = центр
						22, (th / 2),
						40, (th + 15),
						41, ((tw + 42) / 100),
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
		text = [0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 3.5, 51, 15, 72, 1, 73, 2],
		redLn = [0, 'LINE', 8, 'Drill_Table', 62, 1],
		greenLn = [0, 'LINE', 8, 'Drill_Table', 62, 3],
		cellPadding = 3, // Расстояние от границы ячейки до символа
		radius = (colHeight / 2 - cellPadding), // Радиус символа
		y = (th - colHeight / 2), // Центр символа в ячейке
		currCol = 0, d = {}, symbol, skippedCells, i, j, w, h, x;
	
	function baseRnd() {
		result = result.concat(0, 'CIRCLE', 8, 'Drill_Table', 62, 3, 10, x, 20, y, 40, radius);
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
				if (object[key].mount) { result = result.concat(text, [10, (colWidth * currCol), 20, (colHeight), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 1.5), 1, object[key].mount]); }
				if (object[key].pad) { result = result.concat(text, [10, (colWidth * currCol), 20, (colHeight * 2), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 2.5), 1, object[key].pad]); }
				if (object[key].hole) { result = result.concat(text, [10, (colWidth * currCol), 20, (colHeight * 3), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 3.5), 1, object[key].hole]); }
				result = result.concat(text, [10, (colWidth * currCol), 20, (colHeight * 4), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 4.5), 1, object[key].amount]);
				
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
				result = result.concat(0, 'LINE', 8, 'Drill_Table', 62, 2, 10, lineStart, 20, (colHeight * 2), 11, (lineStart + dashSize), 21, (colHeight * 2));
				startPoint = false;
			}
		});
		startPoint = false;
		skippedCells.row3.forEach(function (position, i, arr) { // Проставляет прочерки где нет значений (диаметр отверстия)
			if (!startPoint && startPoint !== 0) { startPoint = position; }
			if (position + 1 !== arr[i + 1]) {
				lineStart = (position - startPoint + 1) * colWidth / 2 - colWidth / 4 + startPoint * colWidth;
				result = result.concat(0, 'LINE', 8, 'Drill_Table', 62, 2, 10, lineStart, 20, (colHeight * 3.5), 11, (lineStart + dashSize), 21, (colHeight * 3.5));
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
	
	d.rnd = { // Аргумент p - точка, для которой нужны координаты. 0 - первая, 2 - вторая. Для первой добавляется заголовок блока
		x05y05:   function (p) { var a = [10, x, 20, y];                           if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x05y0:    function (p) { var a = [10, x, 20, y + radius];                  if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x05y1:    function (p) { var a = [10, x, 20, y - radius];                  if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x0y05:    function (p) { var a = [10, x - radius, 20, y];                  if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x1y05:    function (p) { var a = [10, x + radius, 20, y];                  if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x05y025:  function (p) { var a = [10, x, 20, y + radius / 2];              if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x05y075:  function (p) { var a = [10, x, 20, y - radius / 2];              if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x025y05:  function (p) { var a = [10, x - radius / 2, 20, y];              if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x075y05:  function (p) { var a = [10, x + radius / 2, 20, y];              if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x025y025: function (p) { var a = [10, x - radius / 2, 20, y + radius / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x075y025: function (p) { var a = [10, x + radius / 2, 20, y + radius / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x025y075: function (p) { var a = [10, x - radius / 2, 20, y - radius / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x075y075: function (p) { var a = [10, x + radius / 2, 20, y - radius / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		deg45:    function (p) { var a = [10, x + Math.cos(Math.PI * 0.25) * radius, 20, y + Math.sin(Math.PI * 0.25) * radius]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		deg135:   function (p) { var a = [10, x + Math.cos(Math.PI * 0.75) * radius, 20, y + Math.sin(Math.PI * 0.75) * radius]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		deg225:   function (p) { var a = [10, x + Math.cos(Math.PI * 1.25) * radius, 20, y + Math.sin(Math.PI * 1.25) * radius]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		deg315:   function (p) { var a = [10, x + Math.cos(Math.PI * 1.75) * radius, 20, y + Math.sin(Math.PI * 1.75) * radius]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); }
	};
	d.rect = {
		x05y05:   function (p) { var a = [10, x, 20, y];                 if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x05y0:    function (p) { var a = [10, x, 20, y + h / 2];         if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x05y1:    function (p) { var a = [10, x, 20, y - h / 2];         if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x1y05:    function (p) { var a = [10, x + w / 2, 20, y];         if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x0y05:    function (p) { var a = [10, x - w / 2, 20, y];         if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x025y05:  function (p) { var a = [10, x - w / 4, 20, y];         if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x075y05:  function (p) { var a = [10, x + w / 4, 20, y];         if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x0y0:     function (p) { var a = [10, x - w / 2, 20, y + h / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x1y0:     function (p) { var a = [10, x + w / 2, 20, y + h / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x1y1:     function (p) { var a = [10, x + w / 2, 20, y - h / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x0y1:     function (p) { var a = [10, x - w / 2, 20, y - h / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x025y0:   function (p) { var a = [10, x - w / 4, 20, y + h / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x075y0:   function (p) { var a = [10, x + w / 4, 20, y + h / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x1y025:   function (p) { var a = [10, x + w / 2, 20, y + h / 4]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x1y075:   function (p) { var a = [10, x + w / 2, 20, y - h / 4]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x075y1:   function (p) { var a = [10, x + w / 4, 20, y - h / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x025y1:   function (p) { var a = [10, x - w / 4, 20, y - h / 2]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x0y075:   function (p) { var a = [10, x - w / 2, 20, y - h / 4]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x0y025:   function (p) { var a = [10, x - w / 2, 20, y + h / 4]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x025y025: function (p) { var a = [10, x - w / 4, 20, y + h / 4]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x075y025: function (p) { var a = [10, x + w / 4, 20, y + h / 4]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x075y075: function (p) { var a = [10, x + w / 4, 20, y - h / 4]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); },
		x025y075: function (p) { var a = [10, x - w / 4, 20, y - h / 4]; if (p) { a[0] = 11; a[2] = 21; } else { a = greenLn.concat(a); } result = result.concat(a); }
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
	result = result.concat(redLn, [10,   0, 20, 0,  11, -42,  21, 0]);
	result = result.concat(redLn, [10, -42, 20, 0,  11, -42,  21, th]);
	result = result.concat(redLn, [10, -42, 20, th, 11,   0,  21, th]);
	result = result.concat(redLn, [10,   0, 20, th, 11,   0,  21, 0]);
	result = result.concat(redLn, [10, -42, 20, 15, 11,   0,  21, 15]);
	result = result.concat(redLn, [10, -42, 20, 30, 11,   0,  21, 30]);
	result = result.concat(redLn, [10, -42, 20, 45, 11,   0,  21, 45]);
	result = result.concat(redLn, [10, -42, 20, 60, 11,   0,  21, 60]);
	result = result.concat(redLn, [10, -42, 20, 75, 11,   0,  21, 75]);
	
	// Ячейки данных
	skippedCells = determineEmptyCells(lib); // Ячейки без значений
	for (i = 0; i < columns; i += 1) {
		for (j = 0; j <= rows; j += 1) { // Горизонатльные
			if (!(j === 2 && skippedCells.row1.indexOf(i) + 1 && skippedCells.row2.indexOf(i) + 1)) { // Не рисовать линию если эта ячейка и та, что под ней, пусты
				result = result.concat(redLn, [10, (colWidth * i),  20, (colHeight * j),  11, (colWidth * i) + colWidth,  21, (colHeight * j)]);
			}
		}
		for (j = 1; j < rows; j += 1) { // Вертикальные
			if (!(j > 0 && j < 4 && skippedCells['row' + j].indexOf(i) + 1 && skippedCells['row' + j].indexOf(i + 1) + 1)) {
				result = result.concat(redLn, [10, (colWidth * i + colWidth),  20, (colHeight * j),  11, (colWidth * i + colWidth),  21, (colHeight * j) + colHeight]);
			}
		}
	}
	result = result.concat(redLn, [10, (colWidth * pth), 20, 0, 11, (colWidth * pth), 21, colHeight]);
	result = result.concat(redLn, [10, tw, 20, 0, 11, tw, 21, colHeight]);
	/* -=-=-=- */
	
	/* Заполнение таблицы */
	// Название таблицы
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 5, 51, 15, 72, 2, 73, 1, 10, (tw - colWidth * 2), 20, (th + colHeight), 11, tw, 21, (th + 5), 1, headers[11]);
	
	// Тексты заголовков
	result = result.concat(text, [10, -42, 20, th,                   11, -21, 21, th - colHeight * 0.5, 1], headers[0]);
	result = result.concat(text, [10, -42, 20, th - colHeight,       11, -21, 21, th - colHeight * 1.5, 1], headers[1]);
	result = result.concat(text, [10, -42, 20, th - colHeight * 2,   11, -21, 21, th - colHeight * 2.33, 1], headers[2]);
	result = result.concat(text, [10, -42, 20, th - colHeight * 2.5, 11, -21, 21, th - colHeight * 2.66, 1], headers[3]);
	result = result.concat(text, [10, -42, 20, th - colHeight * 3,   11, -21, 21, th - colHeight * 3.33, 1], headers[4]);
	result = result.concat(text, [10, -42, 20, th - colHeight * 3.5, 11, -21, 21, th - colHeight * 3.66, 1], headers[5]);
	result = result.concat(text, [10, -42, 20, th - colHeight * 4,   11, -21, 21, th - colHeight * 4.33, 1], headers[4]);
	result = result.concat(text, [10, -42, 20, th - colHeight * 4.5, 11, -21, 21, th - colHeight * 4.66, 1], headers[6]);
	result = result.concat(text, [10, -42, 20, th - colHeight * 5,   11, -21, 21, th - colHeight * 5.33, 1], headers[7]);
	result = result.concat(text, [10, -42, 20, th - colHeight * 5.5, 11, -21, 21, th - colHeight * 5.66, 1], headers[8]);
	
	// Значения ячеек
	if (pth) { result = result.concat(text, [10, 0, 20, 0, 11, (pth * colWidth / 2), 21, (colHeight / 2), 1], headers[9]); } // Металлизация - "Есть"
	if (npth) { result = result.concat(text, [10, 0, 20, 0, 11, (pth * colWidth + npth * colWidth / 2), 21, (colHeight / 2), 1], headers[10]); } // Металлизация - "Нет"
	
	fillTheTable(lib.metallized);
	fillTheTable(lib.nonMetallized);
	fillTheTable(lib.holes);
	/* -=-=-=- */
	
	result.push(0, 'ENDSEC', 0, 'EOF');
	document.getElementById('result').innerHTML = '<pre>' + result.join(String.fromCharCode(10)) + '</pre>';
}
