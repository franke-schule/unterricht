'use strict';

// Fachlich geprüfte Sollurteile. Die Mock-Tests beweisen keine KI-Zuverlässigkeit.
const sum = 'double gewichtete_Summe = w_1 * punkt.gibEingabewertX1() + w_2 * punkt.gibEingabewertX2();';
const output = 'int berechnete_ausgabe = 0; if (gewichtete_Summe > theta) { berechnete_ausgabe = 1; } else { berechnete_ausgabe = 0; }';
const delta = 'int delta = punkt.gibLabel() - berechnete_ausgabe;';
const updates = 'w_1 += delta * lernrate * punkt.gibEingabewertX1(); w_2 += delta * lernrate * punkt.gibEingabewertX2(); theta -= delta * lernrate;';
const branches = `if (delta == 1) {
  w_1 = w_1 + lernrate * punkt.gibEingabewertX1();
  w_2 = w_2 + lernrate * punkt.gibEingabewertX2(); theta = theta - lernrate;
} else if (delta == -1) {
  theta = theta + lernrate; w_2 -= lernrate * punkt.gibEingabewertX2();
  w_1 -= lernrate * punkt.gibEingabewertX1();
}`;
const complete = [sum, output, delta, updates].join('\n');
const cases = [];
function add(taskId, name, body, expectedPoints, missing, ruleFragment) {
  cases.push({ taskId, name, body, expectedPoints, missing: missing ? [missing] : [], ruleFragment });
}

add('11-6-einfach-ausgabe', 'korrekte Ausgabe trotz offener Summe und Anpassung',
  'double gewichtete_Summe = 0;\n' + output + '\n' + delta, 3, '',
  'Eine noch falsche oder offene Summenberechnung');
add('11-6-einfach-ausgabe', 'Initialisierung mit 0 und if ohne else',
  sum + '\nint berechnete_ausgabe = 0; if (gewichtete_Summe > theta) berechnete_ausgabe = 1;', 3, '',
  'Ein ausdrückliches else oder eine erneute Zuweisung von 0 ist dann nicht erforderlich');
add('11-6-einfach-ausgabe', 'umgekehrter Vergleich mit vertauschten Zweigen',
  sum + '\nint berechnete_ausgabe = theta >= gewichtete_Summe ? 0 : 1;', 3, '',
  'vertauschte Zweige');
add('11-6-einfach-ausgabe', 'verwendete Klassifikationsmethode',
  'int berechnete_ausgabe = punktKlassifizieren(punkt.gibEingabewertX1(), punkt.gibEingabewertX2());', 3, '',
  'Prüfe bei einem solchen Aufruf auch den tatsächlich vorhandenen Methodenkörper');
add('11-6-einfach-ausgabe', 'nur Gleichheitsfall falsch',
  sum + '\n' + output.replace('> theta', '>= theta'), 2,
  'Ersetze in trainieren beim Schwellenvergleich >= durch >, damit bei Gleichheit die Ausgabe 0 bleibt.',
  'Jeder Fall zählt genau einmal');
add('11-6-einfach-ausgabe', 'offene Ausgabe bleibt konstant 0',
  sum + '\nint berechnete_ausgabe = 0; if (gewichtete_Summe > theta) { } else { }', 2,
  'Setze in trainieren die Ausgabe bei einer Summe größer als theta auf 1.',
  'Der unveränderte Startwert 0 erfüllt den Fall oberhalb von theta nicht');

add('11-6-einfach-anpassung', 'beide Fehlerzweige mit unterschiedlicher Reihenfolge',
  sum + '\n' + output + '\n' + delta + '\n' + branches, 5, '',
  'beliebige Reihenfolge unabhängiger Parameteränderungen');
add('11-6-einfach-anpassung', 'allgemeine Formel trotz offener früherer Schritte',
  'double gewichtete_Summe = 0; int berechnete_ausgabe = 0;\n' + delta + '\n' + updates, 5, '',
  'Diese allgemeine Formel erfüllt bei korrekter Verwendung alle fünf Aspekte');
add('11-6-einfach-anpassung', 'theta-Vorzeichen für beide Fehlerzeichen falsch',
  sum + '\n' + output + '\n' + delta + '\n' + updates.replace('theta -=', 'theta +='), 3,
  'Ersetze in trainieren theta += delta * lernrate durch theta -= delta * lernrate.',
  'Bei vertauschtem theta-Vorzeichen nenne theta');
add('11-6-einfach-anpassung', 'else führt bei delta 0 die negative Anpassung aus',
  sum + '\n' + output + '\n' + delta + '\n' + branches.replace('else if (delta == -1)', 'else'), 4,
  'Ersetze in trainieren das pauschale else durch else if (delta == -1), damit bei delta = 0 keine Anpassung erfolgt.',
  'Ein pauschales else nach if (delta == 1)');
add('11-6-einfach-anpassung', 'Lernrate fehlt in allen Anpassungen',
  sum + '\n' + output + '\n' + delta + '\n' + updates.replaceAll(' * lernrate', ''), 1,
  'Ergänze in trainieren bei allen drei Parameteränderungen den Faktor lernrate.',
  'Die Lernrate darf nicht weggelassen');
add('11-6-einfach-anpassung', 'Anpassungen vollständig offen',
  sum + '\n' + output + '\n' + delta, 1,
  'Die Parameteränderungen in trainieren fehlen; beginne mit den Gewichten im Fall delta = 1.',
  'Das bloße Fehlen jeglicher Anpassung erfüllt nur diesen Nullfall');

add('11-6-schwer-trainieren', 'vollständig mit allgemeiner Formel', complete, 6, '',
  'Keine ausdrückliche if-Bedingung für delta = 0 verlangen');
add('11-6-schwer-trainieren', 'vollständig mit getrennten Fehlerzweigen',
  [sum, output, delta, branches].join('\n'), 6, '', 'direkte Delta-Formeln oder getrennte Fehlerzweige');
add('11-6-schwer-trainieren', 'Klassifikationsmethode statt eigener Summenvariable',
  ['int berechnete_ausgabe = punktKlassifizieren(punkt.gibEingabewertX1(), punkt.gibEingabewertX2());', delta, updates].join('\n'),
  6, '', 'eine zusätzliche Variable gewichtete_Summe oder eine zweite explizite Summe ist nicht erforderlich');
add('11-6-schwer-trainieren', 'direkter Fehlerausdruck ohne Ausgabevariable',
  ['int delta = punkt.gibLabel() - punktKlassifizieren(punkt.gibEingabewertX1(), punkt.gibEingabewertX2());', updates].join('\n'),
  6, '', 'ohne eigene Ausgabevariable ist gültig');
add('11-6-schwer-trainieren', 'früher return im Nullfall und this-Zugriffe',
  [sum, output, delta, 'if (delta == 0) return;', updates.replaceAll('w_1 +=', 'this.w_1 +=').replaceAll('w_2 +=', 'this.w_2 +=').replaceAll('theta -=', 'this.theta -=')].join('\n'),
  6, '', 'ein früher return bei delta == 0 ist ebenfalls erlaubt');
add('11-6-schwer-trainieren', 'delta umgekehrt, anschließende Formeln korrekt',
  complete.replace('punkt.gibLabel() - berechnete_ausgabe', 'berechnete_ausgabe - punkt.gibLabel()'), 5,
  'Ersetze in trainieren die Fehlerberechnung durch Label minus berechnete Ausgabe.',
  'Ein falsch herum berechnetes delta bei sonst korrektem Training erhält deshalb 5 von 6 Punkten');
add('11-6-schwer-trainieren', 'Gleichheitsfehler bei sonst korrektem Training',
  complete.replace('> theta', '>= theta'), 5,
  'Ersetze in trainieren beim Schwellenvergleich >= durch >, damit Gleichheit die Ausgabe 0 liefert.',
  'Keine mehrfachen Abzüge für reine Folgefehler');
add('11-6-schwer-trainieren', 'falsches theta-Vorzeichen als einziger Fehler',
  complete.replace('theta -=', 'theta +='), 5,
  'Ersetze in trainieren theta += delta * lernrate durch theta -= delta * lernrate.',
  'theta neu = theta alt - delta*lernrate');
add('11-6-schwer-trainieren', 'leere Trainingsmethode trotz vollständigem Demonstrationscode', '', 1,
  'Die Trainingsmethode ist noch leer; beginne dort mit der gewichteten Summe der beiden Eingaben.',
  'Die fertige, aber unaufgerufene Methode punktKlassifizieren');

module.exports = { cases };
