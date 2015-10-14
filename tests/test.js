describe('Подсчет скобок', function () {

  it('Закрывающих меньше, чем открывающих', function () {
    assert.equal(testCalcBrackets('my(tes(t) str(ing'), 2);
  });
	
  it('Закрывающих больше, чем открывающих', function () {
    assert.equal(testCalcBrackets('my(tes(t)) strin)g'), -1);
  });
	
  it('Закрывающих столько же, сколько открывающих', function () {
    assert.equal(testCalcBrackets('my(tes(t)) str(in)g'), 0);
  });

});