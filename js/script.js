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
		function handleInput(string) {
			var arr, obj = {}, currLevel = obj;
			
			function AddLevel(string) {
				Object.defineProperties(this, {
					header: {value: string, enumerable: false},
					parent: {value: currLevel, enumerable: false}
				});
			}
			function calcBrackets(string) {
				var brackets = 0, quote = 0, i;
				for (i = 0; i < string.length; i += 1) {
					if (string[i] === '\"' && string[i - 1] !== '\\') { quote += 1; }
					if (quote % 2 === 0) {
						if (string[i] === '(') { brackets += 1; }
						if (string[i] === ')') { brackets -= 1; }
					}
				}
				return brackets;
			}
			
			arr = string.split('\n').reduce(function (result, str, i, a) {
				str = str.trim();
				if (str) {
					if (str[0] === ')') {
						result[result.length - 1] += ')';
					} else {
						result.push(str);
					}
				}
				return result;
			}, []);
			arr.forEach(function (string) {
				var brackets = calcBrackets(string), n = Object.keys(currLevel).length, i = 1;
				if (brackets > 0) {
					currLevel[n] = new AddLevel(string);
					currLevel = currLevel[n];
				} else {
					currLevel[n] = string;
					while (i <= Math.abs(brackets)) {
						currLevel = currLevel.parent;
						i += 1;
					}
				}
			});
			Object.defineProperty(obj, 'convertToArray', {
				value: function () {
					var array = [];
					function walker(object) {
						var i;
						for (i = 0; i <= Object.keys(object).length - 1; i += 1) {
							if (typeof object[i] === 'object') {
								array.push(object[i].header);
								walker(object[i]);
							} else {
								array.push(object[i]);
							}
						}
					}
					walker(obj);
					return array;
				}
			});
			return obj;
		}
		content = handleInput(this.result);
		//if (error) { return; } else { showError(-1, 'firstStep'); }
		//document.getElementById('step2').style.display = 'flex';
		document.write('<pre>' + content.convertToArray().join('</br>') + '</pre>');
		console.log(content);
	};
}());