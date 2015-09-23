/*global FileReader */
// (01) Устанавливает галку/крест в заголовке текущего шага в зависимости от полученного
//      статуса текущей операции, может вывести текст ошибки если он передан.
//      Возвращает 0 или 1 в зависимости от установленного статуса, что позволяет
//      прервать выполнение скрипта в случае ошибки.
// (02) Чистит полученную строку (файл) от лишних пробелов и символов EOL, добавляет
//      в строку символы, по которым ее можно будет разбить на блоки. Используемые
//      коды символов: 10: '\n', 13: '\r', 32: ' ', 34: '"', 40: '(', 41: ')', 124: '|'.
// (03) Преобразует массив строк в объект, имеющий структуру дерева (блоки вложены
//      друг в друга) для упрощения поиска и доступа к нужным значениям.

(function () {
	'use strict';
	var
		input  = document.getElementById('file'),
		reader = new FileReader();
	
	function setStepStatus(result, step) { // (01)
		var errors = {
			'firstStep': 'Выбран некорректный файл.\n\nОткройте .pcb в P-CAD и выполните следующее:\n  File -> Save as... -> Save as type: ASCII Files'
		};
		if (result > -1) {
			document.getElementById(step).className = 'h1-success';
			return 1;
		} else {
			document.getElementById(step).className = 'h1-error';
			window.alert(errors[step]);
			return 0;
		}
	}
	
	function handleString(str) { // (02)
		var result = '', catalog = {}, quotes = 0, i;
		Object.defineProperties(catalog, {
			'10': {value: ''},
			'13': {value: ''},
			'34': {get: function () { if (str[i - 1] !== '\\') { quotes += 1; } return '\"'; }},
			'40': {get: function () { return ([34, 124].indexOf(str.charCodeAt(i - 1)) + 1) ? '(' : '|('; }},
			'32': {get: function () { return ([10, 13, 32, 124].indexOf(str.charCodeAt(i - 1)) + 1 ||
																				[10, 13, 40, 41].indexOf(str.charCodeAt(i + 1)) + 1) ? '' : ' '; }},
			def:  {get: function () { return str[i]; }}
		});
		for (i = 0; i < str.length; i += 1) {
			if (quotes % 2 && str[i] !== '\"') {
				result += str[i];
			} else {
				result += (catalog.hasOwnProperty(str.charCodeAt(i))) ? catalog[str.charCodeAt(i)] : catalog.def;
			}
		}
		return result;
	}
	
	function createList(array) { // (03)
		var obj = {}, currLevel = obj;
		function AddLevel() {
			this.prev = currLevel;
		}
		array.forEach(function (str) {
			var c = 0, s = str.length - 1, i;
			if (str[0] === '(' && str[str.length - 1] === ')') {
				currLevel[str] = null;
				while (str.slice(s, s + 1) === ')') {
					c += 1;
					s -= 1;
				}
				if (c > 1) {
					for (i = 1; i < c; i += 1) {
						currLevel = currLevel.prev;
					}
				}
			} else if (str[0] === '(' && str[str.length - 1] !== ')') {
				currLevel[str] = new AddLevel();
				currLevel = currLevel[str];
			}
		});
		return obj;
	}
	
	input.addEventListener('change', function () {
		if (this.files[0]) {
			reader.readAsText(this.files[0], 'cp1251');
		}
	});
	reader.onload = function () {
		var
			tempArray = [],
			content;
		
		tempArray = handleString(this.result).split('|');
		if (!setStepStatus(tempArray[0].indexOf('ACCEL_ASCII'), 'firstStep')) { return; }
		document.getElementById('step2').style.display = 'flex';
		document.write('<pre>' + tempArray.join('<br>') + '</pre>');
		content = createList(tempArray);
		console.log(content);
	};
}());