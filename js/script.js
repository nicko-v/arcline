/*global FileReader */

(function () {
	'use strict';
	var
		helpButton = document.getElementById('helpButton'),
		input      = document.getElementById('file'),
		reader     = new FileReader(),
		click      = navigator.userAgent.toLowerCase().match(/iphone|ipod|ipad/) ? 'touchend' : 'click';
	
	/* Модальные окна */
	function hideModal() {
		var cover = document.getElementById('cover');
		
		cover.style.opacity = 0;
		setTimeout(function () { cover.innerHTML = ''; }, 100);
		setTimeout(function () {
			document.documentElement.className = '';
			document.body.className = '';
			cover.className = '';
		}, 300);
	}
	function showModal(header, content, buttons, values, isCloseable) {
		var
			close = (isCloseable) ? '<div class="modal-close">' +
															'<div class="modal-close-cross">' +
															'</div></div>' : '',
			cover = document.getElementById('cover'),
			clickOffset, modal, modalHeader, moving;
		
		function createButtons() {
			var i, result = '';
			if (buttons) {
				for (i = 0; i < buttons.length; i += 1) {
					result += '<button class="modal-button" type="button" value="' +
										values[i] + '">' + buttons[i] + '</button>';
				}
			}
			return result;
		}
		function tryToClose(e) { // (10)
			if (!moving) {
				if (e.target.className.match(/modal-cover|modal-close/)) {
					if (isCloseable) {
						hideModal();
					} else {
						modal.style.animation = 'reset 0 linear normal';
						setTimeout(function () { modal.style.animation = 'modal-swing 500ms ease-out normal'; }, 20);
					}
				}
			}
		}
		function moveModal(e) {
			modal.style.left = e.clientX - clickOffset[0] + 'px';
			modal.style.top = e.clientY - clickOffset[1] + 'px';
		}
		
		document.documentElement.className = 'lock';
		document.body.className = 'lock noselect';
		cover.className = 'modal-cover';
		cover.innerHTML = '<div class="modal">' + close +
											'<div class="modal-header uppercase">' + header + '</div>' +
											'<div class="modal-content">' + content + '</div>' +
											createButtons() + '</div>';
		cover.style.opacity = 1;
		cover.addEventListener(click, tryToClose);
		
		modal = document.getElementsByClassName('modal')[0];
		modalHeader = document.getElementsByClassName('modal-header')[0];
		modalHeader.addEventListener('mousedown', function (downEvent) {
			if (downEvent.button === 0) {
				moving = true;
				clickOffset = [downEvent.clientX - modal.offsetLeft,
											 downEvent.clientY - modal.offsetTop];
				document.addEventListener('mousemove', moveModal);
				document.addEventListener('mouseup', function () {
					document.removeEventListener('mousemove', moveModal);
					setTimeout(function () { moving = false; }, 100);
				});
			}
		});
	}
	/* -=-=-=- */
	
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
	helpButton.addEventListener(click, function () { // (01)
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
			if (Object.keys(obj).length < 5) { showError(1, 'firstStep'); return; }
			return obj;
		}
		
		content = handleInput(this.result);
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
					result.vias = vias;
					result.pads = pads;
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
		if (error) { return; } else { showError(-1, 'firstStep'); }
		document.getElementById('step2').style.display = 'flex';
		content.addLayer('Drill');
		window.console.log(content);
		window.console.log(content.getPads());
	};
	
	showModal('Sample header', 'Lorem ipsum dolor sit amet', ['Yes', 'No'], [1, 0], false);
}());