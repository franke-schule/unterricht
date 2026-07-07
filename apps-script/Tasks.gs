const TASKS = {
  b: {
    title:
      'Klasse 9 Aufgabe b: Programmtext analysieren',
    grade:
      9,
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
      'Klasse 9 Aufgabe c: Zahlen variieren',
    grade:
      9,
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
      'Klasse 9 Aufgabe 2b: Klassen analysieren und veraendern',
    grade:
      9,
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
  },

  '1a': {
    title:
      'Klasse 10 Aufgabe 1a: Programmzeilen erklaeren',
    grade:
      10,
    maxPoints:
      6,
    instruction:
      'Bewerte, ob die Schuelerantwort die Bedeutung der beiden Programmzeilen im Hauptprogramm erklaert.',
    program:
      [
        'Kiste block = new Kiste();',
        'Ball ball1 = new Ball(100);'
      ].join('\n'),
    expectedAspects: [
      'Kiste block = new Kiste(); erzeugt ein neues Objekt der Klasse Kiste.',
      'Das neu erzeugte Kiste-Objekt wird in der Objektvariablen block gespeichert.',
      'Ball ball1 = new Ball(100); erzeugt ein neues Objekt der Klasse Ball.',
      'Das neu erzeugte Ball-Objekt wird in der Objektvariablen ball1 gespeichert.',
      'Die 100 wird beim Erzeugen an den Konstruktor von Ball uebergeben.',
      'Die Antwort erklaert die Programmzeilen in eigenen Worten und unterscheidet Klasse, Objekt und Objektvariable nachvollziehbar.'
    ]
  },

  '1b': {
    title:
      'Klasse 10 Aufgabe 1b: Parameterwert Ball(100)',
    grade:
      10,
    maxPoints:
      6,
    instruction:
      'Bewerte, ob die Schuelerantwort die Bedeutung der 100 bei Ball(100) und den passenden Fachbegriff erklaert.',
    program:
      [
        'Ball ball1 = new Ball(100);',
        '',
        'class Ball extends Actor {',
        '   Ball(float startX)',
        '   {',
        '      ball = new Circle(startX, 50, 30);',
        '      setzeBallfarbe(new Color(239, 250, 180));',
        '      geschwindigkeit = 5;',
        '   }',
        '}'
      ].join('\n'),
    expectedAspects: [
      'Die 100 wird beim Konstruktoraufruf new Ball(100) an den Konstruktor Ball(float startX) uebergeben.',
      'Die 100 wird im Konstruktor als Wert fuer startX verwendet.',
      'startX legt die x-Position beziehungsweise den horizontalen Startpunkt des Kreises fest.',
      'Der passende Fachbegriff fuer startX ist Parameter.',
      'Der konkrete Wert 100 kann als Argument oder Parameterwert bezeichnet werden.',
      'Die Antwort stellt den Zusammenhang zwischen Aufruf, Konstruktor und Circle(startX, 50, 30) nachvollziehbar dar.'
    ]
  },

  '1c': {
    title:
      'Klasse 10 Aufgabe 1c: Klasse und Objekt unterscheiden',
    grade:
      10,
    maxPoints:
      6,
    instruction:
      'Bewerte, ob die Schuelerantwort den Unterschied zwischen Klasse und Objekt anhand des Programms erklaert.',
    program:
      [
        'Kiste block = new Kiste();',
        'Ball ball1 = new Ball(100);',
        '',
        'class Ball extends Actor { ... }',
        'class Kiste extends Actor { ... }'
      ].join('\n'),
    expectedAspects: [
      'Eine Klasse ist ein Bauplan oder eine Vorlage fuer Objekte.',
      'Ball und Kiste sind Klassen, weil sie Attribute, Konstruktoren und Methoden beschreiben.',
      'Ein Objekt ist eine konkrete Instanz, die nach einer Klasse erzeugt wurde.',
      'ball1 ist ein Objekt der Klasse Ball beziehungsweise eine Objektvariable, die darauf verweist.',
      'block ist ein Objekt der Klasse Kiste beziehungsweise eine Objektvariable, die darauf verweist.',
      'Die Antwort nutzt Beispiele aus dem Programm und trennt Bauplan, erzeugtes Objekt und Objektvariable nachvollziehbar.'
    ]
  },

  '1f': {
    title:
      'Klasse 10 Aufgabe 1f: extends Actor erklaeren',
    grade:
      10,
    maxPoints:
      6,
    instruction:
      'Bewerte, ob die Schuelerantwort die Bedeutung von extends Actor im Programmtext zu Ball erklaert.',
    program:
      [
        'class Ball extends Actor {',
        '   int geschwindigkeit;',
        '',
        '   void act()',
        '   {',
        '      bewegeBall();',
        '      if(ball.isOutsideView())',
        '      {',
        '         setzteBallnachoben();',
        '      }',
        '   }',
        '}'
      ].join('\n'),
    expectedAspects: [
      'extends Actor bedeutet, dass Ball von der Klasse Actor erbt.',
      'Ball ist dadurch eine Unterklasse von Actor.',
      'Ball uebernimmt Eigenschaften oder Verhalten, die Actor fuer handelnde Objekte in der LearnJ-Umgebung bereitstellt.',
      'Die Methode act() kann dadurch als wiederholt ausgefuehrte Aktion des Actors genutzt werden.',
      'Durch Vererbung muss gemeinsames Actor-Verhalten nicht neu programmiert werden.',
      'Die Antwort verwendet den Fachbegriff Vererbung und bezieht ihn erkennbar auf Ball und Actor.'
    ]
  }
};
