/*global FileReader */
// (01) Устанавливает галку/крест в заголовке текущего шага в зависимости от полученного
//      статуса текущей операции. Может вывести сообщение об ошибке если передан его номер.
// (02) Чистит полученную строку (файл) от лишних пробелов и символов EOL, добавляет
//      в строку символы '$', по которым ее можно будет разбить на блоки. Используемые
//      коды символов: 10: '\n', 13: '\r', 32: ' ', 34: '"', 36: '$', 40: '(', 41: ')'.
// (03) Преобразует массив строк в объект, имеющий структуру дерева (блоки вложены
//      друг в друга) для упрощения поиска и доступа к нужным значениям.

(function () {
	'use strict';
	var
		input  = document.getElementById('file'),
		reader = new FileReader();
	
	input.addEventListener('change', function () {
		if (this.files[0]) {
			reader.readAsText(this.files[0], 'cp1251');
		}
	});
	reader.onload = function () {
		var error = 0, content;
		
		function showError(n, step) { // (01)
			var errors = ['Выбран некорректный файл.\n\nОткройте .pcb в P-CAD и выполните следующее:\n  File -> Save as... -> Save as type: ASCII Files.',
										'Пожалуйста, замените все символы $ на любые другие с помощью текстового редактора. \nДанный символ используется для разделения строк.',
										'Не удалось сформировать корректную структуру данных из файла. \nВозможно файл содержит ошибки или непредусмотренные блоки.'];
			if (n > -1) {
				document.getElementById(step).className = 'h1-error';
				window.alert(errors[n]);
				error = 1;
			} else {
				document.getElementById(step).className = 'h1-success';
			}
		}
		function handleString(str) { // (02)
			var result = '', catalog = {}, quotes = 0, i;
			if (str.indexOf('ACCEL_ASCII') === -1) { showError(0, 'firstStep'); return; }
			if (str.indexOf('$') > -1) { showError(1, 'firstStep'); return; }
			Object.defineProperties(catalog, {
				'10': {value: ''},
				'13': {value: ''},
				'34': {get: function () {
					if (str[i - 1] !== '\\') {
						quotes += 1;
						if (str[i - 2] === ')') { return '$\"'; }
					}
					return '\"';
				}},
				'40': {get: function () { return ([34, 36].indexOf(str.charCodeAt(i - 1)) + 1) ? '(' : '$('; }},
				'32': {get: function () { return ([10, 13, 32, 36, 41].indexOf(str.charCodeAt(i - 1)) + 1 ||
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
		function buildList(array) { // (03)
			var obj = {}, currLevel = obj;
			function AddLevel() {
				this.prev = currLevel;
			}
			array.forEach(function (str) {
				var c = 0, s = str.length - 1, i;
				if ((str[0] === '(' && str[str.length - 1] === ')') ||
						(str[0] === '\"' && str[str.length - 1] === '\"')) {
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
			if (Object.keys(obj).length < 3) { showError(2, 'firstStep'); }
			return obj;
		}
		function buildArray(list) {
			var array = [], key, walker;
			for (key in list) {
				if (list.hasOwnProperty(key)) {
					if (key) {
						array.push(key);
						list = list[key];
					} else {
						array.push(key);
					}
				}
			}
		}
		
		content = buildList(handleString(this.result).split('$'));
		if (error) { return; } else { showError(-1, 'firstStep'); }
		document.getElementById('step2').style.display = 'flex';
		console.log(buildArray(content));
	};
}());