/*global FileReader */
// (01) Устанавливает галку/крест в заголовке текущего шага в зависимости от полученного
//      статуса текущей операции. Может вывести сообщение об ошибке если передан его номер.
// (02) Обрабатывает файл: разбивает на строки, обрезает пробелы в начале и в конце, совмещает
//      отдельные скобки с ближайшей строкой, затем создает объект древовидной структуры
//      с методами: asArray() собирает объект в массив, getPads() возвращает список КП.
// (03) Цикл парсит блок "pcbDesign - multiLayer" на координаты переходных отверстий,
//      отдельных контактных площадок и информацию о компонентах.
// (04) Цикл парсит блоки "library - padStyleDef" и "library - viaStyleDef" на размеры
//      площадок и диаметры их отверстий.

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
					value: function (a) {
						var array = [];
						function walker(object) {
							var i;
							for (i = 0; i < Object.keys(object).length; i += 1) {
								if (typeof object[i] === 'object') {
									array.push(object[i].header);
									walker(object[i]);
								} else {
									array.push(object[i]);
								}
							}
						}
						walker(a || this);
						return array;
					}
				},
				getPads: {
					value: function () {
						var result = {}, pads = {}, vias = {}, comp = {}, currPath, name, type, i, j, k, l;
						
						function parser(type, string) {
							var reg = new RegExp('\\(' + type + ' .+?(?=\\)(?!")|$)', 'g'), values, i;
							switch (type) {
							case 'viaStyleRef':
							case 'viaStyleDef':
							case 'padStyleRef':
							case 'padStyleDef':
							case 'patternRef':
							case 'viaShapeType':
							case 'padShapeType':
							case 'refDesRef':
							case 'rotation':
							case 'isFlipped':
							case 'patternGraphicsNameRef':
								values = string.match(reg);
								return (values) ? string.match(reg)[0].slice(type.length + 2) : null;
							case 'pt':
							case 'holeDiam':
							case 'shapeWidth':
							case 'shapeHeight':
								values = string.match(reg);
								if (!values) { return null; }
								for (i = 0; i < values.length; i += 1) {
									if (values[i].slice(type.length + 2)) {
										return values[i].slice(type.length + 2);
									}
								}
								break;
							}
						}
						function finder(array, object) {
							var i = 0, result;
							result = array.reduce(function (currObj, elem, index) {
								for (i = 0; i < Object.keys(currObj).length; i += 1) {
									if (typeof currObj[i] === 'object' && currObj[i].header.indexOf(array[index]) > -1) {
										return currObj[i];
									}
								}
							}, object);
							return result;
						}
						
						for (i = 0; i < Object.keys(this['4']).length; i += 1) {
							if (this['4'][i].header === '(multiLayer') {
								currPath = this['4'][i];
								break;
							}
						}
						for (i = 0; i < Object.keys(currPath).length; i += 1) { // (03)
							if (typeof currPath[i] === 'string') {
								type = (currPath[i].indexOf('(viaStyleRef') + 1) ?
										'viaStyleRef' : (currPath[i].indexOf('(padStyleRef') + 1) ?
										'padStyleRef' : 0;
								switch (type) {
								case 'viaStyleRef':
									name = parser(type, currPath[i]);
									if (!vias[name]) { vias[name] = {}; vias[name].coords = []; }
									vias[name].coords.push(parser('pt', currPath[i]));
									break;
								case 'padStyleRef':
									name = parser(type, currPath[i]);
									if (!pads[name]) { pads[name] = {}; pads[name].coords = []; }
									pads[name].coords.push(parser('pt', currPath[i]));
									break;
								}
							} else {
								if (currPath[i].header.indexOf('(pattern') > -1) {
									name = parser('refDesRef', currPath[i].header);
									if (!comp[name]) { comp[name] = {}; }
									comp[name].pattern = parser('patternRef', currPath[i].header);
									comp[name].zero = parser('pt', currPath[i].header);
									comp[name].rotation = +parser('rotation', currPath[i].header);
									comp[name].flipped = (parser('isFlipped', currPath[i].header) === 'True') ? true : false;
									comp[name].graphics = (currPath[i].header.indexOf('patternGraphicsNameRef') > -1) ?
											parser('patternGraphicsNameRef', currPath[i].header) :
											parser('patternGraphicsNameRef', currPath[i]['0']);
								}
							}
						}
						for (i = 0; i < Object.keys(this['2']).length; i += 1) { // (04)
							type = (this['2'][i].header.indexOf('(viaStyleDef') + 1) ?
									'via' : (this['2'][i].header.indexOf('(padStyleDef') + 1) ?
									'pad' : 0;
							if (type) {
								name = parser(type + 'StyleDef', this['2'][i].header);
								currPath = (type === 'via') ? vias : pads;
								if (!currPath[name]) { currPath[name] = {}; currPath[name].coords = []; }
								currPath[name].hole = parser('holeDiam', this.asArray(this['2'][i]).join(','));
								currPath[name].shape = parser(type + 'ShapeType', this.asArray(this['2'][i]).join(','));
								currPath[name].width = parser('shapeWidth', this.asArray(this['2'][i]).join(','));
								currPath[name].height = parser('shapeHeight', this.asArray(this['2'][i]).join(','));
							}
						}
						for (i = 0; i < Object.keys(comp).length; i += 1) {
							
						}
						result.vias = vias;
						result.pads = pads;
						result.comp = comp;
						return result;
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
		window.console.log(content.getPads());
	};
}());