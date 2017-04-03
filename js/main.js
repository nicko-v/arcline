/*global Blob, FileReader, generateSVG, generateDXF, generatePCB */
(function () {
	'use strict';
	var
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
		mtlznInfo     = document.getElementById('mtlznInfo'),
		symbol        = document.getElementById('padsSymbol'),
		helpButton    = document.getElementById('helpButton'),
		clearButton   = document.getElementById('clearSymbol'),
		click         = navigator.userAgent.match(/iphone|ipod|ipad/i) ? 'touchend' : 'click',
		msgs          = ['Выбран некорректный файл. <br><br>Откройте .pcb в P-CAD и выполните следующее: <br><i>File -> Save as... -> Save as type: ASCII Files</i>',
		                 'Не удалось сформировать корректную структуру данных из файла. <br>Возможно файл содержит ошибки или непредусмотренные блоки.',
		                 'Не удалось распознать переходные отверстия или контактные площадки. <br>Возможно файл содержит ошибки или непредусмотренные блоки.',
		                 'Нельзя использовать круглые символы для прямоугольных контактных площадок. Пожалуйста, выберите другой символ.',
		                 'Закончились доступные символы, необозначенные площадки не будут отрисованы. <br>Попробуйте уменьшить количество контактных площадок на плате путем приведения площадок сходных размеров к одному типу.',
		                 'На плате присутствуют контактные площадки, расположенные не под прямым углом. К сожалению, символы для них нельзя нарисовать.<br><br>Количество площадок: ',
		                 'Не удалось сформировать таблицу отверстий или сборочные чертежи. <br>Пожалуйста, сообщите разработчику какие действия к этому привели или передайте файл, вызвавший ошибку.',
		                 'Не удалось сформировать .pcb файл. <br>Пожалуйста, сообщите разработчику какие действия к этому привели или передайте файл, вызвавший ошибку.',
		                 'Используемый браузер не поддерживает необходимый для работы приложения функционал. <br>Пожалуйста, установите свежую версию Chrome, Firefox или Opera.',
		                 'Произошла непредвиденная ошибка. <br>Пожалуйста, сообщите разработчику какие действия к этому привели или передайте файл, вызвавший ошибку.',
		                 'Не удалось распознать контур платы, будет построена только таблица отверстий - без сборочного чертежа и проводящих рисунков. <br><br>Пожалуйста, убедитесь, что контур платы существует и находится в слое Board.',
		                 'Не удалось получить информацию о трассировке. Возможно файл содержит ошибки или непредусмотренные значения.'],
		symbolsAmount = [30, 30], // Количество символов - круглые и прямоугольные
		freeSymbolsAm = { rnd: symbolsAmount[0], rect: symbolsAmount[1] }, // Используется для проверки необходимости отрисовки и показа кнопки автоподбора
		activeRow, boardOutline, drillViews = 1, dxfLink, dxfOutputContent, file, fileContent, metallizationArea = {}, output = {},
		padsDescriptions,	objectsLib, pcbLink, pcbOutputContent, reader = new FileReader(), routes;

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
			var x, y;
			
			// Что бы не уходило за края страницы.
			// offsetWidth делится пополам из-за того, что окно имеет свойство translateX(-50%), то есть 0 по X у него не слева, а в центре:
			x = (e.clientX - clickOffset.x - popup.offsetWidth / 2 > 0 &&
			     e.clientX - clickOffset.x + popup.offsetWidth / 2 < window.innerWidth);
			y = (e.clientY - clickOffset.y > 0 &&
			     e.clientY - clickOffset.y + popup.offsetHeight < window.innerHeight);
			
			if (x && y) { // Если курсор находится в пределах страницы, то окно двигается по обеим осям
				popup.style.left = e.clientX - clickOffset.x + window.scrollX + 'px';
				popup.style.top = e.clientY - clickOffset.y  + window.scrollY + 'px';
			} else if (x) { // Если курсор находится за пределами страницы по высоте, то окно может двигаться только по длине
				popup.style.left = e.clientX - clickOffset.x + window.scrollX + 'px';
			} else if (y) { // Наоборот
				popup.style.top = e.clientY - clickOffset.y  + window.scrollY + 'px';
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
				
				// Смещение точки клика относительно центра попапа по X и верхней границы по Y:
				clickOffset = { x: e.clientX - popup.offsetLeft + window.scrollX,
				                y: e.clientY - popup.offsetTop  + window.scrollY };
				
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
			var leftBrackets = 0, quote = 0, bracketsPositions = [], result = { down: 0, strings: [] }, nonCyrillicString = '', i;
			
			for (i = 0; i < string.length; i += 1) {
				// Неэкранированная кавычка - начало или конец какого-то названия, экранированная - его часть, т.е. находится внутри другой пары кавычек:
				if (string[i] === '\"' && string[i - 1] !== '\\') { quote += 1; }
				// Если символ кириллический - заменяем на транслит, иначе файл может не открыться
				if (replacements[string[i]]) { nonCyrillicString += replacements[string[i]]; } else { nonCyrillicString += string[i]; }
				
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
				result.strings.push(nonCyrillicString.slice(pos, bracketsPositions[index + 1] || nonCyrillicString.length));
			});
			
			if (!result.strings.length) { result.strings.push(nonCyrillicString); } // Если строку не пришлось делить - записываем изначальную (с заменой на транслит где надо)
			result.down = leftBrackets; // На столько шагов надо подняться по списку вверх (если закрывающих скобок было больше)
			return result;
		}
		
		replacements = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'z', 'з': 'z', 'и': 'i', 'й': 'i',
		                 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f',
		                 'х': 'h', 'ц': 'c', 'ч': 'h', 'ш': 's', 'щ': 'h', 'ъ': 'b', 'ы': 'i', 'ь': 'b', 'э': 'e', 'ю': 'u', 'я': 'a',
		                 'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E', 'Ж': 'Z', 'З': 'Z', 'И': 'I', 'Й': 'I',
		                 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F',
		                 'Х': 'H', 'Ц': 'C', 'Ч': 'H', 'Ш': 'S', 'Щ': 'H', 'Ъ': 'b', 'Ы': 'I', 'Ь': 'b', 'Э': 'E', 'Ю': 'U', 'Я': 'A' };
		
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
						same = '<span style="color: #666;" title="объединено с перечисленными КП"> (объединено с ' + object[key].same.join(', ') + ')</span>';
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
		objectsLib = {};
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
		mtlznInfo.style.opacity = 0;
		mtlznInfo.innerHTML = 'Площадь металлизации не определена';
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
	window.addEventListener('load', function () {
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
	input.addEventListener('change', function () {
		if (input.value) { // Если был выбран файл
			setStepStatus(1, true, false, true); // Сброс иконок при нажатии кнопки загрузки.
			resetChanges();
			file = input.files[0];
			document.getElementById('fileName').innerHTML = '<p>Название: <span style="color:#666;">' + file.name + '</span></p>' +
			                                                '<p>Состояние: <span style="color:#666;">выбран, не подтвержден</span></p>';
		}
	});
	version.addEventListener(click, function () {
		showPopup({
			header: 'Список изменений',
			content: 'Версия от 18.03.2016:' +
			         '<ul>' +
			         '<li>Добавлена генерация сборочных чертежей с элементами.</li>' +
			         '<li>Отрисовка площадок на проводящих рисунках больше не зависит от наличия у них символа.</li>' +
			         '<li>Переписана и дополнена справка о программе.</li>' +
			         '<li>Исправлены некоторые ошибки.</li>' +
			         '</ul>' +
			         'Update от 19.08.2016:' +
			         '<ul><li>Добавлен расчет площади металлизации.</li></ul>',
			closeable: true
		});
	});
	helpButton.addEventListener(click, function () {
		rollBlock(document.getElementById('help-wrapper'), document.getElementById('help-borders'), true);
	});
	uploadButton.addEventListener(click, function () {
		setStepStatus(1, true, false, true); // Сброс иконок при нажатии кнопки загрузки.
		
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
		
		document.getElementById(padsDescriptions[activeRow.id].symbol).style.display = 'block';
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
		var key, layers, fileName, selectText, pads = { metallized: {}, nonMetallized: {}, holes: {} };
		
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
		function prepareSymbolsInfo(lib, newLib, type) {
			var key, path;
			
			for (key in lib) {
				if (lib.hasOwnProperty(key)) {
					path = (lib[key].shape.match(/mthole|target/i) || lib[key].hole === lib[key].width) ? newLib.holes : (lib[key].pth) ? newLib.metallized : newLib.nonMetallized;
					
					path[key] = {};
					Object.defineProperties(path[key], {
						amount:   { value: lib[key].coords.length },
						hole:     { value: calcHoleSize(lib[key]) },
						pad:      { value: calcPadSize(lib[key]) },
						ratio:    { value: calcRatio(lib[key]) },
						coords:   { value: lib[key].coords, writable: true },
						width:    { value: lib[key].width },
						height:   { value: lib[key].height },
						holeSize: { value: lib[key].hole },
						symbol:   { value: lib[key].symbol },
						shape:    { value: (!lib[key].shape.match(/rect|rndrect/i) && lib[key].width / lib[key].height === 1) ? 'rnd' : 'rect' },
						type:     { value: type }
					});
					Object.defineProperty(path[key], 'mount', {
						value: calcMountSize(lib[key], path[key].pad, type)
					});
					if (path[key].symbol) { path.withSymbols += 1; }
				}
			}
		}
		
		if (freeSymbolsAm.rnd === symbolsAmount[0] && freeSymbolsAm.rect === symbolsAmount[1]) { return; } // Ничего не делать если не было назначено ни одного символа
		// Добавляется скрытое свойство с количеством КП, у которых есть символ:
		Object.defineProperty(pads.metallized, 'withSymbols', { value: 0, writable: true });
		Object.defineProperty(pads.nonMetallized, 'withSymbols', { value: 0, writable: true });
		Object.defineProperty(pads.holes, 'withSymbols', { value: 0, writable: true });
		
		for (key in padsDescriptions) { // Записываем выбранные символы в объект с информацией о КП
			if (padsDescriptions.hasOwnProperty(key)) {
				objectsLib[padsDescriptions[key].type][padsDescriptions[key].name].symbol = padsDescriptions[key].symbol;
			}
		}
		layers = generatePCB(objectsLib);
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
		if (layers.top.length) {  fileContent.addLayer('DrillTop', layers.top); }
		if (layers.bot.length) {  fileContent.addLayer('DrillBot', layers.bot); }
		
		fileName = (file.name.match(/\.pcb$/i)) ? file.name.slice(0, -4) : file.name;
		
		try {
			pcbOutputContent = document.createElement('pre');
			pcbOutputContent.innerHTML = fileContent.asArray().join(String.fromCharCode(10));
		} catch (errPCB) {
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
			prepareSymbolsInfo(objectsLib.vias, pads, 'via');
			prepareSymbolsInfo(objectsLib.pads, pads, 'pad');
			dxfOutputContent = document.createElement('pre');
			dxfOutputContent.innerHTML = generateDXF(pads, boardOutline, objectsLib.componentsOutlines, routes, drillViews).join(String.fromCharCode(10));
		} catch (errDXF) {
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
			document.getElementById(padsDescriptions[activeRow.id].symbol).style.display = 'block';
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
		function Route(string) {
			var type, width, first, second, third;
			
			width = parseFloat(string.slice(string.indexOf('width ') + 6));
			type = string.slice(1, string.indexOf(' '));
			
			first = string.slice(string.indexOf('pt ') + 3, string.indexOf(')')).split(' ');
			string = string.slice(string.indexOf(')') + 1);
			second = string.slice(string.indexOf('pt ') + 3, string.indexOf(')')).split(' ');
			if (type === 'triplePointArc') {
				type = 'arc';
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
		function Text(string, split) {
			var coords = string.slice(string.indexOf('pt ') + 3, string.indexOf(')')).split(' '), text, justification, rotation, sliced;
			
			text = string.slice(string.indexOf(') \"') + 3, string.indexOf('\" ('));
			text = split ? text.split('\\r\\n') : text.replace(/\\r\\n/g, '. ');
			
			if (string.indexOf('justify ') > -1) {
				sliced = string.slice(string.indexOf('justify ') + 8);
				justification = sliced.slice(0, sliced.indexOf(')')).toLowerCase();
			} else { justification = 'lowerleft'; }
			if (string.indexOf('rotation') > -1) {
				sliced = string.slice(string.indexOf('rotation ') + 9);
				rotation = +sliced.slice(0, sliced.indexOf(')'));
			} else { rotation = 0; }
			
			// При изменении структуры объекта, изменить так же в методе getPadsAndOutlines в месте, где создается текстовый объект для обозначения элемента:
			this.type = 'text';
			this.content = text;
			this.justification = justification;
			this.rotation = rotation;
			this.flipped = (string.indexOf('isFlipped True') > -1) ? true : false;
			this.x1 = +coords[0];
			this.y1 = +coords[1];
		}
		function Thermal(string) {
			var begin, end, width;
			
			begin = string.slice(string.indexOf('pt ') + 3, string.indexOf(')')).split(' ');
			string = string.slice(string.indexOf(')') + 2);
			end = string.slice(string.indexOf('pt ') + 3, string.indexOf(')')).split(' ');
			string = string.slice(string.indexOf(')') + 2);
			width = +string.slice(string.indexOf('thermalWidth ') + 13, string.indexOf(')')) || 0;
			
			this.type = 'thermal';
			this.width = width;
			this.x1 = +begin[0];
			this.y1 = +begin[1];
			this.x2 = +end[0];
			this.y2 = +end[1];
		}
		function Polygon(object, type, net) {
			var i, coords;
			
			this.type = type;
			this.net = net || null;
			
			for (i = 0; i < Object.keys(object).length; i += 1) {
				if (typeof object[i] === 'string') {
					if (object[i].indexOf('pt') > -1) {
						coords = object[i].slice(object[i].indexOf('pt ') + 3, object[i].indexOf(')')).split(' ');
						this['x' + i] = +coords[0];
						this['y' + i] = +coords[1];
					} else if (!net && object[i].indexOf('netNameRef') > -1) {
						this.net = object[i].slice(object[i].indexOf('\"') + 1, object[i].lastIndexOf('\"'));
					}
				}
			}
		}
		function calcMetallizationArea(pads, vias, routes) {
			var top = 0, bottom = 0, area, key, topTrace, botTrace, boardPerimeter = 0;
			
			function calcLineSegmentWidth(x1, x2, y1, y2) {
				return Math.sqrt(Math.pow(Math.abs(y2 - y1), 2) + Math.pow(Math.abs(x2 - x1), 2));
			}
			function checkMtlznSideAndIncreaseValue(pad) {
				switch (pad.side) {
				case 'top':
					top += area;
					break;
				case 'bot':
					bottom += area;
					break;
				case 'thru':
					top += area;
					bottom += area;
					break;
				}
			}
			function calcPadsMtlznArea(pads) {
				var key;
				
				for (key in pads) {
					if (pads.hasOwnProperty(key)) {
						
						// Площадь формулы овала (PI * бол.полуось * мал.полуось) так же подходит для нахождения площади круга:
						area = pads[key].shape.match(/ellipse|oval/i) ? Math.PI * (pads[key].width / 2) * (pads[key].height / 2) :
						       pads[key].shape.match(/rect|rndrect/i) ? (pads[key].width * pads[key].height) : 0;
						
						area -= Math.PI * Math.pow(pads[key].hole / 2, 2); // Вычитаем площадь отверстия, если его нет - вычтется 0
						if (area > 0) { pads[key].coords.forEach(checkMtlznSideAndIncreaseValue); }
					}
				}
			}
			function calcRoutesMtlznArea(traces) {
				var key, polygonArea, sum1, sum2, i, area = 0;
				
				for (key in traces) {
					if (traces.hasOwnProperty(key) && typeof traces[key] === 'object') {
						
						if (traces[key].type.match(/line|thermal/)) {
							area += calcLineSegmentWidth(traces[key].x1, traces[key].x2, traces[key].y1, traces[key].y2) * traces[key].width;
						} else if (traces[key].type.match(/copperpour|cutout/)) {
							
							// Алгоритм подсчета площади многоугольника: выстраиваем координаты вершин в порядке против часовой стрелки (уже сделано P-CAD'ом),
							// затем перемножаем каждую x-координату на y-координату следующей вершины (последней вершиной надо повторить начальную) и складываем,
							// затем наоборот - каждую y-координату на x-координату следующей вершины, затем вычитаем первую сумму из второй и делим результат пополам:
							sum1 = sum2 = i = 0;
							while (traces[key]['y' + (i + 1)] !== undefined) {
								sum1 += traces[key]['x' + i] * traces[key]['y' + (i + 1)];
								i += 1;
							}
							sum1 += traces[key]['x' + i] * traces[key].y0;
							i = 0;
							while (traces[key]['x' + (i + 1)] !== undefined) {
								sum2 += traces[key]['y' + i] * traces[key]['x' + (i + 1)];
								i += 1;
							}
							sum2 += traces[key]['y' + i] * traces[key].x0;
							/*-=-=-=-*/
							
							polygonArea = Math.abs(sum1 - sum2) / 2;
							area += traces[key].type === 'copperpour' ? polygonArea : -polygonArea; // Если полигон - увеличиваем площадь, если вырез - уменьшаем.
						}
					}
				}
				
				return area;
			}
			
			calcPadsMtlznArea(pads);
			calcPadsMtlznArea(vias);
			
			for (key in routes) {
				if (routes.hasOwnProperty(key)) {
					switch (routes[key].name) {
					case 'TOP':
						topTrace = routes[key];
						break;
					case 'BOTTOM':
						botTrace = routes[key];
						break;
					}
				}
			}
			
			if (boardOutline.board) { // Считается периметр платы, т.к. по нему идет заливка толщиной 0.2мм
				boardOutline.board.forEach(function (vertex) {
					boardPerimeter += calcLineSegmentWidth(vertex[0], vertex[2], vertex[1], vertex[3]);
				});
			}
			
			top += calcRoutesMtlznArea(topTrace) + boardPerimeter * 0.2;
			bottom += calcRoutesMtlznArea(botTrace) + boardPerimeter * 0.2;
			
			return { top: top, bottom: bottom };
		}
		
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
			getPadsAndOutlines: { // Возвращает объект, содержащий информацию обо всех КП и ПО (координаты, формы и т.д.), а так же контурах элементов.
				value: function () {
					var comp, compPin, compsOutlines = { lines: [], arcs: [], texts: [] }, comps = {}, coords, cosA, currPath, height, i, flipped, j, k,
						key, l, name, netName, node, outline, pth = true, pad, padName, padNum, pads = {}, patternGraphics, patternName, patternOrigin,
						patterns = {}, pin, pinDes, pinMap, rotation, shiftX, shiftY, type, refDesCenter, result = {}, samePads, side, sinA, vias = {}, width, x, y;
					
					function parser(type, string) {
						var i, tmp, values = [], result = '',
							// Совпадение до первой закрывающей скобки, т.к. внутри скобок быть не может:
							regStandardValue = new RegExp('\\(' + type + ' .+?(?=\\))', 'g'),
							// Совпадение до кавычки, за которой идет закрывающая скобка или конец строки:
							regName = new RegExp('\\(' + type + ' .+?(?=(\"\\))|\"$)', 'g');
						
						function getClosingQuotePos(string) {
							var pos = 0, lastSymbol = '';
							
							while (string.length) { // Поиск неэкранированной закрывающей кавычки. Экранированные - часть названия
								if (string[0] === '\"' && lastSymbol !== '\\') {
									break;
								} else {
									lastSymbol = string[0];
									string = string.slice(1);
									pos += 1;
								}
							}
							return pos;
						}
						
						switch (type) {
						case 'viaShapeType':
						case 'padShapeType':
							values = string.match(regStandardValue);
							return (values) ? values[0].slice(type.length + 2) : null;
						case 'rotation':
						case 'holeDiam':
						case 'shapeWidth':
						case 'shapeHeight':
						case 'padNum':
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
						case 'refDesRef':
						case 'patternRef':
						case 'patternDefExtended':
						case 'patternGraphicsNameRef':
						case 'patternGraphicsNameDef':
						case 'defaultPinDes':
						case 'netNameRef':
						case 'compRef':
						case 'compPinRef':
						case 'originalName':
							values = string.match(regName);
							return (values) ? values[0].slice(type.length + 3) : null;
						case 'net':
						case 'compInst':
							tmp = string.slice(string.indexOf(type + ' \"') + (type + ' \"').length);
							return tmp.slice(0, getClosingQuotePos(tmp)) || null;
						case 'node':
							tmp = string.slice(string.indexOf('node \"') + 6);
							values.push(tmp.slice(0, getClosingQuotePos(tmp)));
							tmp = tmp.slice(tmp.indexOf('\" \"') + 3);
							values.push(tmp.slice(0, getClosingQuotePos(tmp)));
							return values;
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
						var result = {}, shape, rnd = new RegExp('ellipse|oval|mthole|target', 'i'), rect = new RegExp('rect|rndrect', 'i');
						
						function isSameShape(shape1, shape2) {
							return (shape1.match(rnd) && shape2.match(rnd)) || (shape1.match(rect) && shape2.match(rect));
						}
						
						if (obj1.width  === obj2.width &&
						    obj1.height === obj2.height &&
						    obj1.hole   === obj2.hole &&
						    obj1.pth    === obj2.pth &&
						    isSameShape(obj1.shape, obj2.shape)) {
							result.same = true;
							result.rotated = false;
						} else if (obj1.width  === obj2.height &&
						           obj1.height === obj2.width &&
						           obj1.hole   === obj2.hole &&
						           obj1.pth    === obj2.pth &&
						           isSameShape(obj1.shape, obj2.shape)) {
							result.same = true;
							result.rotated = true;
						} else {
							result.same = false;
							result.rotated = false;
						}
						
							
						return result;
					}
					function getPatternCenter(pattern) {
						var i, j, key, min = { x: Infinity, y: Infinity }, max = { x: -Infinity, y: -Infinity };
						
						if (pattern.outline.length) {
							for (i = 0; i < pattern.outline.length; i += 1) {
								if (pattern.outline[i].type.match(/line|arc/)) {
									j = 1;
									while (pattern.outline[i]['x' + j] !== undefined) {
										if (pattern.outline[i]['x' + j] < min.x) { min.x = pattern.outline[i]['x' + j]; }
										if (pattern.outline[i]['x' + j] > max.x) { max.x = pattern.outline[i]['x' + j]; }
										if (pattern.outline[i]['y' + j] < min.y) { min.y = pattern.outline[i]['y' + j]; }
										if (pattern.outline[i]['y' + j] > max.y) { max.y = pattern.outline[i]['y' + j]; }
										j += 1;
									}
								}
							}
						} else if (typeof pattern.pins === 'object') {
							for (key in pattern.pins) {
								if (pattern.pins.hasOwnProperty(key)) {
									// Условия без else из-за того, что может быть всего один ключ и его координаты станут одновременно и минимумом, и максимумом:
									if (pattern.pins[key].x < min.x) { min.x = pattern.pins[key].x; }
									if (pattern.pins[key].x > max.x) { max.x = pattern.pins[key].x; }
									if (pattern.pins[key].y < min.y) { min.y = pattern.pins[key].y; }
									if (pattern.pins[key].y > max.y) { max.y = pattern.pins[key].y; }
								}
							}
						}
						
						return { x: min.x + Math.abs((max.x - min.x)) / 2,
						         y: min.y + Math.abs((max.y - min.y)) / 2
						       };
					}
					
					try {
						// Поиск по блоку pcbDesign -> multilayer.
						// Сбор координат ПО, отдельных КП и информации о компонентах (обозначение, сеть, координаты, поворот, отражение, паттерн, графика):
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
											                         net: parser('netNameRef', this['4'][i][j]),
											                         side: 'thru'
											                       });
										} else if (this['4'][i][j].indexOf('(padStyleRef') + 1) {
											name = parser('padStyleRef', this['4'][i][j]);
											if (!pads[name]) { pads[name] = {}; pads[name].coords = []; pads[name].same = []; }
											coords = parser('pt', this['4'][i][j]).split(' ');
											pads[name].coords.push({ x: +coords[0],
											                         y: +coords[1],
											                         net: parser('netNameRef', this['4'][i][j]),
											                         flipped: (+coords[2] === 1) ? true : false,
											                         rotation: parser('rotation', this['4'][i][j])
											                       });
										}
										
									} else {
										if (this['4'][i][j].header.indexOf('(pattern') > -1) {
											name = parser('refDesRef', this['4'][i][j].header);
											if (!comps[name]) { comps[name] = {}; }
											patternOrigin = parser('pt', this['4'][i][j].header).split(' ');
											comps[name].pattern  = parser('patternRef', this['4'][i][j].header);
											comps[name].origin   = { x: +patternOrigin[0], y: +patternOrigin[1], flipped: +patternOrigin[2] ? true : false };
											comps[name].rotation = parser('rotation', this['4'][i][j].header);
											comps[name].graphics = (this['4'][i][j].header.indexOf('patternGraphicsNameRef') > -1) ?
													parser('patternGraphicsNameRef', this['4'][i][j].header) :
													parser('patternGraphicsNameRef', this['4'][i][j]['0']);
										}
									}
								}
								
								break;
							}
						}
						
						// Поиск по блоку library -> viaStyleDef/padStyleDef.
						// Получение информации о ПО и КП (размер, отверстие, форма, сторона, металлизация) с последующим объединением одинаковых.
						// Объединение только внутри групп (ПО с ПО, КП с КП), т.к. на чертеже удобнее видеть разные символы:
						for (i = 0; i < Object.keys(this['2']).length; i += 1) {
							if (typeof this['2'][i] === 'object') {
								type = (this['2'][i].header.indexOf('viaStyleDef') > -1) ?
										'via' : (this['2'][i].header.indexOf('padStyleDef') > -1) ?
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
										samePads = isPadsSame(currPath[key], currPath[name]);
										if (samePads.same) {
											
											if (samePads.rotated) { // Если КП одинаковые по размерам, но с разным поворотом
												for (j = 0; j < currPath[name].coords.length; j += 1) {
													currPath[name].coords[j].rotation += 90;
													if (currPath[name].coords[j].rotation >= 360) { currPath[name].coords[j].rotation -= 360; }
												}
											}
											
											currPath[key].coords = currPath[key].coords.concat(currPath[name].coords);
											currPath[key].same.push(name); // Добавляем в КП, с которой объединили, текущее название что бы выводить его на странице
											currPath[name].mergedWith = currPath[key]; // Сохраняем ссылку на КП, с которой объединяем, что бы потом найти, куда она переехала
											currPath[name].rotatedAtMerge = samePads.rotated;
											break;
										}
									}
								}
							}
							
							type = null;
							pth = true;
						}
						
						// Поиск по блоку library -> patternDefExtended.
						// Получение информации о паттернах (название, варианты графики, контуры) и их выводах (название КП, координаты, поворот, отражение, padNum, defaultPinDes):
						for (i = 0; i < Object.keys(this['2']).length; i += 1) {
							if (this['2'][i].header.indexOf('patternDefExtended') > -1) {
								patternName = parser('patternDefExtended', this['2'][i].header);
								patterns[patternName] = {};
								for (j = 0; j < Object.keys(this['2'][i]).length; j += 1) {
									if (typeof this['2'][i][j] === 'string' && this['2'][i][j].indexOf('originalName') > -1) {
										patterns[patternName].originalName = parser('originalName', this['2'][i][j]);
									} else if (typeof this['2'][i][j] === 'object' && this['2'][i][j].header.indexOf('patternGraphicsDef') > -1) {
										
										for (k = 0; k < Object.keys(this['2'][i][j]).length; k += 1) {
											if (typeof this['2'][i][j][k] === 'string' && this['2'][i][j][k].indexOf('patternGraphicsNameDef') > -1) {
												patternGraphics = parser('patternGraphicsNameDef', this['2'][i][j][k]);
												patterns[patternName][patternGraphics] = {};
												patterns[patternName][patternGraphics].pins = {};
											} else if (typeof this['2'][i][j][k] === 'object') {
												if (this['2'][i][j][k].header.indexOf('multiLayer') > -1) {
													for (l = 0; l < Object.keys(this['2'][i][j][k]).length; l += 1) {
														if (typeof this['2'][i][j][k][l] === 'string' && this['2'][i][j][k][l].indexOf('padStyleRef') + 1) {
															name   = parser('padStyleRef', this['2'][i][j][k][l]);
															pinDes = parser('defaultPinDes', this['2'][i][j][k][l]);
															padNum = parser('padNum', this['2'][i][j][k][l]);
															coords = parser('pt', this['2'][i][j][k][l]).split(' ');
															
															if (!patterns[patternName][patternGraphics].pins[padNum]) { patterns[patternName][patternGraphics].pins[padNum] = {}; }
															
															patterns[patternName][patternGraphics].pins[padNum] = { x: +coords[0],
															                                                        y: +coords[1],
															                                                        padName: name,
															                                                        pinDes: pinDes,
															                                                        flipped: (+coords[2]) ? true : false,
															                                                        rotation: parser('rotation', this['2'][i][j][k][l])
															                                                      };
														}
													}
												} else if (this['2'][i][j][k].header.indexOf('layerContents') > -1) {
													if (!patterns[patternName][patternGraphics].outline) { patterns[patternName][patternGraphics].outline = []; }
													for (l = 0; l < Object.keys(this['2'][i][j][k]).length; l += 1) {
														if (typeof this['2'][i][j][k][l] === 'string') {
															
															if (this['2'][i][j][k][l].match(/\(line|\(triplePointArc/i)) {
																patterns[patternName][patternGraphics].outline.push(new Route(this['2'][i][j][k][l]));
															} else if (this['2'][i][j][k][l].indexOf('(text ') > -1) {
																patterns[patternName][patternGraphics].outline.push(new Text(this['2'][i][j][k][l], false));
															}
															
														}
													}
													
													patterns[patternName][patternGraphics].center = getPatternCenter(patterns[patternName][patternGraphics]);
												}
											}
										}
										
									}
								}
							}
						}
						
						// Поиск по блоку netlist -> compInst.
						// Получение значения compRef, связывающего конкретный компонент (его позиционное обозначение) с блоком library - compDef:
						for (i = 0; i < Object.keys(this['3']).length; i += 1) {
							if (typeof this['3'][i] === 'object') {
								if (this['3'][i].header.indexOf('(compInst') > -1) {
									comp = parser('compInst', this['3'][i].header);
									for (j = 0; j < Object.keys(this['3'][i]).length; j += 1) {
										if (typeof this['3'][i][j] === 'string' && this['3'][i][j].indexOf('compRef') > -1 && comps[comp]) {
											comps[comp].compRef = parser('compRef', this['3'][i][j]);
											break;
										}
									}
								}
							}
						}
						
						// Объединение объектов patterns и comps.
						// В объект comps копируется информация о выводах:
						for (key in comps) {
							if (comps.hasOwnProperty(key) && patterns[comps[key].pattern][comps[key].graphics]) {
								comps[key].pins = JSON.parse(JSON.stringify(patterns[comps[key].pattern][comps[key].graphics].pins));
							}
						}
					
						// Поиск по блоку library -> compDef -> attachedPattern -> padPinMap.
						// Получение значения compPinRef и добавление его к соответствующему выводу компонента:
						for (i = 0; i < Object.keys(this['2']).length; i += 1) {
							if (typeof this['2'][i] === 'object' && this['2'][i].header.indexOf('(compDef') > -1) {
								
								for (j = 0; j < Object.keys(this['2'][i]).length; j += 1) {
									if (typeof this['2'][i][j] === 'object' && this['2'][i][j].header.indexOf('attachedPattern') > -1) {
										
										patternName = this['2'][i][j].header.match(/(?:patternName \")(.+?)(?:\")/)[1];
										currPath = null;
										for (key in patterns) {
											if (patterns.hasOwnProperty(key) && patterns[key].originalName === patternName) {
												currPath = patterns[key];
												break;
											}
										}
										
										for (k = 0; k < Object.keys(this['2'][i][j]).length; k += 1) {
											if (typeof this['2'][i][j][k] === 'object' && this['2'][i][j][k].header.indexOf('padPinMap') > -1) {
												
												for (l = 0; l < Object.keys(this['2'][i][j][k]).length; l += 1) {
													if (typeof this['2'][i][j][k][l] === 'string' && this['2'][i][j][k][l].indexOf('padNum') > -1) {
														padNum = parser('padNum', this['2'][i][j][k][l]);
														compPin = parser('compPinRef', this['2'][i][j][k][l]);
														if (currPath) {
															for (key in currPath) {
																if (currPath.hasOwnProperty(key) && typeof currPath[key] === 'object' && currPath[key].pins[padNum]) {
																	currPath[key].pins[padNum].compPin = compPin;
																}
															}
														}
													}
												}
												
											}
										}
										currPath = null;
										
									}
								}
								
							}
						}
						
						// Поиск по блоку netlist -> net.
						// Получение связей и добавление их в указанные выводы указанных компонентов:
						for (i = 0; i < Object.keys(this['3']).length; i += 1) {
							if (typeof this['3'][i] === 'object' && this['3'][i].header.indexOf('(net') > -1) {
								netName = parser('net', this['3'][i].header);
								if (netName) {
									for (j = 0; j < Object.keys(this['3'][i]).length; j += 1) {
										if (typeof this['3'][i][j] === 'string' && this['3'][i][j].indexOf('(node') > -1) {
											node = parser('node', this['3'][i][j]);
											
											/* Поиск соответствующего pin. В нетлисте может быть использован один из трех вариантов - padNum, pinDes, compPin.
											 * В объекте comps хранятся объекты padNum (т.к. это основной параметр и есть у всех КП, входящих в компоненты),
											 * внутри которых ключи pinDes и compPin, поэтому, если нет подходящего padNum - перебираются все padNum'ы в поисках
											 * совпадения по ключам pinDes, compPin. */
											if (comps[node[0]]) {
												if (comps[node[0]].pins[node[1]]) {
													comps[node[0]].pins[node[1]].net = netName;
												} else {
													for (key in comps[node[0]].pins) {
														if (comps[node[0]].pins.hasOwnProperty(key) && [comps[node[0]].pins[key].pinDes, comps[node[0]].pins[key].compPin].indexOf(node[1]) > -1) {
															comps[node[0]].pins[key].net = netName;
														}
													}
												}
											}
											/* -=-=-=- */
											
										}
									}
								}
							}
						}
						
						// Перенос информации о КП, находящихся в составе компонентов, в основной объект контактных площадок, в процессе
						// перерассчитываются координаты, поворот, сторона в зависимости от поворота и отражения самого компонента:
						for (key in comps) {
							if (comps.hasOwnProperty(key)) {
								
								for (pinDes in comps[key].pins) {
									if (comps[key].pins.hasOwnProperty(pinDes)) {
										
										shiftX = comps[key].pins[pinDes].x;
										shiftY = comps[key].pins[pinDes].y;
										flipped = comps[key].pins[pinDes].flipped;
										padName = comps[key].pins[pinDes].padName;
										netName = comps[key].pins[pinDes].net || null;
										pad = pads[padName].mergedWith || pads[padName]; // Если КП была объединена с другой
										side = (pad.side === 'top') ? (flipped ? 'bot' : 'top') : (pad.side === 'bot') ? (flipped ? 'top' : 'bot') : 'thru';
										
										if (comps[key].rotation) {
											sinA = Math.sin(comps[key].rotation * Math.PI / 180);
											cosA = Math.cos(comps[key].rotation * Math.PI / 180);
											x = (shiftX * cosA - shiftY * sinA);
											y = (shiftY * cosA + shiftX * sinA);
										} else {
											x = shiftX;
											y = shiftY;
										}
										if (comps[key].origin.flipped) {
											x = -x;
											side = (pad.side === 'top') ? 'bot' : (pad.side === 'bot') ? 'top' : 'thru';
										}
										
										if (drillViews < 2 && side === 'bot') { drillViews = 2; }
										// В случае, если элемент повернут - прибавляем его поворот к повороту КП. Если получилось больше 360 (полный оборот) - уменьшаем на 360
										rotation = (comps[key].rotation) ? comps[key].rotation + comps[key].pins[pinDes].rotation : comps[key].pins[pinDes].rotation;
										if (pads[padName].rotatedAtMerge) { rotation += 90; }
										while (rotation >= 360) { rotation -= 360; }
										
										pad.coords.push({ x: Math.round((comps[key].origin.x + x) * 1000) / 1000,
										                  y: Math.round((comps[key].origin.y + y) * 1000) / 1000,
										                  side: side,
										                  net: netName,
										                  rotation: rotation
										                });
										
										// Записывает в каких компонентах использована площадка:
										if (pad.comps) { if (pad.comps.indexOf(key) === -1) { pad.comps.push(key); } } else { pad.comps = []; pad.comps.push(key); }
									}
								}
								
							}
						}
						
						// Перенос информации о контурах элементов в отдельный объект с упрощенной структурой, в процессе перерасчитываются
						// координаты контуров (изначально заданы относительно точки нуля элемента), расчитываются положения обозначений (центр элемента):
						for (key in comps) {
							if (comps.hasOwnProperty(key)) {
								
								if (comps[key].rotation) {
									sinA = Math.sin(comps[key].rotation * Math.PI / 180);
									cosA = Math.cos(comps[key].rotation * Math.PI / 180);
								}
								
								outline = patterns[comps[key].pattern][comps[key].graphics].outline;
								if (outline && outline.length) {
									for (i = 0; i < outline.length; i += 1) {
										
										switch (outline[i].type) {
										case 'line':
											compsOutlines.lines.push({ x1: Math.round(((comps[key].rotation ? outline[i].x1 * cosA - outline[i].y1 * sinA : outline[i].x1) * (comps[key].origin.flipped ? -1 : 1) + comps[key].origin.x) * 1000) / 1000,
											                           x2: Math.round(((comps[key].rotation ? outline[i].x2 * cosA - outline[i].y2 * sinA : outline[i].x2) * (comps[key].origin.flipped ? -1 : 1) + comps[key].origin.x) * 1000) / 1000,
											                           y1: Math.round(((comps[key].rotation ? outline[i].y1 * cosA + outline[i].x1 * sinA : outline[i].y1) + comps[key].origin.y) * 1000) / 1000,
											                           y2: Math.round(((comps[key].rotation ? outline[i].y2 * cosA + outline[i].x2 * sinA : outline[i].y2) + comps[key].origin.y) * 1000) / 1000,
											                           flipped: comps[key].origin.flipped
											                         });
											break;
										case 'arc':
											// В случае, если компонент отражен, сразу меняются точки начала и конца арки (x1 <-> x2, y1 <-> y2):
											compsOutlines.arcs.push({ x1: Math.round(((comps[key].origin.flipped ?
											                                            (comps[key].rotation ? outline[i].x2 * cosA - outline[i].y2 * sinA : outline[i].x2) * -1 :
											                                            (comps[key].rotation ? outline[i].x1 * cosA - outline[i].y1 * sinA : outline[i].x1)) +
																															  comps[key].origin.x) * 1000) / 1000,
											                          x2: Math.round(((comps[key].origin.flipped ?
											                                            (comps[key].rotation ? outline[i].x1 * cosA - outline[i].y1 * sinA : outline[i].x1) * -1 :
											                                            (comps[key].rotation ? outline[i].x2 * cosA - outline[i].y2 * sinA : outline[i].x2)) +
																															  comps[key].origin.x) * 1000) / 1000,
											                          x3: Math.round(((comps[key].rotation ? outline[i].x3 * cosA - outline[i].y3 * sinA : outline[i].x3) * (comps[key].origin.flipped ? -1 : 1) + comps[key].origin.x) * 1000) / 1000,
											                          y1: Math.round(((comps[key].origin.flipped ?
																								                  (comps[key].rotation ? outline[i].y2 * cosA + outline[i].x2 * sinA : outline[i].y2) :
																								                  (comps[key].rotation ? outline[i].y1 * cosA + outline[i].x1 * sinA : outline[i].y1)) +
																								               comps[key].origin.y) * 1000) / 1000,
											                          y2: Math.round(((comps[key].origin.flipped ?
																								                  (comps[key].rotation ? outline[i].y1 * cosA + outline[i].x1 * sinA : outline[i].y1) :
																								                  (comps[key].rotation ? outline[i].y2 * cosA + outline[i].x2 * sinA : outline[i].y2)) +
																								               comps[key].origin.y) * 1000) / 1000,
											                          y3: Math.round(((comps[key].rotation ? outline[i].y3 * cosA + outline[i].x3 * sinA : outline[i].y3) + comps[key].origin.y) * 1000) / 1000,
											                          flipped: comps[key].origin.flipped
											                        });
											break;
										case 'text':
											// Структура объекта должна соответствовать структуре объектов, производимых конструктором Text:
											compsOutlines.texts.push({ x1: Math.round(((comps[key].rotation ? outline[i].x1 * cosA - outline[i].y1 * sinA : outline[i].x1) * (comps[key].origin.flipped ? -1 : 1) + comps[key].origin.x) * 1000) / 1000,
											                           y1: Math.round(((comps[key].rotation ? outline[i].y1 * cosA + outline[i].x1 * sinA : outline[i].y1) + comps[key].origin.y) * 1000) / 1000,
											                           content: outline[i].content,
											                           justification: outline[i].justification,
											                           flipped: comps[key].origin.flipped,
										                             rotation: 0
											                         });
											break;
										}
										
									}
								}
								
								refDesCenter = patterns[comps[key].pattern][comps[key].graphics].center;
								if (isFinite(refDesCenter.x) && isFinite(refDesCenter.y)) {
									// Структура объекта должна соответствовать структуре объектов, производимых конструктором Text:
									compsOutlines.texts.push({ content: [key.replace(/_/g, '-')], // Т.к. это один из символов, не поддерживаемых dxf. Иногда встречается в элементах
										                         justification: 'center',
										                         rotation: 0,
											                       flipped: comps[key].origin.flipped,
									                           x1: Math.round(((comps[key].rotation ? refDesCenter.x * cosA - refDesCenter.y * sinA : refDesCenter.x) * (comps[key].origin.flipped ? -1 : 1) + comps[key].origin.x) * 1000) / 1000,
										                         y1: Math.round(((comps[key].rotation ? refDesCenter.y * cosA + refDesCenter.x * sinA : refDesCenter.y) + comps[key].origin.y) * 1000) / 1000
									                         });
								}
							}
						}
						
						/* Удаление КП и ПО, которые на плате не используются */
						for (name in pads) { if (pads.hasOwnProperty(name)) { if (!pads[name].coords.length || pads[name].mergedWith) { delete pads[name]; } else { delete pads[name].side; } } }
						for (name in vias) { if (vias.hasOwnProperty(name)) { if (!vias[name].coords.length || vias[name].mergedWith) { delete vias[name]; } else { delete vias[name].side; } } }
						/* -=-=-=- */
						
						// Сортируется по алфавиту список компонентов, к которым принадлежат КП, затем подряд идущие
						// обозначения сжимаются в последовательность (D1, D2, D3 -> D1...D3):
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
					result.componentsOutlines = compsOutlines;
					
					setStepStatus(3, true);
					
					return result;
				}
			},
			getBoardOutline: { // Возвращает объект с координатами объектов на слоях Board, Top(Bot) Assy
				value: function () {
					var i, j, key, currPath, result = {}, layerName, layerNum = {}, coords, offset;
					
					function parser(string) {
						var result = [];
						
						while (string.indexOf('(pt') + 1) {
							coords = string.slice(string.indexOf('(pt') + 4, string.indexOf(')')).split(' ');
							result.push(+coords[0], +coords[1]);
							string = string.slice(string.indexOf(')') + 2);
						}
						// Если три набора координат - значит арка, переносим координаты центра арки в конец массива что бы порядок координат был таким же, как у линий:
						if (result.length === 6) { result.push(result[0], result[1]); result.shift(); result.shift(); }
						
						return result;
					}
					function stickToZero(array) {
						array.forEach(function (coords) {
							var i;
							
							for (i = 0; i < coords.length; i += 1) {
								if (i % 2) {
									coords[i] = coords[i] - offset.y;
								} else {
									coords[i] = coords[i] - offset.x;
								}
							}
						});
					}
					function getBoardOffset(array) {
						var minX = Infinity, minY = Infinity;
						
						array.forEach(function (coords) {
							var i;
							
							for (i = 0; i < coords.length; i += 1) {
								if (i % 2 && coords[i] < minY) { minY = coords[i]; }
								if (!i % 2 && coords[i] < minX) { minX = coords[i]; }
							}
						});
						
						return { x: minX, y: minY };
					}
					
					try {
						for (i = 0; i < Object.keys(this['4']).length; i += 1) {
							if (typeof this['4'][i] === 'object') {
								
								if (this['4'][i].header.indexOf('layerDef') > -1) {
									layerName = this['4'][i].header.slice(11, -1);
									switch (layerName) {
									case 'Board':
										layerNum.board = +this['4'][i][0].slice(10, -1);
										break;
									case 'Top Assy':
										layerNum.topAssy = +this['4'][i][0].slice(10, -1);
										break;
									case 'Bot Assy':
										layerNum.botAssy = +this['4'][i][0].slice(10, -1);
										break;
									}
								} else if (Object.keys(layerNum).length && this['4'][i].header.indexOf('(layerContents ') > -1) {
									layerNum.current = +this['4'][i].header.slice(28, -1);
									
									switch (layerNum.current) {
									case layerNum.board:
										result.board = [];
										currPath = result.board;
										break;
									case layerNum.topAssy:
										result.topAssy = [];
										currPath = result.topAssy;
										break;
									case layerNum.botAssy:
										result.botAssy = [];
										currPath = result.botAssy;
										break;
									default:
										currPath = null;
										break;
									}
									
									for (j = 0; j < Object.keys(this['4'][i]).length; j += 1) {
										if (currPath && typeof this['4'][i][j] === 'string' && this['4'][i][j].match(/line|triplePointArc/i)) {
											currPath.push(parser(this['4'][i][j]));
										}
									}
								}
								
							}
						}
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
					
					if (result.board) {
						offset = getBoardOffset(result.board);
						for (key in result) { if (result.hasOwnProperty(key)) { stickToZero(result[key]); } }
						result.shiftX = offset.x;
						result.shiftY = offset.y;
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
			getRoutes: { // Возвращает объект, содержащий информацию о трассировке (координаты, толщины линий, сети) и полигонах (вершины, сети)
				value: function () {
					var i, j, k, l, currNum, currType, layerName, polygonType, netName, routes = {};
					
					function handleIsland(object, net) {
						var i, j;
						
						for (i = 0; i < Object.keys(object).length; i += 1) {
							if (typeof object[i] === 'object') {
								if (object[i].header.indexOf('islandOutline') > -1) {
									routes[currNum][k] = new Polygon(object[i], 'copperpour', net);
									k += 1;
								} else if (object[i].header.indexOf('cutout') > -1) {
									for (j = 0; j < Object.keys(object[i]).length; j += 1) {
										if (object[i][j].header.indexOf('cutoutOutline') > -1) {
											routes[currNum][k] = new Polygon(object[i][j], 'cutout');
											k += 1;
										}
									}
								}
							} else if (typeof object[i] === 'string' && object[i].indexOf('thermal') > -1) {
								routes[currNum][k] = new Thermal(object[i]);
								k += 1;
							}
						}
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
												routes[currNum] = {
													// Заменяются некоторые символы, которые нельзя использовать в dxf
													name: layerName.toUpperCase().replace(/\+/g, 'plus').replace(/\.|\:|\;|\*|\=|<|\>|\^|\“|\_|\‘|\?|\/|\\|\|/g, '-'),
													type: currType
												};
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
										k = 0;
										
										for (j = 0; j < Object.keys(this['4'][i]).length; j += 1) {
											
											if (typeof this['4'][i][j] === 'string') {
												if (this['4'][i][j].match(/\(line|\(triplePointArc/i)) {
													routes[currNum][k] = new Route(this['4'][i][j]);
													k += 1;
												} else if (this['4'][i][j].match(/\(text/i)) {
													routes[currNum][k] = new Text(this['4'][i][j], true);
													k += 1;
												}
											} else if (typeof this['4'][i][j] === 'object') {
												polygonType = (this['4'][i][j].header.indexOf('polyCutOut') > -1) ? 'cutout' :
													            (this['4'][i][j].header.indexOf('planeObj') > -1) ? 'plane' :
													            (this['4'][i][j].header.indexOf('copperPour95') > -1) ? 'copperpour' : null;
												if (polygonType && polygonType.match(/cutout|plane/i)) {
													for (l = 0; l < Object.keys(this['4'][i][j]).length; l += 1) {
														if (typeof this['4'][i][j][l] === 'object' && this['4'][i][j][l].header.indexOf('pcbPoly') > -1) {
															routes[currNum][k] = new Polygon(this['4'][i][j][l], polygonType);
															k += 1;
														}
													}
												} else if (polygonType && polygonType === 'copperpour') {
													for (l = 0; l < Object.keys(this['4'][i][j]).length; l += 1) {
														if (typeof this['4'][i][j][l] === 'string') {
															if (this['4'][i][j][l].indexOf('netNameRef') > -1) {
																netName = this['4'][i][j][l].slice(this['4'][i][j][l].indexOf('\"') + 1, this['4'][i][j][l].lastIndexOf('\"'));
															}
														} else if (typeof this['4'][i][j][l] === 'object') {
															if (this['4'][i][j][l].header.indexOf('island') > -1) {
																handleIsland(this['4'][i][j][l], netName);
															} /* else if (this['4'][i][j][l].header.indexOf('pcbPoly') > -1) {
																routes[currNum][k] = new Polygon(this['4'][i][j][l], polygonType);
																k += 1;
															} */ // Отключено, т.к. при таком варианте отрисовывается общий контур полигона, который может не соответствовать реальной заливке
															     // из-за того, что внутри или на границе контура могут быть объекты, которые заливка будет обтекать. Актуальные контуры
															     // хранятся в блоках island. Необходимо более подробное тестирование этой части. Раскомменитровать при необходимости.
														}
													}
													netName = null;
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
					// Если на слое ничего нет - удаляем из объекта:
					for (i in routes) { if (routes.hasOwnProperty(i)) { if (!routes[i].hasOwnProperty(0)) { delete routes[i]; } } }
					
					return routes;
				}
			}
		});
		
		objectsLib = fileContent.getPadsAndOutlines();
		boardOutline = fileContent.getBoardOutline();
		if (boardOutline.board) { routes = fileContent.getRoutes(); }
		metallizationArea = calcMetallizationArea(objectsLib.pads, objectsLib.vias, routes || {});
		if (metallizationArea.top > 0 || metallizationArea.bottom > 0) {
			mtlznInfo.innerHTML = 'Площадь металлизации на лицевой стороне - ' +
			                       Math.round(metallizationArea.top / 10) / 1000    + ' дм<sup>2</sup>, на обратной - ' +
			                       Math.round(metallizationArea.bottom / 10) / 1000 + ' дм<sup>2</sup>.';
			mtlznInfo.title = 'Площадь металлизации на лицевой стороне - ' +
			                   Math.round(metallizationArea.top * 1000) / 1000 + ' кв.мм, на обратной - ' +
			                   Math.round(metallizationArea.bottom * 1000) / 1000 + ' кв.мм.';
			mtlznInfo.style.opacity = 1;
		}
		createPadsList(objectsLib);
	});
}());