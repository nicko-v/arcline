/*global FileReader */

(function () {
	'use strict';
	var
		reader,
		input        = document.getElementById('file'),
		uploadButton = document.getElementById('upload'),
		helpButton   = document.getElementById('helpButton'),
		libButton    = document.getElementById('libButton'),
		click        = navigator.userAgent.toLowerCase().match(/iphone|ipod|ipad/) ? 'touchend' : 'click',
		msgs         = ['Выбран некорректный файл. <br><br>Откройте .pcb в P-CAD и выполните следующее: <br><i>File -> Save as... -> Save as type: ASCII Files</i>',
	                  'Не удалось сформировать корректную структуру данных из файла. <br>Возможно файл содержит ошибки или непредусмотренные блоки.',
	                  'Не удалось распознать переходные отверстия или контактные площадки. <br>Возможно файл содержит ошибки или непредусмотренные блоки.',
										'Используемый браузер не поддерживает необходимый для работы приложения функционал. <br>Пожалуйста, установите свежую версию Chrome, Firefox или Opera.',
									  'Произошла непредвиденная ошибка. <br>Пожалуйста, сообщите разработчику, какие действия к этому привели или передайте файл, вызвавший ошибку.'];

	function hidePopup() {
		var cover = document.getElementById('cover');
		
		cover.style.opacity = 0;
		setTimeout(function () { cover.innerHTML = ''; }, 100);
		setTimeout(function () {
			document.documentElement.className = '';
			document.body.className = '';
			cover.className = '';
		}, 300);
	}
	function showPopup(params) { // (02)
		var
			close = (params.closeable) ? '<div class="modal-close"><div class="modal-close-cross"></div></div>' : '',
		  cover = document.getElementById('cover'),
		  clickOffset, modal, modalHeader, moving;
		
		function createButtons() {
			var result = '';
			if (params.buttons) {
				params.buttons.forEach(function (button, index) {
					result += '<button class="modal-button"type="button" id="popup-btn' + index + '">' + button + '</button>';
				});
			}
			return result;
		}
		function tryToClose(e) { // (10)
			if (!moving) {
				if (e.target.className.match(/modal-cover|modal-close/)) {
					if (params.closeable) {
						hidePopup();
					} else {
						modal.style.animation = 'reset 0 linear normal';
						setTimeout(function () { modal.style.animation = 'modal-swing 500ms ease-out normal'; }, 20);
					}
				}
			}
		}
		function moveModal(e) {
			// offsetWidth делится пополам из-за того, что окно имеет свойство translateX(-50%),
			// то есть 0 по X у него не слева, а в центре.
			var
				x = (e.clientX - clickOffset[0] - modal.offsetWidth / 2 > 0 &&
			       e.clientX - clickOffset[0] + modal.offsetWidth / 2 < document.body.offsetWidth),
				y = (e.clientY - clickOffset[1] > 0 &&
			       e.clientY - clickOffset[1] + modal.offsetHeight < document.body.offsetHeight);
			if (x && y) {
				modal.style.left = e.clientX - clickOffset[0] + 'px';
				modal.style.top = e.clientY - clickOffset[1] + 'px';
			} else if (x) {
				modal.style.left = e.clientX - clickOffset[0] + 'px';
			} else if (y) {
				modal.style.top = e.clientY - clickOffset[1] + 'px';
			}
		}
		function stopMoving() {
			document.removeEventListener('mousemove', moveModal);
			setTimeout(function () { moving = false; }, 100);
		}
		
		if (!document.getElementById('modal')) {
			document.documentElement.className = 'lock';
			document.body.className = 'lock noselect';
			cover.className = 'modal-cover';
			cover.innerHTML = '<div class="modal" id="modal">' + close +
												'<div class="modal-header uppercase" id="modalHeader">' + params.header + '</div>' +
												'<div class="modal-content">' + params.content + '</div>' +
												createButtons() + '</div>';
			cover.style.opacity = 1;
			cover.addEventListener(click, tryToClose);
			if (params.buttons) {
				params.buttons.forEach(function (item, index) {
					document.getElementById('popup-btn' + index).addEventListener(click, function () {
						params.funcs[index]();
						hidePopup();
					});
				});
			}
			
			modal = document.getElementById('modal');
			modal.style.minWidth = modal.offsetWidth + 'px'; // Иначе при приближении к границе окна уменьшается ширина.
			modalHeader = document.getElementById('modalHeader');
			modalHeader.addEventListener('mousedown', function (e) {
				if (e.button === 0) {
					moving = true;
					clickOffset = [e.clientX - modal.offsetLeft, e.clientY - modal.offsetTop];
					document.addEventListener('mousemove', moveModal);
					document.addEventListener('mouseup', stopMoving);
				}
			});
		}
	}
	function rollBlock(wrapper, block, restore) {
		var
			style = window.getComputedStyle(block),
			margins = parseInt(style.marginTop, 10) + parseInt(style.marginBottom, 10);
		
		if (!parseInt(wrapper.style.maxHeight, 10)) {
			wrapper.style.maxHeight = block.offsetHeight + margins + 'px';
		} else if (restore) {
			wrapper.style.maxHeight = '0px';
		}
	}
	function setStepStatus(step, operation, status, restore) {
		var icon = document.getElementById('stp' + step + operation), i = 1, opsAmount;
		if (restore) {
			while (document.getElementById('stp' + step + i)) {
				icon = document.getElementById('stp' + step + i);
				icon.className = 'yellow icon-spin5 animate-spin';
				i += 1;
			}
		} else { icon.className = (status) ? 'green icon-ok' : 'red icon-cancel'; }
	}
	
	window.onerror = function () {
		showPopup({
			header:    'Ошибка',
			content:   msgs[msgs.length - 1], // Неопределенная ошибка всегда последняя в массиве msgs
			buttons:   ['Обновить страницу'],
			funcs:     [location.reload.bind(location, true)],
			closeable: false
		});
	};
	if (!(window.FileReader && document.body.style.flex !== undefined)) {
		showPopup({
			header: 'Ошибка',
			content: msgs[msgs.length - 2],
			closeable: false
		});
		return;
	}
	
	reader = new FileReader();
	
	Object.defineProperty(Object.prototype, 'shiftProperties', {
		value: function (from, step) {
			var i;
			if (Object.keys(this).length > 0) {
				for (i = Object.keys(this).length - 1; i >= from; i -= 1) {
					this[i + step] = this[i];
					delete this[i];
				}
			}
		}
	});
	
	input.addEventListener('change', function () {
		var field = document.getElementById('fileName');
		setStepStatus(1, 1, true, true); // Сброс иконок при нажатии кнопки загрузки.
		if (this.value) {
			field.innerHTML = 'Имя файла: ' + this.value.slice(this.value.lastIndexOf('\\') + 1);
		} else {
			field.innerHTML = '';
			// Сворачивает блок статуса обработки файла если файл не был выбран:
			rollBlock(document.getElementById('step1Progress-wrapper'), document.getElementById('step1Progress'), true);
		}
	});
	helpButton.addEventListener(click, function () { // (01)
		rollBlock(document.getElementById('help-wrapper'), document.getElementById('help-borders'), true);
	});
	uploadButton.addEventListener(click, function () {
		setStepStatus(1, 1, true, true); // Сброс иконок при нажатии кнопки загрузки.
		if (input.files[0]) {
			rollBlock(document.getElementById('step1Progress-wrapper'), document.getElementById('step1Progress'), false);
			setTimeout(function () { reader.readAsText(input.files[0], 'cp1251'); }, 600);
		}
	});
	libButton.addEventListener(click, function () {
		rollBlock(document.getElementById('libWrapper'), document.getElementById('lib'), true);
	});
	
	reader.onload = function () {
		var content;
		
		function createObject(string) { // (03)
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
			
			if (string.indexOf('ACCEL_ASCII') + 1) {
				setStepStatus(1, 1, true);
			} else {
				showPopup({
					header:    'Ошибка',
					content:   msgs[0],
					closeable: true
				});
				setStepStatus(1, 1, false);
				return;
			}
			try {
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
			} catch (err) {
				showPopup({
					header:    'Ошибка',
					content:   msgs[1],
					closeable: true
				});
				setStepStatus(1, 2, false);
				return;
			}
			if (Object.keys(obj).length > 4) {
				setStepStatus(1, 2, true);
			} else {
				showPopup({
					header:    'Ошибка',
					content:   msgs[1],
					closeable: true
				});
				setStepStatus(1, 2, false);
				return;
			}
			
			return obj;
		}
		
		content = createObject(this.result);
		if (!content) { return; }
		
		Object.defineProperties(content, {
			asArray: {
				value: function (a) {
					var array = [];
					function walker(object) {
						var i;
						for (i = 0; i < Object.keys(object).length; i += 1) {
							if (object.hasOwnProperty(i)) {
								if (typeof object[i] === 'object') {
									array.push(object[i].header);
									walker(object[i]);
								} else {
									array.push(object[i]);
								}
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
						prop, shiftX, shiftY, type, result = {}, side, sinA, vias = {},
						width, x, y, zero;
					
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
					
					try {
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
							type = (this['2'][i].header.indexOf('viaStyleDef') + 1) ?
									'via' : (this['2'][i].header.indexOf('padStyleDef') + 1) ?
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
						for (key in comp) { // (07)
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
						for (key in comp) { // (08)
							if (comp.hasOwnProperty(key)) {
								zero = comp[key].zero.split(' ');
								for (name in comp[key].pads) {
									if (comp[key].pads.hasOwnProperty(name)) {
										for (i = 0; i < comp[key].pads[name].length; i += 1) {
											shiftX = +comp[key].pads[name][i].split(' ')[0];
											shiftY = +comp[key].pads[name][i].split(' ')[1];
											side = pads[name].side;
											if (comp[key].rotation) {
												sinA = Math.sin(comp[key].rotation * Math.PI / 180);
												cosA = Math.cos(comp[key].rotation * Math.PI / 180);
												x = (shiftX * cosA - shiftY * sinA);
												y = (shiftY * cosA + shiftX * sinA);
											} else {
												x = shiftX;
												y = shiftY;
											}
											if (zero[2] === 'flipped') {
												x = -x;
												side = (pads[name].side === 'top') ?
														'bot' : (pads[name].side === 'bot') ?
														'top' : 'thru';
											}
											pads[name].coords.push((+zero[0] + x).toFixed(3) + ' ' +
																						 (+zero[1] + y).toFixed(3) + ' ' +
																						 side + ' ' + (+comp[key].pads[name][i].split(' ')[2]));
										}
									}
								}
							}
						}
						for (name in pads) { if (pads.hasOwnProperty(name)) { if (!pads[name].coords.length) { delete pads[name]; } } }
						for (name in vias) { if (vias.hasOwnProperty(name)) { if (!vias[name].coords.length) { delete vias[name]; } } }
					} catch (err) {
						showPopup({
							header:    'Ошибка',
							content:   msgs[2],
							closeable: true
						});
						setStepStatus(1, 3, false);
						return;
					}
					result.vias = vias;
					result.pads = pads;
					setStepStatus(1, 3, true);
					return result;
				}
			},
			addLayer: {
				value: function (layerName) { // (09)
					var i, j, layerNum, layers = [];
					
					function compareNumeric(a, b) {
						return a - b;
					}
					function getFreeLayerNum(array) {
						var i, result;
						for (i = 1; i < array.length; i += 1) {
							if (!array[i]) { result = i; }
						}
						return result || array.length;
					}
					
					for (i = 0; i < Object.keys(this['4']).length; i += 1) {
						if (typeof this['4'][i] === 'object' && this['4'][i].header.indexOf('(layerDef') + 1) {
							if (this['4'][i].header.slice(11, -1).toLowerCase() === layerName.toLowerCase()) {
								layerNum = +this['4'][i][0].slice(10, -1);
							} else {
								layers[+this['4'][i][0].slice(10, -1)] = true;
								if (typeof this['4'][i + 1] === 'object' && this['4'][i + 1].header.indexOf('(multiLayer') + 1) {
									layerNum = getFreeLayerNum(layers);
									this['4'].shiftProperties(i + 1, 1);
									this['4'][i + 1] = {};
									Object.defineProperties(this['4'][i + 1], {
										header: { value: '(layerDef \"' + layerName + '\"' },
										0:			{ value: '(layerNum ' + layerNum + ')', enumerable: true },
										1:			{ value: '(layerType NonSignal)', enumerable: true },
										2:			{ value: '(fieldSetRef \"(Default)\"))', enumerable: true }
									});
									i += 1;
								}
							}
						} else if (typeof this['4'][i] === 'object' && this['4'][i].header.indexOf('(layerContents') + 1) {
							this['4'].shiftProperties(i, 1);
							this['4'][i] = {};
							Object.defineProperty(this['4'][i], 'header', { value: '(layerContents (layerNumRef ' + layerNum + ')' });
							for (j = i + 1; j < Object.keys(this['4']).length; j += 1) {
								if (typeof this['4'][j] === 'object' && this['4'][j].header.indexOf('(layerNumRef ' + layerNum) + 1) {
									delete this['4'][j];
									break;
								}
							}
							break;
						}
					}
				}
			}
		});
		if (!content.getPads()) { return; }
	};
}());