/*global FileReader */
// Пояснения:
// (01) Открывает или закрывает блок справки при нажатии кнопки наверху страницы.
// (02) Устанавливает галку/крест в заголовке текущего шага в зависимости от полученного
//      статуса текущей операции. Может вывести сообщение об ошибке если передан его номер.
// (03) Обрабатывает файл: разбивает на строки, обрезает пробелы в начале и в конце, совмещает
//      отдельные скобки с ближайшей строкой, затем создает объект древовидной структуры
//      с методами: asArray() собирает объект в массив, getPads() возвращает список КП.
// (04) Цикл парсит блок "pcbDesign - multiLayer" на координаты переходных отверстий,
//      отдельных контактных площадок и информацию о компонентах.
// (05) Цикл парсит блоки "library - padStyleDef" и "library - viaStyleDef" на размеры
//      площадок и диаметры их отверстий.
// (06) Ищет какое-либо свойство (заголовок) в объекте по указанному пути. Принимает объект для
//      поиска и массив, элементы которого - последовательный путь к свойству, являющемуся
//      последним элементом массива.
//      Например: ['(library "Library_1"', '(padStyleDef "(Default)"', '(holeDiam 0.9652)']
//      найдет объект '(padStyleDef "(Default)"'. В случае, если свойства не уникальны,
//      вернет первый объект, подходящий под указанный путь.
//
// TODO:[] Переработать и упростить код, парсящий файл на информацию о КП.
// TODO:[] Сделать нормальную обработку ошибок через try...catch.

(function () {
	'use strict';
	var
		helpButton	= document.getElementById('helpButton'),
		input				= document.getElementById('file'),
		reader			= new FileReader();
	
	helpButton.addEventListener('click', function () { // (01)
		var helpWrapper = document.getElementsByClassName('help-wrapper')[0];
		if (!parseInt(helpWrapper.style.maxHeight, 10)) {
			helpWrapper.style.maxHeight = window.getComputedStyle(document.getElementById('calcHeight')).height;
		} else {
			helpWrapper.style.maxHeight = '0px';
		}
	});
	input.addEventListener('change', function () {
		if (this.files[0]) {
			reader.readAsText(this.files[0], 'cp1251');
		}
	});
	reader.onload = function () {
		var error = 0, content;
		
		function showError(n, step) { // (02)
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
		function handleInput(string) { // (03)
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
						var comp = {}, cosA, currPath, height, i, j, key, name, pads = {},
							prop, shiftX, shiftY, type, result = {}, sinA, vias = {}, width, x, y, zero;
						
						function parser(type, string) {
							var values, i,
								// Совпадение до первой закрывающей скобки, т.к. внутри скобок быть не может:
								regStandardValue = new RegExp('\\(' + type + ' .+?(?=\\))', 'g'),
								// Совпадение до кавычки, за которой идет закрывающая скобка или конец строки:
								regName = new RegExp('\\(' + type + ' .+?(?=(\"\\))|\"$)', 'g');
							
							switch (type) {
							case 'viaShapeType':
							case 'padShapeType':
								values = string.match(regStandardValue);
								return (values) ? values[0].slice(type.length + 2) : null;
							case 'rotation':
							case 'holeDiam':
							case 'shapeWidth':
							case 'shapeHeight':
								values = string.match(regStandardValue);
								return (values) ? +values[0].slice(type.length + 2) : 0;
							case 'pt':
								values = string.match(regStandardValue);
								if (values) {
									return (string.indexOf('isFlipped True') === -1) ?
													values[0].slice(type.length + 2) :
													values[0].slice(type.length + 2) + ' flipped';
								} else {
									return null;
								}
							case 'padStyleRef':
							case 'padStyleDef':
							case 'viaStyleRef':
							case 'viaStyleDef':
							case 'patternRef':
							case 'refDesRef':
							case 'patternGraphicsNameRef':
								values = string.match(regName);
								return (values) ? values[0].slice(type.length + 3) : null;
							}
						}
						function finder(array, object) { // (06)
							var i = 0, nextBranch;
							function find(obj, start) {
								var j;
								for (j = start; j < Object.keys(obj).length; j += 1) {
									if (typeof obj[j] === 'object' && obj[j].header === array[i]) {
										i += 1;
										nextBranch = j + 1;
										return find(obj[j], 0);
									} else if (j === Object.keys(obj).length - 1) {
										i -= 1;
										return find(obj.parent, nextBranch);
									} else if (i === array.length - 1 && obj[j] === array[i]) {
										return obj;
									}
								}
								return;
							}
							return find(object, 0);
						}
						
						for (i = 0; i < Object.keys(this['4']).length; i += 1) {
							if (this['4'][i].header === '(multiLayer') {
								currPath = this['4'][i];
								break;
							}
						}
						for (i = 0; i < Object.keys(currPath).length; i += 1) { // (04)
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
									comp[name].rotation = parser('rotation', currPath[i].header);
									comp[name].graphics = (currPath[i].header.indexOf('patternGraphicsNameRef') > -1) ?
											parser('patternGraphicsNameRef', currPath[i].header) :
											parser('patternGraphicsNameRef', currPath[i]['0']);
								}
							}
						}
						for (i = 0; i < Object.keys(this['2']).length; i += 1) { // (05)
							type = (this['2'][i].header.indexOf('(viaStyleDef') + 1) ?
									'via' : (this['2'][i].header.indexOf('(padStyleDef') + 1) ?
									'pad' : 0;
							if (type) {
								name = parser(type + 'StyleDef', this['2'][i].header);
								currPath = (type === 'via') ? vias : pads;
								if (!currPath[name]) { currPath[name] = {}; currPath[name].coords = []; }
								currPath[name].side = 'thru';
								for (j = 0; j < Object.keys(this['2'][i]).length; j += 1) {
									if (typeof this['2'][i][j] === 'string') {
										prop = (this['2'][i][j].indexOf('holeDiam') + 1) ?
														'hole' : (this['2'][i][j].indexOf('layerNumRef 1') + 1) ?
														'layer1' : (this['2'][i][j].indexOf('layerNumRef 2') + 1) ?
														'layer2' : null;
										switch (prop) {
										case 'hole':
											currPath[name].hole = parser('holeDiam', this['2'][i][j]);
											break;
										case 'layer1':
											currPath[name].shape = parser(type + 'ShapeType', this['2'][i][j]);
											currPath[name].width = parser('shapeWidth', this['2'][i][j]);
											currPath[name].height = parser('shapeHeight', this['2'][i][j]);
											break;
										case 'layer2':
											width = parser('shapeWidth', this['2'][i][j]);
											height = parser('shapeHeight', this['2'][i][j]);
											if (width && !currPath[name].width) {
												currPath[name].side = 'bot';
												currPath[name].width = width;
												currPath[name].height = height;
											} else if (!width) {
												currPath[name].side = 'top';
											}
											break;
										}
									}
								}
							}
							type = null;
						}
						for (key in comp) {
							if (comp.hasOwnProperty(key)) {
								comp[key].pads = {};
								currPath = finder(['(patternDefExtended \"' + comp[key].pattern + '\"',
																	 '(patternGraphicsDef',
																	 '(patternGraphicsNameDef "' + comp[key].graphics + '")'], this['2']);
								for (i = 0; i < Object.keys(currPath).length; i += 1) {
									if (typeof currPath[i] === 'object' && currPath[i].header === '(multiLayer') {
										for (j = 0; j < Object.keys(currPath[i]).length; j += 1) {
											name = parser('padStyleRef', currPath[i][j]);
											if (!comp[key].pads[name]) { comp[key].pads[name] = []; }
											comp[key].pads[name].push(parser('pt', currPath[i][j]) + ' ' + parser('rotation', currPath[i][j]));
										}
										break;
									}
								}
							}
						}
						for (key in comp) {
							if (comp.hasOwnProperty(key)) {
								zero = comp[key].zero.split(' ');
								for (name in comp[key].pads) {
									if (comp[key].pads.hasOwnProperty(name)) {
										for (i = 0; i < comp[key].pads[name].length; i += 1) {
											shiftX = +comp[key].pads[name][i].split(' ')[0];
											shiftY = +comp[key].pads[name][i].split(' ')[1];
											cosA = Math.cos(comp[key].rotation * Math.PI / 180);
											sinA = Math.sin(comp[key].rotation * Math.PI / 180);
											x = (shiftX * cosA - shiftY * sinA).toFixed(4);
											y = (shiftY * cosA + shiftX * sinA).toFixed(4);
											if (zero[2] !== 'flipped') { x = -x; }
											pads[name].coords.push((+zero[0] + x) + ' ' +
																						 (+zero[1] + y) + ' ' +
																						 (+comp[key].pads[name][i].split(' ')[2])
																						);
										}
									}
								}
							}
						}
						for (name in pads) {if (pads.hasOwnProperty(name)) {if (!pads[name].coords.length) {delete pads[name]; } } }
						for (name in vias) {if (vias.hasOwnProperty(name)) {if (!vias[name].coords.length) {delete vias[name]; } } }
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