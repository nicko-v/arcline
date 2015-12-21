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
*		40 - высота текста / высота вьюпорта
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
		w = colWidth * columns,
		h = colHeight * rows, // Общая высота таблицы
		dashSize = colWidth / 2,
		result = [0, 'SECTION',
						2, 'TABLES',
						0, 'TABLE',
						2, 'VPORT',
						0, 'VPORT',
						2, '*ACTIVE',
						12, (w / 2 - 21), // Длина таблицы без столбца заголовков (т.к. он слева от нуля по X) - половина столбца заголовков = центр
						22, (h / 2),
						40, (h + 15),
						41, ((w + 42) / 100),
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
		currCol = 0, skippedCells, i, j;
	
	function fillTheTable(object) {
		var startPoint, lineStart, key;
		
		for (key in object) { // Проставляет значения
			if (object.hasOwnProperty(key)) {
				if (object[key].mount) { result = result.concat(text, [10, (colWidth * currCol), 20, (colHeight), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 1.5), 1, object[key].mount]); }
				if (object[key].pad) { result = result.concat(text, [10, (colWidth * currCol), 20, (colHeight * 2), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 2.5), 1, object[key].pad]); }
				if (object[key].hole) { result = result.concat(text, [10, (colWidth * currCol), 20, (colHeight * 3), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 3.5), 1, object[key].hole]); }
				result = result.concat(text, [10, (colWidth * currCol), 20, (colHeight * 4), 11, (colWidth * currCol + colWidth * 0.5), 21, (colHeight * 4.5), 1, object[key].amount]);
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
	
	skippedCells = determineEmptyCells(lib); // Ячейки без значений
	
	/* Построение таблицы */
	// Ячейки заголовков
	result = result.concat(redLn, [10,   0, 20, 0,  11, -42,  21, 0]);
	result = result.concat(redLn, [10, -42, 20, 0,  11, -42,  21, h]);
	result = result.concat(redLn, [10, -42, 20, h,  11,   0,  21, h]);
	result = result.concat(redLn, [10,   0, 20, h,  11,   0,  21, 0]);
	result = result.concat(redLn, [10, -42, 20, 15, 11,   0,  21, 15]);
	result = result.concat(redLn, [10, -42, 20, 30, 11,   0,  21, 30]);
	result = result.concat(redLn, [10, -42, 20, 45, 11,   0,  21, 45]);
	result = result.concat(redLn, [10, -42, 20, 60, 11,   0,  21, 60]);
	result = result.concat(redLn, [10, -42, 20, 75, 11,   0,  21, 75]);
	
	// Ячейки данных
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
	result = result.concat(redLn, [10, w, 20, 0, 11, w, 21, colHeight]);
	/* -=-=-=- */
	
	/* Заполнение таблицы */
	// Название таблицы
	result.push(0, 'TEXT', 8, 'Drill_Table', 62, 2, 7, 'win_eskd', 40, 5, 51, 15, 72, 2, 73, 1, 10, (w - colWidth * 2), 20, (h + colHeight), 11, w, 21, (h + 5), 1, headers[11]);
	
	// Тексты заголовков
	result = result.concat(text, [10, -42, 20, h,                   11, -21, 21, h - colHeight * 0.5, 1], headers[0]);
	result = result.concat(text, [10, -42, 20, h - colHeight,       11, -21, 21, h - colHeight * 1.5, 1], headers[1]);
	result = result.concat(text, [10, -42, 20, h - colHeight * 2,   11, -21, 21, h - colHeight * 2.33, 1], headers[2]);
	result = result.concat(text, [10, -42, 20, h - colHeight * 2.5, 11, -21, 21, h - colHeight * 2.66, 1], headers[3]);
	result = result.concat(text, [10, -42, 20, h - colHeight * 3,   11, -21, 21, h - colHeight * 3.33, 1], headers[4]);
	result = result.concat(text, [10, -42, 20, h - colHeight * 3.5, 11, -21, 21, h - colHeight * 3.66, 1], headers[5]);
	result = result.concat(text, [10, -42, 20, h - colHeight * 4,   11, -21, 21, h - colHeight * 4.33, 1], headers[4]);
	result = result.concat(text, [10, -42, 20, h - colHeight * 4.5, 11, -21, 21, h - colHeight * 4.66, 1], headers[6]);
	result = result.concat(text, [10, -42, 20, h - colHeight * 5,   11, -21, 21, h - colHeight * 5.33, 1], headers[7]);
	result = result.concat(text, [10, -42, 20, h - colHeight * 5.5, 11, -21, 21, h - colHeight * 5.66, 1], headers[8]);
	
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
