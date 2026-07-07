/**
 * Regelbasierte Mindestbewertung fuer die einzelnen Aufgaben.
 */

function applyRuleBasedMinimum_(
  evaluation,
  task,
  answer
) {
  let ruleBasedEvaluation = null;

  if (task === TASKS.b) {
    ruleBasedEvaluation =
      evaluateTaskBByRules_(
        answer,
        task.maxPoints
      );
  }

  if (task === TASKS.c) {
    ruleBasedEvaluation =
      evaluateTaskCByRules_(
        answer,
        task.maxPoints
      );
  }

  if (task === TASKS['2b']) {
    ruleBasedEvaluation =
      evaluateTask2BByRules_(
        answer,
        task.maxPoints
      );
  }

  if (!ruleBasedEvaluation) {
    return evaluation;
  }

  if (
    ruleBasedEvaluation.points >
    evaluation.points
  ) {
    return ruleBasedEvaluation;
  }

  return evaluation;
}


function evaluateTaskBByRules_(
  answer,
  maxPoints
) {
  const normalizedAnswer =
    normalizeGermanText_(
      answer
    );

  const strengths = [];
  const missing = [];
  let points = 0;

  if (containsAny_(normalizedAnswer, [
    'erstellt',
    'erzeugt',
    'angelegt',
    'new circle',
    'neuer kreis',
    'kreis wird erstellt',
    'ball wird erstellt'
  ])) {
    points += 1;
    strengths.push(
      'Du erkennst, dass zuerst ein Kreis beziehungsweise Ball erstellt wird.'
    );
  } else {
    missing.push(
      'Erklaere, dass in der ersten Zeile ein Kreis-Objekt erzeugt wird.'
    );
  }

  if (containsAny_(normalizedAnswer, [
    'bewegt',
    'verschoben',
    'move',
    'wandert'
  ])) {
    points += 1;
    strengths.push(
      'Du beschreibst, dass der Kreis bewegt oder verschoben wird.'
    );
  } else {
    missing.push(
      'Ergaenze, dass move(10, 10) den Kreis verschiebt.'
    );
  }

  if (containsAny_(normalizedAnswer, [
    'rot',
    'red',
    'color.red'
  ])) {
    points += 1;
    strengths.push(
      'Du nennst die rote Faerbung durch setFillColor(Color.red).'
    );
  } else if (containsAny_(normalizedAnswer, [
    'blau',
    'blue',
    'gefaerbt',
    'farbig',
    'farbe'
  ])) {
    missing.push(
      'Die Farbe ist im Programm rot, nicht blau.'
    );
  } else {
    missing.push(
      'Ergaenze, dass setFillColor(Color.red) den Kreis rot faerbt.'
    );
  }

  if (containsAny_(normalizedAnswer, [
    'zerstoert',
    'zerstort',
    'entfernt',
    'geloescht',
    'geloscht',
    'verschwindet',
    'destroy'
  ])) {
    points += 1;
    strengths.push(
      'Du erkennst, dass der Kreis am Ende entfernt oder zerstoert wird.'
    );
  } else {
    missing.push(
      'Erklaere, dass destroy() den Kreis wieder entfernt.'
    );
  }

  if (containsAny_(normalizedAnswer, [
    'dann',
    'anschliessend',
    'anschließend',
    'danach',
    'zuerst'
  ])) {
    points += 1;
    strengths.push(
      'Du beschreibst die Reihenfolge des Programms nachvollziehbar.'
    );
  }

  if (containsAny_(normalizedAnswer, [
    'position',
    'groesse',
    'grosse',
    'größe',
    'koordinate',
    'x',
    'y',
    '200',
    '50'
  ])) {
    points += 1;
    strengths.push(
      'Du gehst auf die Zahlen fuer Position oder Groesse ein.'
    );
  } else {
    missing.push(
      'Fuer die volle Punktzahl solltest du noch die Bedeutung der Zahlen erwaehnen.'
    );
  }

  points =
    clampNumber_(
      points,
      0,
      maxPoints
    );

  return {
    ok:
      true,
    points:
      points,
    maxPoints:
      maxPoints,
    status:
      points >= maxPoints * 0.75
        ? 'gut'
        : points >= maxPoints * 0.4
          ? 'teilweise richtig'
          : 'noch unvollstaendig',
    strengths:
      strengths.slice(0, 4),
    missing:
      missing.slice(0, 4),
    feedback:
      points >= maxPoints * 0.75
        ? 'Deine Antwort trifft die wichtigsten Programmschritte. Achte noch auf genaue Fachbegriffe und die richtige Farbe.'
        : 'Du hast einige wichtige Programmschritte erkannt. Ergaenze noch die fehlenden Details, besonders Farbe und Zahlen.'
  };
}


function evaluateTaskCByRules_(
  answer,
  maxPoints
) {
  const normalizedAnswer =
    normalizeGermanText_(
      answer
    );

  const strengths = [];
  const missing = [];
  let points = 0;

  const mentionsCircleLine =
    containsAny_(normalizedAnswer, [
      'zeile 1',
      'erste zeile',
      'circle',
      'new circle',
      'zahlen in zeile 1'
    ]);

  const mentionsCoordinates =
    containsAny_(normalizedAnswer, [
      'x und y',
      'x- und y',
      'x koordinate',
      'x-koordinate',
      'y koordinate',
      'y-koordinate',
      'koordinate',
      'koordinaten'
    ]);

  const mentionsSize =
    containsAny_(normalizedAnswer, [
      'radius',
      'groesse',
      'grosse',
      'durchmesser',
      'breite',
      'hoehe'
    ]);

  const mentionsMove =
    containsAny_(normalizedAnswer, [
      'move',
      'bei move',
      'verschiebung',
      'verschoben',
      'bewegt'
    ]);

  if (
    mentionsCircleLine &&
    mentionsCoordinates
  ) {
    points += 2;
    strengths.push(
      'Du erkennst, dass zwei Zahlen in der ersten Zeile die Position beziehungsweise Koordinaten betreffen.'
    );
  } else {
    missing.push(
      'Erklaere, dass zwei Zahlen in new Circle(...) die x- und y-Position festlegen.'
    );
  }

  if (
    mentionsCircleLine &&
    mentionsSize
  ) {
    points += 1;
    strengths.push(
      'Du erkennst, dass eine Zahl die Groesse beziehungsweise den Radius des Kreises beschreibt.'
    );
  } else {
    missing.push(
      'Ergaenze, dass eine Zahl in new Circle(...) die Groesse des Kreises beeinflusst.'
    );
  }

  if (
    mentionsMove &&
    mentionsCoordinates
  ) {
    points += 2;
    strengths.push(
      'Du beschreibst, dass move(...) die Verschiebung in x- und y-Richtung angibt.'
    );
  } else {
    missing.push(
      'Erklaere, dass die beiden Zahlen in move(10, 10) die Verschiebung in x- und y-Richtung angeben.'
    );
  }

  if (
    containsAny_(normalizedAnswer, [
      'erste zahl',
      'zweite zahl',
      'dritte zahl',
      '200',
      '50'
    ])
  ) {
    points += 1;
    strengths.push(
      'Du ordnest einzelne Zahlen oder Zahlenpositionen genauer zu.'
    );
  } else {
    missing.push(
      'Fuer die volle Punktzahl solltest du noch genauer sagen, welche Zahl wofuer steht.'
    );
  }

  points =
    clampNumber_(
      points,
      0,
      maxPoints
    );

  return {
    ok:
      true,
    points:
      points,
    maxPoints:
      maxPoints,
    status:
      points >= maxPoints * 0.75
        ? 'gut'
        : points >= maxPoints * 0.4
          ? 'teilweise richtig'
          : 'noch unvollstaendig',
    strengths:
      strengths.slice(0, 4),
    missing:
      missing.slice(0, 4),
    feedback:
      points >= maxPoints * 0.75
        ? 'Deine Antwort beschreibt die Bedeutung der Zahlen schon gut. Fuer die volle Punktzahl ordne die einzelnen Zahlen noch genauer zu.'
        : 'Du hast wichtige Beobachtungen genannt. Ergaenze noch genauer, welche Zahl welche Wirkung hat.'
  };
}


function evaluateTask2BByRules_(
  answer,
  maxPoints
) {
  const normalizedAnswer =
    normalizeGermanText_(
      answer
    );

  const strengths = [];
  const missing = [];
  let points = 0;

  if (containsAny_(normalizedAnswer, [
    'petershund',
    'wuffti',
    '5',
    'erzeugt',
    'erstellt',
    'new hund'
  ])) {
    points += 1;
    strengths.push(
      'Du erkennst, dass fuer Peter ein Hund-Objekt mit passenden Daten erzeugt wird.'
    );
  } else {
    missing.push(
      'Erklaere, dass petersHund als Hund mit Alter 5 und Name Wuffti erzeugt wird.'
    );
  }

  if (containsAny_(normalizedAnswer, [
    'inashund',
    'schnuffi',
    '8',
    'zweiter hund',
    'new hund'
  ])) {
    points += 1;
    strengths.push(
      'Du erkennst, dass ein zweites Hund-Objekt fuer Ina erzeugt wird.'
    );
  } else {
    missing.push(
      'Ergaenze, dass inasHund als Hund mit Alter 8 und Name Schnuffi erzeugt wird.'
    );
  }

  if (
    containsAny_(normalizedAnswer, [
      'konstruktor',
      'parameter',
      'alter',
      'name'
    ]) &&
    containsAny_(normalizedAnswer, [
      '5',
      '8',
      'wuffti',
      'schnuffi'
    ])
  ) {
    points += 1;
    strengths.push(
      'Du beschreibst, dass die Werte an den Konstruktor uebergeben werden.'
    );
  } else {
    missing.push(
      'Ergaenze, dass die Klammerwerte an den Konstruktor fuer Alter und Name uebergeben werden.'
    );
  }

  if (
    containsAny_(normalizedAnswer, [
      'petershund.zeigedaten',
      'peters hund',
      'zeige daten',
      'daten aus'
    ]) &&
    containsAny_(normalizedAnswer, [
      'peter',
      'petershund',
      'wuffti'
    ])
  ) {
    points += 1;
    strengths.push(
      'Du erklaerst den Methodenaufruf zeigeDaten fuer petersHund.'
    );
  } else {
    missing.push(
      'Beschreibe, dass petersHund.zeigeDaten() die Daten von petersHund ausgibt.'
    );
  }

  if (
    containsAny_(normalizedAnswer, [
      'inashund.zeigedaten',
      'inas hund',
      'zeige daten',
      'daten aus'
    ]) &&
    containsAny_(normalizedAnswer, [
      'ina',
      'inashund',
      'schnuffi'
    ])
  ) {
    points += 1;
    strengths.push(
      'Du erklaerst den Methodenaufruf zeigeDaten fuer inasHund.'
    );
  } else {
    missing.push(
      'Beschreibe, dass inasHund.zeigeDaten() die Daten von inasHund ausgibt.'
    );
  }

  if (containsAny_(normalizedAnswer, [
    'bellt',
    'bellen',
    'belle',
    'wuff wuff',
    'belltext'
  ])) {
    points += 1;
    strengths.push(
      'Du erkennst, dass inasHund.belle() den Hund bellen laesst.'
    );
  } else {
    missing.push(
      'Ergaenze, dass inasHund.belle() die Methode belle aufruft und einen Belltext ausgibt.'
    );
  }

  points =
    clampNumber_(
      points,
      0,
      maxPoints
    );

  return {
    ok:
      true,
    points:
      points,
    maxPoints:
      maxPoints,
    status:
      points >= maxPoints * 0.75
        ? 'gut'
        : points >= maxPoints * 0.4
          ? 'teilweise richtig'
          : 'noch unvollstaendig',
    strengths:
      strengths.slice(0, 4),
    missing:
      missing.slice(0, 4),
    feedback:
      points >= maxPoints * 0.75
        ? 'Deine Antwort erklaert die Objekte und Methodenaufrufe schon gut. Achte noch darauf, Alter, Name und Methoden genau zuzuordnen.'
        : 'Du hast erste Programmschritte erkannt. Ergaenze noch genauer, welche Objekte erzeugt werden und welche Methoden aufgerufen werden.'
  };
}
