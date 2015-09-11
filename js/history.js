// Finding prime numbers in array (from 2 to n).
// 26.8.15
/*
function sumElements(arr) {
    'use strict';
    var i, sum = 0;
    for (i = 0; i < arr.length; i += 1) {
        sum += arr[i];
    }
    arr.push('Сумма элементов: ' + sum);
    return arr;
}
function erath(arr) {
    'use strict';
    var primes = [], i, p = 2;
    while (p * p < arr.length) {
        for (i = 0; i < arr.length; i += 1) {
            if (arr[i] !== 0 && arr[i] !== p && arr[i] % p === 0) {
                arr[i] = 0;
            }
        }
        p += 1;
    }
    for (i = 0; i < arr.length; i += 1) {
        if (arr[i] !== 0) {
            primes.push(arr[i]);
        }
    }
    return sumElements(primes);
}
function main() {
    'use strict';
    var numArr = [], i, max = 100;
    for (i = 2; i <= max; i += 1) {
        numArr.push(i);
    }
    window.alert(erath(numArr));
}
main();
*/
// Finding sum of highest sequence in array.
// 26.8.15
/*
function createRandomNumbersArray(size, max) {
    // Function receives array size and highest possible number and 
    // returns array with random positive and negative numbers.
    'use strict';
    var i, arr = [];
    for (i = 0; i < size; i += 1) {
        arr[i] = Math.round((Math.random() * max) - (Math.random() * max));
    }
    return arr;
}
function getMaxSubSum(arr) {
    // Function receives array with numbers and returns sum of highest sequence.
    'use strict';
    var i, j = 0, negSum = 0, posSum = 0, max = 0, currSeq = 0, comprArr = [];
    // Compressing array by summing groups of negative and positive numbers.
    for (i = 0; i < arr.length; i += 1) {
        if (arr[i] > 0) {
            posSum += arr[i];
            if (arr[i + 1] < 0 || i + 1 === arr.length) {
                comprArr[j] = posSum;
                posSum = 0;
                j += 1;
            }
        } else {
            negSum += arr[i];
            if (arr[i + 1] > 0 || i + 1 === arr.length) {
                comprArr[j] = negSum;
                negSum = 0;
                j += 1;
            }
        }
    }
    // Now have array with alternate positive and negative numbers.
    // Next step: checking array keys in sequence. If key is positive 
    // or negative, but next key is greater - adding to currSeq var.
    for (i = 0; i < comprArr.length; i += 1) {
        if (comprArr[i] > 0 || (comprArr[i] < 0 &&
                                i + 1 < comprArr.length &&
                                currSeq > Math.abs(comprArr[i]) &&
                                comprArr[i + 1] > Math.abs(comprArr[i]))) {
            currSeq += comprArr[i];
        } else {
            currSeq = 0;
        }
        if (currSeq > max) {
            max = currSeq;
        }
    }
    return max;
}
function main() {
    'use strict';
    var arr = (createRandomNumbersArray(10, 10));
    window.alert(getMaxSubSum(arr));
}
main();
*/
// Adding value to object.
// 26.8.15
/*
function addClass(obj, cls) {
    'use strict';
    var key, arr = [];
    for (key in obj) {
        // Splitting string to array with spaces if string have values
        // or not splitting if string is empty.
        arr = (obj[key]) ? obj[key].split(' ') : obj[key].split('');
        if (arr.indexOf(cls) < 0) {
            arr.push(cls);
            obj[key] = arr.join(' ');
        }
    }
    return obj;
}
function main() {
    'use strict';
    var obj = {
        className: 'open menu',
        objKey1: 'new',
        objKey2: ''
    }, key;
    addClass(obj, 'new');
    addClass(obj, 'open');
    addClass(obj, 'me');
    for (key in obj) {
        window.alert(key + ' : ' + obj[key]);
    }
    
}
main();
*/
// Text camelizer.
// 26.8.15
/*
function camelize(arr) {
    'use strict';
    var str = arr.join(', ').toLowerCase(), i;
    for (i = 0; i < str.length; i += 1) {
        if (str[i] === '-') {
            str = str.slice(0, i) + str.substr(i + 1, 1).toUpperCase() + str.slice(i + 2);
        }
    }
    arr = str.split(', ');
    return arr;
}
function main() {
    'use strict';
    var arr = ['my-class-name', '-my-class-Name', 'MY-CLASS-NAME', 'mY-cLAss-naMe-'];
    window.alert(camelize(arr));
}
main();
*/
// Removing value from object.
// 27.8.15
/*
function removeClass(obj, cls) {
    'use strict';
    var i, arr;
    for (i in obj) {
        arr = obj[i].split(' ');
        while (arr.indexOf(cls) >= 0) {
            arr.splice(arr.indexOf(cls), 1);
            obj[i] = arr.join(' ');
        }
    }
    return obj;
}
function main() {
    'use strict';
    var obj = {
        className: 'open menu open'
    }, i;
    removeClass(obj, 'open');
    for (i in obj) {
        window.alert(i + ' : ' + obj[i]);
    }
}
main();
*/
// Removing out of range numbers from array.
// 27.8.15
/*
function filterRangeInPlace(arr, a, b) {
    'use strict';
    var i;
    for (i = 0; i < arr.length; i += 1) {
        if (arr[i] < a || arr[i] > b) {
            arr.splice(i, 1);
            i -= 1;
        }
    }
}
function main() {
    'use strict';
    var arr = [5, 8, 2, 0, 4, 9, 7, 5, 2, 1, 3, 6, 9];
    filterRangeInPlace(arr, 2, 5);
    window.alert(arr);
}
main();
*/
// Sorting numeric array.
// 28.8.15
/*
function compareNumeric(a, b) {
    'use strict';
    return a - b;
}
function main() {
    'use strict';
    var arr = [5, 8, 2, 0, 1, 7, 5, 2, 9, 6, 4];
    arr.sort(compareNumeric);
    window.alert(arr);
}
main();
*/
// Removing anagrams from array.
// 28.8.15
/* 
function sortLetters(str) {
    'use strict';
    // Exploding string to arr by letters, sorting alphabetically
    // and glue them back to string.
    return str.toLowerCase().split('').sort().join('');
}
function aclean(arr) {
    'use strict';
    var i, j, sortedStr;
    // Outer cycle picking values one after another and
    // inner cycle comparing them to remaining ones.
    for (i = 0; i < arr.length; i += 1) {
        sortedStr = sortLetters(arr[i]);
        for (j = i + 1; j < arr.length; j += 1) {
            if (sortedStr === sortLetters(arr[j])) {
                arr.splice(j, 1);
                j -= 1;
            }
        }
    }
    return arr;
}
function main() {
    'use strict';
    var arr = ['воз', 'киборг', 'корсет', 'ЗОВ', 'гробик', 'костер', 'сектор'];
    window.alert(aclean(arr));
}
main();
*/
// Calculating subtotals for numeric array.
// 31.8.15
/*
function getSums(arr) {
    'use strict';
    var result = [];
    arr.reduce(function (sum, curr) {
        result.push(sum + curr);
        return sum + curr;
    }, 0);
    return result;
}
function main() {
    'use strict';
    var arr = [1, 2, 3, 4, 5];
    window.alert(getSums(arr));
}
main();
*/
// String buffer with clearing method.
// 1.9.15
/* 
function makeBuffer() {
    'use strict';
    var arr = [];
    function buffer(item) {
        if (item !== undefined) {
            arr.push(String(item));
        }
        return arr.join('');
    }
    buffer.clear = function () {
        arr = [];
    };
    return buffer;
}
var buffer = makeBuffer();
buffer('Замыкания');
buffer(' Использовать');
buffer(' Нужно!');
window.alert(buffer());
*/
// Getters and setters usage.
// 8.9.15
/*
(function (a) {
    'use strict';
    function User(fullName) {
        this.fullName = fullName;
        Object.defineProperty(this, 'firstName', {
            get: function () {
                return this.fullName.split(' ')[0];
            },
            set: function (first) {
                this.fullName = first + ' ' + this.fullName.split(' ')[1];
            }
        });
        Object.defineProperty(this, 'lastName', {
            get: function () {
                return this.fullName.split(' ')[1];
            },
            set: function (last) {
                this.fullName = this.fullName.split(' ')[0] + ' ' + last;
            }
        });
    }
    var vasya = new User('Василий Попкин');
    window.alert(vasya.firstName);
    window.alert(vasya.lastName);
    vasya.lastName = 'Сидоров';
    window.alert(vasya.fullName);
}());
*/
// Method borrowing.
// 9.9.15
/*
(function (a) {
    'use strict';
    function sumArgs() {
        var reduce = [].reduce;
        return reduce.call(arguments, function (prev, currEl) {
            return prev + currEl;
        });
    }
    window.alert(sumArgs(1, 2, 3));
}());
*/
// 