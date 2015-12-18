/*global FileReader, generateSVG, generateLayers */

(function () {
	'use strict';
	var
		reader        = new FileReader(),
		lib           = document.getElementById('lib'),
		autoButton    = document.getElementById('auto'),
		input         = document.getElementById('file'),
		startButton   = document.getElementById('start'),
		uploadButton  = document.getElementById('upload'),
		padsList      = document.getElementById('padsList'),
		icon          = document.getElementById('padsIcon'),
		descr         = document.getElementById('padsDescr'),
		libButton     = document.getElementById('libButton'),
		symbol        = document.getElementById('padsSymbol'),
		helpButton    = document.getElementById('helpButton'),
		clearButton   = document.getElementById('clearSymbol'),
		allSupported  = window.FileReader && document.body.style.flex !== undefined,
		click         = navigator.userAgent.match(/iphone|ipod|ipad/i) ? 'touchend' : 'click',
		msgs          = ['Выбран некорректный файл. <br><br>Откройте .pcb в P-CAD и выполните следующее: <br><i>File -> Save as... -> Save as type: ASCII Files</i>',
	                   'Не удалось сформировать корректную структуру данных из файла. <br>Возможно файл содержит ошибки или непредусмотренные блоки.',
	                   'Не удалось распознать переходные отверстия или контактные площадки. <br>Возможно файл содержит ошибки или непредусмотренные блоки.',
										 'Нельзя использовать круглые символы для прямоугольных контактных площадок. Пожалуйста, выберите другой символ.',
										 'Закончились доступные для использования символы. Попробуйте уменьшить количество контактных площадок на плате.',
										 'На плате присутствуют контактные площадки, расположенные не под прямым углом. К сожалению, символы для них нельзя нарисовать.<br><br>Количество площадок: ',
										 'Используемый браузер не поддерживает необходимый для работы приложения функционал. <br>Пожалуйста, установите свежую версию Chrome, Firefox или Opera.',
									   'Произошла непредвиденная ошибка. <br>Пожалуйста, сообщите разработчику какие действия к этому привели или передайте файл, вызвавший ошибку.'],
		symbolsAmount = [30, 30], // Количество символов - круглые и прямоугольные
		freeSymbolsAm = { rnd: symbolsAmount[0], rect: symbolsAmount[1] }, // Используется для проверки необходимости отрисовки и показа кнопки автоподбора
		padsDescriptions, activeRow, padsLib, file, fileContent;

	function hidePopup() {
		var cover = document.getElementById('cover');
		
		cover.style.opacity = 0;
		setTimeout(function () { cover.innerHTML = ''; }, 100);
		setTimeout(function () {
			document.body.classList.remove('lock');
			cover.classList.remove('popup-cover');
		}, 300);
	}
	function showPopup(params) { // (02)
		var cover = document.getElementById('cover'), clickOffset, popup, close, header, content, moving;
		
		function tryToClose(e) { // (10)
			if (!moving && e.target.className.match(/popup-cover|popup-close/)) {
				if (params.closeable) {
					hidePopup();
					cover.removeEventListener(click, tryToClose);
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
		
		if (!cover.innerHTML) { // Предотвращает появление нового окошка пока существует другое
			cover.classList.add('popup-cover'); // Класс с затемненным фоном и блокировкой прокрутки
			
			popup = document.createElement('div');
			popup.classList.add('popup');
			
			header = document.createElement('div');
			header.classList.add('popup-header', 'uppercase');
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
			
			cover.addEventListener(click, tryToClose);
			header.addEventListener('mousedown', function (e) {
				if (e.button === 0) {
					moving = true;
					clickOffset = [e.clientX - popup.offsetLeft, e.clientY - popup.offsetTop];
					document.addEventListener('mousemove', movePopup);
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
		var icon = document.getElementById('stp' + step + operation), opsAmount;
		
		function setToAll(n, cls) { // Ставит классы cls всем элементам, начиная с заданного n
			while (document.getElementById('stp' + step + n)) {
				icon = document.getElementById('stp' + step + n);
				icon.className = cls;
				n += 1;
			}
		}
		
		if (restore) { // Если передан флаг восстановления статусов (например при выборе нового файла)
			setToAll(1, 'yellow icon-spin5 animate-spin');
		} else {
			icon.className = (status) ? 'green icon-ok' : 'red icon-cancel';
			if (!status) { setToAll(operation + 1, 'red icon-stop'); }
		}
	}
	function parseInputFile(string) { // (03)
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
				header: 'Ошибка',
				content: msgs[0],
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
				header: 'Ошибка',
				content: msgs[1],
				closeable: true
			});
			setStepStatus(1, 2, false);
			return;
		}
		if (Object.keys(obj).length > 4) {
			setStepStatus(1, 2, true);
		} else {
			showPopup({
				header: 'Ошибка',
				content: msgs[1],
				closeable: true
			});
			setStepStatus(1, 2, false);
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
			var key, usage, result = '';
			
			for (key in object) {
				if (object.hasOwnProperty(key)) {
					
					if (object[key].comps) {
						usage = '<span style="color: #666;"> (' + object[key].comps.join(', ') + ')</span>';
					} else { usage = (v) ? '<span style="color: #666;"> (переходное отверстие)</span>' :
					                       '<span style="color: #666;"> (используется самостоятельно)</span>'; }
					
					result += '<div id="r' + i + '" class="step2-actions-pads-list-row">' +
					          '<span class="icon-help step2-actions-pads-list-row-status yellow"></span>' + key + usage +
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
		padsDescriptions = {};
		
		while (document.getElementById('rnd' + i)) { document.getElementById('rnd' + i).style.display = 'block'; i += 1; }
		i = 1;
		while (document.getElementById('rect' + i)) { document.getElementById('rect' + i).style.display = 'block'; i += 1; }
	}
	
	if (!allSupported) {
		showPopup({
			header: 'Ошибка',
			content: msgs[msgs.length - 2],
			closeable: false
		});
		return;
	}
	
	window.addEventListener('error', function () {
		showPopup({
			header:    'Ошибка',
			content:   msgs[msgs.length - 1], // Неопределенная ошибка всегда последняя в массиве msgs
			buttons:   ['Обновить страницу'],
			funcs:     [location.reload.bind(location, true)],
			closeable: false
		});
	});
	window.addEventListener('load', function () { // Добавление символов в библиотеку
		var rndGroup, rectGroup, symbol, i;
		
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
			setStepStatus(1, 1, true, true); // Сброс иконок при нажатии кнопки загрузки.
			file = input.files[0];
			document.getElementById('fileName').innerHTML = '<p>Название: <span style="color:#666;">' + file.name + '</span></p>' +
			                                                '<p>Состояние: <span style="color:#666;">выбран, не подтвержден</span></p>';
		}
	});
	helpButton.addEventListener(click, function () { // (01)
		rollBlock(document.getElementById('help-wrapper'), document.getElementById('help-borders'), true);
	});
	uploadButton.addEventListener(click, function () {
		setStepStatus(1, 1, true, true); // Сброс иконок при нажатии кнопки загрузки.
		
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
		
		document.getElementById(padsDescriptions[activeRow.id].symbol).style.display = 'block';
		clearButton.style.display = 'none';
		autoButton.style.display = 'block';
		symbol.innerHTML = 'Выберите символ из библиотеки.';
		status.classList.remove('green', 'icon-ok');
		status.classList.add('icon-help', 'yellow');
		
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
				if (padsDescriptions['r' + i].shape === 'rnd' && freeSymbols.rnd.length) { // Если круглая КП
					
					padsDescriptions['r' + i].symbol = freeSymbols.rnd[0]; // Берем первый свободный символ нужного типа
					padsDescriptions['r' + i].symbolCode = generateSVG(100, 100, freeSymbols.rnd[0], 2); // Генерируем для него svg
					document.getElementById(freeSymbols.rnd[0]).style.display = 'none'; // Прячем выбранный символ в библиотеке
					freeSymbols.rnd.shift(); // Удаляем из массива уже не свободный символ
					document.getElementById('r' + i).firstChild.classList.remove('icon-help', 'yellow'); // Добавляем галочку на соответствующую строку списка КП
					document.getElementById('r' + i).firstChild.classList.add('green', 'icon-ok');
					freeSymbolsAm.rnd -= 1; // Уменьшаем остаток символов
					
				} else if (padsDescriptions['r' + i].shape === 'rect' && freeSymbols.rect.length) {
					
					padsDescriptions['r' + i].symbol = freeSymbols.rect[0];
					padsDescriptions['r' + i].symbolCode = generateSVG(100, 100 / padsDescriptions['r' + i].ratio, freeSymbols.rect[0], 2);
					document.getElementById(freeSymbols.rect[0]).style.display = 'none';
					freeSymbols.rect.shift();
					document.getElementById('r' + i).firstChild.classList.remove('icon-help', 'yellow'); // Добавляем галочку на соответствующую строку списка КП
					document.getElementById('r' + i).firstChild.classList.add('green', 'icon-ok');
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
		var key, layers;
		
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
		
		document.getElementById('result').innerHTML = '<pre>' + fileContent.asArray().join(String.fromCharCode(10)) + '</pre>';
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
				symbol.innerHTML = padsDescriptions[row.id].symbolCode || 'Выберите символ из библиотеки.';
				descr.innerHTML = padsDescriptions[row.id].descr;
				activeRow = row;
				clearButton.style.display = (padsDescriptions[row.id].symbolCode) ? 'flex' : 'none';
				autoButton.style.display = (padsDescriptions[row.id].symbolCode || freeSymbolsAm[padsDescriptions[row.id].shape] === 0) ? 'none' : 'block';
			}
		}
	});
	lib.addEventListener(click, function (e) {
		var status;
		
		if (!e.target.id.match(/(rnd|rect)\d+/i) || !activeRow) { return; } // Если клик не по символу или нет активной КП
		if (e.target.id.match(/rnd\d+/i) && (padsDescriptions[activeRow.id].ratio !== 1 || padsDescriptions[activeRow.id].shape === 'rect')) { // При попытке наложения круглого символа на не круглую КП
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
		
		e.target.style.display = 'none';
		autoButton.style.display = 'none';
		symbol.innerHTML = generateSVG(100, 100 / padsDescriptions[activeRow.id].ratio, e.target.id, 2);
		clearButton.style.display = 'flex';
		
		status = activeRow.firstChild;
		status.classList.remove('icon-help', 'yellow');
		status.classList.add('green', 'icon-ok');
		
		freeSymbolsAm[padsDescriptions[activeRow.id].shape] -= 1; // Уменьшаем количество свободных символов данного типа
		
		padsDescriptions[activeRow.id].symbolCode = symbol.innerHTML;
		padsDescriptions[activeRow.id].symbol = e.target.id;
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
			getPads: { // NOTE: [] Этот метод надо полностью переписать
				value: function () {
					var comp = {}, cosA, currPath, height, i, j, key, name, pads = {},
						prop, rotation, shiftX, shiftY, type, result = {}, side, sinA, vias = {},
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
							       Math.PI * (a[1].width / 2) : a[1].width * a[1].height;
							sqB = (b[1].shape.match(/ellipse|oval|mthole|target/i) && b[1].width === b[1].height) ?
							       Math.PI * (b[1].width / 2) : b[1].width * b[1].height;
							
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
					function writeSideForLonePads(coordsArray, defaultSide) {
						var k, coords, side;
						
						if (coordsArray.length) {
							for (k = 0; k < coordsArray.length; k += 1) { // Записывает слой отдельностоящего пада. Надо все это упростить
								coords = coordsArray[k].split(' ');
								if (coords[2]) { // Если у набора координат есть третье значение - это отдельная КП
									if (coords[2] === 'flipped') { side = (defaultSide === 'top') ? 'bot' : 'top'; } else { side = defaultSide; } // Меняем сторону если у текущих координат есть флаг flipped
									if (+coords[2] || +coords[2] === 0) { coords[3] = coords[2]; } // Если третье значение - угол поворота - делаем его четвертым
									coords[2] = side;
									coordsArray[k] = coords.join(' ');
								}
							}
						}
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
									pads[name].coords.push(parser('pt', currPath[i]) + ' ' + parser('rotation', currPath[i]));
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
								writeSideForLonePads(currPath[name].coords, currPath[name].side);
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
											// В случае, если элемент повернут - прибавляем его поворот к повороту КП. Если получилось больше 360 (полный оборот) - уменьшаем на 360
											rotation = (comp[key].rotation) ? comp[key].rotation + (+comp[key].pads[name][i].split(' ')[2]) : (+comp[key].pads[name][i].split(' ')[2]);
											while (rotation >= 360) { rotation -= 360; }
											
											pads[name].coords.push((+zero[0] + x).toFixed(3) + ' ' +
																						 (+zero[1] + y).toFixed(3) + ' ' +
																						 side + ' ' + rotation);
										}
										// Записывает в каких компонентах использована площадка:
										if (pads[name].comps) { pads[name].comps.push(key); } else { pads[name].comps = []; pads[name].comps.push(key); }
									}
								}
							}
						}
						for (name in pads) { if (pads.hasOwnProperty(name)) { if (!pads[name].coords.length) { delete pads[name]; } } }
						for (name in vias) { if (vias.hasOwnProperty(name)) { if (!vias[name].coords.length) { delete vias[name]; } } }
						for (name in pads) {
							if (pads.hasOwnProperty(name) && pads[name].comps && pads[name].comps.length > 1) {
								pads[name].comps.sort(compareNames);
								pads[name].comps = compressNames(pads[name].comps);
							}
						}
					} catch (err) {
						showPopup({
							header:    'Ошибка',
							content:   msgs[2],
							closeable: true
						});
						setStepStatus(1, 3, false);
						return;
					}
					
					result.vias = sortObject(vias); // Сортировка в порядке увеличения площади КП
					result.pads = sortObject(pads);
					setStepStatus(1, 3, true);
					return result;
				}
			},
			addLayer: {
				value: function (layerName, layerContent) { // (09)
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
					function shiftPropsLeft(object, n) {
						var size = Object.keys(object).length;
						
						for (n; n < size; n += 1) {
							object[n] = object[n + 1];
						}
						if (!object[size]) { delete object[size]; }
					}
					function shiftPropsRight(object, n) {
						var size = Object.keys(object).length, i;
						
						for (i = size; i >= n; i -= 1) {
							object[i + 1] = object[i];
							delete object[i];
						}
					}
					
					for (i = 0; i < Object.keys(this['4']).length; i += 1) {
						if (typeof this['4'][i] === 'object') {
							
							if (this['4'][i].header.indexOf('(layerDef') + 1) { // Находим блок layerDef
								if (this['4'][i].header.slice(11, -1).toLowerCase() === layerName.toLowerCase()) { // Если слой с таким именем существует - берем его номер
									layerNum = +this['4'][i][0].slice(10, -1);
								} else { // Иначе запоминаем номер этого слоя в соответствующую ячейку массива что бы потом найти наименьший свободный номер
									layers[+this['4'][i][0].slice(10, -1)] = true;
								}
							} else if (this['4'][i].header.indexOf('(multiLayer') + 1) { // Находим блок multilayer - после него идут блоки с содержимым слоев, перед ним - с описанием
								/* Создаем блок с описанием слоя */
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
			}
		});
		padsLib = fileContent.getPads();
		if (!padsLib) { return; }
		
		createPadsList(padsLib);
	});
}());