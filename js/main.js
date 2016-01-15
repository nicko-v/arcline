/*global Blob, FileReader, unescape, generateSVG, generateDXF, generateLayers */

(function () {
	'use strict';
	var
		reader        = new FileReader(),
		lib           = document.getElementById('lib'),
		tabs          = document.getElementById('tabs'),
		autoButton    = document.getElementById('auto'),
		input         = document.getElementById('file'),
		link          = document.getElementById('link'),
		startButton   = document.getElementById('start'),
		cover         = document.getElementById('cover'),
		uploadButton  = document.getElementById('upload'),
		tabPCB        = document.getElementById('tabPCB'),
		tabDXF        = document.getElementById('tabDXF'),
		version       = document.getElementById('version'),
		padsList      = document.getElementById('padsList'),
		icon          = document.getElementById('padsIcon'),
		descr         = document.getElementById('padsDescr'),
		libButton     = document.getElementById('libButton'),
		symbol        = document.getElementById('padsSymbol'),
		helpButton    = document.getElementById('helpButton'),
		clearButton   = document.getElementById('clearSymbol'),
		click         = navigator.userAgent.match(/iphone|ipod|ipad/i) ? 'touchend' : 'click',
		msgs          = ['Выбран некорректный файл. <br><br>Откройте .pcb в P-CAD и выполните следующее: <br><i>File -> Save as... -> Save as type: ASCII Files</i>',
		                 'Не удалось сформировать корректную структуру данных из файла. <br>Возможно файл содержит ошибки или непредусмотренные блоки.',
		                 'Не удалось распознать переходные отверстия или контактные площадки. <br>Возможно файл содержит ошибки или непредусмотренные блоки.',
		                 'Нельзя использовать круглые символы для прямоугольных контактных площадок. Пожалуйста, выберите другой символ.',
		                 'Закончились доступные символы. Попробуйте уменьшить количество контактных площадок на плате путем приведения площадок сходных размеров к одному типу.',
		                 'На плате присутствуют контактные площадки, расположенные не под прямым углом. К сожалению, символы для них нельзя нарисовать.<br><br>Количество площадок: ',
		                 'Не удалось сформировать таблицу отверстий. <br>Пожалуйста, сообщите разработчику какие действия к этому привели или передайте файл, вызвавший ошибку.',
		                 'Не удалось сформировать выходной .pcb файл. <br>Пожалуйста, сообщите разработчику какие действия к этому привели или передайте файл, вызвавший ошибку.',
		                 'Используемый браузер не поддерживает необходимый для работы приложения функционал. <br>Пожалуйста, установите свежую версию Chrome, Firefox или Opera.',
		                 'Произошла непредвиденная ошибка. <br>Пожалуйста, сообщите разработчику какие действия к этому привели или передайте файл, вызвавший ошибку.',
		                 'Не удалось распознать контур платы, будет построена только таблица отверстий - без сборочного чертежа и проводящих рисунков. <br><br>Пожалуйста, убедитесь, что контур платы существует и находится в слое Board.',
		                 'Не удалось получить информацию о трассировке. Возможно файл содержит ошибки или непредусмотренные значения.'],
		symbolsAmount = [30, 30], // Количество символов - круглые и прямоугольные
		freeSymbolsAm = { rnd: symbolsAmount[0], rect: symbolsAmount[1] }, // Используется для проверки необходимости отрисовки и показа кнопки автоподбора
		drillViews = 1, padsDescriptions, padsLib, activeRow, file, fileContent, pcbOutputContent, dxfOutputContent, pcbLink, dxfLink,
		boardOutline, routes, output = {};

	function hidePopup() {
		cover.style.opacity = 0;
		setTimeout(function () { cover.innerHTML = ''; }, 100);
		setTimeout(function () {
			document.body.classList.remove('lock');
			cover.classList.remove('popup-cover');
		}, 300);
	}
	function showPopup(params) { // Принимает объект с ключами: заголовок, текст, кнопки, функции кнопок, закрываемость. Ключи могут отсутствовать.
		var clickOffset, popup, close, header, content, moving;
		
		function tryToClose(e) {
			if (!moving && e.target.className.match(/popup-cover|popup-close/)) {
				if (params.closeable) {
					hidePopup();
					cover.onclick = tryToClose;
				} else {
					popup.style.animation = 'reset 0 linear normal';
					setTimeout(function () { popup.style.animation = 'popup-swing 500ms ease-out normal'; }, 20);
				}
			}
		}
		function movePopup(e) {
			// offsetWidth делится пополам из-за того, что окно имеет свойство translateX(-50%),
			// то есть 0 по X у него не слева, а в центре.
			var // Что бы не уходило за края страницы:
				x = (e.clientX - clickOffset[0] - popup.offsetWidth / 2 > 0 &&
			       e.clientX - clickOffset[0] + popup.offsetWidth / 2 < document.body.offsetWidth),
				y = (e.clientY - clickOffset[1] > 0 &&
			       e.clientY - clickOffset[1] + popup.offsetHeight < document.body.offsetHeight);
			if (x && y) { // Если мышь находится в пределах страницы, то символ двигается по обеим осям:
				popup.style.left = e.clientX - clickOffset[0] + 'px';
				popup.style.top = e.clientY - clickOffset[1] + 'px';
			} else if (x) { // Если мышь находится за пределами страницы по высоте, то символ может двигаться только по длине:
				popup.style.left = e.clientX - clickOffset[0] + 'px';
			} else if (y) { // Наоборот:
				popup.style.top = e.clientY - clickOffset[1] + 'px';
			}
		}
		function stopMoving() {
			document.removeEventListener('mousemove', movePopup);
			setTimeout(function () { moving = false; }, 100);
		}
		
		cover.innerHTML = '';
		
		cover.classList.add('popup-cover'); // Класс с затемненным фоном и блокировкой прокрутки
		
		popup = document.createElement('div');
		popup.classList.add('popup');
		
		header = document.createElement('div');
		header.classList.add('uppercase');
		header.classList.add('popup-header');
		header.innerHTML = params.header;
		
		content = document.createElement('div');
		content.classList.add('popup-content');
		content.innerHTML = params.content;
		
		popup.appendChild(header);
		popup.appendChild(content);
		
		if (params.buttons) { // Если у окошка должны быть кнопки
			params.buttons.forEach(function (name, index) {
				var button = document.createElement('button');
				
				button.classList.add('popup-button');
				button.innerHTML = name;
				button.addEventListener(click, function () { params.funcs[index](); hidePopup(); });
				popup.appendChild(button);
			});
		}
		if (params.closeable) { // Если нужен закрывающий крестик
			close = document.createElement('div');
			close.classList.add('popup-close');
			close.appendChild(document.createElement('div'));
			close.firstChild.classList.add('popup-close-cross');
			popup.appendChild(close);
		}
		
		document.body.classList.add('lock');
		cover.style.opacity = 1;
		cover.appendChild(popup);
		popup.style.top = window.scrollY + window.innerHeight / 3 + 'px'; // Что бы показывалось относительно прокрученной страницы
		popup.style.minWidth = popup.style.maxWidth = popup.offsetWidth + 'px'; // Иначе при приближении к границе окна уменьшается ширина.
		
		cover.onclick = tryToClose;
		header.addEventListener('mousedown', function (e) {
			if (e.button === 0) {
				moving = true;
				clickOffset = [e.clientX - popup.offsetLeft, e.clientY - popup.offsetTop];
				document.addEventListener('mousemove', movePopup);
				document.addEventListener('mouseup', stopMoving);
			}
		});
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
	function setStepStatus(operation, status, stop, restore) {
		var icon = document.getElementById('op' + operation), opsAmount;
		
		function setToAll(n, cls, title) { // Ставит классы cls всем элементам, начиная с заданного n
			var i;
			
			while (document.getElementById('op' + n)) {
				icon = document.getElementById('op' + n);
				icon.className = 'cleanstate';
				icon.title = title;
				for (i = 0; i < cls.length; i += 1) { icon.classList.add(cls[i]); }
				n += 1;
			}
		}
		
		if (restore) { // Если передан флаг восстановления статусов (например при выборе нового файла)
			setToAll(1, ['yellow', 'icon-spin5', 'animate-spin'], 'Ожидание');
		} else {
			icon.className = 'cleanstate';
			if (status) {
				icon.classList.add('green');
				icon.classList.add('icon-ok');
				icon.title = 'Выполнено успешно';
			} else {
				icon.classList.add('red');
				icon.classList.add('icon-cancel');
				icon.title = 'Ошибка при выполнении';
				if (stop) { setToAll(operation + 1, ['red', 'icon-stop'], 'Операция не выполнялась'); }
			}
		}
	}
	function parseInputFile(string) {
		var arr, replacements = {}, obj = {}, currLevel = obj;
		
		function Branch(string) {
			Object.defineProperties(this, {
				header: {value: string, enumerable: false},
				parent: {value: currLevel, enumerable: false}
			});
		}
		function calcBrackets(string) {
			var leftBrackets = 0, quote = 0, bracketsPositions = [], result = { down: 0, strings: [] }, noCyrillicString = '', i;
			
			for (i = 0; i < string.length; i += 1) {
				// Неэкранированная кавычка - начало или конец какого-то названия, экранированная - его часть, т.е. находится внутри другой пары кавычек:
				if (string[i] === '\"' && string[i - 1] !== '\\') { quote += 1; }
				// Если символ кириллический - заменяет на транслит, иначе файл может не открыться
				if (replacements[string[i].toLowerCase()]) { noCyrillicString += replacements[string[i].toLowerCase()]; } else { noCyrillicString += string[i]; }
				
				if (quote % 2 === 0) { // Говорит о том, что скобка находится вне кавычек, т.е. является частью разметки, а не названия
					if (string[i] === '(') {
						leftBrackets += 1;
						bracketsPositions.push(i);
					} else if (string[i] === ')') {
						leftBrackets -= 1;
						bracketsPositions.pop();
					}
				}
			}
			
			bracketsPositions.forEach(function (pos, index) {
				result.strings.push(noCyrillicString.slice(pos, bracketsPositions[index + 1] || noCyrillicString.length));
			});
			
			if (!result.strings.length) { result.strings.push(noCyrillicString); } // Если строку не пришлось делить - записываем изначальную (с заменой на транслит где надо)
			result.down = leftBrackets; // На столько шагов надо подняться по списку вверх (если закрывающих скобок было больше)
			return result;
		}
		
		Object.defineProperties(replacements, {
			'а': { value: 'a' },
			'б': { value: 'b' },
			'в': { value: 'v' },
			'г': { value: 'g' },
			'д': { value: 'd' },
			'е': { value: 'e' },
			'ё': { value: 'e' },
			'ж': { value: 'z' },
			'з': { value: 'z' },
			'и': { value: 'i' },
			'й': { value: 'i' },
			'к': { value: 'k' },
			'л': { value: 'l' },
			'м': { value: 'm' },
			'н': { value: 'n' },
			'о': { value: 'o' },
			'п': { value: 'p' },
			'р': { value: 'r' },
			'с': { value: 's' },
			'т': { value: 't' },
			'у': { value: 'u' },
			'ф': { value: 'f' },
			'х': { value: 'h' },
			'ц': { value: 'c' },
			'ч': { value: 'h' },
			'ш': { value: 's' },
			'щ': { value: 'h' },
			'ъ': { value: 'b' },
			'ы': { value: 'i' },
			'ь': { value: 'b' },
			'э': { value: 'e' },
			'ю': { value: 'u' },
			'я': { value: 'a' }
		});
		
		if (string.indexOf('ACCEL_ASCII') + 1) {
			setStepStatus(1, true);
		} else {
			showPopup({
				header: 'Ошибка',
				content: msgs[0],
				closeable: true
			});
			setStepStatus(1, false, true);
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
				var n = Object.keys(currLevel).length, i = 1, levels;
				
				levels = calcBrackets(string);
				if (levels.down > 0) {
					levels.strings.forEach(function (str) {
						currLevel[n] = new Branch(str);
						currLevel = currLevel[n];
						n = Object.keys(currLevel).length;
					});
				} else {
					currLevel[n] = levels.strings[0];
					while (i <= Math.abs(levels.down)) {
						currLevel = currLevel.parent;
						i += 1;
					}
				}
			});
		} catch (err) {
			showPopup({
				header: 'Ошибка',
				content: msgs[1],
				closeable: true
			});
			setStepStatus(2, false, true);
			return;
		}
		if (Object.keys(obj).length > 4) {
			setStepStatus(2, true);
		} else {
			showPopup({
				header: 'Ошибка',
				content: msgs[1],
				closeable: true
			});
			setStepStatus(2, false, true);
			return;
		}
		
		return obj;
	}
	function createPadsDescr(lib) {
		var
			bgdColor = window.getComputedStyle(document.getElementById('padsViewer')).backgroundColor,
			result = {}, i = 0;
		
		function collectInfo(object, type) {
			var key, width, height, hole, amount, border, radius, color;

			for (key in object) {
				if (object.hasOwnProperty(key)) {
					
					width  = (object[key].width > object[key].height) ? object[key].width : object[key].height;
					height = (object[key].width > object[key].height) ? object[key].height : object[key].width;
					amount = object[key].coords.length;
					hole   = object[key].hole;
					border = (hole === width) ? '2px solid #666' : 'none';
					color  = (hole) ? bgdColor : '#7c4e22';
					radius = 0;
					result['r' + i] = {};
					
					if (object[key].shape.match(/ellipse|oval|mthole|target/i)) {
						
						if (width === height) {
							if (hole > 0 && width !== hole) {
								result['r' + i].descr = '<p>Площадка: ' + width + 'мм</p>' +
								                        '<p>Отверстие: ' + hole + 'мм</p>' +
								                        '<p>Количество: ' + amount + '</p>';
							} else if (hole === 0) {
								result['r' + i].descr = '<p>Площадка: ' + width + 'мм</p>' +
								                        '<p>Количество: ' + amount + '</p>';
							} else if (width === hole) {
								result['r' + i].descr = '<p>Отверстие: ' + hole + 'мм</p>' +
								                        '<p>Количество: ' + amount + '</p>';
							}
						} else if (width !== height) {
							if (hole > 0) {
								result['r' + i].descr = '<p>Длина: ' + width + 'мм</p>' +
								                        '<p>Ширина: ' + height + 'мм</p>' +
								                        '<p>Отверстие: ' + hole + 'мм</p>' +
								                        '<p>Количество: ' + amount + '</p>';
							} else if (hole === 0) {
								result['r' + i].descr = '<p>Длина: ' + width + 'мм</p>' +
								                        '<p>Ширина: ' + height + 'мм</p>' +
								                        '<p>Количество: ' + amount + '</p>';
							} else if (width === hole) {
								result['r' + i].descr = '<p>Длина отверстия: ' + width + 'мм</p>' +
								                        '<p>Ширина отверстия: ' + height + 'мм</p>' +
								                        '<p>Количество: ' + amount + '</p>';
							}
						}
						radius = 50;
						
					} else if (object[key].shape.match(/rect|rndrect/i)) {
						
						if (hole > 0) {
							result['r' + i].descr = '<p>Длина: ' + width + 'мм</p>' +
							                        '<p>Ширина: ' + height + 'мм</p>' +
							                        '<p>Отверстие: ' + hole + 'мм</p>' +
							                        '<p>Количество: ' + amount + '</p>';
						} else if (hole === 0) {
							result['r' + i].descr = '<p>Длина: ' + width + 'мм</p>' +
							                        '<p>Ширина: ' + height + 'мм</p>' +
							                        '<p>Количество: ' + amount + '</p>';
						}
					}
					
					if (width > 0 && height > 0) {
						result['r' + i].imageCode = '<div style="display: flex;' +
						                                        'align-items: center;' +
						                                        'justify-content: center;' +
						                                        'position: relative;' +
							                                      'background-color: #7c4e22;' +
							                                      'width: 100px;' +
						                                        'height: ' + (100 / width * height).toFixed(3) + 'px;' +
						                                        'border-radius: ' + radius + 'px;">' +
							                          '<div style="background-color: ' + color + ';' +
						                                        'display: flex;' +
						                                        'align-items: center;' +
						                                        'justify-content: center;' +
						                                        'box-sizing: border-box;' +
						                                        'border: ' + border + ';' +
						                                        'border-radius: 50px;' +
							                                      'width: ' + (100 / width * hole).toFixed(3) + 'px;' +
							                                      'height: ' + (100 / width * hole).toFixed(3) + 'px;">' +
							                          '</div></div>';
					} else {
						result['r' + i].imageCode = '<i class="icon-help" style="font-size: 90px;"></i>';
					}
					result['r' + i].ratio = width / height; // Сохраняется соотношение сторон (или диаметров) для дальнейшего масштабирования символа
					result['r' + i].shape = (!object[key].shape.match(/rect|rndrect/i) && width / height === 1) ? 'rnd' : 'rect';
					result['r' + i].type = type;
					result['r' + i].name = key;
					i += 1;
				}
			}
		}
		
		collectInfo(lib.vias, 'vias');
		collectInfo(lib.pads, 'pads');
		return result;
	}
	function createPadsList(lib) {
		var i = 0;
		
		function getNames(object, v) { // Флаг v для объекта с via, что бы добавить соответствующее описание
			var key, usage, status, same, result = '';
			
			for (key in object) {
				if (object.hasOwnProperty(key)) {
					
					if (object[key].comps) {
						usage = '<span style="color: #666;" title="используется в перечисленных компонентах">(' + object[key].comps.join(', ') + ')</span>';
					} else { usage = (v) ? '<span style="color: #666;">(переходное отверстие)</span>' :
					                       '<span style="color: #666;">(используется самостоятельно)</span>'; }
					
					status = (object[key].width > 0 && object[key].height > 0) ? 'icon-help step2-actions-pads-list-row-status yellow' : 'icon-cancel step2-actions-pads-list-row-status red';
					if (object[key].same.length) {
						same = '<span style="color: #666;" title="объединено с перечисленными КП"> (' + object[key].same.join(', ') + ')</span>';
						usage = '<br />' + usage;
					} else { same = false; }
					
					result += '<div id="r' + i + '" class="step2-actions-pads-list-row">' +
					          '<span class="' + status + '"></span>' + key + (same || ' ') + usage +
					          '</div>';
					i += 1;
				}
			}
			return result;
		}
		
		padsDescriptions = createPadsDescr(lib);
		padsList.innerHTML = getNames(lib.vias, 1) + getNames(lib.pads);
		icon.innerHTML = 'Выберите контактную площадку из списка.';
	}
	function resetChanges() {
		var i = 1;
		
		clearButton.style.display = 'none';
		autoButton.style.display = 'none';
		padsList.innerHTML = '';
		symbol.innerHTML = '';
		descr.innerHTML = '';
		icon.innerHTML = '';
		activeRow = null;
		padsLib = {};
		fileContent = {};
		padsDescriptions = {};
		freeSymbolsAm = { rnd: symbolsAmount[0], rect: symbolsAmount[1] };
		
		while (document.getElementById('rnd' + i)) { document.getElementById('rnd' + i).style.display = 'block'; i += 1; }
		i = 1;
		while (document.getElementById('rect' + i)) { document.getElementById('rect' + i).style.display = 'block'; i += 1; }
		
		if (output.pcb) { document.getElementById('result').removeChild(output.pcb); }
		if (output.dxf) { document.getElementById('result').removeChild(output.dxf); }
		link.innerHTML = '';
		pcbOutputContent = '';
		dxfOutputContent = '';
		output = {};
		link.nextElementSibling.style.display = 'none';
		tabDXF.classList.remove('step3-actions-headers-header-active');
		tabPCB.classList.add('step3-actions-headers-header-active');
	}
	
	if (!window.FileReader || document.body.style.flex === undefined) {
		showPopup({
			header: 'Ошибка',
			content: msgs[8],
			closeable: false
		});
		return;
	}
	
	window.addEventListener('error', function () {
		showPopup({
			header:    'Ошибка',
			content:   msgs[9],
			buttons:   ['Обновить страницу'],
			funcs:     [location.reload.bind(location, true)],
			closeable: false
		});
	});
	window.addEventListener('load', function () { // Добавление символов в библиотеку
		var rndGroup, rectGroup, symbol, i, favicon;
		
		setTimeout(function () { document.body.scrollTop = 0; }, 200);
		
		favicon = document.createElement('link');
		favicon.rel = 'icon';
		favicon.type = 'image/x-icon';
		favicon.href = 'data:image/x-icon;base64,AAABAAEAEBAQAAEABAAoAQAAFgAAACgAAAAQAAAAIAAAAAEABAAAAAAAgAAAAAAAA' +
		               'AAAAAAAEAAAAAAAAAAAAAAAh0YAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
		               'AAAAAAAAAAAAAAAABEREQAAAAAREBEBEQAAARAAEQABEAARAAARAAARABAAABEAAAEBEAAAEQAAAREAAAARAAAAERE' +
		               'REREREREREREREREREREAAAARAAAAERAAABEAAAEQEAAAEQAAAQARAAARAAARAAEQABEAARAAABEQEQERAAAAABERE' +
		               'QAAD4HwAA4kcAAM5zAACeeQAAvn0AAD58AAB+fgAAAAAAAAAAAAB+fgAAPnwAAL59AACeeQAAznMAAOJHAAD4HwAA';
		document.getElementsByTagName('head')[0].appendChild(favicon);
		
		rndGroup = document.createElement('div');
		rndGroup.classList.add('step2-actions-lib-group');
		rectGroup = document.createElement('div');
		rectGroup.classList.add('step2-actions-lib-group');
		
		for (i = 1; i <= symbolsAmount[0]; i += 1) {
			symbol = document.createElement('div');
			symbol.classList.add('step2-actions-lib-group-symbol');
			symbol.innerHTML = generateSVG(50, 50, 'rnd' + i, 1);
			symbol.id = 'rnd' + i;
			rndGroup.appendChild(symbol);
		}
		for (i = 1; i <= symbolsAmount[1]; i += 1) {
			symbol = document.createElement('div');
			symbol.classList.add('step2-actions-lib-group-symbol');
			symbol.innerHTML = generateSVG(50, 50, 'rect' + i, 1);
			symbol.id = 'rect' + i;
			rectGroup.appendChild(symbol);
		}
		
		lib.appendChild(rndGroup);
		lib.appendChild(rectGroup);
	});
	version.addEventListener(click, function () {
		showPopup({
			header: 'Список изменений',
			content: 'Версия от 10.01.2016:' +
			         '<ul>' +
			         '<li>Добавлена кнопка информации о версии.</li>' +
			         '<li>Добавлена отрисовка сборочных чертежей.</li>' +
			         '<li>Добавлены инструкция и советы по использованию.</li>' +
			         '</ul>',
			closeable: true
		});
	});
	input.addEventListener('change', function () {
		if (input.value) { // Если был выбран файл
			setStepStatus(1, true, false, true); // Сброс иконок при нажатии кнопки загрузки.
			file = input.files[0];
			document.getElementById('fileName').innerHTML = '<p>Название: <span style="color:#666;">' + file.name + '</span></p>' +
			                                                '<p>Состояние: <span style="color:#666;">выбран, не подтвержден</span></p>';
		}
	});
	helpButton.addEventListener(click, function () {
		rollBlock(document.getElementById('help-wrapper'), document.getElementById('help-borders'), true);
	});
	uploadButton.addEventListener(click, function () {
		setStepStatus(1, true, false, true); // Сброс иконок при нажатии кнопки загрузки.
		
		if (padsList.innerHTML) { resetChanges(); }
		
		if (file) {
			rollBlock(document.getElementById('step1Progress-wrapper'), document.getElementById('step1Progress'), false);
			document.getElementById('fileName').innerHTML = '<p>Название: <span style="color:#666;">' + file.name + '</span></p>' +
			                                                '<p>Состояние: <span style="color:#666;">подтвержден, загружен</span></p>';
			setTimeout(function () { reader.readAsText(file, 'cp1251'); }, 600);
		}
	});
	libButton.addEventListener(click, function () {
		document.getElementById('libWrapper').classList.toggle('step2-actions-lib-wrapper-JS_toggle_margin');
		rollBlock(document.getElementById('libWrapper'), document.getElementById('lib'), true);
		libButton.classList.toggle('icon-down-open');
		libButton.classList.toggle('icon-up-open');
	});
	clearButton.addEventListener(click, function () {
		var status;
		
		if (!activeRow || !padsDescriptions[activeRow.id].symbolCode) { return; }
		
		status = activeRow.firstChild;
		
		document.getElementById(padsDescriptions[activeRow.id].symbol).style.display = 'flex';
		clearButton.style.display = 'none';
		autoButton.style.display = 'block';
		symbol.innerHTML = 'Выберите символ из библиотеки.';
		status.classList.remove('icon-ok');
		status.classList.remove('green');
		status.classList.add('icon-help');
		status.classList.add('yellow');
		
		freeSymbolsAm[padsDescriptions[activeRow.id].shape] += 1;
		
		delete padsDescriptions[activeRow.id].symbol;
		delete padsDescriptions[activeRow.id].symbolCode;
	});
	autoButton.addEventListener(click, function () {
		var i = 1, noSymbs, freeSymbols = { rnd: [], rect: [] };
		
		for (i = 1; i <= symbolsAmount[0]; i += 1) { // Поиск еще не занятых символов
			if (document.getElementById('rnd' + i).style.display !== 'none') { freeSymbols.rnd.push('rnd' + i); }
		}
		for (i = 1; i <= symbolsAmount[1]; i += 1) {
			if (document.getElementById('rect' + i).style.display !== 'none') { freeSymbols.rect.push('rect' + i); }
		}
		
		i = 0;
		while (padsDescriptions['r' + i]) {
			if (!padsDescriptions['r' + i].symbolCode) { // Если еще не назначен символ
				if (padsDescriptions['r' + i].shape === 'rnd' && freeSymbols.rnd.length && padsDescriptions['r' + i].ratio > 0) { // Если круглая КП
					
					padsDescriptions['r' + i].symbol = freeSymbols.rnd[0]; // Берем первый свободный символ нужного типа
					padsDescriptions['r' + i].symbolCode = generateSVG(100, 100, freeSymbols.rnd[0], 2); // Генерируем для него svg
					document.getElementById(freeSymbols.rnd[0]).style.display = 'none'; // Прячем выбранный символ в библиотеке
					freeSymbols.rnd.shift(); // Удаляем из массива уже не свободный символ
					
					document.getElementById('r' + i).firstChild.classList.remove('icon-help'); // Добавляем галочку на соответствующую строку списка КП
					document.getElementById('r' + i).firstChild.classList.remove('yellow');
					document.getElementById('r' + i).firstChild.classList.add('icon-ok');
					document.getElementById('r' + i).firstChild.classList.add('green');
					freeSymbolsAm.rnd -= 1; // Уменьшаем остаток символов
					
				} else if (padsDescriptions['r' + i].shape === 'rect' && freeSymbols.rect.length && padsDescriptions['r' + i].ratio) {
					
					padsDescriptions['r' + i].symbol = freeSymbols.rect[0];
					padsDescriptions['r' + i].symbolCode = generateSVG(100, 100 / padsDescriptions['r' + i].ratio, freeSymbols.rect[0], 2);
					document.getElementById(freeSymbols.rect[0]).style.display = 'none';
					freeSymbols.rect.shift();
					
					document.getElementById('r' + i).firstChild.classList.remove('icon-help');
					document.getElementById('r' + i).firstChild.classList.remove('yellow');
					document.getElementById('r' + i).firstChild.classList.add('icon-ok');
					document.getElementById('r' + i).firstChild.classList.add('green');
					freeSymbolsAm.rect -= 1; // Уменьшаем остаток символов
					
				} else if (freeSymbols.rnd.length === 0 || freeSymbols.rect.length === 0) { noSymbs = true; }
				
			}
			i += 1;
		}
		if (noSymbs) {
			showPopup({
				header: 'Предупреждение',
				content: msgs[4],
				buttons: ['OK'],
				funcs: [hidePopup],
				closeable: true
			});
		}
		autoButton.style.display = 'none';
		clearButton.style.display = (padsDescriptions[activeRow.id].symbolCode) ? 'flex' : 'none';
		symbol.innerHTML = padsDescriptions[activeRow.id].symbolCode || 'Выберите символ из библиотеки.'; // Показываем сгенерированный символ в окошке
	});
	startButton.addEventListener(click, function () {
		var key, layers, fileName, selectText, symbols = { metallized: {}, nonMetallized: {}, holes: {} };
		
		function dotToComma(a) {
			if (a) { // Если 0 - не форматирует
				a = (Math.round(a * 100) / 100).toString().split('.').join(',');
				if (!a.match(/\,|\./)) { a += ',0'; }
			}
			return a;
		}
		function calcMountSize(pad, padSize) {
			var width = (pad.width > pad.height) ? pad.width : pad.height, height = (pad.width > pad.height) ? pad.height : pad.width;
			
			if (padSize) {
				return (pad.shape.match(/ellipse|oval/i) && width === height) ? '%%C' + dotToComma(width + 0.2) : dotToComma(width + 0.2) + 'x' + dotToComma(height + 0.2);
			} else { return false; }
		}
		function calcHoleSize(pad) {
			return (pad.shape.match(/mthole|target/i)) ? '%%C' + dotToComma(pad.width) : (pad.hole) ? '%%C' + dotToComma(pad.hole) : false;
		}
		function calcPadSize(pad) {
			var width = (pad.width > pad.height) ? pad.width : pad.height, height = (pad.width > pad.height) ? pad.height : pad.width;
			
			switch (pad.shape) {
			case 'ellipse':
			case 'oval':
				if (width === height) {
					return (pad.hole < width) ? '%%C' + dotToComma(width) : false;
				} else {
					return dotToComma(width) + 'x' + dotToComma(height);
				}
			case 'mthole':
			case 'target':
				return false;
			case 'rect':
			case 'rndrect':
				return dotToComma(width) + 'x' + dotToComma(height);
			default:
				return false;
			}
		}
		function calcRatio(pad) {
			return (pad.width > pad.height) ? pad.width / pad.height : pad.height / pad.width;
		}
		function prepareSymbolsInfo(lib, newLib) {
			var key, path;
			
			for (key in lib) {
				if (lib.hasOwnProperty(key) && lib[key].symbol) {
					path = (lib[key].shape.match(/mthole|target/i) || lib[key].hole === lib[key].width) ? newLib.holes : (lib[key].pth) ? newLib.metallized : newLib.nonMetallized;
					
					path[lib[key].symbol] = {};
					Object.defineProperties(path[lib[key].symbol], {
						amount: { value: lib[key].coords.length },
						hole:   { value: calcHoleSize(lib[key]) },
						pad:    { value: calcPadSize(lib[key]) },
						ratio:  { value: calcRatio(lib[key]) },
						coords: { value: lib[key].coords },
						width:  { value: lib[key].width },
						height: { value: lib[key].height }
					});
					Object.defineProperty(path[lib[key].symbol], 'mount', {
						value: calcMountSize(lib[key], path[lib[key].symbol].pad)
					});
				}
			}
		}
		
		if (freeSymbolsAm.rnd === symbolsAmount[0] && freeSymbolsAm.rect === symbolsAmount[1]) { return; } // Ничего не делать если не было назначено ни одного символа
		
		for (key in padsDescriptions) { // Записываем выбранные символы в объект с информацией о КП
			if (padsDescriptions.hasOwnProperty(key)) {
				padsLib[padsDescriptions[key].type][padsDescriptions[key].name].symbol = padsDescriptions[key].symbol;
			}
		}
		layers = generateLayers(padsLib);
		if (layers.skipped) {
			showPopup({
				header: 'Предупреждение',
				content: msgs[5] + layers.skipped,
				buttons: ['OK'],
				funcs: [hidePopup],
				closeable: true
			});
		}
		
		if (layers.thru.length) { fileContent.addLayer('Drill', layers.thru); }
		if (layers.top.length) { fileContent.addLayer('DrillTop', layers.top); }
		if (layers.bot.length) { fileContent.addLayer('DrillBot', layers.bot); }
		
		fileName = (file.name.match(/\.pcb$/i)) ? file.name.slice(0, -4) : file.name;
		
		try {
			pcbOutputContent = document.createElement('pre');
			pcbOutputContent.innerHTML = fileContent.asArray().join(String.fromCharCode(10));
		} catch (error) {
			showPopup({
				header: 'Ошибка',
				content: msgs[7],
				buttons: ['OK'],
				funcs: [hidePopup],
				closeable: true
			});
			return;
		}
		
		try {
			prepareSymbolsInfo(padsLib.vias, symbols);
			prepareSymbolsInfo(padsLib.pads, symbols);
			dxfOutputContent = document.createElement('pre');
			dxfOutputContent.innerHTML = generateDXF(symbols, boardOutline, drillViews).join(String.fromCharCode(10));
		} catch (err) {
			showPopup({
				header: 'Ошибка',
				content: msgs[6],
				buttons: ['OK'],
				funcs: [hidePopup],
				closeable: true
			});
			return;
		}
		
		if (document.createElement('a').download !== undefined) { // Атрибут download не поддерживают IE и Safari
			pcbLink = document.createElement('a');
			pcbLink.href = window.URL.createObjectURL(new Blob([pcbOutputContent.innerHTML], { type: 'text/plain' }));
			pcbLink.download = fileName + '_DRILL.pcb';
			pcbLink.classList.add('step3-actions-tabContent-link');
			pcbLink.innerHTML = 'Сохранить .pcb файл';
			
			dxfLink = document.createElement('a');
			dxfLink.href = window.URL.createObjectURL(new Blob([dxfOutputContent.innerHTML], { type: 'text/plain' }));
			dxfLink.download = fileName + '_SB.dxf';
			dxfLink.classList.add('step3-actions-tabContent-link');
			dxfLink.innerHTML = 'Сохранить .dxf файл';
		}
		
		output.pcb = document.createElement('div');
		output.dxf = document.createElement('div');
		output.pcb.appendChild(pcbOutputContent);
		output.dxf.appendChild(dxfOutputContent);
		
		output.dxf.style.display = 'none';
		
		tabDXF.classList.remove('step3-actions-headers-header-active');
		tabPCB.classList.add('step3-actions-headers-header-active');
		
		document.getElementById('result').appendChild(output.pcb);
		document.getElementById('result').appendChild(output.dxf);
		
		selectText = document.createElement('span');
		selectText.style.fontSize = '1.4rem';
		selectText.style.color = '#666';
		selectText.innerHTML = 'Выделить текст: Ctrl+A';
		
		if (pcbLink) { link.appendChild(pcbLink); }
		link.appendChild(selectText);
		link.nextElementSibling.style.display = 'block';
	});
	padsList.addEventListener(click, function (e) {
		var row = e.target;
		
		if (e.target.id !== 'padsList') { // Если клик не на обертке списка, а на строке внутри.
			while (!row.classList.contains('step2-actions-pads-list-row')) { row = row.parentElement; }
			[].forEach.call(document.getElementsByClassName('step2-actions-pads-list-rowActive'), function (elem) {
				if (elem !== row) { elem.classList.remove('step2-actions-pads-list-rowActive'); }
			});
			if (row.classList.contains('step2-actions-pads-list-rowActive')) { // Если клик по уже активной строке
				row.classList.remove('step2-actions-pads-list-rowActive'); // Снимаем выделение
				icon.innerHTML = 'Выберите контактную площадку из списка.'; // Убираем иконку, символ и описание
				symbol.innerHTML = '';
				descr.innerHTML = '';
				activeRow = null;
				clearButton.style.display = 'none';
				autoButton.style.display = 'none';
			} else {
				row.classList.add('step2-actions-pads-list-rowActive');
				icon.innerHTML = padsDescriptions[row.id].imageCode;
				if (padsDescriptions[row.id].symbolCode) {
					symbol.innerHTML = padsDescriptions[row.id].symbolCode;
				} else {
					symbol.innerHTML = (padsDescriptions[row.id].ratio > 0) ? 'Выберите символ из библиотеки.' : 'Не удалось распознать размеры КП.';
				}
				descr.innerHTML = padsDescriptions[row.id].descr;
				activeRow = row;
				clearButton.style.display = (padsDescriptions[row.id].symbolCode) ? 'flex' : 'none';
				autoButton.style.display = (!padsDescriptions[row.id].symbolCode && freeSymbolsAm[padsDescriptions[row.id].shape] > 0 && padsDescriptions[row.id].ratio > 0) ? 'block' : 'none';
			}
		}
	});
	lib.addEventListener(click, function (e) {
		var status, libSymbol = e.target, i = 0;
		
		while (i < 3) { // Клик может попасть на path, svg или div - ищем именно div с нужным id
			if (libSymbol.id && libSymbol.id.match(/(rnd|rect)\d+/i)) { break; } else { libSymbol = libSymbol.parentNode; }
			i += 1;
		}
		
		if (!activeRow || !libSymbol.id || !libSymbol.id.match(/(rnd|rect)\d+/i)) { return; } // Если клик не по символу или нет активной КП
		if (libSymbol.id.match(/rnd\d+/i) && (padsDescriptions[activeRow.id].ratio !== 1 || padsDescriptions[activeRow.id].shape === 'rect')) { // При попытке наложения круглого символа на не круглую КП
			showPopup({
				header: 'Сообщение',
				content: msgs[3],
				buttons: ['ОК'],
				funcs: [hidePopup],
				closeable: true
			});
			return;
		}
		
		if (padsDescriptions[activeRow.id].symbolCode) { // Если символ уже назначен
			document.getElementById(padsDescriptions[activeRow.id].symbol).style.display = 'flex';
			freeSymbolsAm[padsDescriptions[activeRow.id].shape] += 1; // Увеличиваем количество оставшихся символов, т.к. далее оно уменьшится
		}
		
		libSymbol.style.display = 'none';
		autoButton.style.display = 'none';
		symbol.innerHTML = generateSVG(100, 100 / padsDescriptions[activeRow.id].ratio, libSymbol.id, 2);
		clearButton.style.display = 'flex';
		
		status = activeRow.firstChild;
		status.classList.remove('icon-help');
		status.classList.remove('yellow');
		status.classList.add('icon-ok');
		status.classList.add('green');
		
		freeSymbolsAm[padsDescriptions[activeRow.id].shape] -= 1; // Уменьшаем количество свободных символов данного типа
		
		padsDescriptions[activeRow.id].symbolCode = symbol.innerHTML;
		padsDescriptions[activeRow.id].symbol = libSymbol.id;
	});
	tabs.addEventListener(click, function (e) {
		if (e.target === tabPCB) {
			tabPCB.classList.add('step3-actions-headers-header-active');
			tabDXF.classList.remove('step3-actions-headers-header-active');
			if (pcbOutputContent && link.contains(dxfLink)) {
				if (pcbLink) { link.replaceChild(pcbLink, dxfLink); }
				output.dxf.style.display = 'none';
				output.pcb.style.display = 'block';
			}
		} else if (e.target === tabDXF) {
			tabDXF.classList.add('step3-actions-headers-header-active');
			tabPCB.classList.remove('step3-actions-headers-header-active');
			if (dxfOutputContent && link.contains(pcbLink)) {
				if (pcbLink) { link.replaceChild(dxfLink, pcbLink); }
				output.pcb.style.display = 'none';
				output.dxf.style.display = 'block';
			}
		}
	});
	reader.addEventListener('load', function () {
		fileContent = parseInputFile(this.result);
		if (!fileContent) { return; }
		
		Object.defineProperties(fileContent, {
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
			addLayer: {
				value: function (layerName, layerContent) {
					var i, j, exists = false, layerNum, layers = [];
					
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
					function shiftPropsLeft(object, n) {
						var size = Object.keys(object).length;
						
						for (n; n < size; n += 1) {
							object[n] = object[n + 1];
						}
						delete object[n];
					}
					function shiftPropsRight(object, n) {
						var size = Object.keys(object).length, i;
						
						for (i = size - 1; i >= n; i -= 1) {
							object[i + 1] = object[i];
							delete object[i];
						}
					}
					
					for (i = 0; i < Object.keys(this['4']).length; i += 1) {
						if (typeof this['4'][i] === 'object') {
							
							if (this['4'][i].header.indexOf('(layerDef') + 1 && !layerNum) { // Находим блок layerDef
								if (this['4'][i].header.slice(11, -1).toLowerCase() === layerName.toLowerCase()) { // Если слой с таким именем существует - берем его номер
									layerNum = +this['4'][i][0].slice(10, -1);
									exists = true;
								} else { // Иначе запоминаем номер этого слоя в соответствующую ячейку массива что бы потом найти наименьший свободный номер
									layers[+this['4'][i][0].slice(10, -1)] = true;
								}
							} else if (this['4'][i].header.indexOf('(multiLayer') + 1) { // Находим блок multilayer - после него идут блоки с содержимым слоев, перед ним - с описанием
								/* Создаем блок с описанием слоя */
								if (!exists) { // Если слоя не было найдено
									if (!layerNum) { layerNum = getFreeLayerNum(layers); } // Если слоя с нужным именем не нашлось - подбираем первый свободный номер
									shiftPropsRight(this['4'], i); // Смещаем нумерацию свойств в блоке на 1
									this['4'][i] = {};
									Object.defineProperties(this['4'][i], { // Создаем свойство на освободившемся месте
										header: { value: '(layerDef \"' + layerName + '\"' },
										0:			{ value: '(layerNum ' + layerNum + ')', enumerable: true },
										1:			{ value: '(layerType NonSignal)', enumerable: true },
										2:			{ value: '(fieldSetRef \"(Default)\"))', enumerable: true }
									});
									i += 1; // Снова указывает на multilayer
								}
								
								/* Создаем блок с содержимым слоя */
								shiftPropsRight(this['4'], i + 1); // Смещаем нумерацию свойств что бы добавить описание для нового слоя
								this['4'][i + 1] = {};
								Object.defineProperty(this['4'][i + 1], 'header', { value: '(layerContents (layerNumRef ' + layerNum + ')' });
								for (j = 0; j < layerContent.length; j += 1) { // Записываем содержимое слоя, поступившее в массиве
									this['4'][i + 1][j] = layerContent[j];
								}
								this['4'][i + 1][j - 1] += ')'; // Закрываем блок
								
								/* Удаляем предыдущее содержимое слоя */
								for (j = i + 2; j < Object.keys(this['4']).length; j += 1) {
									if ((typeof this['4'][j] === 'object' && this['4'][j].header.indexOf('(layerNumRef ' + layerNum) + 1) ||
									    (typeof this['4'][j] === 'string' && this['4'][j].indexOf('(layerNumRef ' + layerNum) + 1)) {
										delete this['4'][j];
										shiftPropsLeft(this['4'], j);
									}
								}
								break;
							}
							
						}
					}
				}
			},
			getPads: { // NOTE: [] Этот метод надо полностью переписать
				value: function () {
					var comp = {}, coords, cosA, currPath, height, i, j, key, name, pth = true, pad, pads = {},
						rotation, shiftX, shiftY, type, result = {}, side, sinA, vias = {},
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
												values[0].slice(type.length + 2) + ' 0' :
												values[0].slice(type.length + 2) + ' 1';
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
					function finder(array, object) {
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
					function compareNames(a, b) {
						var arrA, arrB, i, result = -1;
						
						function split(str) {
							var arr = [];
							str.split('').forEach(function (c) {
								if (+c + 1 && +arr[arr.length - 1]) { arr[arr.length - 1] += c; } else { arr.push(c); }
							});
							return arr;
						}
						
						arrA = split(a);
						arrB = split(b);
						for (i = 0; i < arrA.length; i += 1) {
							if (arrA[i] !== arrB[i] && i < arrB.length) {
								if (+arrA[i] + 1) {
									if (+arrB[i] + 1) { result = (+arrA[i] > +arrB[i]) ? 1 : -1; break; } else { result = 1; break; }
								} else {
									if (+arrB[i] + 1) { result = -1; break; } else { result = (arrA[i].charCodeAt(0) > arrB[i].charCodeAt(0)) ? 1 : -1; break; }
								}
							}
						}
						return result;
					}
					function compressNames(array) {
						var pattern = [], box = [];
						
						function openBox(arr) {
							switch (arr.length) {
							case 1:
								return arr[0];
							case 2:
								return arr.join(', ');
							default:
								return arr[0] + '...' + arr[arr.length - 1];
							}
						}
						
						return array.reduce(function (result, item, index) {
							var num = item.match(/[0-9]+$/), base = num ? item.slice(0, item.length - num[0].length) : null;
							
							if (num && base === pattern[0] && +num[0] === pattern[1] + 1) {
								box.push(item);
								pattern[1] += 1;
								if (index === array.length - 1) { result.push(openBox(box)); }
							} else {
								// Если из имени получилось изъять число (т.е. на конце нет никаких символов вроде *),
								// создаем новый паттерн, иначе - обнуляем:
								if (num) { pattern[0] = base; pattern[1] = +num[0]; } else { pattern = []; }
								if (index > 0) {
									result.push(openBox(box));
									if (index !== array.length - 1) { box = [item]; } else { result.push(item); }
								} else { box.push(item); }
							}
							
							return result;
						}, []);
					}
					function sortObject(object) {
						var key, sortable = [], result = {};
						
						function compare(a, b) {
							var sqA, sqB;
							
							sqA = (a[1].shape.match(/ellipse|oval|mthole|target/i) && a[1].width === a[1].height) ?
							       Math.PI * Math.pow(a[1].width / 2, 2) : a[1].width * a[1].height;
							sqB = (b[1].shape.match(/ellipse|oval|mthole|target/i) && b[1].width === b[1].height) ?
							       Math.PI * Math.pow(b[1].width / 2, 2) : b[1].width * b[1].height;
							
							return sqA - sqB;
						}
						
						for (key in object) {
							if (object.hasOwnProperty(key)) { sortable.push([key, object[key]]); }
						}
						sortable.sort(compare);
						for (i = 0; i < sortable.length; i += 1) {
							result[sortable[i][0]] = sortable[i][1];
						}
						return result;
					}
					function writeSideForLonePads(coords, defaultSide) {
						var i;
						
						for (i = 0; i < coords.length; i += 1) { // Записывает слой отдельностоящего пада. Надо все это упростить
							if (coords[i].hasOwnProperty('flipped')) { // Если есть такой ключ - это отдельная КП
								if (coords[i].flipped) { // Меняем сторону если у текущих координат есть флаг flipped
									coords[i].side = (defaultSide === 'top') ? 'bot' : (defaultSide === 'bot') ? 'top' : 'thru';
								} else {
									coords[i].side = defaultSide;
									delete coords[i].flipped;
								}
								if (drillViews < 2 && coords[i].side === 'bot') { drillViews = 2; } // Количество необходимых видов передается в функцию построения сборочного чертежа
							}
						}
					}
					function isPadsSame(obj1, obj2) {
						var rnd = new RegExp('ellipse|oval|mthole|target', 'i'), rect = new RegExp('rect|rndrect', 'i');
						
						return (obj1.width === obj2.width && obj1.height === obj2.height && obj1.hole === obj2.hole && obj1.pth === obj2.pth &&
						       ((obj1.shape.match(rnd) && obj2.shape.match(rnd)) || (obj1.shape.match(rect) && obj2.shape.match(rect)))) ? true : false;
					}
					
					try {
						for (i = 0; i < Object.keys(this['4']).length; i += 1) {
							if (typeof this['4'][i] === 'object' && this['4'][i].header === '(multiLayer') {
								
								for (j = 0; j < Object.keys(this['4'][i]).length; j += 1) {
									if (typeof this['4'][i][j] === 'string') {
										
										if (this['4'][i][j].indexOf('(viaStyleRef') + 1) {
											name = parser('viaStyleRef', this['4'][i][j]);
											if (!vias[name]) { vias[name] = {}; vias[name].coords = []; vias[name].same = []; }
											coords = parser('pt', this['4'][i][j]).split(' ');
											vias[name].coords.push({ x: +coords[0],
											                         y: +coords[1],
											                         side: 'thru'
											                       });
										} else if (this['4'][i][j].indexOf('(padStyleRef') + 1) {
											name = parser('padStyleRef', this['4'][i][j]);
											if (!pads[name]) { pads[name] = {}; pads[name].coords = []; pads[name].same = []; }
											coords = parser('pt', this['4'][i][j]).split(' ');
											pads[name].coords.push({ x: +coords[0],
											                         y: +coords[1],
											                         flipped: (+coords[2] === 1) ? true : false,
											                         rotation: parser('rotation', this['4'][i][j])
											                       });
										}
										
									} else {
										if (this['4'][i][j].header.indexOf('(pattern') > -1) {
											name = parser('refDesRef', this['4'][i][j].header);
											if (!comp[name]) { comp[name] = {}; }
											comp[name].pattern = parser('patternRef', this['4'][i][j].header);
											comp[name].zero = parser('pt', this['4'][i][j].header);
											comp[name].rotation = parser('rotation', this['4'][i][j].header);
											comp[name].graphics = (this['4'][i][j].header.indexOf('patternGraphicsNameRef') > -1) ?
													parser('patternGraphicsNameRef', this['4'][i][j].header) :
													parser('patternGraphicsNameRef', this['4'][i][j]['0']);
										}
									}
								}
								
								break;
							}
						}
						for (i = 0; i < Object.keys(this['2']).length; i += 1) {
							if (typeof this['2'][i] === 'object') {
								type = (this['2'][i].header.indexOf('viaStyleDef') + 1) ?
										'via' : (this['2'][i].header.indexOf('padStyleDef') + 1) ?
										'pad' : null;
							}
							if (type) {
								name = parser(type + 'StyleDef', this['2'][i].header);
								currPath = (type === 'via') ? vias : pads;
								if (!currPath[name]) { currPath[name] = {}; currPath[name].coords = []; currPath[name].same = []; }
								currPath[name].side = 'thru'; // Вариант по-умолчанию - сквозная КП
								
								for (j = 0; j < Object.keys(this['2'][i]).length; j += 1) {
									if (typeof this['2'][i][j] === 'string') {
										
										if (this['2'][i][j].match(/isHolePlated False/i)) {
											pth = false;
										} else if (this['2'][i][j].match(/holeDiam/i)) {
											currPath[name].hole = parser('holeDiam', this['2'][i][j]);
										}
										
										if (this['2'][i][j].match(/layerNumRef 1\)/i)) {
											currPath[name].shape = parser(type + 'ShapeType', this['2'][i][j]).toLowerCase();
											currPath[name].width = parser('shapeWidth', this['2'][i][j]);
											currPath[name].height = parser('shapeHeight', this['2'][i][j]);
										}
										
										if (this['2'][i][j].match(/layerNumRef 2\)/i)) {
											width = parser('shapeWidth', this['2'][i][j]);
											height = parser('shapeHeight', this['2'][i][j]);
											if (width && !currPath[name].width) { // Если на слое bot у КП есть размеры, но не было на top
												currPath[name].side = 'bot'; // Значит КП на слое bot
												currPath[name].width = width;
												currPath[name].height = height;
											} else if (!width) { // Если на слое bot у КП нет размеров
												currPath[name].side = 'top'; // Значит она на top, иначе вариант по умолчанию - thru
											}
										}
									}
								}
								
								currPath[name].pth = (currPath[name].hole < currPath[name].width) ? pth : false;
								writeSideForLonePads(currPath[name].coords, currPath[name].side);
								
								for (key in currPath) {
									if (currPath.hasOwnProperty(key) && key !== name && !currPath[key].mergedWith) {
										if (isPadsSame(currPath[key], currPath[name])) {
											currPath[key].coords = currPath[key].coords.concat(currPath[name].coords);
											currPath[key].same.push(name); // Добавляем в КП, с которой объединили, текущее название что бы выводить его на странице
											currPath[name].mergedWith = currPath[key]; // Сохраняем ссылку на КП, с которой объединяем, что бы потом найти, куда она переехала
											break;
										}
									}
								}
							}
							type = null;
							pth = true;
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
											pad = pads[name].mergedWith || pads[name]; // Если КП была объединена с другой
											side = pad.side;
											
											if (comp[key].rotation) {
												sinA = Math.sin(comp[key].rotation * Math.PI / 180);
												cosA = Math.cos(comp[key].rotation * Math.PI / 180);
												x = (shiftX * cosA - shiftY * sinA);
												y = (shiftY * cosA + shiftX * sinA);
											} else {
												x = shiftX;
												y = shiftY;
											}
											if (+zero[2]) {
												x = -x;
												side = (pad.side === 'top') ?
														'bot' : (pad.side === 'bot') ?
														'top' : 'thru';
											}
											if (drillViews < 2 && side === 'bot') { drillViews = 2; }
											// В случае, если элемент повернут - прибавляем его поворот к повороту КП. Если получилось больше 360 (полный оборот) - уменьшаем на 360
											rotation = (comp[key].rotation) ? comp[key].rotation + (+comp[key].pads[name][i].split(' ')[3]) : (+comp[key].pads[name][i].split(' ')[3]);
											while (rotation >= 360) { rotation -= 360; }
											
											pad.coords.push({ x: Math.round((+zero[0] + x) * 1000) / 1000,
											                  y: Math.round((+zero[1] + y) * 1000) / 1000,
											                  side: side,
											                  rotation: +rotation
											                });
										}
										// Записывает в каких компонентах использована площадка:
										if (pad.comps) { pad.comps.push(key); } else { pad.comps = []; pad.comps.push(key); }
									}
								}
							}
						}
						for (name in pads) { if (pads.hasOwnProperty(name)) { if (!pads[name].coords.length || pads[name].mergedWith) { delete pads[name]; } else { delete pads[name].side; } } }
						for (name in vias) { if (vias.hasOwnProperty(name)) { if (!vias[name].coords.length || vias[name].mergedWith) { delete vias[name]; } else { delete vias[name].side; } } }
						for (name in pads) {
							if (pads.hasOwnProperty(name) && pads[name].comps && pads[name].comps.length > 1) {
								pads[name].comps.sort(compareNames);
								pads[name].comps = compressNames(pads[name].comps);
							}
						}
					} catch (err) {
						showPopup({
							header: 'Ошибка',
							content: msgs[2],
							buttons: ['OK'],
							funcs: [hidePopup],
							closeable: true
						});
						setStepStatus(3, false, true);
						return;
					}
					
					result.vias = sortObject(vias); // Сортировка в порядке увеличения площади КП
					result.pads = sortObject(pads);
					setStepStatus(3, true);
					
					return result;
				}
			},
			getBoardOutline: {
				value: function () {
					var i, j, result = [], layerNum, minX, minY, coords;
					
					function parser(string) {
						var result = [];
						
						while (string.indexOf('(pt') + 1) {
							coords = string.slice(string.indexOf('(pt') + 4, string.indexOf(')')).split(' ');
							result.push(+coords[0], +coords[1]);
							string = string.slice(string.indexOf(')') + 2);
							// Ищет левую нижнюю точку контура что бы узнать насколько контур смещен от нуля координат:
							if (result[result.length - 2] < minX || minX === undefined) { minX = result[result.length - 2]; }
							if (result[result.length - 1] < minY || minY === undefined) { minY = result[result.length - 1]; }
						}
						// Если три набора координат - значит арка, переносим координаты центра арки в конец массива что бы порядок координат был таким же, как у линий:
						if (result.length === 6) { result.push(result[0], result[1]); result.shift(); result.shift(); }
						
						return result;
					}
					
					try {
						for (i = 0; i < Object.keys(this['4']).length; i += 1) {
							if (typeof this['4'][i] === 'object') {
								
								if (this['4'][i].header.match(/layerDef \"Board\"/i)) {
									layerNum = this['4'][i][0].slice(10, -1);
								} else if (layerNum && this['4'][i].header.indexOf('(layerContents (layerNumRef ' + layerNum + ')') + 1) {
									for (j = 0; j < Object.keys(this['4'][i]).length; j += 1) {
										if (typeof this['4'][i][j] === 'string' && this['4'][i][j].indexOf('(pt') + 1) {
											result.push(parser(this['4'][i][j]));
										}
									}
									break;
								}
								
							}
						}
						result.forEach(function (coords) {
							var i;
							
							for (i = 0; i < coords.length; i += 1) {
								if (i % 2) {
									coords[i] = coords[i] - minY;
								} else {
									coords[i] = coords[i] - minX;
								}
							}
						});
					} catch (err) {
						showPopup({
							header: 'Ошибка',
							content: msgs[10],
							buttons: ['OK'],
							funcs: [hidePopup],
							closeable: true
						});
						setStepStatus(4, false, true);
					}
					
					if (result.length) {
						result.push({ shiftX: minX, shiftY: minY });
						setStepStatus(4, true);
					} else {
						showPopup({
							header: 'Предупреждение',
							content: msgs[10],
							buttons: ['OK'],
							funcs: [hidePopup],
							closeable: true
						});
						setStepStatus(4, false, true);
					}
					return result;
				}
			},
			getRoutes: {
				value: function () {
					var i, j, currNum, currType, layerName, routes = {};
					
					function Route(string) {
						var type, width, first, second, third;
						
						width = parseFloat(string.slice(string.indexOf('width ') + 6));
						type = string.slice(1, string.indexOf(' '));
						
						first = string.slice(string.indexOf('pt ') + 3, string.indexOf(')')).split(' ');
						string = string.slice(string.indexOf(')') + 1);
						second = string.slice(string.indexOf('pt ') + 3, string.indexOf(')')).split(' ');
						if (type === 'triplePointArc') {
							third = first; // Меняем местами для удобства, т.к. у арок первая пара координат - центр, а у линий - начало
							first = second;
							string = string.slice(string.indexOf(')') + 1);
							second = string.slice(string.indexOf('pt ') + 3, string.indexOf(')')).split(' ');
						}
						
						this.type = type;
						this.width = width;
						this.x1 = +first[0];
						this.y1 = +first[1];
						this.x2 = +second[0];
						this.y2 = +second[1];
						
						if (third) {
							this.x3 = +third[0];
							this.y3 = +third[1];
						}
					}
					function Text(string) {
						var coords = string.slice(string.indexOf('pt ') + 3, string.indexOf(')')).split(' '), text;
						
						text = string.slice(string.indexOf(') \"') + 3, string.indexOf('\" (')).split('\\r\\n');
						string = string.slice(string.indexOf('justify ') + 8);
						
						this.type = 'text';
						this.content = text;
						this.justify = string.slice(0, string.indexOf(')')).toLowerCase();
						this.x1 = +coords[0];
						this.y1 = +coords[1];
					}
					
					try {
						for (i = 0; i < Object.keys(this['4']).length; i += 1) {
							if (typeof this['4'][i] === 'object') {
								
								if (this['4'][i].header.indexOf('layerDef') > -1) {
									layerName = this['4'][i].header.slice(11, -1);
									
									for (j = 0; j < Object.keys(this['4'][i]).length; j += 1) {
										if (typeof this['4'][i][j] === 'string') {
											
											if (this['4'][i][j].indexOf('layerNum') > -1) {
												currNum = +this['4'][i][j].slice(10, -1);
											} else if (this['4'][i][j] === '(layerType Signal)') {
												currType = 'signal';
											} else if (this['4'][i][j] === '(layerType Plane)') {
												currType = 'plane';
											}
											
											if (currNum && currType) {
												routes[currNum] = { name: layerName.toUpperCase(), type: currType };
												break;
											}
											
										}
									}
									currNum = null;
									currType = null;
								}
								
								if (this['4'][i].header.indexOf('layerContents') > -1) {
									currNum = this['4'][i].header.slice(28, -1);
									if (routes.hasOwnProperty(currNum)) {
										
										for (j = 0; j < Object.keys(this['4'][i]).length; j += 1) {
											if (typeof this['4'][i][j] === 'string') {
												if (this['4'][i][j].match(/\(line|\(triplePointArc/i)) {
													routes[currNum][j] = new Route(this['4'][i][j]);
												} else if (this['4'][i][j].match(/\(text/i)) {
													routes[currNum][j] = new Text(this['4'][i][j]);
												}
											}
										}
										
									}
								}
							}
						}
					} catch (err) {
						showPopup({
							header: 'Ошибка',
							content: msgs[11],
							buttons: ['OK'],
							funcs: [hidePopup],
							closeable: true
						});
						setStepStatus(5, false, false);
					}
					
					setStepStatus(5, true);
					
					return routes;
				}
			}
		});
		//console.log(fileContent.getRoutes());
		padsLib = fileContent.getPads();
		boardOutline = fileContent.getBoardOutline();
		if (boardOutline.length) { routes = fileContent.getRoutes(); }
		createPadsList(padsLib);
	});
}());