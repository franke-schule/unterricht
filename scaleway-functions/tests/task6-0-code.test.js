'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../evaluation-core');
const { extractFunction } = require('../migrate-website');
const { createHandler } = require('../handler');

const repo = path.resolve(__dirname, '../..');
const clientPath = path.join(repo, 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/task6-0.mjs');
const htmlPath = path.join(repo, 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6-0.html');
const client = fs.readFileSync(clientPath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');

const taskIds = [
  ['11-6-0-4a-code', 3],
  ['11-6-0-5a-code', 4],
  ['11-6-0-5b-code', 4]
];

const dogClass = `public class Hund {
  private int alter;
  private String name;
  public Hund(int startAlter, String startName) { alter = startAlter; name = startName; }
  public int gibAlter() { return alter; }
  public void setzeAlter(int neuesAlter) { alter = neuesAlter; }
  public void setzeDaten(int neuesAlter, String neuerName) { alter = neuesAlter; name = neuerName; }
  public void zeigeDaten() { println("Der Hund heißt " + name + " und ist " + alter + " Jahre alt."); }
  public void belle() { println(name + ": Wuff wuff"); }
}`;
const mainStart = `Hund petersHund = new Hund(5, "Wuffti");
Hund inasHund = new Hund(8, "Schnuffi");
println("Vorher:");
petersHund.zeigeDaten();
inasHund.zeigeDaten();
inasHund.belle();
petersHund.setzeAlter(6);
println("Nachher:");
petersHund.zeigeDaten();
inasHund.zeigeDaten();`;
const codeBundle = main => `// ===== Datei: Hauptprogramm.java =====\n${main}\n// ===== Datei: Hund.java =====\n${dogClass}`;
const cumulativeSolution = codeBundle(`${mainStart}
println(petersHund.gibAlter());
petersHund.setzeAlter(7);
println(petersHund.gibAlter());
println(inasHund.gibAlter());
inasHund.setzeDaten(9, "Flocke");
inasHund.zeigeDaten();`);

test('Aufgabe 6.0 registriert drei getrennte code-Rubriken mit den spezifizierten Punkten', () => {
  for (const [id, maxPoints] of taskIds) {
    const task = core.TASKS[id];
    assert.ok(task, `Fehlende Rubrik ${id}`);
    assert.equal(task.grade, 11);
    assert.equal(task.responseType, 'code');
    assert.equal(task.maxPoints, maxPoints);
    assert.deepEqual(task.statusLabels, {
      correct: 'korrekt', partial: 'teilweise korrekt', incorrect: 'noch nicht korrekt'
    });
    assert.equal(task.expectedAspects.length, maxPoints);
    const prompt = core.buildPrompt_(task, '// ===== Datei: Hauptprogramm.java =====\n// ===== Datei: Hund.java =====');
    assert.match(prompt, /statisch/);
    assert.match(prompt, /Kommentare/);
    assert.match(prompt, /keine vollständige Musterlösung/);
  }
  assert.equal(core.TASKS[taskIds[0][0]].codeAnalysisContext,
    core.TASKS[taskIds[1][0]].codeAnalysisContext);
  assert.equal(core.TASKS[taskIds[1][0]].codeAnalysisContext,
    core.TASKS[taskIds[2][0]].codeAnalysisContext);
});

test('Rubriken decken kumulative und unabhängige Schritte samt Scheinlösungen ab', () => {
  const a = core.TASKS['11-6-0-4a-code'];
  assert.match(a.rubric.join(' '), /späterer gültiger Setter aus 5A/);
  assert.match(a.codeAnalysisRules.join(' '), /println\(6\)/);
  assert.match(a.codeAnalysisRules.join(' '), /gibAlter\(\) als Getter-Aufruf/);
  assert.match(a.codeAnalysisRules.join(' '), /Getteraufrufs in println/);
  const b = core.TASKS['11-6-0-5a-code'];
  assert.match(b.rubric.join(' '), /inasHund unverändert/);
  assert.match(b.codeAnalysisRules.join(' '), /println\(7\)/);
  assert.match(b.codeAnalysisRules.join(' '), /spätere gültige Aufrufe aus Aufgabe 5B/i);
  assert.match(b.codeAnalysisRules.join(' '), /Änderungen an inasHund/);
  assert.match(b.expectedAspects.join(' '), /Setter erhält den Wert 7/);
  assert.match(b.expectedAspects.join(' '), /nach dem vorgegebenen petersHund\.setzeAlter\(6\)/);
  assert.match(b.expectedAspects.join(' '), /inasHund\.gibAlter/);
  assert.match(b.expectedAspects.join(' '), /Reihenfolge ist beliebig/);
  assert.match(b.codeAnalysisRules.join(' '), /Getter-Ausgaben dürfen in beliebiger Reihenfolge stehen/);
  const c = core.TASKS['11-6-0-5b-code'];
  for (const phrase of ['Argumente stehen gemäß Signatur in der Reihenfolge Alter 9', 'inasHund.zeigeDaten()', 'hart kodierte println-Ausgabe', 'unabhängig von 5A']) {
    assert.ok((c.expectedAspects.join(' ') + ' ' + c.rubric.join(' ') + ' ' + c.codeAnalysisRules.join(' ')).includes(phrase), phrase);
  }
  assert.match(c.codeAnalysisRules.join(' '), /Aufruf davor/);
  assert.match(c.codeAnalysisRules.join(' '), /Kommentare/);
});

test('4A übermittelt die Bewertungsrubrik und konkrete Regeln für beide gemeldeten Fehlbewertungen', () => {
  const task = core.TASKS['11-6-0-4a-code'];
  const wrongCode = codeBundle(`${mainStart}\nprintln(petersHund.zeigeDaten());`);
  const correctCode = codeBundle(`${mainStart}\nprintln(petersHund.gibAlter());`);
  for (const code of [wrongCode, correctCode]) {
    const prompt = core.buildPrompt_(task, code);
    for (const rule of task.rubric) assert.ok(prompt.includes(rule), `Rubrikregel fehlt: ${rule}`);
    for (const rule of task.codeAnalysisRules) assert.ok(prompt.includes(rule), `Coderegel fehlt: ${rule}`);
    assert.match(prompt, /Fehlt dort petersHund\.gibAlter\(\), sind alle drei Aspekte unerfüllt und es gibt 0 Punkte/);
    assert.match(prompt, /println\(petersHund\.zeigeDaten\(\)\) ist deshalb ein Typfehler, kein Getteraufruf/);
    assert.match(prompt, /keine zusätzlichen Anforderungen/);
    assert.match(prompt, /nach dem vorgegebenen petersHund\.setzeAlter\(6\) vollständig richtig: 3 von 3 Punkten/);
    assert.match(prompt, /Eine zusätzliche Getterausgabe vor der Altersänderung ist nicht gefordert/);
    assert.ok(prompt.endsWith(`${code}\nENDE SCHUELERCODE`));
  }
});

test('Client prüft aktuellen IDE-Code aus beiden Dateien und Codeblöcke haben keine Begleitfelder', () => {
  assert.match(client, /evaluateCodeAnswer\(\{ serverUrl:SERVER_URL, taskId:block\.codeTask\.id, code, expectedMaxPoints:block\.codeTask\.maxPoints \}\)/);
  assert.match(client, /online_ide_access/);
  assert.match(client, /getIDE\?\.\(IDE_ID\)/);
  assert.match(client, /getName\?\.\(\) === 'Hauptprogramm\.java'/);
  assert.match(client, /getName\?\.\(\) === 'Hund\.java'/);
  assert.match(client, /Datei: Hauptprogramm\.java/);
  assert.match(client, /Datei: Hund\.java/);
  assert.match(client, /Hauptprogramm\.java` wurde in der Online-IDE nicht gefunden\./);
  assert.match(client, /Die Online-IDE lädt noch\. Bitte warte kurz und versuche es erneut\./);
  assert.match(client, /Der aktuelle Programmcode ist noch zu kurz für eine Auswertung\./);
  assert.match(client, /Dein Programmcode ist zu lang für die automatische Auswertung\./);
  assert.match(client, /Die Codeprüfung für Aufgabe 6\.0 ist auf dem Server noch nicht bereitgestellt/);
  assert.match(client, /if \(!block\.codeTask\) block\.fields\.forEach/);
  assert.match(client, /11-6-0-4a-code/);
  assert.match(client, /11-6-0-5a-code/);
  assert.match(client, /11-6-0-5b-code/);
  assert.match(client, /Finde heraus.*setzeAlter.*als Eingabe erwartet.*Prüfe/);
  assert.match(client, /finally \{ button\.disabled = false; \}/);
  assert.match(client, /Die Auswertung konnte nicht abgeschlossen werden/);
  for (const id of ['block-4a', 'block-5a', 'block-5b']) {
    const mount = html.match(new RegExp(`<div id="block-${id.slice(6)}"><\/div>`));
    assert.ok(mount, `Blockcontainer ${id}`);
  }
  assert.match(html, /Wenn du im Auswahlfenster eine Methode auswählst, ergänzt die IDE den Code\. Der Aufruf wirkt erst, wenn das Programm ihn ausführt\./);
  assert.doesNotMatch(html + client, /System\.out\.println/);
});

test('4A-Legacy-Migration ist einmalig und bewahrt späteren Codeerfolg samt Merksatz', () => {
  const readSavedSource = extractFunction(client, 'readSaved');
  const makeReader = storage => {
    const context = vm.createContext({
      localStorage:{
        getItem:key => storage[key] ?? null,
        setItem:(key, value) => { storage[key] = value; }
      },
      STORAGE_KEY:'informatik11-ki-aufgabe6-0-v2',
      STEPS:['objects', 'class-card', 'signatures', 'completion', 'transfer', 'quiz'],
      CLASS_CARD:{ cards:[{ id:'a1' }] },
      parseStoredChoices:value => value || ''
    });
    vm.runInContext(readSavedSource + '\nglobalThis.testReadSaved = readSaved;', context);
    return () => context.testReadSaved();
  };
  const key = 'informatik11-ki-aufgabe6-0-v2';

  const legacyStorage = { [key]:JSON.stringify({
    fields:{ 'answer-4a-0':'petersHund', 'remember-4':'visible' },
    flags:{ 'block-4a':true, 'block-4b':true, 'remember-4':true }
  }) };
  const migrated = makeReader(legacyStorage)();
  assert.equal(migrated.flags['block-4a'], undefined, 'alte Dropdownfreigabe wird entwertet');
  assert.equal(migrated.flags['remember-4'], undefined, 'alter Merksatzstatus wird mit invalidiert');
  assert.equal(migrated.flags['migration-4a-code-v1'], true, 'Migration wird versioniert markiert');
  assert.equal(migrated.fields['answer-4a-0'], undefined, 'altes Antwortfeld wird entfernt');

  const afterCodeCheck = JSON.parse(legacyStorage[key]);
  afterCodeCheck.flags['block-4a'] = true;
  afterCodeCheck.flags['remember-4'] = true;
  legacyStorage[key] = JSON.stringify(afterCodeCheck);
  const reloadedLegacy = makeReader(legacyStorage)();
  assert.equal(reloadedLegacy.flags['block-4a'], true, 'neuer Codeerfolg bleibt nach Legacy-Migration erhalten');
  assert.equal(reloadedLegacy.flags['remember-4'], true, 'Merksatz bleibt nach Legacy-Migration erhalten');

  const freshStorage = {};
  const fresh = makeReader(freshStorage)();
  assert.equal(fresh.flags['migration-4a-code-v1'], true, 'frischer Stand speichert Sentinel bereits beim Erstaufruf');
  const freshAfterCheck = JSON.parse(freshStorage[key]);
  freshAfterCheck.flags['block-4a'] = true;
  freshAfterCheck.flags['remember-4'] = true;
  freshStorage[key] = JSON.stringify(freshAfterCheck);
  const reloadedFresh = makeReader(freshStorage)();
  assert.equal(reloadedFresh.flags['block-4a'], true, 'frisch erworbener Codeerfolg bleibt beim Reload');
  assert.equal(reloadedFresh.flags['remember-4'], true, 'frisch freigeschalteter Merksatz bleibt beim Reload');
});

test('IDE-Code-Leser unterscheidet Ladezustand, fehlende Dateien und übergibt beide aktuellen Dateien in Reihenfolge', () => {
  const source = extractFunction(client, 'readIdeCode');
  const buildReader = frame => {
    const context = vm.createContext({ IDE_ID:'Java11Aufgabe6_0HundV2', document:{ getElementById: id => id === 'frame-hund' ? frame : null } });
    vm.runInContext(source + '\nglobalThis.testReadIdeCode = readIdeCode;', context);
    return context.testReadIdeCode;
  };
  const notLoaded = buildReader(null);
  assert.throws(() => notLoaded(), /Die Online-IDE lädt noch/);
  const ideFrame = files => ({ contentWindow:{ online_ide_access:{ getIDE(id) {
    assert.equal(id, 'Java11Aufgabe6_0HundV2');
    return { getFiles: () => files };
  } } } });
  assert.throws(() => buildReader(ideFrame([{ getName:() => 'Hund.java', getText:() => 'class Hund {}' }]))(), /Hauptprogramm\.java.*nicht gefunden/);
  assert.throws(() => buildReader(ideFrame([{ getName:() => 'Hauptprogramm.java', getText:() => 'println(1);' }]))(), /Hund\.java.*nicht gefunden/);
  const code = buildReader(ideFrame([
    { getName:() => 'Hund.java', getText:() => 'class Hund {}' },
    { getName:() => 'Hauptprogramm.java', getText:() => 'println(petersHund.gibAlter());' }
  ]))();
  assert.ok(code.indexOf('Datei: Hauptprogramm.java') < code.indexOf('Datei: Hund.java'));
  assert.match(code, /println\(petersHund\.gibAlter\(\)\)/);
  assert.match(code, /class Hund/);
  const errors = extractFunction(client, 'serverError');
  const errorContext = vm.createContext({});
  vm.runInContext(errors + '\nglobalThis.testServerError = serverError;', errorContext);
  assert.equal(errorContext.testServerError(new Error('unknown taskId')), 'Die Codeprüfung für Aufgabe 6.0 ist auf dem Server noch nicht bereitgestellt. Bitte informiere deine Lehrkraft.');
  assert.equal(errorContext.testServerError(new Error('offline')), 'Die Auswertung konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
});

test('HTML-Startprojekt behält die sieben Sollzeilen und verwendet println', () => {
  const start = html.match(/<script type="plain\/text" title="Hauptprogramm\.java">([\s\S]*?)<\/script>/)?.[1] || '';
  const dog = html.match(/<script type="plain\/text" title="Hund\.java">([\s\S]*?)<\/script>/)?.[1] || '';
  assert.match(html, /'id':'Java11Aufgabe6_0HundV2'/);
  assert.equal((start.match(/println\(/g) || []).length, 2);
  assert.match(dog, /println\("Der Hund heißt /);
  assert.match(dog, /println\(name \+ ": Wuff wuff"\)/);
  assert.doesNotMatch(start + dog, /System\.out\.println/);
});

test('vorhandener evaluateCodeAnswer-Transport setzt Grenzen, POST-Vertrag und Antwortformat durch', async () => {
  const sourcePath = path.join(repo, 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs');
  const source = fs.readFileSync(sourcePath, 'utf8').replace(/^export /gm, '');
  let request;
  const context = vm.createContext({
    URL, AbortController, crypto: require('node:crypto').webcrypto,
    setTimeout, clearTimeout,
    fetch: async (url, options) => {
      request = { url, options };
      const body = JSON.parse(options.body);
      return { ok: true, json: async () => ({ requestId: body.requestId, type: 'GEMINI_CODE_EVALUATION_RESULT', result: {
        ok: true, points: 3, maxPoints: 3, status: 'korrekt', strengths: ['Getterwert ausgegeben.'], missing: [], feedback: 'Gezielter nächster Schritt.'
      } }) };
    }
  });
  vm.runInContext(source + '\nglobalThis.testEvaluateCodeAnswer = evaluateCodeAnswer;', context);
  const code = '// ===== Datei: Hauptprogramm.java =====\nprintln(petersHund.gibAlter());\n// ===== Datei: Hund.java =====\npublic class Hund {}';
  const result = await context.testEvaluateCodeAnswer({ taskId: taskIds[0][0], code, expectedMaxPoints: 3 });
  assert.equal(result.status, 'korrekt');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.credentials, 'omit');
  assert.equal(request.url, 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/');
  const payload = JSON.parse(request.options.body);
  assert.equal(payload.taskId, taskIds[0][0]);
  assert.equal(payload.requestType, 'code');
  assert.equal(payload.code, code);
  await assert.rejects(context.testEvaluateCodeAnswer({ taskId: taskIds[0][0], code: 'kurz' }), /zu kurz/);
  await assert.rejects(context.testEvaluateCodeAnswer({ taskId: taskIds[0][0], code: 'x'.repeat(12001) }), /zu lang/);
  context.fetch = async () => ({ ok: false, json: async () => ({ result: { ok: false, message: 'Unbekannte taskId' } }) });
  await assert.rejects(context.testEvaluateCodeAnswer({ taskId: 'unbekannte-id', code }), /Unbekannte taskId/);
  context.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    return { ok: true, json: async () => ({ requestId: body.requestId, type: 'GEMINI_CODE_EVALUATION_RESULT', result: {
      ok: true, points: 4, maxPoints: 4, status: 'korrekt', strengths: [], missing: [], feedback: 'Antwortfehler'
    } }) };
  };
  await assert.rejects(context.testEvaluateCodeAnswer({ taskId: taskIds[0][0], code, expectedMaxPoints: 3 }), /unerwartetes Format/);
});

test('Prompt-Vertrag mit Codefixtures und kontrollierten Modellantworten (Mock; keine KI-Livebewertung)', async () => {
  const fixtures = [
    { name:'vollständige kumulative Lösung 4A+5A+5B / 4A', taskId:'11-6-0-4a-code', code:cumulativeSolution, points:3,
      fragment:'Ein späterer gültiger petersHund.setzeAlter(7) ist erlaubt' },
    { name:'vollständige kumulative Lösung 4A+5A+5B / 5A', taskId:'11-6-0-5a-code', code:cumulativeSolution, points:4,
      fragment:'Spätere gültige Aufrufe aus Aufgabe 5B dürfen die vorherigen Ergebnisse nicht entwerten' },
    { name:'vollständige kumulative Lösung 4A+5A+5B / 5B', taskId:'11-6-0-5b-code', code:cumulativeSolution, points:4,
      fragment:'Andere Aufrufe und Ergebnisse aus 5A sind irrelevant' },
    { name:'5A Getterausgaben in umgekehrter Reihenfolge', taskId:'11-6-0-5a-code',
      code:codeBundle(`${mainStart}\npetersHund.setzeAlter(7);\nprintln(inasHund.gibAlter());\nprintln(petersHund.gibAlter());`), points:4,
      fragment:'Die beiden Getter-Ausgaben dürfen in beliebiger Reihenfolge stehen' },
    { name:'4A mit späterem Setter', taskId:'11-6-0-4a-code',
      code:codeBundle(`${mainStart}\nprintln(petersHund.gibAlter());\npetersHund.setzeAlter(7);`), points:3,
      fragment:'entwertet eine Ausgabe des aktuellen Getterwerts nicht' },
    { name:'gemeldete gültige Getterausgabe nur nach der Altersänderung', taskId:'11-6-0-4a-code',
      code:codeBundle(`${mainStart}\nprintln(petersHund.gibAlter());`), points:3,
      fragment:'Eine zusätzliche Getterausgabe vor der Altersänderung ist nicht gefordert' },
    { name:'gemeldete void-Ausgabe statt Getteraufruf', taskId:'11-6-0-4a-code',
      code:codeBundle(`${mainStart}\nprintln(petersHund.zeigeDaten());`), points:0,
      fragment:'println(petersHund.zeigeDaten()) ist deshalb ein Typfehler, kein Getteraufruf' },
    { name:'5B allein', taskId:'11-6-0-5b-code',
      code:codeBundle(`${mainStart}\ninasHund.setzeDaten(9, "Flocke");\ninasHund.zeigeDaten();`), points:4,
      fragment:'Andere Aufrufe und Ergebnisse aus 5A sind irrelevant' },
    { name:'falsche setzeDaten-Reihenfolge', taskId:'11-6-0-5b-code',
      code:codeBundle(`${mainStart}\ninasHund.setzeDaten("Flocke", 9);\ninasHund.zeigeDaten();`), points:2,
      fragment:'erstes Argument 9 und dessen zweites Argument der String "Flocke"' },
    { name:'Getter ohne Ausgabe', taskId:'11-6-0-4a-code',
      code:codeBundle(`${mainStart}\npetersHund.gibAlter();`), points:2,
      fragment:'Rückgabewert des Getteraufrufs in println(...)' },
    { name:'harte Zahlen statt Getterausgaben', taskId:'11-6-0-5a-code',
      code:codeBundle(`${mainStart}\npetersHund.setzeAlter(7);\nprintln(7);\nprintln(8);`), points:2,
      fragment:'println(7) oder eine sonstige harte Zahl zählt nicht' },
    { name:'hart kodierter Flocke-Text', taskId:'11-6-0-5b-code',
      code:codeBundle(`${mainStart}\ninasHund.setzeDaten(9, "Flocke");\nprintln("Der Hund heißt Flocke und ist 9 Jahre alt.");`), points:2,
      fragment:'println("Der Hund heißt Flocke und ist 9 Jahre alt.") ersetzt den Methodenaufruf nicht' },
    { name:'falsches Objekt für 5A', taskId:'11-6-0-5a-code',
      code:codeBundle(`${mainStart}\ninasHund.setzeAlter(7);\nprintln(petersHund.gibAlter());\nprintln(inasHund.gibAlter());`), points:0,
      fragment:'frühere Änderungen an inasHund schließen diesen Aspekt aus' },
    { name:'zeigeDaten vor setzeDaten', taskId:'11-6-0-5b-code',
      code:codeBundle(`${mainStart}\ninasHund.zeigeDaten();\ninasHund.setzeDaten(9, "Flocke");`), points:2,
      fragment:'Ein anderer Empfänger, ein Aufruf davor oder eine hart kodierte println-Ausgabe zählt nicht' },
    { name:'Kommentar als Scheinlösung', taskId:'11-6-0-4a-code',
      code:codeBundle(`${mainStart}\n// println(petersHund.gibAlter());`), points:0,
      fragment:'Kommentare, Zeichenketten mit Java-Code, Anleitungstexte und hart kodierte erwartete Ausgaben sind keine Lösung' }
  ];

  // This contract test only proves complete routing/prompt construction and result normalization.
  // Its controlled model responses do not establish that an AI judge would award these points.
  for (let index = 0; index < fixtures.length; index++) {
    const fixture = fixtures[index];
    const task = core.TASKS[fixture.taskId];
    const seen = [];
    const handle = createHandler({ rateLimit:Infinity, env:{
      AI_API_KEY:'mock-only', AI_PROJECT_ID:'11111111-1111-1111-1111-111111111111',
      AI_MODEL:'mock-model', AI_EVALUATION_ENABLED:'true'
    }, fetchImpl:async (url, options) => {
      const payload = JSON.parse(options.body);
      seen.push(payload);
      const controlled = {
        points:fixture.points, maxPoints:task.maxPoints,
        status:fixture.points === task.maxPoints ? task.statusLabels.correct : fixture.points ? task.statusLabels.partial : task.statusLabels.incorrect,
        strengths:task.expectedAspects.slice(0, fixture.points),
        missing:task.expectedAspects.slice(fixture.points),
        feedback:'Mock-Antwort; keine semantische Livebewertung.'
      };
      return { ok:true, status:200, async text() {
        return JSON.stringify({ choices:[{ finish_reason:'stop', message:{ content:JSON.stringify(controlled) } }] });
      } };
    } });

    const requestId = `task6_fixture_${index}`;
    const response = await handle({ httpMethod:'POST', path:'/', headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ requestId, taskId:fixture.taskId, requestType:'code', code:fixture.code }) });
    assert.equal(response.statusCode, 200, fixture.name);
    assert.equal(seen.length, 1, fixture.name);
    assert.equal(seen[0].messages[1].content.includes(`\n${fixture.code}\nENDE SCHUELERCODE`), true, `${fixture.name}: vollständiger Code im Prompt`);
    assert.ok(seen[0].messages[1].content.includes(fixture.fragment), `${fixture.name}: passende Rubrikregel im Prompt`);
    for (const aspect of task.expectedAspects) assert.ok(seen[0].messages[1].content.includes(aspect), `${fixture.name}: erwarteter Aspekt im Prompt`);
    const result = JSON.parse(response.body).result;
    assert.equal(result.points, fixture.points, fixture.name);
    assert.equal(result.maxPoints, task.maxPoints, fixture.name);
    assert.equal(result.status, fixture.points === task.maxPoints ? task.statusLabels.correct : fixture.points ? task.statusLabels.partial : task.statusLabels.incorrect, fixture.name);
    assert.deepEqual(result.strengths, task.expectedAspects.slice(0, fixture.points), `${fixture.name}: kontrollierte erkannte Aspekte`);
    assert.deepEqual(result.missing, task.expectedAspects.slice(fixture.points), `${fixture.name}: kontrollierte fehlende Aspekte`);
    assert.equal(result.feedback, 'Mock-Antwort; keine semantische Livebewertung.', fixture.name);
  }
});

