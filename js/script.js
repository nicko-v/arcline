/*global FileReader */
// (01) Устанавливает галку/крест в заголовке текущего шага в зависимости от полученного
//      статуса текущей операции. Может вывести сообщение об ошибке если передан его номер.
// (02) Обрабатывает файл: разбивает на строки, обрезает пробелы в начале и в конце, совмещает
//      отдельные скобки с ближайшей строкой, затем создает объект древовидной структуры
//      с методами: asArray() собирает объект в массив, vias() и pads() возвращают список
//      переходных точек и КП с названиями, координатами и размерами.

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
				parser: {
					value: function (type, string) {
						var reg = new RegExp('\\(' + type + ' .+?(?=\\)(?!")|$)', 'g'), values, i;
						switch (type) {
						case 'viaStyleRef':
						case 'padStyleRef':
						case 'padStyleDef':
							return string.match(reg)[0].slice(type.length + 2);
						case 'pt':
						case 'holeDiam':
						case 'shapeWidth':
						case 'shapeHeight':
							values = string.match(reg);
							for (i = 0; i < values.length; i += 1) {
								if (values[i].slice(type.length + 2)) {
									return values[i].slice(type.length + 2);
								}
							}
							break;
						}
					}
				},
				asArray: {
					value: function (a) {
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
						walker(a || this);
						return array;
					}
				},
				pads: {
					value: function () {
						var result = {}, thru = {vias: {}, pads: {}}, planar = {}, currPath = {}, name, hole, width, height, coords, i, j, key;
						for (i = 0; i < Object.keys(this['4']).length; i += 1) {
							if (this['4'][i].header === '(multiLayer') {
								currPath = this['4'][i];
								break;
							}
						}
						for (i = 0; i < Object.keys(currPath).length; i += 1) {
							if (typeof currPath[i] === 'string') {
								if (currPath[i].indexOf('(viaStyleRef') > -1) {
									name = this.parser('viaStyleRef', currPath[i]);
									coords = this.parser('pt', currPath[i]);
									if (thru.vias[name]) {
										thru.vias[name].push(coords);
									} else {
										thru.vias[name] = [null, coords];
									}
								} else if (currPath[i].indexOf('(padStyleRef') > -1) {
									name = this.parser('padStyleRef', currPath[i]);
									coords = this.parser('pt', currPath[i]);
									if (thru.pads[name]) {
										thru.pads[name].push(coords);
									} else {
										thru.pads[name] = [null, coords];
									}
								}
							}
						}
						for (key in thru.vias) {
							if (thru.vias.hasOwnProperty(key)) {
								for (i = 0; i < Object.keys(this['2']).length; i += 1) {
									if (this['2'][i].header === '(viaStyleDef ' + key) {
										for (j = 0; j < Object.keys(this['2'][i]).length; j += 1) {
											thru.vias[key][0] = [this.parser('holeDiam', this.asArray(this['2'][i]).join(',')),
																					 this.parser('shapeWidth', this.asArray(this['2'][i]).join(','))];
										}
										break;
									}
								}
							}
						}
						for (i = 0; i < Object.keys(this['2']).length; i += 1) {
							if (this['2'][i].header.indexOf('(padStyleDef') > -1) {
								name = this.parser('padStyleDef', this['2'][i].header);
								hole = this.parser('holeDiam', this.asArray(this['2'][i]).join(','));
								width = this.parser('shapeWidth', this.asArray(this['2'][i]).join(','));
								height = this.parser('shapeHeight', this.asArray(this['2'][i]).join(','));
							}
							if (!thru.pads[name]) {
								if (hole > 0) {
									thru.pads[name] = [hole, width, height];
								} else {
									planar[name] = [width, height];
								}
							} else {
								if (hole > 0) {
									thru.pads[name][0] = [hole, width, height];
								} else {
									planar[name][0] = [width, height];
								}
							}
						}
						result.thru = thru;
						result.planar = planar;
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
		window.console.log(content.pads());
	};
}());