/*global FileReader */
// (01) Устанавливает галку/крест в заголовке текущего шага в зависимости от полученного
//      статуса текущей операции. Может вывести сообщение об ошибке если передан его номер.
// (02) Обрабатывает файл: разбивает на строки, обрезает пробелы в начале и в конце, совмещает
//      отдельные скобки с ближайшей строкой, затем создает объект древовидной структуры.
//      Метод asArray() собирает объект в массив.

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
										'Не удалось сформировать корректную структуру данных из файла. \n\nВозможно файл содержит ошибки или непредусмотренные блоки.',
										'Не удалось распознать переходные отверстия или контактные площадки. \n\nВозможно файл содержит ошибки или непредусмотренные блоки.'];
			if (n > -1) {
				document.getElementById(step).className = 'h1-error';
				window.alert(errors[n]);
				error = 1;
			} else {
				document.getElementById(step).className = 'h1-success';
			}
		}
		function handleInput(string) { // (02)
			var arr, obj = {}, currLevel = obj;
			
			function Branch(string) {
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
			
			if (string.indexOf('ACCEL_ASCII') === -1) { showError(0, 'firstStep'); return; }
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
					currLevel[n] = new Branch(string);
					currLevel = currLevel[n];
				} else {
					currLevel[n] = string;
					while (i <= Math.abs(brackets)) {
						currLevel = currLevel.parent;
						i += 1;
					}
				}
			});
			Object.defineProperties(obj, {
				asArray: {
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
				},
				pads: {
					get: function () {
						
					}
				},
				vias: {
					get: function () {
						var result, workingBranch, i;
						for (i = 0; i < Object.keys(this['4']).length; i += 1) {
							if (this['4'][i].header === '(multiLayer') { workingBranch = this['4'][i]; break; }
						}
						if (!workingBranch) { showError(2, 'firstStep'); return; }
						for (i = 0; i < Object.keys(workingBranch).length; i += 1) {
							if (workingBranch[i].indexOf('(via (viaStyleRef') > -1) {
								result[workingBranch.match(/".+?"/)[0].] = workingBranch[i].;
							}
						}
					}
				}
			});
			if (Object.keys(obj).length < 5) { showError(1, 'firstStep'); return; }
			return obj;
		}
		
		content = handleInput(this.result);
		if (error) { return; } else { showError(-1, 'firstStep'); }
		document.getElementById('step2').style.display = 'flex';
		window.console.log(content);
		window.console.log(content.vias);
	};
}());