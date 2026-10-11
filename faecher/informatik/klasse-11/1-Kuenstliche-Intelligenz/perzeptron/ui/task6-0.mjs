import { mountClassCard, evaluateClassCard, parseStoredChoices } from '../../../../klasse-10/2-Modellierung-und-Programmierung-Online-IDE/klassendiagramm.mjs';

const STORAGE_KEY = 'informatik11-ki-aufgabe6-0-v1';
const STEPS = ['objects', 'signatures', 'completion', 'transfer', 'quiz'];
const CARD_TASK = {
  key: 'datenpunkt', className: 'Datenpunkt', attributeSlots: 3, methodSlots: 5,
  cards: [
    { id:'a1', text:'private double x_1', kind:'A' },
    { id:'a2', text:'private double x_2', kind:'A' },
    { id:'a3', text:'private int label', kind:'A' },
    { id:'m1', text:'public double gibEingabewertX1()', kind:'M' },
    { id:'m2', text:'public double gibEingabewertX2()', kind:'M' },
    { id:'m3', text:'public int gibLabel()', kind:'M' },
    { id:'m4', text:'public void setzeEingabewertX1(double neuerWert)', kind:'M' },
    { id:'m5', text:'public void setzeLabel(int neuesLabel)', kind:'M' },
    { id:'d1', text:'public Datenpunkt(double wert_x_1, double wert_x_2, int wert_label)', kind:'D', hint:'Das ist der bereits vorgegebene Konstruktor; sortiere hier nur Attribute und Methoden ein.' },
    { id:'d2', text:'punkt', kind:'D', hint:'`punkt` ist eine Objektvariable im Hauptprogramm, kein Attribut der Klasse.' },
    { id:'d3', text:'public int gibLabel(int label)', kind:'D', hint:'Vergleiche die Klammern genau mit `Datenpunkt.java`.' },
  ],
  success:'Korrekt. Drei Attribute und fünf gewöhnliche Methoden stehen im passenden Bereich der Klassenkarte.',
  missingHint:'Vergleiche mit `Datenpunkt.java`: Es fehlen noch Attribute oder Methoden. Der Konstruktor gehört nicht in diese Zuordnung.',
  extra:'',
};

const BLOCKS = [
  {
    id:'1a', title:'1A Beobachtung', mount:'block-1a',
    prompt:'<strong>Starte</strong> das Programm und <strong>vergleiche</strong> die Ausgaben der beiden Objekte. Welcher Wert ändert sich, wenn die Methode an <code>punkt</code> aufgerufen wird?',
    fields:[['Objekt','punkt',['punkt','andererPunkt','Datenpunkt']],['Attribut','label',['label','x_1','x_2']],['Wert vorher','1',['1','0','2.5']],['Wert nachher','0',['0','1','4.0']],['Zweites Objekt unverändert','ja',['ja','nein']]],
    button:'Beobachtung prüfen',
    hints:['Achte auf die Zeilen mit „Vorher“ und „Nachher“.','Vergleiche die drei Werte von `punkt` zeilenweise und prüfe danach `andererPunkt`.','Bei `punkt` ändert sich ein ganzzahliger Wert von 1 auf 0; die drei Werte des anderen Objekts bleiben gleich.'],
    feedback:['Korrekt. Nur das Label von `punkt` ändert sich von 1 auf 0; `andererPunkt` bleibt unverändert.','Teilweise korrekt. Vergleiche noch Objektname, Attribut und Vorher-/Nachher-Wert in der Konsole.','Noch nicht korrekt. Lies zuerst die beiden `punkt`-Zeilen und suche genau einen Unterschied.'],
    answer:'Nur bei <code>punkt</code> ändert sich <code>label</code> von 1 auf 0; <code>andererPunkt</code> bleibt unverändert.'
  },
  {
    id:'2a-setter', title:'2A Setter', mount:'block-2a-setter', sharedPrompt:true,
    code:'public void setzeEingabewertX1(double neuerWert)',
    prompt:'<strong>Bestimme</strong> bei jeder Methodendeklaration den Methodennamen, den Rückgabetyp und die Eingabeparameter mit ihren Datentypen.',
    fields:[['Methodenname','setzeEingabewertX1',['setzeEingabewertX1','gibLabel','Datenpunkt','x_1']],['Rückgabetyp','void',['void','double','int','kein Eingabeparameter']],['Parametertyp','double',['double','int','void','kein Eingabeparameter']],['Parametername','neuerWert',['neuerWert','label','kein Eingabeparameter']]],
    button:'Setter prüfen',
    hints:['Schau zuerst auf die Wörter unmittelbar vor und hinter dem Methodennamen.','Vor dem Methodennamen steht der Rückgabetyp; in den Klammern steht zuerst der Typ, dann der Name des Eingabeparameters.','Bei `setzeEingabewertX1` steht `void` vor dem Namen; in Klammern steht `double neuerWert`.'],
    feedback:['Korrekt. `setzeEingabewertX1` erwartet einen `double`-Wert über `neuerWert` und gibt nichts zurück.','Teilweise korrekt. Prüfe besonders, ob `void` den Rückgabetyp oder einen Eingabeparameter bezeichnet.','Noch nicht korrekt. Lies erst das Wort vor dem Methodennamen und dann die beiden Wörter in den Klammern.'],
    answer:'Methodenname <code>setzeEingabewertX1</code>, Rückgabetyp <code>void</code>, Eingabeparameter <code>double neuerWert</code>.'
  },
  {
    id:'2a-getter', title:'2A Getter', mount:'block-2a-getter', sharedPrompt:true,
    code:'public int gibLabel()',
    prompt:'<strong>Bestimme</strong> bei jeder Methodendeklaration den Methodennamen, den Rückgabetyp und die Eingabeparameter mit ihren Datentypen.',
    fields:[['Methodenname','gibLabel',['gibLabel','setzeEingabewertX1','Datenpunkt','label']],['Rückgabetyp','int',['int','double','void','kein Eingabeparameter']],['Parametertyp','kein Eingabeparameter',['kein Eingabeparameter','int','double','void']],['Parametername','kein Eingabeparameter',['kein Eingabeparameter','neuerWert','label']]],
    button:'Getter prüfen',
    hints:['Achte auf die leeren Klammern.','Trenne den Typ vor `gibLabel` von den Eingabeparametern in den Klammern.','Der Getter hat den Rückgabetyp `int` und keinen Eingabeparameter.'],
    feedback:['Korrekt. `gibLabel()` liefert `int` zurück und hat keinen Eingabeparameter.','Teilweise korrekt. Leere Klammern bedeuten hier: kein Eingabeparameter; der Rückgabetyp steht davor.','Noch nicht korrekt. Schau auf das `int` vor `gibLabel` und die leeren Klammern dahinter.'],
    answer:'Methodenname <code>gibLabel</code>, Rückgabetyp <code>int</code>, kein Eingabeparameter.'
  },
  {
    id:'2b', title:'2B Zwei Parameter', mount:'block-2b', code:'public int punktKlassifizieren(double x_1, double x_2)', source:'Codeausschnitt aus Aufgabe 6.1',
    prompt:'<strong>Bestimme</strong> bei jeder Methodendeklaration den Methodennamen, den Rückgabetyp und die Eingabeparameter mit ihren Datentypen.',
    fields:[['Methodenname','punktKlassifizieren',['punktKlassifizieren','Datenpunkt','gibLabel']],['Rückgabetyp','int',['int','double','void']],['Parameter 1: Typ','double',['double','int','void']],['Parameter 1: Name','x_1',['x_1','x_2','punkt']],['Parameter 2: Typ','double',['double','int','void']],['Parameter 2: Name','x_2',['x_2','x_1','punkt']]],
    button:'Zwei Parameter prüfen',
    hints:['Zähle die Einträge zwischen den Klammern.','Das Komma trennt zwei Paare aus Datentyp und Namen.','Beide Eingabeparameter tragen den Datentyp `double`; der Rückgabetyp steht vor `punktKlassifizieren`.'],
    feedback:['Korrekt. Die Methode liefert `int` zurück und nimmt zwei `double`-Eingaben entgegen.','Teilweise korrekt. Prüfe den zweiten Eintrag hinter dem Komma und verwechsle ihn nicht mit dem Rückgabetyp.','Noch nicht korrekt. Trenne zuerst die Signatur am Methodennamen und am Komma.'],
    answer:'<code>punktKlassifizieren</code> liefert <code>int</code> zurück und hat zwei Eingabeparameter: <code>double x_1</code>, <code>double x_2</code>.'
  },
  {
    id:'2c', title:'2C Parameter und Argument', mount:'block-2c',
    prompt:'<strong>Vergleiche</strong> die Deklaration <code>setzeLabel(int neuesLabel)</code> mit dem Aufruf <code>punkt.setzeLabel(0);</code>. Welcher Name bezeichnet den Parameter, welcher Wert das Argument?',
    fields:[['Parametername','neuesLabel',['neuesLabel','int','0','punkt']],['Parametertyp','int',['int','neuesLabel','void']],['Argument','0',['0','int','neuesLabel']]],
    button:'Parameter und Argument prüfen',
    hints:['Schau in die runden Klammern der Deklaration.','Vergleiche den Namen nach dem Datentyp mit dem Wert im Aufruf.','`int` ist der Datentyp; der folgende Name bezeichnet den Eingabeparameter.'],
    feedback:['Korrekt. `neuesLabel` ist der Parametername, `int` sein Typ und `0` das übergebene Argument.','Teilweise korrekt. Unterscheide noch den Namen in der Deklaration vom Wert beim Aufruf.','Noch nicht korrekt. Markiere zuerst Deklaration und Aufruf und lies jeweils den Inhalt der Klammern.'],
    answer:'Parametername <code>neuesLabel</code>, Parametertyp <code>int</code>, Argument <code>0</code>.'
  },
  {
    id:'3a', title:'3A Auswahl und Ausgabe', mount:'block-3a',
    prompt:'<strong>Tippe</strong> in einer neuen Zeile hinter dem gültigen Objektnamen <code>punkt</code> einen Punkt. <strong>Suche</strong> im Auswahlfenster die Methode, die den ersten Eingabewert zurückgibt, und <strong>ergänze</strong> den Aufruf.<br><strong>Gib</strong> den Rückgabewert mit <code>System.out.println</code> aus und <strong>starte</strong> das Programm. <strong>Lies</strong> anschließend im Auswahlfenster ab, welchen Datentyp die Methode <code>setzeEingabewertX1</code> als Eingabe erwartet.',
    fields:[['Ausgewählte Methode','gibEingabewertX1',['gibEingabewertX1','gibEingabewertX2','gibLabel','setzeEingabewertX1']],['Beobachteter Zahlenwert','2.5',['2.5','4.0','7.5']],['Auswahl führt den Aufruf bereits aus?','nein',['nein','ja']]],
    button:'Auswahl und Ausgabe prüfen',
    hints:['Der Objektname steht bereits im Hauptprogramm.','Suche nach einer `gib…`-Methode für `X1`; überlege, wie ein Rückgabewert sichtbar wird.','Der Getter braucht kein Argument. Setze seinen Aufruf als Ausdruck in `System.out.println(…);` ein.'],
    feedback:['Korrekt. `gibEingabewertX1()` liefert hier 2.5; sichtbar wird der Wert erst durch `System.out.println`.','Teilweise korrekt. Prüfe die leeren Aufrufklammern, die Ausgabeanweisung und die letzte Konsolenzeile.','Noch nicht korrekt. Wähle am Objekt `punkt` den Getter für X1 und gib seinen Rückgabewert aus.'],
    answer:'<code>punkt.gibEingabewertX1()</code> ohne Argument; <code>System.out.println(punkt.gibEingabewertX1());</code> zeigt <code>2.5</code>. Die Auswahl führt nichts aus.'
  },
  {
    id:'3b', title:'3B Eingabetyp im Auswahlfenster', mount:'block-3b',
    prompt:'<strong>Lies</strong> anschließend im Auswahlfenster ab, welchen Datentyp die Methode <code>setzeEingabewertX1</code> als Eingabe erwartet.',
    fields:[['Erwarteter Eingabetyp','double',['double','int','void']]],
    button:'Eingabetyp prüfen',
    hints:['Lies die Angabe in den runden Klammern der Methodendeklaration.','Bei `setzeEingabewertX1` steht vor `neuerWert` der gesuchte Typ.','Die Signatur lautet `setzeEingabewertX1(double neuerWert)`.'],
    feedback:['Korrekt. `setzeEingabewertX1` erwartet einen `double`-Wert.','Teilweise korrekt. Unterscheide den Eingabetyp vom Rückgabetyp `void`.','Noch nicht korrekt. Lies die Signatur im Fenster oder in `Datenpunkt.java`: Gesucht ist der Typ vor `neuerWert`.'],
    answer:'Der Eingabetyp ist <code>double</code>.'
  },
  {
    id:'4a', title:'4A Setter in der IDE', mount:'block-4a',
    prompt:'<strong>Ändere</strong> den ersten Eingabewert von <code>punkt</code> mit einem Methodenaufruf auf <code>7.5</code>. <strong>Lies</strong> ihn danach über die passende Methode aus und <strong>prüfe</strong> die Ausgabe; <code>andererPunkt</code> soll unverändert bleiben.',
    fields:[['X1 von punkt','7.5',['7.5','2.5','6.0']],['X1 von andererPunkt','6.0',['6.0','7.5','2.5']]],
    button:'Ausgaben vergleichen',
    hints:['Die Änderung gehört an das Objekt `punkt`.','Wähle eine `setze…`-Methode mit `double`-Argument; zum Nachsehen eine `gib…`-Methode ohne Argument.','Der erste Aufruf setzt X1 auf 7.5; gib anschließend die X1-Werte beider Objekte mit `System.out.println` aus.'],
    feedback:['Korrekt. Für `punkt` liest du 7.5, für `andererPunkt` weiterhin 6.0.','Teilweise korrekt. Prüfe, welches Objekt vor dem Punkt steht und ob du beide X1-Werte ausgibst.','Noch nicht korrekt. Rufe den Setter an `punkt` auf und lies danach die beiden Objekte getrennt aus.'],
    answer:'<code>punkt.setzeEingabewertX1(7.5);</code> und beide Getter-Ausgaben ergeben <code>7.5</code> für <code>punkt</code>, <code>6.0</code> für <code>andererPunkt</code>.'
  },
  {
    id:'4b', title:'4B Signatur aus Aufgabe 6.1', mount:'block-4b', source:'Codeausschnitt aus Aufgabe 6.1', code:'public void trainieren(Datenpunkt punkt)',
    prompt:'<strong>Ordne</strong> in <code>public void trainieren(Datenpunkt punkt)</code> Parametername und Parametertyp zu. <strong>Ergänze</strong> den Aufruf am bereits vorhandenen Objekt <code>netz</code>, wenn der Datenpunkt <code>punkt</code> übergeben werden soll.',
    fields:[['Rückgabetyp','void',['void','Datenpunkt','punkt']],['Parametertyp','Datenpunkt',['Datenpunkt','void','punkt']],['Parametername','punkt',['punkt','Datenpunkt','netz']],['Objektvariable','netz',['netz','Datenpunkt','punkt']],['Argument','punkt',['punkt','Datenpunkt','netz']],['Vollständiger Aufruf','netz.trainieren(punkt);',null]],
    button:'Trainieren-Aufruf prüfen',
    hints:['Die Klammern der Deklaration nennen Typ und Parametername.','Beim Aufruf steht vor dem Punkt das vorhandene Objekt; in Klammern steht das übergebene Objekt.','`Datenpunkt` ist der Parametertyp; `punkt` ist Parametername und beim Aufruf die übergebene Objektvariable.'],
    feedback:['Korrekt. `trainieren` hat einen `Datenpunkt`-Parameter und wird hier als `netz.trainieren(punkt);` aufgerufen.','Teilweise korrekt. Prüfe besonders `Datenpunkt` als Typ, `punkt` als Argument und den Punkt hinter `netz`.','Noch nicht korrekt. Trenne zuerst Deklaration und Aufruf; der Klassenname ersetzt keine Objektvariable.'],
    answer:'Rückgabetyp <code>void</code>, Parametertyp <code>Datenpunkt</code>, Parametername und Argument <code>punkt</code>, Objektvariable <code>netz</code>; Aufruf <code>netz.trainieren(punkt);</code>.'
  },
  {
    id:'4c', title:'4C Getter aus Aufgabe 6.1', mount:'block-4c', source:'Codeausschnitt aus Aufgabe 6.1', code:'punkt.gibEingabewertX1()',
    prompt:'<strong>Bestimme</strong> Objektvariable, Methodenname, Eingabeparameter und Rückgabetyp dieses Aufrufs.',
    fields:[['Objektvariable','punkt',['punkt','Datenpunkt','x_1']],['Methodenname','gibEingabewertX1',['gibEingabewertX1','Datenpunkt','gibLabel']],['Eingabeparameter','kein Eingabeparameter',['kein Eingabeparameter','double','x_1']],['Rückgabetyp','double',['double','void','int']]],
    button:'Getter-Aufruf prüfen',
    hints:['Lies zuerst die Teile links und rechts des Punkts.','Leere Klammern enthalten kein Argument; den Rückgabetyp findest du in `Datenpunkt.java`.','Vor dem Punkt steht `punkt`; der Getter liefert einen `double`-Wert.'],
    feedback:['Korrekt. `punkt` ist die Objektvariable, `gibEingabewertX1()` ein parameterloser Getter mit Rückgabetyp `double`.','Teilweise korrekt. Prüfe den Rückgabetyp in der Deklaration und die leeren Klammern im Aufruf.','Noch nicht korrekt. Trenne Objektname, Punkt und Methodenname und lies dann die Deklaration nach.'],
    answer:'Objektvariable <code>punkt</code>, Methodenname <code>gibEingabewertX1</code>, kein Eingabeparameter, Rückgabetyp <code>double</code>.'
  },
];

const QUIZ = [
  { q:'Welche Aussagen zu Klasse und Objekten stimmen?', options:['Die Klasse `Datenpunkt` legt Attribute und Methoden fest.','Zwei `Datenpunkt`-Objekte können unterschiedliche Attributwerte besitzen.','Eine Änderung an `punkt` ändert alle Datenpunkte.','`punkt` ist der Name der Klasse.'], solution:['A','B'], hint:'Die Klasse beschreibt die Struktur; konkrete Werte gehören zu einzelnen Objekten.', explanation:'Eine Klasse ist der Bauplan; jedes Objekt besitzt eigene Werte. `Datenpunkt` ist Klassenname, `punkt` Objektvariable.' },
  { q:'Was sagt `public void setzeLabel(int neuesLabel)` aus?', options:['In den Klammern steht ein Eingabeparameter.','`int` ist der Typ des Eingabeparameters.','`void` bedeutet, dass die Methode keinen Wert zurückgibt.','`void` bedeutet, dass die Methode keine Eingabeparameter hat.'], solution:['A','B','C'], hint:'Lies Rückgabetyp vor dem Methodennamen und Eingabeparameter in den Klammern getrennt.', explanation:'`void` bedeutet keine Rückgabe. `int neuesLabel` ist ein Eingabeparameter mit Typ und Namen.' },
  { q:'Was gilt für `public int gibLabel()`?', options:['Der Rückgabetyp ist `int`.','Die Methode hat keinen Eingabeparameter.','Beim Aufruf gehören die leeren Klammern dazu.','Die Methode gibt den Wert automatisch auf der Konsole aus.'], solution:['A','B','C'], hint:'Ein Getter liefert einen Wert zurück; zum Anzeigen muss er ausgegeben werden.', explanation:'`int` ist Rückgabetyp; leere Klammern bedeuten keinen Eingabeparameter. Der Getter druckt nicht selbst.' },
  { q:'Was gilt für `punkt.setzeLabel(0);`?', options:['`punkt` ist eine Objektvariable.','`setzeLabel` ist der Methodenname.','`0` ist das Argument.','`0` ist der Parametername der Deklaration.'], solution:['A','B','C'], hint:'Im Aufruf steht ein konkretes Argument; den Parameternamen findest du in der Deklaration.', explanation:'`punkt` benennt das Objekt, `setzeLabel` die Methode, `0` den übergebenen Wert. In der Deklaration heißt der Parameter `neuesLabel`.' },
  { q:'Was gilt für das Auswahlfenster nach `punkt.`?', options:['Es hilft, passende zugängliche Mitglieder des Objekttyps zu finden.','Es hilft, einen Methodenaufruf zu ergänzen.','Die Auswahl führt die Methode sofort aus.','Private Attribute von `Datenpunkt` sind im Hauptprogramm direkt zugänglich.'], solution:['A','B'], hint:'Das Fenster unterstützt beim Schreiben. Der vollständige Aufruf wird erst beim Programmstart ausgeführt.', explanation:'Die Vorschläge hängen vom Objekttyp und der Zugänglichkeit ab. Auswählen ergänzt Code; erst ein ausgeführter Aufruf wirkt.' },
  { q:'Was gilt für `public void trainieren(Datenpunkt punkt)` aus Aufgabe 6.1?', options:['`Datenpunkt` ist der Parametertyp.','`punkt` ist der Parametername.','Am vorhandenen Objekt lautet der Aufruf `netz.trainieren(punkt);`.','`void` ist der Typ des Eingabeparameters.'], solution:['A','B','C'], hint:'Trenne Rückgabetyp, Parametertyp und Parametername; beim Aufruf steht `netz` vor dem Punkt.', explanation:'`Datenpunkt` ist Parametertyp und `punkt` der Parametername. Das Objekt `netz` ruft `trainieren` mit dem Argument `punkt` auf; `void` ist Rückgabetyp.' },
];

function htmlCode(text) { return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/`([^`]+)`/g, '<code>$1</code>'); }
function savedFields() {
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY)); return value && typeof value.fields === 'object' && value.fields ? value.fields : {}; }
  catch { return {}; }
}
function showFeedback(element, level, message) {
  element.hidden = false;
  element.className = 'feedback ' + level;
  element.innerHTML = htmlCode(message);
}
function showStep(id, focus = false) {
  if (!STEPS.includes(id)) return;
  document.querySelectorAll('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== id; });
  document.querySelectorAll('[data-tab]').forEach(tab => { const chosen = tab.dataset.tab === id; tab.setAttribute('aria-selected', String(chosen)); tab.tabIndex = chosen ? 0 : -1; });
  document.querySelector('#active-tab').value = id;
  document.querySelector('#active-tab').dispatchEvent(new Event('input', { bubbles:true }));
  document.querySelector('.task6-0-ide').hidden = id === 'quiz';
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
function restoreFlags(saved) {
  ['remember-1','remember-2','remember-3','quiz-summary'].forEach(id => { if (saved.hasFlag(id)) document.getElementById(id).hidden = false; });
  if (saved.hasFlag('block-1a')) showObservedLabelChange();
}
function showObservedLabelChange() { document.getElementById('punkt-label-state').textContent = 'label: 1 → 0'; }
function reveal(id) { document.getElementById(id).hidden = false; savedInputs?.setFlag(id); }
let savedInputs;

function renderBlock(block) {
  const root = document.getElementById(block.mount);
  const card = document.createElement('article'); card.className = 'card task6-0-block'; card.id = 'task-' + block.id;
  const title = document.createElement('h3'); title.textContent = block.title; card.append(title);
  if (block.source) { const source = document.createElement('p'); source.className = 'kicker'; source.textContent = block.source; card.append(source); }
  if (block.code) { const pre = document.createElement('pre'); pre.className = 'task6-0-code'; const code = document.createElement('code'); code.textContent = block.code; pre.append(code); card.append(pre); }
  const prompt = document.createElement('p'); prompt.innerHTML = block.prompt; card.append(prompt);
  const fields = document.createElement('div'); fields.className = 'input-grid'; fields.id = 'fields-' + block.id;
  block.fields.forEach(([labelText, , options], index) => {
    const label = document.createElement('label'); const id = 'answer-' + block.id + '-' + index; label.htmlFor = id; label.textContent = labelText;
    let input;
    if (options) { input = document.createElement('select'); const blank = document.createElement('option'); blank.value = ''; blank.textContent = '– bitte wählen –'; input.append(blank); options.forEach(value => { const option = document.createElement('option'); option.value = value; option.textContent = value; input.append(option); }); }
    else { input = document.createElement('input'); input.type = 'text'; input.autocomplete = 'off'; }
    input.id = id; input.dataset.fieldIndex = String(index); label.append(input); fields.append(label);
  });
  card.append(fields);
  const button = document.createElement('button'); button.className = 'primary-button'; button.type = 'button'; button.textContent = block.button; card.append(button);
  const result = document.createElement('p'); result.className = 'feedback'; result.setAttribute('role', 'status'); result.setAttribute('aria-live', 'polite'); result.hidden = true; card.append(result);
  block.hints.forEach((hint, index) => { const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'Hilfe ' + (index + 1); const p = document.createElement('p'); p.innerHTML = htmlCode(hint); details.append(summary, p); card.append(details); });
  button.addEventListener('click', () => checkBlock(block, fields, result));
  root.append(card);
}
function checkBlock(block, fields, result) {
  let correct = 0; let firstWrong = -1; let empty = false;
  block.fields.forEach(([, expected], index) => {
    const input = fields.querySelector('[data-field-index="' + index + '"]'); const value = input.value.trim();
    if (!value) empty = true;
    const valid = block.id === '4b' && index === 5 ? /^netz\s*\.\s*trainieren\s*\(\s*punkt\s*\)\s*;$/.test(value) : value === expected;
    input.classList.toggle('is-correct', !!value && valid); input.classList.toggle('is-wrong', !!value && !valid);
    if (valid) correct++; else if (firstWrong < 0) firstWrong = index;
  });
  if (empty) { showFeedback(result, '', 'Ergänze zuerst deine Antwort.'); return; }
  if (correct === block.fields.length) {
    showFeedback(result, 'success', block.feedback[0]);
    if (block.id === '1a') { showObservedLabelChange(); savedInputs?.setFlag('block-1a'); }
    if (block.id === '2c') reveal('remember-2');
    if (block.id === '3a' || block.id === '3b') {
      savedInputs?.setFlag('block-' + block.id);
      if (savedInputs?.hasFlag('block-3a') && savedInputs?.hasFlag('block-3b')) reveal('remember-3');
    }
  } else {
    const partial = correct > 0 || (block.id === '3b' && fields.querySelector('select')?.value === 'void');
    let message = block.feedback[partial ? 1 : 2];
    if (block.id === '4b' && firstWrong === 5) {
      const call = fields.querySelector('[data-field-index="5"]').value;
      if (/^Datenpunkt\b/.test(call)) message += ' `Datenpunkt` ist der Klassenname; verwende für den Aufruf die Objektvariable.';
      else if (/^netz\s+trainieren/.test(call)) message += ' Zwischen Objektvariable und Methodenname fehlt der Punkt.';
      else if (/^netz\s*\.\s*trainieren\s*punkt/.test(call)) message += ' Zum Methodenaufruf gehören runde Klammern, auch ohne Argument.';
      else if (/trainieren\s*\(\s*Datenpunkt/.test(call)) message += ' In den Aufruf gehört ein Argument, nicht der Parametername aus der Deklaration.';
    }
    showFeedback(result, partial ? 'partial' : 'error', message);
  }
}
function setupCard() {
  const root = document.getElementById('block-1b'); const card = document.createElement('article'); card.className = 'card task6-0-block';
  card.innerHTML = '<h3>1B Klassenkarte</h3><p><strong>Ordne</strong> die drei Attribute und die fünf Methoden der Klasse <code>Datenpunkt</code> zu. Der bereits vorgegebene Konstruktor wird hier nicht einsortiert.</p><p>Ziehe, tippe oder wähle die Karten per Tastatur.</p><div class="class-builder" id="class-builder"></div><input type="hidden" id="class-card-state"><button id="check-class-card" type="button" class="primary-button">Klassenkarte prüfen</button><p id="class-card-feedback" class="feedback" role="status" aria-live="polite" hidden></p>';
  const button = card.querySelector('#check-class-card'); const result = card.querySelector('#class-card-feedback');
  const fields = savedFields(); const state = card.querySelector('#class-card-state');
  state.value = JSON.stringify(parseStoredChoices(fields['class-card-state'] || '', 8, CARD_TASK.cards.map(entry => entry.id)));
  root.append(card);
  CARD_TASK.hints = ['Suche in `Datenpunkt.java` nach Deklarationen innerhalb der Klasse.','Attribute stehen hier vor dem Konstruktor und haben keine Aufrufklammern; Methoden haben einen Namen mit Klammern.','Die drei `private`-Deklarationen gehören nach oben. Unten stehen die drei `gib…`- und zwei `setze…`-Deklarationen; den Konstruktor lässt du liegen.'];
  CARD_TASK.hints.forEach((hint, index) => { const details = document.createElement('details'); const summary = document.createElement('summary'); summary.textContent = 'Hilfe ' + (index + 1); const p = document.createElement('p'); p.innerHTML = htmlCode(hint); details.append(summary, p); card.append(details); });
  mountClassCard(card.querySelector('#class-builder'), CARD_TASK, state, button, result);
  button.addEventListener('click', () => {
    const choices = parseStoredChoices(state.value, 8, CARD_TASK.cards.map(entry => entry.id));
    if (choices.every(value => !value)) { showFeedback(result, '', 'Beginne mit einem Attribut aus `Datenpunkt.java`.'); return; }
    const evaluation = evaluateClassCard(CARD_TASK, choices);
    const message = evaluation.message.replace('Mindestens ein Baustein steht im falschen Bereich. Attribute stehen ohne runde Klammern oben, Konstruktor und Methoden mit runden Klammern unten.', 'Attribute stehen ohne Aufrufklammern oben, Methoden mit Klammern unten.');
    showFeedback(result, evaluation.status === 'korrekt' ? 'success' : evaluation.status === 'teilweise korrekt' ? 'partial' : 'error', message);
    if (evaluation.status === 'korrekt') reveal('remember-1');
  });
}
function quizSelected(fieldset) { return [...fieldset.querySelectorAll('input:checked')].map(input => input.value); }
function sameSet(a, b) { return a.length === b.length && b.every(value => a.includes(value)); }
function setupQuiz() {
  const root = document.getElementById('quiz-questions');
  QUIZ.forEach((entry, index) => {
    const fieldset = document.createElement('fieldset'); fieldset.className = 'quiz-question';
    const legend = document.createElement('legend'); legend.textContent = (index + 1) + '. ' + entry.q; fieldset.append(legend);
    entry.options.forEach((option, optionIndex) => { const label = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox'; input.name = 'quiz-' + (index + 1); input.value = 'ABCD'[optionIndex]; label.append(input, document.createTextNode(' ' + option)); fieldset.append(label); });
    const feedback = document.createElement('p'); feedback.className = 'feedback'; feedback.setAttribute('role', 'status'); feedback.setAttribute('aria-live', 'polite'); feedback.hidden = true; fieldset.append(feedback); root.append(fieldset);
  });
  const form = document.getElementById('quiz-form');
  form.addEventListener('submit', event => {
    event.preventDefault(); const count = checker.checkAll(); document.getElementById('quiz-progress').textContent = count + ' von 6 Fragen vollständig richtig';
    showFeedback(document.getElementById('quiz-feedback'), count === 6 ? 'success' : 'partial', count === 6 ? 'Alle sechs Fragen sind vollständig richtig beantwortet.' : count + ' von 6 Fragen sind vollständig richtig. Verbessere die markierten Fragen und prüfe erneut.');
    if (count === 6) { buildSummary(); reveal('quiz-summary'); }
  });
  const checker = window.addQuizQuestionChecks({
    questions:[...root.children].map((fieldset, index) => ({
      fieldset, feedback:fieldset.querySelector('.feedback'), solution:QUIZ[index].solution,
      check:() => {
        const chosen = quizSelected(fieldset); const right = chosen.filter(value => QUIZ[index].solution.includes(value)).length;
        if (!chosen.length) return { result:'empty', text:'Kreuze mindestens eine Antwort an.' };
        if (sameSet(chosen, QUIZ[index].solution)) return { result:'correct', text:'Korrekt. Frage ' + (index + 1) + ' ist vollständig richtig beantwortet.' };
        if (right) return { result:'mixed', text:'Teilweise korrekt. Prüfe die Aussagen noch einmal. ' + QUIZ[index].hint };
        return { result:'wrong', text:'Noch nicht korrekt. ' + QUIZ[index].hint };
      },
    })),
    buttonClass:'primary-button', levels:{ high:'success', medium:'partial', low:'error' }, onAllCorrect:() => form.requestSubmit(),
    onCheck:() => { const count = [...root.children].filter((fieldset,index) => sameSet(quizSelected(fieldset), QUIZ[index].solution)).length; document.getElementById('quiz-progress').textContent = count + ' von 6 Fragen vollständig richtig'; },
  });
}
function buildSummary() {
  const summary = document.getElementById('quiz-summary'); summary.replaceChildren();
  const h = document.createElement('h3'); h.textContent = 'Auswertung aller Teilaufgaben'; summary.append(h);
  const list = document.createElement('ol');
  const all = [BLOCKS[0], { title:'1B Klassenkarte', prompt:'<strong>Ordne</strong> die drei Attribute und die fünf Methoden der Klasse <code>Datenpunkt</code> zu. Der bereits vorgegebene Konstruktor wird hier nicht einsortiert.', answer:'Attribute: <code>private double x_1</code>, <code>private double x_2</code>, <code>private int label</code>. Methoden: <code>gibEingabewertX1</code>, <code>gibEingabewertX2</code>, <code>gibLabel</code>, <code>setzeEingabewertX1</code>, <code>setzeLabel</code>.' }, ...BLOCKS.slice(1)];
  all.forEach(block => { const li = document.createElement('li'); li.innerHTML = '<strong>' + block.title + '</strong><p>' + block.prompt + '</p><p>Richtig: ' + block.answer + '</p>'; list.append(li); });
  QUIZ.forEach((entry,index) => { const li = document.createElement('li'); const answers = entry.solution.map(letter => htmlCode(entry.options['ABCD'.indexOf(letter)])); li.innerHTML = '<strong>Quizfrage ' + (index + 1) + ': ' + htmlCode(entry.q) + '</strong><p>Richtig: ' + answers.join(' · ') + '</p><p>' + htmlCode(entry.explanation) + '</p>'; list.append(li); });
  summary.append(list);
}

setupTabs();
BLOCKS.forEach(renderBlock);
setupCard();
setupQuiz();
buildSummary();
savedInputs = window.persistTaskInputs(STORAGE_KEY, 'input, select, textarea');
const active = document.getElementById('active-tab').value;
showStep(STEPS.includes(active) ? active : 'objects');
restoreFlags(savedInputs);
document.getElementById('reset-progress').addEventListener('click', () => {
  if (!confirm('Deine Antworten und dein Lernfortschritt werden gelöscht. Dein Code in der Online-IDE bleibt erhalten.')) return;
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* Seite bleibt benutzbar. */ }
  location.reload();
});
