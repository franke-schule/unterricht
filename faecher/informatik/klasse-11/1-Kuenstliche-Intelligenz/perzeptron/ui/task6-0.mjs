import { mountClassCard, evaluateClassCard, parseStoredChoices } from '../../../../klasse-10/2-Modellierung-und-Programmierung-Online-IDE/klassendiagramm.mjs';
import { evaluateCodeAnswer } from './semantic-answer.mjs?v=20261019-code-check';
import { unlockSolution } from '../../../../klasse-10/1-Datenbanken/tab-navigation.mjs';

const STORAGE_KEY = 'informatik11-ki-aufgabe6-0-v2';
const SERVER_URL = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';
const IDE_ID = 'Java11Aufgabe6_0HundV2';
const STEPS = ['objects', 'class-card', 'signatures', 'completion', 'transfer', 'quiz'];
const CLASS_CARD = {
  key: 'hund', className: 'Hund', attributeSlots: 2, methodSlots: 5,
  cards: [
    { id:'a1', text:'private int alter', kind:'A' },
    { id:'a2', text:'private String name', kind:'A' },
    { id:'m1', text:'public void zeigeDaten()', kind:'M' },
    { id:'m2', text:'public void belle()', kind:'M' },
    { id:'m3', text:'public int gibAlter()', kind:'M' },
    { id:'m4', text:'public void setzeAlter(int neuesAlter)', kind:'M' },
    { id:'m5', text:'public void setzeDaten(int neuesAlter, String neuerName)', kind:'M' },
    { id:'d1', text:'public Hund(int startAlter, String startName)', kind:'D', hint:'Das ist der bereits vorgegebene Konstruktor; hier ordnest du nur Attribute und Methoden ein.' },
    { id:'d2', text:'petersHund', kind:'D', hint:'`petersHund` ist eine Objektvariable im Hauptprogramm, kein Attribut der Klasse.' },
    { id:'d3', text:'public int gibAlter(int alter)', kind:'D', hint:'Vergleiche die leeren Klammern von `gibAlter()` mit dieser Karte.' },
  ],
  success:'Korrekt. Zwei Attribute und fünf Methoden stehen im passenden Bereich der Klassenkarte.',
  missingHint:'Prüfe den Bereich der übrigen Karten.',
};

const BLOCKS = [
  {
    id:'1a', title:'1A Beobachtung', mount:'block-1a',
    prompt:'<strong>Starte</strong> das Programm und <strong>vergleiche</strong> Wuffti und Schnuffi vor und nach dem Methodenaufruf. <strong>Bestimme</strong>, welcher Hund welchen Wert verändert und welcher Hund unverändert bleibt.',
    fields:[['Dieses Objekt wird verändert.','petersHund',['petersHund','inasHund','Hund']],['Attribut','alter',['alter','name']],['Wert vorher','5',['5','6','8']],['Wert nachher','6',['6','5','8']],['Dieses Objekt wird <u>nicht</u> verändert.','inasHund',['petersHund','inasHund','Hund']]],
    button:'Beobachtung prüfen',
    hints:['Achte auf die Ausgaben unter „Vorher:“ und „Nachher:“ .','Vergleiche zuerst die beiden Zeilen zu Wuffti und danach die beiden zu Schnuffi.','Nur bei Wuffti ändert sich das Alter von 5 auf 6; Schnuffi bleibt 8 Jahre alt.'],
    feedback:['Korrekt. Der Aufruf an `petersHund` ändert nur Wufftis Alter von 5 auf 6; Schnuffi bleibt unverändert.','Teilweise korrekt. Prüfe noch Objektvariable, Attribut und die beiden Alterswerte in der Konsole.','Noch nicht korrekt. Suche zwischen „Vorher:“ und „Nachher:“ genau die geänderte Hundezeile.'],
    answer:'`petersHund`: Wuffti, Alter 5 → 6; `inasHund`: Schnuffi, Alter 8 → 8.'
  },
  {
    id:'3a', title:'3A Setter', mount:'block-3a', code:'public void setzeAlter(int neuesAlter)',
    prompt:'<strong>Bestimme</strong> Methodennamen, Rückgabetyp sowie Typ und Namen des Eingabeparameters.',
    fields:[['Methodenname','setzeAlter',['setzeAlter','gibAlter','Hund']],['Rückgabetyp','void',['void','int','String']],['Parametertyp','int',['int','String','void','kein Eingabeparameter']],['Parametername','neuesAlter',['neuesAlter','neuerName','kein Eingabeparameter']]],
    button:'Setter prüfen', hints:['Lies das Wort vor dem Methodennamen.','Vor dem Namen steht die Rückgabeangabe; in den Klammern stehen Typ und Name des Eingabeparameters.','`void` bedeutet keine Rückgabe; der Eingabeparameter lautet `int neuesAlter`.'],
    feedback:['Korrekt. `setzeAlter` erwartet einen `int`-Wert und gibt keinen Wert zurück.','Teilweise korrekt. Unterscheide `void` vor dem Methodennamen von `int` in den Klammern.','Noch nicht korrekt. Lies zuerst vor und dann innerhalb der Klammern.'],
    answer:'Methodenname `setzeAlter`, Rückgabetyp `void`, Eingabeparameter `int neuesAlter`.'
  },
  {
    id:'3b', title:'3B Getter', mount:'block-3b', code:'public int gibAlter()',
    prompt:'<strong>Bestimme</strong> Methodennamen, Rückgabetyp und Eingabeparameter dieser Deklaration.',
    fields:[['Methodenname','gibAlter',['gibAlter','setzeAlter','Hund']],['Rückgabetyp','int',['int','void','String']],['Parametertyp','kein Eingabeparameter',['kein Eingabeparameter','int','void']],['Parametername','kein Eingabeparameter',['kein Eingabeparameter','neuesAlter','alter']]],
    button:'Getter prüfen', hints:['Achte auf die leeren Klammern.','Der Typ vor `gibAlter` bezeichnet die Rückgabe, nicht eine Eingabe.','`gibAlter()` gibt einen `int`-Wert zurück und hat keinen Eingabeparameter.'],
    feedback:['Korrekt. `gibAlter()` liefert `int` zurück und hat keinen Eingabeparameter.','Teilweise korrekt. Leere Klammern bedeuten hier: kein Eingabeparameter.','Noch nicht korrekt. Lies `int` vor dem Methodennamen und die leeren Klammern dahinter.'],
    answer:'Methodenname `gibAlter`, Rückgabetyp `int`, kein Eingabeparameter.'
  },
  {
    id:'3c', title:'3C Zwei Parameter', mount:'block-3c', code:'public void setzeDaten(int neuesAlter, String neuerName)',
    prompt:'<strong>Bestimme</strong> den Rückgabetyp und die beiden Eingabeparameter mit Typ und Namen.',
    fields:[['Rückgabetyp','void',['void','int','String']],['Parameter 1: Typ','int',['int','String','void']],['Parameter 1: Name','neuesAlter',['neuesAlter','neuerName']],['Parameter 2: Typ','String',['String','int','void']],['Parameter 2: Name','neuerName',['neuerName','neuesAlter']]],
    button:'Zwei Parameter prüfen', hints:['Das Komma trennt zwei Eingaben.','Lies links und rechts vom Komma je ein Paar aus Datentyp und Namen.','Die Paare lauten `int neuesAlter` und `String neuerName`; `void` steht vor dem Methodennamen.'],
    feedback:['Korrekt. `setzeDaten` nimmt Alter und Namen entgegen und gibt nichts zurück.','Teilweise korrekt. Prüfe besonders Typ und Namen hinter dem Komma.','Noch nicht korrekt. Teile die Klammer am Komma in zwei Typ-Namen-Paare.'],
    answer:'Rückgabetyp `void`; Eingabeparameter `int neuesAlter` und `String neuerName`.'
  },
  {
    id:'3d', title:'3D Parameter und Argument', mount:'block-3d',
    prompt:'<strong>Vergleiche</strong> `setzeAlter(int neuesAlter)` mit `petersHund.setzeAlter(6);`. <strong>Ordne</strong> Parametertyp, Parameternamen und Argument zu.',
    fields:[['Parametertyp','int',['int','void','6']],['Parametername','neuesAlter',['neuesAlter','int','6']],['Argument','6',['6','neuesAlter','int']]],
    button:'Parameter und Argument prüfen', hints:['Vergleiche die Inhalte der beiden Klammern.','In der Deklaration steht ein Typ mit Namen; im Aufruf steht ein konkreter Wert.','`int` ist der Parametertyp, `neuesAlter` der Parametername und `6` das Argument.'],
    feedback:['Korrekt. Beim Aufruf wird das Argument `6` an den Parameter `neuesAlter` vom Typ `int` übergeben.','Teilweise korrekt. Trenne noch den Namen in der Deklaration vom Wert im Aufruf.','Noch nicht korrekt. Lies zuerst die Deklaration und danach die Klammern des Aufrufs.'],
    answer:'Parametertyp `int`, Parametername `neuesAlter`, Argument `6`.'
  },
  {
    id:'4a', title:'4A Auswahl und Ausgabe', mount:'block-4a',
    prompt:'<strong>Tippe</strong> im Hauptprogramm in einer neuen Zeile `petersHund.` und <strong>suche</strong> im Auswahlfenster den Getter für das Alter. <strong>Ergänze</strong> eine Ausgabe seines Rückgabewerts mit `println(...)` und <strong>starte</strong> das Programm.',
    codeTask:{ id:'11-6-0-4a-code', maxPoints:3 },
    button:'Code zu 4A prüfen', hints:['Suche eine Methode, deren Name mit `gib` beginnt.','Der Getter braucht kein Argument; sein Rückgabewert wird erst durch eine Ausgabe sichtbar.','Ergänze `println(petersHund.gibAlter());` nach der vorhandenen Altersänderung.'],
    feedback:['Korrekt. Dein Code gibt den Rückgabewert von `petersHund.gibAlter()` mit `println(...)` aus.','Teilweise korrekt. Prüfe, ob du den Rückgabewert des Getters ausgibst und die leeren Aufrufklammern ergänzt hast.','Noch nicht korrekt. Ergänze im Hauptprogramm eine Ausgabe mit dem Alters-Getter von `petersHund`.'],
    answer:'`println(petersHund.gibAlter());` gibt Wufftis aktuelles Alter aus. Die Auswahl im Fenster ergänzt Code; der Programmlauf führt ihn aus.'
  },
  {
    id:'4b', title:'4B Eingabetyp im Auswahlfenster', mount:'block-4b',
    prompt:'<strong>Finde heraus</strong>, welchen Datentyp `setzeAlter` als Eingabe erwartet. <strong>Prüfe</strong> dazu den Vorschlag im Auswahlfenster oder die Deklaration in `Hund.java`.',
    fields:[['Erwarteter Eingabetyp','int',['int','void','String']]], button:'Eingabetyp prüfen',
    hints:['Suche `setzeAlter` nach `petersHund.`.','Der Typ steht in den Klammern direkt vor `neuesAlter`.','Die Deklaration lautet `setzeAlter(int neuesAlter)`; der Eingabetyp ist `int`.'],
    feedback:['Korrekt. `setzeAlter` erwartet einen `int`-Wert.','Teilweise korrekt. `void` bezeichnet den Rückgabetyp; suche den Eingabetyp in den Klammern.','Noch nicht korrekt. Lies die Deklaration in `Hund.java`: Gesucht ist der Typ vor `neuesAlter`.'],
    answer:'Der Eingabetyp ist `int`.'
  },
  {
    id:'5a', title:'5A Alter ändern', mount:'block-5a',
    prompt:'<strong>Setze</strong> Wufftis Alter mit einem neuen Methodenaufruf auf `7`. <strong>Gib</strong> danach das Alter beider Hunde mit ihren Gettern aus und <strong>vergleiche</strong> die Werte.',
    codeTask:{ id:'11-6-0-5a-code', maxPoints:4 }, button:'Code zu 5A prüfen',
    hints:['Rufe den Setter am Objekt `petersHund` auf.','Lies danach mit `gibAlter()` die Werte beider Objektvariablen aus; drucke nicht bloß Zahlen.','Ergänze `petersHund.setzeAlter(7);` und danach je eine `println(...)`-Ausgabe mit `petersHund.gibAlter()` und `inasHund.gibAlter()`.'],
    feedback:['Korrekt. Wufftis Alter wird auf `7` gesetzt; danach gibt dein Code beide Alterswerte über die Getter aus.','Teilweise korrekt. Prüfe den Setter an `petersHund` und die Ausgaben beider Getter nach dem Setzen.','Noch nicht korrekt. Setze Wufftis Alter in `Hauptprogramm.java` und gib danach die Getterwerte beider Hunde aus.'],
    answer:'`petersHund.setzeAlter(7);` verändert Wuffti. Danach geben `println(petersHund.gibAlter());` und `println(inasHund.gibAlter());` die aktuellen Werte der beiden Hunde aus.'
  },
  {
    id:'5b', title:'5B Alter und Name ändern', mount:'block-5b',
    prompt:'<strong>Setze</strong> bei `inasHund` mit `setzeDaten` das Alter auf `9` und den Namen auf `Flocke`. <strong>Rufe</strong> danach `inasHund.zeigeDaten()` auf und <strong>starte</strong> das Programm.',
    codeTask:{ id:'11-6-0-5b-code', maxPoints:4 }, button:'Code zu 5B prüfen',
    hints:['Die Deklaration erwartet zuerst das Alter und dann den Namen.','Vor dem Punkt steht `inasHund`; Zeichenketten stehen in Anführungszeichen.','Ergänze `inasHund.setzeDaten(9, "Flocke");` und rufe danach `inasHund.zeigeDaten();` auf.'],
    feedback:['Korrekt. Dein Code setzt `inasHund` auf Flocke und 9 Jahre und ruft danach `zeigeDaten()` an diesem Objekt auf.','Teilweise korrekt. Prüfe Objektvariable, Reihenfolge der Argumente und den anschließenden Aufruf von `zeigeDaten()`.','Noch nicht korrekt. Verwende `setzeDaten` an `inasHund` mit Alter und Name in der deklarierten Reihenfolge.'],
    answer:'`inasHund.setzeDaten(9, "Flocke");` setzt beide Werte; der folgende Aufruf `inasHund.zeigeDaten();` gibt die neuen Hundedaten aus.'
  },
];

const QUIZ = [
  { q:'Was gilt für die Klasse `Hund` und ihre Objekte?', options:['`Hund` legt Attribute und Methoden fest.','Wuffti und Schnuffi können verschiedene Alterswerte haben.','Ein Setter-Aufruf an Wuffti ändert auch Schnuffi.','`petersHund` ist der Klassenname.'], solution:['A','B'], hint:'Die Klasse beschreibt die gemeinsame Struktur; die Werte gehören zu einzelnen Objekten.', explanation:'`Hund` ist der Klassenname. `petersHund` und `inasHund` bezeichnen verschiedene Objekte mit eigenen Werten.' },
  { q:'Was sagt `public void setzeAlter(int neuesAlter)` aus?', options:['Die Methode hat einen Eingabeparameter.','Der Eingabeparameter hat den Typ `int`.','`void` bedeutet, dass kein Wert zurückgegeben wird.','`void` bedeutet, dass kein Argument übergeben wird.'], solution:['A','B','C'], hint:'Lies Rückgabetyp und Klammerinhalt getrennt.', explanation:'`void` bezeichnet die fehlende Rückgabe; `int neuesAlter` ist ein Eingabeparameter.' },
  { q:'Was gilt für `public int gibAlter()`?', options:['Der Rückgabetyp ist `int`.','Die Methode erwartet kein Argument.','Beim Aufruf gehören die leeren Klammern dazu.','Der Getter druckt seinen Wert immer selbst.'], solution:['A','B','C'], hint:'`gibAlter()` liefert einen Wert zurück; zur Anzeige braucht es eine Ausgabe.', explanation:'`gibAlter()` liefert einen `int`-Wert und hat keinen Eingabeparameter; `println(...)` zeigt den Rückgabewert an.' },
  { q:'Was gilt für `petersHund.setzeAlter(6);`?', options:['`petersHund` ist die Objektvariable.','`setzeAlter` ist der Methodenname.','`6` ist das Argument.','`6` ist der Parametername der Deklaration.'], solution:['A','B','C'], hint:'Im Aufruf steht ein konkreter Wert, in der Deklaration ein Parametername.', explanation:'Der Aufruf übergibt `6` an `neuesAlter` und wirkt auf das Objekt `petersHund`.' },
  { q:'Was gilt für das Auswahlfenster nach `petersHund.`?', options:['Es zeigt zugängliche Vorschläge zum Objekttyp.','Es kann einen Methodenaufruf ergänzen.','Die Auswahl führt den Aufruf sofort aus.','`private int alter` ist im Hauptprogramm direkt zugänglich.'], solution:['A','B'], hint:'Das Fenster unterstützt beim Schreiben; die Wirkung entsteht erst bei der Ausführung.', explanation:'Vorschläge hängen von Typ und Zugänglichkeit ab. Auswählen ergänzt Code, der erst beim Programmlauf wirkt.' },
  { q:'Was gilt für `setzeDaten(int neuesAlter, String neuerName)`?', options:['Die Methode hat zwei Eingabeparameter.','Das Alter steht im Aufruf vor dem Namen.','`inasHund.setzeDaten(9, "Flocke");` ist ein passender Aufruf.','`void` ist der Typ des ersten Eingabeparameters.'], solution:['A','B','C'], hint:'Trenne Rückgabetyp von den beiden Typ-Namen-Paaren in Klammern.', explanation:'`int neuesAlter` und `String neuerName` sind die beiden Parameter; `void` ist der Rückgabetyp.' },
];

function htmlCode(text) { return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`([^`]+)`/g, '<code>$1</code>'); }
function htmlContent(text) {
  return String(text).split(/(<\/?(?:strong|code|u)>|<br\s*\/?>)/gi)
    .map(part => /^<\/?(?:strong|code|u)>$|^<br\s*\/?>$/i.test(part) ? part : htmlCode(part))
    .join('');
}
function readSaved() {
  let value;
  try {
    value = JSON.parse(localStorage.getItem(STORAGE_KEY));
  } catch { value = null; }
  if (!value || typeof value !== 'object' || Array.isArray(value)) value = { fields:{}, flags:{} };
  value.fields = value.fields && typeof value.fields === 'object' && !Array.isArray(value.fields) ? value.fields : {};
  value.flags = value.flags && typeof value.flags === 'object' && !Array.isArray(value.flags) ? value.flags : {};
  // 4A used to be a dropdown-only check; invalidate it once, then preserve code success.
  const migrationKey = 'migration-4a-code-v1';
  if (value.flags[migrationKey] !== true) {
    const hadDropdownOnly4a = value.flags['block-4a'] === true;
    if (hadDropdownOnly4a) {
      delete value.flags['block-4a'];
      delete value.flags['remember-4'];
    }
    for (const key of Object.keys(value.fields)) if (/^answer-4a-/.test(key)) delete value.fields[key];
    value.flags[migrationKey] = true;
  }
  value.fields['class-card-state'] = JSON.stringify(parseStoredChoices(value.fields['class-card-state'] || '', 7, CLASS_CARD.cards.map(card => card.id)));
  if (!STEPS.includes(value.fields['active-tab'])) value.fields['active-tab'] = 'objects';
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)); } catch { /* Seite bleibt ohne Speicherung benutzbar. */ }
  return value;
}
const SAVED = readSaved();
function showFeedback(element, level, message) {
  element.hidden = false;
  element.className = 'feedback' + (level ? ' ' + level : '');
  element.innerHTML = htmlCode(message);
}
function showStep(id, focus = false) {
  if (!STEPS.includes(id)) id = 'objects';
  document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== id; });
  document.querySelectorAll('[data-tab]').forEach(tab => { const chosen = tab.dataset.tab === id; tab.setAttribute('aria-selected', String(chosen)); tab.tabIndex = chosen ? 0 : -1; });
  const active = document.querySelector('#active-tab'); active.value = id; active.dispatchEvent(new Event('input', { bubbles:true }));
  document.querySelector('.task6-0-ide').hidden = id === 'class-card' || id === 'quiz';
  if (focus) { const heading = document.querySelector('#' + id + ' h2'); heading.tabIndex = -1; heading.focus({ preventScroll:true }); heading.scrollIntoView({ behavior:'smooth', block:'start' }); }
}
function setupTabs() {
  const active = document.createElement('input'); active.type = 'hidden'; active.id = 'active-tab'; active.value = 'objects'; document.querySelector('main').append(active);
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => showStep(tab.dataset.tab, true));
    tab.addEventListener('keydown', event => {
      const index = STEPS.indexOf(tab.dataset.tab); const move = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-1, ArrowDown:1 }[event.key];
      let next = index; if (event.key === 'Home') next = 0; else if (event.key === 'End') next = STEPS.length - 1; else if (move) next = (index + move + STEPS.length) % STEPS.length; else return;
      event.preventDefault(); showStep(STEPS[next]); document.querySelector('[data-tab="' + STEPS[next] + '"]').focus();
    });
  });
  document.querySelectorAll('[data-flow]').forEach(flow => {
    const next = STEPS[STEPS.indexOf(flow.dataset.flow) + 1]; if (!next) return;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'primary-button'; button.textContent = 'Weiter: ' + document.querySelector('[data-tab="' + next + '"]').textContent.replace(/^\d+\s*/, '');
    button.addEventListener('click', () => showStep(next, true)); flow.append(button);
  });
}
let savedInputs;
function reveal(id) { const element = document.getElementById(id); if (element) element.hidden = false; savedInputs?.setFlag(id); }
function restoreFlags() {
  ['remember-1','remember-3','remember-4','quiz-summary'].forEach(id => { if (savedInputs?.hasFlag(id)) document.getElementById(id).hidden = false; });
}

function renderBlock(block) {
  const root = document.getElementById(block.mount); const card = document.createElement('article'); card.className = 'card task6-0-block'; card.id = 'task-' + block.id;
  const title = document.createElement('h3'); title.textContent = block.title; card.append(title);
  if (block.code) { const pre = document.createElement('pre'); pre.className = 'task6-0-code'; const code = document.createElement('code'); code.textContent = block.code; pre.append(code); card.append(pre); }
  const prompt = document.createElement('p'); prompt.innerHTML = htmlContent(block.prompt); card.append(prompt);
  const fields = document.createElement('div'); fields.className = 'input-grid'; fields.id = 'fields-' + block.id;
  if (!block.codeTask) block.fields.forEach(([labelText, , options], index) => {
    const label = document.createElement('label'); const id = 'answer-' + block.id + '-' + index; label.htmlFor = id; label.innerHTML = htmlContent(labelText);
    let input;
    if (options) { input = document.createElement('select'); const blank = document.createElement('option'); blank.value = ''; blank.textContent = '– bitte wählen –'; input.append(blank); options.forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = value; input.append(option); }); }
    else { input = document.createElement('input'); input.type = 'text'; input.autocomplete = 'off'; }
    input.id = id; input.dataset.fieldIndex = String(index); label.append(input); fields.append(label);
  });
  card.append(fields); const button = document.createElement('button'); button.className = 'primary-button'; button.type = 'button'; button.textContent = block.button; card.append(button);
  const result = document.createElement('p'); result.className = 'feedback'; result.setAttribute('role', 'status'); result.setAttribute('aria-live', 'polite'); result.hidden = true; card.append(result);
  block.hints.forEach((hint, index) => { const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'Hilfe ' + (index + 1); const p = document.createElement('p'); p.innerHTML = htmlCode(hint); details.append(summary, p); card.append(details); });
  button.addEventListener('click', () => checkBlock(block, fields, result, button)); root.append(card);
}
function readIdeCode() {
  const frame = document.getElementById('frame-hund');
  const access = frame?.contentWindow?.online_ide_access;
  const ide = access?.getIDE?.(IDE_ID);
  if (!ide || typeof ide.getFiles !== 'function') throw new Error('Die Online-IDE lädt noch. Bitte warte kurz und versuche es erneut.');
  const files = ide.getFiles();
  if (!Array.isArray(files)) throw new Error('Die Online-IDE lädt noch. Bitte warte kurz und versuche es erneut.');
  const mainFile = files.find(file => file.getName?.() === 'Hauptprogramm.java');
  if (!mainFile || typeof mainFile.getText !== 'function') throw new Error('`Hauptprogramm.java` wurde in der Online-IDE nicht gefunden.');
  const dogFile = files.find(file => file.getName?.() === 'Hund.java');
  if (!dogFile || typeof dogFile.getText !== 'function') throw new Error('`Hund.java` wurde in der Online-IDE nicht gefunden.');
  return '// ===== Datei: Hauptprogramm.java =====\n' + mainFile.getText() + '\n// ===== Datei: Hund.java =====\n' + dogFile.getText();
}
function serverError(error) {
  const message = String(error?.message || '');
  if (/unbekannt|nicht gefunden|task.?id|Aufgabe.*nicht/i.test(message)) return 'Die Codeprüfung für Aufgabe 6.0 ist auf dem Server noch nicht bereitgestellt. Bitte informiere deine Lehrkraft.';
  return 'Die Auswertung konnte nicht abgeschlossen werden. Bitte versuche es erneut.';
}
function renderCodeEvaluation(block, result) {
  const level = result.points === result.maxPoints ? 'success' : result.points > 0 ? 'partial' : 'error';
  const message = block.feedback[level === 'success' ? 0 : level === 'partial' ? 1 : 2];
  const box = document.getElementById('task-' + block.id).querySelector('[aria-live="polite"]');
  box.hidden = false;
  box.className = 'feedback ' + level;
  box.replaceChildren();
  const heading = document.createElement('strong');
  heading.textContent = `${result.points} von ${result.maxPoints} Punkten – ${result.status}`;
  box.append(heading);
  for (const [label, items, empty] of [
    ['Das ist dir gelungen', result.strengths, 'Noch kein Aspekt ist eindeutig belegt.'],
    ['Das solltest du überprüfen', result.missing, 'Es fehlt kein wesentlicher Aspekt.']
  ]) {
    const title = document.createElement('strong'); title.textContent = label; box.append(title);
    if (items.length) { const list = document.createElement('ul'); for (const item of items) { const li = document.createElement('li'); li.textContent = item; list.append(li); } box.append(list); }
    else { const p = document.createElement('span'); p.textContent = empty; box.append(p); }
  }
  const feedback = document.createElement('span'); feedback.textContent = message; box.append(feedback);
  if (typeof result.feedback === 'string' && result.feedback.trim()) {
    const detail = document.createElement('p'); detail.textContent = result.feedback.trim(); box.append(detail);
  }
}
async function checkCodeBlock(block, result, button) {
  let code;
  try { code = readIdeCode(); } catch (error) { showFeedback(result, 'error', error.message); return; }
  if (code.trim().length < 20) { showFeedback(result, 'error', 'Der aktuelle Programmcode ist noch zu kurz für eine Auswertung.'); return; }
  if (code.length > 12000) { showFeedback(result, 'error', 'Dein Programmcode ist zu lang für die automatische Auswertung.'); return; }
  button.disabled = true;
  showFeedback(result, 'partial', 'Der aktuelle Programmcode wird für diesen Aufgabenteil ausgewertet.');
  try {
    const evaluation = await evaluateCodeAnswer({ serverUrl:SERVER_URL, taskId:block.codeTask.id, code, expectedMaxPoints:block.codeTask.maxPoints });
    renderCodeEvaluation(block, evaluation);
    if (evaluation.points === evaluation.maxPoints && block.id === '4a') {
      savedInputs?.setFlag('block-4a');
      if (savedInputs?.hasFlag('block-4b')) reveal('remember-4');
    }
  } catch (error) { showFeedback(result, 'error', serverError(error)); }
  finally { button.disabled = false; }
}
function checkBlock(block, fields, result, button) {
  if (block.codeTask) { checkCodeBlock(block, result, button); return; }
  let correct = 0; let empty = false;
  block.fields.forEach(([, expected], index) => {
    const input = fields.querySelector('[data-field-index="' + index + '"]'); const value = input.value.trim(); const valid = value === expected;
    if (!value) empty = true;
    input.classList.toggle('is-correct', !!value && valid); input.classList.toggle('is-wrong', !!value && !valid); if (valid) correct++;
  });
  if (empty) { showFeedback(result, '', 'Ergänze zuerst deine Antwort.'); return; }
  if (correct === block.fields.length) {
    showFeedback(result, 'success', block.feedback[0]);
    if (block.id === '1a') reveal('remember-1');
    if (block.id === '3d') reveal('remember-3');
    if (block.id === '4a' || block.id === '4b') { savedInputs?.setFlag('block-' + block.id); if (savedInputs?.hasFlag('block-4a') && savedInputs?.hasFlag('block-4b')) reveal('remember-4'); }
  } else {
    const partial = correct > 0 || (block.id === '4b' && fields.querySelector('select').value === 'void');
    showFeedback(result, partial ? 'partial' : 'error', block.feedback[partial ? 1 : 2]);
  }
}

function setupCard() {
  const root = document.getElementById('class-builder'); const state = document.getElementById('class-card-state');
  state.value = JSON.stringify(parseStoredChoices(SAVED.fields['class-card-state'] || '', 7, CLASS_CARD.cards.map(card => card.id)));
  mountClassCard(root, CLASS_CARD, state, document.getElementById('check-class-card'), document.getElementById('class-card-feedback'));
  document.getElementById('check-class-card').addEventListener('click', () => {
    const choices = parseStoredChoices(state.value, 7, CLASS_CARD.cards.map(card => card.id)); const result = document.getElementById('class-card-feedback');
    if (choices.every(value => !value)) { showFeedback(result, '', 'Beginne mit einem Eintrag aus `Hund.java`.'); return; }
    const evaluation = evaluateClassCard(CLASS_CARD, choices); const right = CLASS_CARD.cards.filter(card => (card.kind === 'A' || card.kind === 'M') && choices.some((id, index) => id === card.id && (card.kind === 'A' ? index < 2 : index >= 2))).length;
    if (evaluation.status === 'korrekt') { showFeedback(result, 'success', CLASS_CARD.success); return; }
    const distractor = CLASS_CARD.cards.find(card => card.kind === 'D' && choices.includes(card.id));
    const countText = right + ' von 7 verlangten Einträgen stehen richtig. ';
    const main = right >= 4 ? 'Teilweise korrekt. ' : 'Noch nicht korrekt. ';
    const next = distractor ? distractor.hint : right >= 4 ? 'Prüfe den Bereich der übrigen Karten.' : 'Vergleiche Attribute ohne Klammern und Methoden mit Klammern.';
    showFeedback(result, evaluation.status === 'teilweise korrekt' ? 'partial' : 'error', main + countText + next);
  });
}

function quizSelected(fieldset) { return [...fieldset.querySelectorAll('input:checked')].map(input => input.value); }
function sameSet(a, b) { return a.length === b.length && b.every(value => a.includes(value)); }
function setupQuiz() {
  const root = document.getElementById('quiz-questions');
  QUIZ.forEach((entry, index) => {
    const fieldset = document.createElement('fieldset'); fieldset.className = 'quiz-question';
    const legend = document.createElement('legend'); legend.innerHTML = htmlCode((index + 1) + '. ' + entry.q); fieldset.append(legend);
    entry.options.forEach((option, optionIndex) => { const label = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox'; input.name = 'quiz-' + (index + 1); input.value = 'ABCD'[optionIndex]; const text = document.createElement('span'); text.innerHTML = htmlCode(option); label.append(input, document.createTextNode(' '), text); fieldset.append(label); });
    const feedback = document.createElement('p'); feedback.className = 'feedback'; feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite'); feedback.hidden = true; fieldset.append(feedback); root.append(fieldset);
  });
  const form = document.getElementById('quiz-form');
  form.addEventListener('submit', event => { event.preventDefault(); const count = checker.checkAll(); document.getElementById('quiz-progress').textContent = count + ' von 6 Fragen vollständig richtig'; showFeedback(document.getElementById('quiz-feedback'), count === 6 ? 'success' : 'partial', count === 6 ? 'Alle sechs Fragen sind vollständig richtig beantwortet.' : count + ' von 6 Fragen sind vollständig richtig. Verbessere die markierten Fragen und prüfe erneut.'); if (count === 6) { buildSummary(); reveal('quiz-summary'); } });
  const checker = window.addQuizQuestionChecks({
    questions:[...root.children].map((fieldset, index) => ({
      fieldset, feedback:fieldset.querySelector('.feedback'), solution:QUIZ[index].solution,
      check:() => { const chosen = quizSelected(fieldset); const right = chosen.filter(value => QUIZ[index].solution.includes(value)).length; if (!chosen.length) return { result:'empty', text:'Kreuze mindestens eine Antwort an.' }; if (sameSet(chosen, QUIZ[index].solution)) return { result:'correct', text:'Korrekt. Frage ' + (index + 1) + ' ist vollständig richtig beantwortet.' }; if (right) return { result:'mixed', text:'Teilweise korrekt. Prüfe die Aussagen noch einmal. ' + QUIZ[index].hint }; return { result:'wrong', text:'Noch nicht korrekt. ' + QUIZ[index].hint }; },
    })),
    buttonClass:'primary-button', levels:{ high:'success', medium:'partial', low:'error' }, onAllCorrect:() => form.requestSubmit(),
    onCheck:() => { const count = [...root.children].filter((fieldset,index) => sameSet(quizSelected(fieldset), QUIZ[index].solution)).length; document.getElementById('quiz-progress').textContent = count + ' von 6 Fragen vollständig richtig'; },
  });
}
function buildSummary() {
  const summary = document.getElementById('quiz-summary'); summary.replaceChildren(); const h = document.createElement('h3'); h.textContent = 'Auswertung aller Teilaufgaben'; summary.append(h); const list = document.createElement('ol');
  const classAnswer = { title:'2A Klassenkarte', prompt:'<strong>Ordne</strong> die zwei Attribute und fünf Methoden der Klasse <code>Hund</code> in die Klassenkarte ein. Der vorgegebene Konstruktor gehört nicht in diese Zuordnung.', answer:'Attribute: <code>private int alter</code>, <code>private String name</code>. Methoden: <code>zeigeDaten()</code>, <code>belle()</code>, <code>gibAlter()</code>, <code>setzeAlter(int neuesAlter)</code>, <code>setzeDaten(int neuesAlter, String neuerName)</code>. Der Konstruktor ist nicht einsortiert.' };
  const all = [BLOCKS[0], classAnswer, ...BLOCKS.slice(1)];
  all.forEach(block => { const li = document.createElement('li'); li.innerHTML = '<strong>' + block.title + '</strong><p>' + htmlContent(block.prompt) + '</p><p>Richtig: ' + htmlCode(block.answer) + '</p>'; list.append(li); });
  QUIZ.forEach((entry,index) => { const li = document.createElement('li'); const answers = entry.solution.map(letter => htmlCode(entry.options['ABCD'.indexOf(letter)])); li.innerHTML = '<strong>Quizfrage ' + (index + 1) + ': ' + htmlCode(entry.q) + '</strong><p>Richtig: ' + answers.join(' · ') + '</p><p>' + htmlCode(entry.explanation) + '</p>'; list.append(li); });
  summary.append(list);
}

setupTabs();
BLOCKS.forEach(renderBlock);
setupCard();
setupQuiz();
buildSummary();
document.getElementById('solution-code-form').addEventListener('submit', event => unlockSolution(event, 'M3WP-D8B2', 'solution-download-link', 'solution-code-message'));
savedInputs = window.persistTaskInputs(STORAGE_KEY, 'input:not([name="solution-code"]), select, textarea');
showStep(STEPS.includes(document.getElementById('active-tab').value) ? document.getElementById('active-tab').value : 'objects');
restoreFlags();
document.getElementById('reset-progress').addEventListener('click', () => {
  if (!confirm('Deine Antworten und dein Lernfortschritt werden gelöscht. Dein Code in der Online-IDE bleibt erhalten.')) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* Seite bleibt benutzbar. */ }
  location.reload();
});
