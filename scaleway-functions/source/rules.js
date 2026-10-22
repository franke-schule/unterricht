/**
 * Regelbasierte Mindestbewertung fuer die einzelnen Aufgaben.
 */

function applyRuleBasedMinimum_(
  evaluation,
  task,
  answer
) {
  if (task === TASKS['ph11-kettenkarussell-winkelgeschwindigkeit']) {
    const changes = evaluateKettenkarussellChangesByRules_(answer, task);
    if (changes) return changes;
  }

  if (task === TASKS['11-6-0-4a-code'] || task === TASKS['11-6-0-5a-code']) {
    const getterEvaluation = evaluateDogGetterByRules_(answer, task);
    if (getterEvaluation) return getterEvaluation;
  }

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

  if (task === TASKS['11-4-1']) {
    ruleBasedEvaluation = evaluateFishDepthOneByRules_(answer, task.maxPoints);
  }

  if (task === TASKS['11-4-2']) {
    ruleBasedEvaluation = evaluateFishDepthDevelopmentByRules_(answer, task.maxPoints);
  }

  if (task === TASKS['11-4-3']) {
    ruleBasedEvaluation = evaluateFishEqualAccuracyByRules_(answer, task.maxPoints);
  }

  if (task === TASKS['11-5-1']) {
    ruleBasedEvaluation = evaluatePerceptronLearningByRules_(answer, task.maxPoints);
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


function evaluateKettenkarussellChangesByRules_(answer, task) {
  const text = normalizeGermanText_(normalizePhysicsNotation_(answer));
  // Nur eindeutig erkannte Beschreibungen nachbewerten. Zitate, Zweifel,
  // Negationen und andere unklare Aussagen bleiben bei der KI-Bewertung.
  if (/[?"„“]/.test(text) || /\b(?:angeblich|vielleicht|behauptet|bewerte|punkte|zentrifugalkraft)\b/.test(text) || /nach aussen|nicht\s+keine/.test(text)) return null;
  const subjects = /(?<force>\bzentripetalkraft(?:\s+f_z)?\b|\bf_z\b)|(?<angle>\b(?:auslenk)?winkel(?:\s+α)?\b|α)|(?<radius>\b(?:bahn)?radius(?:\s+r)?\b|\br\b)|(?<rope>\bseilkraft(?:\s+f_?s)?\b|\bf_?s\b)|(?<mass>\bmasse(?:\s+m)?\b|\bm\b)|(?<weight>\bgewichtskraft(?:\s+f_?g)?\b|\bf_?g\b)/g;
  const matches = [...text.matchAll(subjects)];
  const growth = /\b(?:groesser|vergroessert|steigt|steigen|zunimmt|zunehmen|nimmt\s+(?:\w+\s+){0,2}zu|nehmen\s+(?:\w+\s+){0,2}zu|erhoeht)\b/;
  const contrary = /\b(?:nicht|kein(?:e|en|er|es)?|kleiner|abnimmt|abnehmen|sinkt|sinken|weniger)\b/;
  const chunks = matches.map((match, index) => {
    const span = text.slice(match.index + match[0].length, matches[index + 1]?.index ?? text.length);
    return { kind: Object.keys(match.groups).find(key => match.groups[key] !== undefined), span,
      grows: growth.test(span), constant: /\b(?:gleich|unveraendert|konstant)\b/.test(span), negated: contrary.test(span) };
  });
  // Gemeinsame Prädikate wie „Masse und Gewichtskraft bleiben gleich“.
  for (let index = chunks.length - 2; index >= 0; index--) {
    if (/^\s*(?:(?:,|und|sowie)\s*)*(?:(?:die|der|das)\s*)?$/.test(chunks[index].span)) {
      for (const property of ['grows', 'constant', 'negated']) chunks[index][property] = chunks[index + 1][property];
    }
  }
  const entries = kind => chunks.filter(chunk => chunk.kind === kind);
  const increased = kind => entries(kind).some(chunk => chunk.grows && !chunk.constant && !chunk.negated);
  for (const kind of ['force', 'angle', 'radius', 'rope']) {
    if (entries(kind).some(chunk => chunk.negated || chunk.constant)) return null;
  }
  for (const kind of ['mass', 'weight']) {
    if (entries(kind).some(chunk => chunk.grows || /\bnicht\b[^,.;]*\b(?:gleich|konstant|unveraendert)\b/.test(chunk.span))) return null;
    if (entries(kind).some(chunk => /\b(?:kleiner|weniger|sinkt|abnimmt|schrumpft|nimmt\s+ab)\b/.test(chunk.span))) return null;
    if (entries(kind).some(chunk => /\b(?:aendert|veraendert)\b/.test(chunk.span) && !/\bnicht\b/.test(chunk.span))) return null;
  }
  const massUnaffected = /\b(?:keine(?:n)?\s+(?:auswirkung(?:en)?|einfluss)\s+auf\s+(?:die\s+)?(?:masse|m))\b/.test(text);
  const massConstant = entries('mass').some(chunk => chunk.constant) || massUnaffected;
  const weightConstant = entries('weight').some(chunk => chunk.constant);
  if (!increased('force') || !increased('angle') || !increased('radius') || !massConstant || !weightConstant) return null;
  if (entries('rope').length && !increased('rope')) return null;
  const points = increased('rope') ? 5 : 4;
  return {
    ok: true, points, maxPoints: task.maxPoints,
    status: points === task.maxPoints ? task.statusLabels.correct : task.statusLabels.partial,
    strengths: [],
    missing: points === 5 ? [] : ['Die Veränderung der Seilkraft F_S fehlt; vergleiche die Länge ihres Kraftpfeils bei größerer Winkelgeschwindigkeit.'],
    feedback: points === 5 ? 'Sehr gut, alles richtig' : ''
  };
}


function evaluateDogGetterByRules_(answer, task) {
  const files = { 'Hauptprogramm.java': [], 'Hund.java': [] };
  const tokens = /\s+|\/\/[^\r\n]*|\/\*[\s\S]*?\*\/|"(?:\\[^\r\n]|[^"\\\r\n])*"|[A-Za-z_$][\w$]*|\d+|[{}().,;=+\-]/gy;
  let file = '';
  let offset = 0;
  while (offset < answer.length) {
    tokens.lastIndex = offset;
    const match = tokens.exec(answer);
    if (!match) return null;
    const token = match[0];
    offset = tokens.lastIndex;
    if (/^\s+$/.test(token)) continue;
    if (token.startsWith('//')) {
      const marker = token.match(/^\/\/ ===== Datei: (Hauptprogramm\.java|Hund\.java) =====\s*$/);
      if (marker) {
        if (files[marker[1]].length) return null;
        file = marker[1];
      }
      continue;
    }
    if (token.startsWith('/*')) continue;
    if (!file) return null;
    if (token.startsWith('"') && !/^"(?:[^"\\\r\n]|\\(?:[btnfr"'\\]|[0-7]{1,3}))*"$/.test(token)) return null;
    if (/^\d+$/.test(token) && (/^0\d/.test(token) || Number(token) > (files[file][files[file].length - 1] === '-' ? 2147483648 : 2147483647))) return null;
    files[file].push(token.startsWith('"') ? '""' : token);
  }

  const dog = files['Hund.java'].join(' ');
  if (!dog.startsWith('public class Hund { ') || !dog.endsWith(' }')) return null;
  let members = dog.slice('public class Hund { '.length, -2);
  const referenceMembers = [
    'private int alter ;',
    'private String name ;',
    'public Hund ( int startAlter , String startName ) { alter = startAlter ; name = startName ; }',
    'public int gibAlter ( ) { return alter ; }',
    'public void setzeAlter ( int neuesAlter ) { alter = neuesAlter ; }',
    'public void setzeDaten ( int neuesAlter , String neuerName ) { alter = neuesAlter ; name = neuerName ; }',
    'public void zeigeDaten ( ) { println ( "" + name + "" + alter + "" ) ; }',
    'public void belle ( ) { println ( name + "" ) ; }'
  ];
  for (const member of referenceMembers) {
    const padded = ' ' + members + ' ';
    const expected = ' ' + member + ' ';
    if (!padded.includes(expected)) return null;
    members = padded.replace(expected, ' ').trim();
  }
  if (members) return null;

  const main = files['Hauptprogramm.java'];
  if (!main.length || main[main.length - 1] !== ';') return null;
  const declared = new Set();
  let getter = false;
  let printed = false;
  let voidOutput = false;
  let voidInPrint = false;
  let voidCall = null;
  let wrongGetterArity = false;
  let peterSetterAfterStarter = false;
  let setterSevenAfterStarter = false;
  let peterValueSeven = false;
  let peterPrintedAfterSeven = false;
  let inaPrintedAfterSeven = false;
  let inaChangedBeforeBoth = false;
  let sawPeterShow = false;
  let starterSetterSeen = false;
  for (const statement of main.join(' ').split(' ;').filter(text => text.trim())) {
    const text = statement.trim();
    const declaration = text.match(/^Hund (petersHund|inasHund) = new Hund \( (?:- )?\d+ , "" \)$/);
    if (declaration) {
      if (declared.has(declaration[1])) return null;
      declared.add(declaration[1]);
      continue;
    }
    const receiver = text.match(/\b(petersHund|inasHund) \./);
    if (receiver && !declared.has(receiver[1])) return null;
    if (/^(?:println \( )?(?:petersHund|inasHund) \. gibAlter \( (?:- )?\d+ \)(?: \))?$/.test(text)) {
      wrongGetterArity = true;
      continue;
    }
    if (/^(?:petersHund|inasHund) \. (?:zeigeDaten|belle|gibAlter) \( \)$/.test(text)) {
      if (text === 'petersHund . gibAlter ( )') getter = true;
      if (text === 'petersHund . zeigeDaten ( )') sawPeterShow = true;
    } else if (/^(?:petersHund|inasHund) \. setzeAlter \( (?:- )?\d+ \)$/.test(text) ||
      /^(?:petersHund|inasHund) \. setzeDaten \( (?:- )?\d+ , "" \)$/.test(text)) {
      const previousStarterSeen = starterSetterSeen;
      if (text === 'petersHund . setzeAlter ( 6 )') starterSetterSeen = true;
      if (previousStarterSeen && text.startsWith('petersHund . setzeAlter')) {
        peterSetterAfterStarter = true;
        const setterValue = text.match(/setzeAlter \( (-?\d+) \)/);
        peterValueSeven = Boolean(setterValue && setterValue[1] === '7');
        if (peterValueSeven) setterSevenAfterStarter = true;
      } else if (text.startsWith('petersHund . setzeDaten')) {
        peterValueSeven = false;
      }
      if (text === 'petersHund . setzeAlter ( 6 )' && !previousStarterSeen) peterValueSeven = false;
      if (text.startsWith('inasHund . setzeAlter') || text.startsWith('inasHund . setzeDaten')) {
        if (!(peterPrintedAfterSeven && inaPrintedAfterSeven)) {
          inaChangedBeforeBoth = true;
          inaPrintedAfterSeven = false;
        }
      }
      continue;
    } else if (/^println \( (?:petersHund|inasHund) \. gibAlter \( \) \)$/.test(text)) {
      if (text === 'println ( petersHund . gibAlter ( ) )') {
        getter = true; printed = true;
        if (peterValueSeven) peterPrintedAfterSeven = true;
      }
      if (text === 'println ( inasHund . gibAlter ( ) )' && peterValueSeven && !inaChangedBeforeBoth) inaPrintedAfterSeven = true;
    } else if (/^println \( (?:petersHund|inasHund) \. (?:zeigeDaten|belle) \( \) \)$/.test(text)) {
      voidOutput = true;
      voidInPrint = true;
      const match = text.match(/^println \( (petersHund|inasHund) \. (zeigeDaten|belle) \( \) \)$/);
      if (match) voidCall = { receiver: match[1], method: match[2] };
    } else if (!/^println \( (?:""|(?:- )?\d+) \)$/.test(text)) {
      return null;
    }
  }

  if (wrongGetterArity) {
    return {
      ok: true, points: 0, maxPoints: task.maxPoints,
      status: task.statusLabels.incorrect, strengths: [],
      missing: ['Die Methode gibAlter() hat keinen Eingabeparameter.'],
      feedback: 'Die Methode gibAlter() hat keinen Eingabeparameter.'
    };
  }

  if (task === TASKS['11-6-0-5a-code']) {
    const strengths = [];
    const missing = [];
    if (peterSetterAfterStarter) strengths.push('Du verwendest nach dem vorgegebenen Setter einen ausführbaren Setter-Aufruf an petersHund.');
    else missing.push('Füge nach dem vorgegebenen setzeAlter(6)-Aufruf einen Setter-Aufruf an petersHund ein.');
    if (setterSevenAfterStarter) {
      strengths.push('Der Setter setzt petersHund nach dem vorhandenen setzeAlter(6)-Aufruf auf 7.');
    } else missing.push('Setze petersHund nach dem vorhandenen setzeAlter(6)-Aufruf mit setzeAlter(7) auf 7.');
    if (peterValueSeven && peterPrintedAfterSeven) strengths.push('Du gibst Wufftis Getterwert nach dem Setter aus.');
    else missing.push('Gib den Rückgabewert von petersHund.gibAlter() nach setzeAlter(7) aus.');
    if (peterValueSeven && inaPrintedAfterSeven && !inaChangedBeforeBoth) strengths.push('Du gibst Inas unveränderten Getterwert nach dem Setter aus.');
    else missing.push('Gib den Rückgabewert von inasHund.gibAlter() nach dem Setter aus, bevor du inasHund änderst.');
    let points = Number(peterSetterAfterStarter) + Number(setterSevenAfterStarter) + Number(peterValueSeven && peterPrintedAfterSeven) + Number(peterValueSeven && inaPrintedAfterSeven && !inaChangedBeforeBoth);
    if (voidOutput) {
      points = Math.min(points, task.maxPoints - 1);
      const receiver = voidCall ? voidCall.receiver : 'petersHund';
      const method = voidCall ? voidCall.method : 'zeigeDaten';
      missing.unshift(`Ersetze println(${receiver}.${method}()) durch eine Ausgabe des Alters-Getters; ${method}() hat den Rückgabetyp void.`);
    }
    return {
      ok: true, points, maxPoints: task.maxPoints,
      status: points === task.maxPoints ? task.statusLabels.correct : points ? task.statusLabels.partial : task.statusLabels.incorrect,
      strengths, missing: missing.slice(0, 2),
      feedback: missing.slice(0, 2).join(' ')
    };
  }

  const points = Number(getter) + Number(printed) + Number(getter && !voidOutput);
  const strengths = [];
  if (getter) strengths.push('Du rufst petersHund.gibAlter() nach der Objekterzeugung auf.');
  if (printed) strengths.push('Du gibst den Rückgabewert des Getters mit println(...) aus.');
  if (getter && !voidOutput) strengths.push('Der Getteraufruf ist vollständig und enthält die leeren Klammern.');
  const missing = [];
  if (voidOutput) {
    if (voidInPrint && voidCall) missing.push(`Ersetze den inneren Aufruf ${voidCall.receiver}.${voidCall.method}() durch petersHund.gibAlter(); ${voidCall.method}() hat den Rückgabetyp void.`);
    else missing.push('Ersetze petersHund.zeigeDaten() durch einen Aufruf von println(...) und einem Aufruf der Getter-Methode in den runden Klammern von println.');
  }
  else if (!getter && sawPeterShow) missing.push('Ersetze petersHund.zeigeDaten() durch einen Aufruf von println(...) und einem Aufruf der Getter-Methode in den runden Klammern von println.');
  else if (!getter) missing.push('Ergänze eine Ausgabe des Rückgabewerts von petersHund.gibAlter() mit println(...).');
  else if (!printed) missing.push('Gib den Rückgabewert des Alters-Getters mit println(...) aus.');
  return {
    ok: true, points, maxPoints: task.maxPoints,
    status: points === task.maxPoints ? task.statusLabels.correct : points ? task.statusLabels.partial : task.statusLabels.incorrect,
    strengths, missing,
    feedback: points === task.maxPoints
      ? 'Korrekt. Du gibst den Rückgabewert von petersHund.gibAlter() mit println(...) aus. Vorherige Aufrufe von zeigeDaten() oder setzeAlter(...) sind erlaubt; der Getter muss nicht direkt nach der Objekterzeugung stehen.'
      : missing.join(' ')
  };
}


function createFishRuleEvaluation_(points, maxPoints, strengths, missing, feedback) {
  return {
    ok: true,
    points: clampNumber_(points, 0, maxPoints),
    maxPoints: maxPoints,
    status: points >= maxPoints * 0.75 ? 'gut' : points >= maxPoints * 0.4 ? 'teilweise richtig' : 'noch unvollstaendig',
    strengths: strengths.slice(0, 4),
    missing: missing.slice(0, 4),
    feedback: feedback
  };
}


function evaluateFishDepthOneByRules_(answer, maxPoints) {
  const text = normalizeGermanText_(answer);
  const strengths = [];
  const missing = [];
  let points = 0;
  const describesTree =
    containsAny_(text, ['schuppenfarbe', 'schuppen farbe']) ||
    (containsAny_(text, ['baum', 'wurzel', 'knoten']) && containsAny_(text, ['ast', 'aeste', 'äste', 'blatt', 'blaetter', 'blätter', 'teilt', 'aufteilung']));
  if (describesTree) { points++; strengths.push('Du beschreibst den resultierenden Baum nachvollziehbar.'); }
  else { missing.push('Beschreibe den resultierenden Baum, zum Beispiel seinen ersten Split und die entstehenden Aeste oder Blaetter.'); }
  const rejectsPerfectClassification = containsAny_(text, ['nein', 'nicht alle', 'nicht vollstaendig', 'nicht vollständig', 'koennen nicht alle', 'kann nicht alle', 'fehler bleiben', 'fehlklass', '3 falsch', '6 von 9', '66,7', '66.7']);
  const givesReason = containsAny_(text, ['gemischt', 'teilmeng', 'beide klassen', 'nicht rein', 'unrein', 'tiefe 1', 'nur ein split', 'nur eine aufteilung']) || (text.includes('friedlich') && text.includes('feindselig'));
  if (rejectsPerfectClassification && givesReason) { points++; strengths.push('Du begruendest, warum nicht alle Trainingsdaten korrekt klassifiziert werden.'); }
  else { missing.push('Entscheide begruendet, ob bei Tiefe 1 alle Trainingsdaten richtig klassifiziert werden.'); }
  if (containsAny_(text, ['groessere baumtiefe', 'größere baumtiefe', 'baumtiefe erhoehen', 'baumtiefe erhöhen', 'tiefe erhoehen', 'tiefe erhöhen', 'tieferer baum', 'mehr ebenen', 'weitere aufteilung', 'weiter aufteil', 'weiterer split', 'mehr knoten'])) { points++; strengths.push('Du schlaegst eine sinnvolle Verbesserung vor.'); }
  else { missing.push('Schlage eine sinnvolle Verbesserung vor, etwa eine groessere maximale Baumtiefe.'); }
  return createFishRuleEvaluation_(points, maxPoints, strengths, missing, points === maxPoints ? 'Du beschreibst den Baum, begruendest seine Grenze und nennst eine passende Verbesserung.' : 'Ergaenze die noch fehlenden Teile zu Beschreibung, Begruendung oder Verbesserung.');
}


function evaluateFishDepthDevelopmentByRules_(answer, maxPoints) {
  const text = normalizeGermanText_(answer);
  const strengths = [];
  const missing = [];
  let points = 0;
  const decreasingErrors = /train/.test(text) && (
    /(?:fehler|fehleranzahl)[^.!?;]{0,70}(?:sinken|sink\w*|werden weniger|nehmen ab|verringern sich)/.test(text) ||
    /weniger\s+(?:trainings)?fehler/.test(text) ||
    containsAny_(text, ['3 ueber 1 auf 0', '3 ueber 1 bis 0', 'von 3 auf 0', 'von drei auf null'])
  );
  if (decreasingErrors) { points++; strengths.push('Du beschreibst die sinkende Zahl falsch klassifizierter Trainingsdaten.'); }
  else { missing.push('Beschreibe, wie sich die Fehler in der Trainingsphase bei höherer Baumtiefe verändern.'); }

  // Verneinungen gelten nur für die jeweilige Aussage. Ein später behaupteter
  // Testvorteil darf nicht durch ein früheres „steigt nicht“ verdeckt werden.
  const claimsTestChange = text.split(/[.!?;,\n]+|\b(?:aber|jedoch|sondern|weil|und)\b/).some(function(statement) {
    const affirmative = statement
      .replace(/\b(?:steigt|sinkt|faellt|nimmt zu|nimmt ab|verbessert sich|verringert sich)\s+(?:(?:hier|dabei|dadurch)\s+)?nicht\b/g, 'bleibt gleich')
      .replace(/\b(?:nimmt nicht (?:zu|ab)|(?:verbessert|verringert) sich nicht|(?:wird|ist) nicht (?:besser|hoeher|geringer))\b/g, 'bleibt gleich')
      .replace(/\b(?:keine|keinen|nicht)\s+(?:hoehere|bessere|geringere)\s+(?:test)?genauigkeit\b/g, 'gleiche genauigkeit')
      .replace(/\b(?:nicht|keine)\s+mehr testfische richtig\b/g, 'gleich viele testfische richtig');
    return /\b(?:test)?genauigkeit\b[^.!?;,]{0,60}\b(?:steigt|sinkt|faellt|nimmt zu|nimmt ab|verbessert sich|verringert sich|(?:ist|wird)\s+(?:hoeher|besser|geringer))\b/.test(affirmative) ||
      /\b(?:hoehere|bessere|geringere)\s+(?:test)?genauigkeit\b/.test(affirmative) ||
      /\bmehr testfische richtig\b/.test(affirmative);
  });
  const equalTestAccuracy = containsAny_(text, ['genauigkeit']) &&
    containsAny_(text, ['gleich', 'unveraendert', 'steigt nicht', 'nimmt nicht zu', 'nicht hoeher']) && !claimsTestChange;
  if (equalTestAccuracy) { points++; strengths.push('Du erkennst, dass die Genauigkeit auf diesen Testdaten gleich bleibt.'); }
  else { missing.push('Vergleiche die Genauigkeit bei den Baumtiefen 1 bis 3.'); }

  const explainsNoConnection = /fehler/.test(text) && /genauigkeit/.test(text) && (
    /haeng\w*[^.!?;]{0,70}nicht[^.!?;]{0,30}zusammen/.test(text) ||
    /kein(?:en)?\s+(?:direkten\s+|erkennbaren\s+)?zusammenhang/.test(text) ||
    /genauigkeit[^.!?;]{0,50}(?:unabhaengig|haengt[^.!?;]{0,20}nicht)/.test(text) ||
    /weniger\s+(?:trainings)?fehler[^.!?;]{0,100}(?:nicht zu|keine (?:hoehere|bessere))[^.!?;]{0,40}genauigkeit/.test(text)
  );
  if (explainsNoConnection && !claimsTestChange) {
    points++;
    strengths.push('Du erklärst, dass weniger Trainingsfehler in dieser Tabelle nicht zu höherer Testgenauigkeit führen.');
  } else {
    missing.push('Erkläre den Zusammenhang zwischen Trainingsfehlern und Genauigkeit in dieser Tabelle.');
  }
  const feedback = points === maxPoints
    ? 'Richtig. Bei höherer Baumtiefe entstehen weniger Trainingsfehler. Die Genauigkeit bleibt bei Tiefe 1 bis 3 gleich. Weniger Trainingsfehler führen in dieser Tabelle nicht zu höherer Testgenauigkeit.'
    : points > 0
      ? 'Teilweise korrekt. Prüfe beide Ergebnisspalten und ergänze den noch fehlenden Zusammenhang. Achte darauf, dass sich deine Aussagen zur Genauigkeit nicht widersprechen.'
      : 'Noch nicht korrekt. Vergleiche die Trainingsfehler und die Genauigkeit bei Tiefe 1 bis 3 und beschreibe den Zusammenhang in dieser Tabelle.';
  return createFishRuleEvaluation_(points, maxPoints, strengths, missing, feedback);
}


function evaluateFishEqualAccuracyByRules_(answer, maxPoints) {
  const text = normalizeGermanText_(answer);
  const strengths = [];
  const missing = [];
  let points = 0;
  if (containsAny_(text, ['gleich genau', 'gleiche genauigkeit', 'dieselbe genauigkeit', 'beide 80', 'beide haben 80', 'je 80', 'beide vier von fuenf', 'beide vier von fünf']) || (text.includes('beide') && text.includes('80'))) { points++; strengths.push('Du erkennst die gleiche Genauigkeit der beiden Baeume.'); }
  else { missing.push('Nenne, dass beide Baeume auf den Testdaten dieselbe Genauigkeit haben.'); }
  const mentionsBothFish =
    containsAny_(text, ['t3', 'testfisch 3', 'fisch 3']) &&
    containsAny_(text, ['t4', 'testfisch 4', 'fisch 4']);
  if (containsAny_(text, ['unterschiedlich', 'andere fisch', 'nicht dieselben', 'verschiedene fehler']) || mentionsBothFish) { points++; strengths.push('Du beschreibst unterschiedliche Fehlklassifikationen.'); }
  else { missing.push('Erklaere, dass die falsch klassifizierten Fische trotz gleicher Genauigkeit verschieden sein koennen.'); }
  if (containsAny_(text, ['allein', 'nicht genug', 'nicht ausreichend', 'zeigt nicht', 'art der fehler', 'welche fehler', 'verteilung'])) { points++; strengths.push('Du ordnest die Genauigkeit als begrenztes Guetemass ein.'); }
  else { missing.push('Erklaere, warum die Genauigkeit allein die Art der Fehler nicht zeigt.'); }
  return createFishRuleEvaluation_(points, maxPoints, strengths, missing, points === maxPoints ? 'Du zeigst klar, warum gleiche Genauigkeit nicht dieselben Fehler bedeutet.' : 'Vergleiche neben der Genauigkeit auch, welche Fische falsch klassifiziert werden.');
}


function evaluatePerceptronLearningByRules_(answer, maxPoints) {
  const text = normalizeGermanText_(answer);
  const strengths = [];
  const missing = [];
  let points = 0;
  const changesParameters =
    containsAny_(text, ['gewicht', 'w1', 'w2', 'parameter']) &&
    containsAny_(text, ['aendert', 'ändert', 'anpass', 'veraendert', 'verändert', 'passt']);
  const mentionsThreshold = containsAny_(text, ['schwellenwert', 'theta', 'θ']);
  if (changesParameters && (mentionsThreshold || containsAny_(text, ['gewicht', 'parameter']))) {
    points++;
    strengths.push('Du nennst die Anpassung von Gewichten und/oder Schwellenwert.');
  } else {
    missing.push('Erkläre, welche Parameter bei einer Fehlklassifikation angepasst werden.');
  }
  const comparesOutputs =
    containsAny_(text, ['soll', 'zielwert', 'erwartet', 'label', 't']) &&
    containsAny_(text, ['ist', 'ausgabe', 'berechnet', 'f a', 'f(a)', 'fehler', 'abweich']);
  if (comparesOutputs) {
    points++;
    strengths.push('Du beschreibst den Vergleich von erwarteter und berechneter Ausgabe.');
  } else {
    missing.push('Beschreibe, dass die Anpassung aus der Abweichung zwischen Zielwert und Ausgabe entsteht.');
  }
  if (containsAny_(text, ['gespeichert', 'steckt', 'gelernt', 'in den gewichten', 'in gewichten', 'parameter'])) {
    points++;
    strengths.push('Du ordnest das Gelernte den angepassten Parametern zu.');
  } else {
    missing.push('Ergänze, wo das Gelernte im Modell gespeichert ist.');
  }
  const deniesAwareness = containsAny_(text, ['kein bewusstsein', 'nicht bewusst', 'kein verstaendnis', 'kein verständnis', 'versteht nicht', 'nicht menschlich', 'feste regel', 'algorithmus']);
  const falseAwareness = containsAny_(text, ['entwickelt bewusstsein', 'hat bewusstsein', 'versteht seine fehler bewusst', 'versteht seine fehler bewusst']);
  if (deniesAwareness && !falseAwareness) {
    points++;
    strengths.push('Du grenzt die Regelanpassung von Bewusstsein und Verständnis ab.');
  } else {
    missing.push('Grenze die feste Rechenregel von Bewusstsein oder menschlichem Verständnis ab.');
  }
  return createFishRuleEvaluation_(points, maxPoints, strengths, missing, points === maxPoints ? 'Du erklärst fachlich vollständig, wie das Perzeptron Parameter anpasst und wo sein Lernen begrenzt ist.' : 'Ergänze die noch fehlenden Aspekte zu Fehlervergleich, Parametern oder der Abgrenzung von Bewusstsein.');
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
      'Erkläre die Bedeutung der Zahlen für Position und Größe.'
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
      'Ordne jeder Zahl ihre Bedeutung zu.'
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
        ? 'Ordne jeder Zahl ihre Bedeutung zu.'
        : 'Erkläre die Bedeutung der Zahlen für Position und Größe.'
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
