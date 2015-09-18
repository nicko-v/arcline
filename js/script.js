/*global FileReader */
// (01) Разбивает строку в массив по символам EOL и удаляет пустые элементы.
// (02) Чистит строки в массиве от лишних пробелов.

(function () {
	'use strict';
	var
		input  = document.getElementById('file'),
		reader = new FileReader(),
		tempArray = [],
		content   = {};
	
	function removeSpaces(array) {
		array.forEach(function (str, index) {
			str = str.split('').reduce(function (result, symb, ind, arr) {
				if (symb === ' ' && (result.length === 0 || ind === arr.length - 1 || arr[ind + 1] === ' ')) {
					return result;
				} else {
					return result + symb;
				}
			}, '');
			array[index] = str;
		});
	}
	
	function createList(array, obj) {
		var currLevel = obj;
		function AddLevel() {
			this.prev = currLevel;
		}
		array.forEach(function (str) {
			if (str[0] === '(' && str[str.length - 1] === ')') {
				currLevel[str] = new AddLevel();
			} else if (str[0] === '(' && str[str.length - 1] !== ')') {
				currLevel[str] = new AddLevel();
				currLevel = currLevel[str];
			} else if (str[0] === ')' && str.length === 1) {
				currLevel = currLevel.prev;
			}
		});
	}
	
	input.addEventListener('change', function () {
		if (this.files[0]) {
			reader.readAsText(this.files[0], 'cp1251');
		}
	});
	reader.onload = function () {
		tempArray = this.result.split(/\r\n|\n|\r/).filter(function (str) { // (01)
			return str;
		});
		if (tempArray[0].indexOf('ACCEL_ASCII') === -1) {
			document.getElementById('firstStep').className = 'h1-error';
			window.alert('Выбран некорректный файл.\n\nОткройте .pcb в P-CAD и выполните следующее:\n  Save as... -> Save as type: ASCII Files');
			return;
		}
		document.getElementById('firstStep').className = 'h1-success';
		removeSpaces(tempArray); // (02)
		document.write('<pre>' + tempArray.join('</br>') + '</pre>');
		
		content[tempArray[0]] = createList(tempArray, content);
		for (var i in content) {
			console.log('key: ' + i + ' value: ' + content[i])
		}
		console.log(content);
	};
}());