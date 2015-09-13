/*global FileReader */
// (00) Функция разбивает строку в массив по символам EOL и удаляет пустые элементы.
// (01) Функция чистит строки в массиве от пробелов в начале и в конце и удаляет символы,
//      которые не удалось преобразовать в Юникод.

(function () {
	'use strict';
		
	var
		reader    = new FileReader(),
		input     = document.getElementById('file'),
		tempArray = [],
		content   = {};
		
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
		tempArray = this.result.split(/\r\n|\n|\r/).filter(function (str) {
			return str;
		});
		//tempArray = removeUnwantedSymbols(tempArray);
		document.write('<pre>' + tempArray.join('</br>') + '</pre>');
		
		tempArray.forEach(function (str) {
			
		});
		
	};
}());