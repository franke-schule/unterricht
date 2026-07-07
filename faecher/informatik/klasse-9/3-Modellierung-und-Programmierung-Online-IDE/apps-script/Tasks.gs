const TASKS = {
  b: {
    title:
      'Aufgabe b: Programmtext analysieren',
    maxPoints:
      6,
    instruction:
      'Bewerte, ob die Schuelerantwort die Funktion jeder Programmzeile beschreibt.',
    program:
      [
        'Circle ball = new Circle(200, 50, 50);',
        'ball.move(10, 10);',
        'ball.setFillColor(Color.red);',
        'ball.destroy();'
      ].join('\n'),
    expectedAspects: [
      'Circle ball = new Circle(200, 50, 50); erzeugt ein neues Circle-Objekt und speichert es in der Variablen ball.',
      'Die Zahlen im Konstruktor legen Position und Groesse des Kreises fest.',
      'ball.move(10, 10); verschiebt den Kreis um die angegebenen Werte.',
      'ball.setFillColor(Color.red); faerbt den Kreis rot.',
      'ball.destroy(); entfernt oder zerstoert den Kreis wieder.',
      'Die Antwort verwendet eigene Worte und erklaert die Reihenfolge des Programms nachvollziehbar.'
    ]
  },

  c: {
    title:
      'Aufgabe c: Zahlen variieren',
    maxPoints:
      6,
    instruction:
      'Bewerte, ob die Schuelerantwort Beobachtungen zur Wirkung der Zahlen im Programm beschreibt.',
    program:
      [
        'Circle ball = new Circle(200, 50, 50);',
        'ball.move(10, 10);',
        'ball.setFillColor(Color.red);',
        'ball.destroy();'
      ].join('\n'),
    expectedAspects: [
      'Die erste Zahl in new Circle(200, 50, 50) beeinflusst die horizontale Position des Kreises.',
      'Die zweite Zahl in new Circle(200, 50, 50) beeinflusst die vertikale Position des Kreises.',
      'Die dritte Zahl in new Circle(200, 50, 50) beeinflusst die Groesse des Kreises.',
      'Die erste Zahl in move(10, 10) beschreibt die horizontale Verschiebung.',
      'Die zweite Zahl in move(10, 10) beschreibt die vertikale Verschiebung.',
      'Die Antwort beruht erkennbar auf einzelnen Veraenderungen und Beobachtungen.'
    ]
  },

  '2b': {
    title:
      'Aufgabe 2b: Klassen analysieren und veraendern',
    maxPoints:
      6,
    instruction:
      'Bewerte, ob die Schuelerantwort die Funktion jeder Programmzeile in Programm.java beschreibt.',
    program:
      [
        'Programm.java:',
        'Hund petersHund = new Hund(5, "Wuffti");',
        '',
        'Hund inasHund = new Hund(8, "Schnuffi");',
        '',
        'petersHund.zeigeDaten();',
        '',
        'inasHund.zeigeDaten();',
        '',
        'inasHund.belle();',
        '',
        'Hund.java:',
        'class Hund {',
        '   int alter;',
        '   String name;',
        '',
        '   Hund(int par1, String par2)',
        '   {',
        '      alter = par1;',
        '      name = par2;',
        '   }',
        '',
        '   void zeigeDaten()',
        '   {',
        '      println("Der Hund heisst " + name + " und ist " + alter + " Jahre alt.");',
        '   }',
        '',
        '   void belle() {',
        '      println(name + ": Wuff wuff"); }',
        '}'
      ].join('\n'),
    expectedAspects: [
      'Hund petersHund = new Hund(5, "Wuffti"); erzeugt ein Hund-Objekt mit Alter 5 und Name Wuffti und speichert es in petersHund.',
      'Hund inasHund = new Hund(8, "Schnuffi"); erzeugt ein zweites Hund-Objekt mit Alter 8 und Name Schnuffi und speichert es in inasHund.',
      'petersHund.zeigeDaten(); ruft die Methode zeigeDaten fuer petersHund auf und gibt seine Daten aus.',
      'inasHund.zeigeDaten(); ruft die Methode zeigeDaten fuer inasHund auf und gibt ihre Daten aus.',
      'inasHund.belle(); ruft die Methode belle fuer inasHund auf und gibt den Belltext mit dem Namen aus.',
      'Die Antwort verwendet eigene Worte und erklaert Objekte, Konstruktoraufrufe und Methodenaufrufe nachvollziehbar.'
    ]
  }
};
