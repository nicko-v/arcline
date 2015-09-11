/*global FileReader */
// (00) Функция разбивает строку в массив по символам EOL и удаляет пустые элементы.
//      Регэксп на случай если файл сохранен с использованием только \n или \r, обычно используется \r\n.
// (01) Функция чистит строки в массиве от пробелов в начале и в конце, удаляет символы
//      в неверной кодировке.
(function () {
	'use strict';
		
	var
		reader  = new FileReader(),
		input   = document.getElementById('file'),
		mainArr = [];
		
	function removeUnwantedSymbols(array) { // (01)
		array.forEach(function (str, index) {
			str = str.split('').reduce(function (result, symb, ind, arr) {
				if (symb === String.fromCharCode(65533) ||
						(symb === ' ' && (result.length === 0 || ind === arr.length - 1))) {
					return result;
				} else {
					return result + symb;
				}
			}, '');
			array[index] = str;
		});
		return array;
	}
	input.addEventListener('change', function () {
		if (this.files[0]) {
			reader.readAsText(this.files[0]);
		}
	});
	reader.onload = function () { // (00)
		document.getElementById('firstStep').className = 'h1-success';
		mainArr = this.result.split(/\r\n|\n|\r/).filter(function (str) {
			return str;
		});
		mainArr = removeUnwantedSymbols(mainArr);
		document.write('<pre>' + mainArr.join('</br>') + '</pre>');
	};
}());