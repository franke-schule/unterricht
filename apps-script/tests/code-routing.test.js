const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const path =
  require('node:path');

const vm =
  require('node:vm');


const cache =
  new Map();

const context = {
  console,

  ContentService: {
    MimeType: {
      JAVASCRIPT:
        'application/javascript',
      JSON:
        'application/json'
    },

    createTextOutput(text) {
      return {
        text,
        mimeType:
          '',

        setMimeType(mimeType) {
          this.mimeType =
            mimeType;

          return this;
        }
      };
    }
  },

  HtmlService: {
    createHtmlOutput(html) {
      return {
        html,
        title:
          '',

        setTitle(title) {
          this.title =
            title;

          return this;
        }
      };
    }
  },

  CacheService: {
    getScriptCache() {
      return {
        put(key, value) {
          cache.set(
            key,
            value
          );
        },

        get(key) {
          return cache.has(key)
            ? cache.get(key)
            : null;
        }
      };
    }
  }
};


vm.createContext(
  context
);


[
  'Config.gs',
  'Tasks.gs',
  'Helpers.gs',
  'Code.gs',
  'Gemini.gs'
].forEach(
  function(filename) {
    const source =
      fs.readFileSync(
        path.join(
          process.cwd(),
          'apps-script',
          filename
        ),
        'utf8'
      );

    vm.runInContext(
      source,
      context,
      {
        filename:
          filename
      }
    );
  }
);


const evaluatedTypes = [];
const evaluatedTitles = [];

context.evaluateWithGemini_ =
  function(task) {
    evaluatedTypes.push(
      task.responseType || 'text'
    );
    evaluatedTitles.push(task.title);

    return {
      ok:
        true,
      points:
        6,
      maxPoints:
        6,
      status:
        'gut',
      strengths: [
        'Test'
      ],
      missing: [],
      feedback:
        'Testfeedback'
    };
  };


const codePrompt =
  context.buildPrompt_(
    vm.runInContext(
      "TASKS['10-2a']",
      context
    ),
    'Robot roboter = new Robot();'
  );

assert.match(
  codePrompt,
  /BEGINN SCHUELERCODE/
);

assert.match(
  codePrompt,
  /statische Codeanalyse/
);

assert.match(codePrompt, /Robot-Befehle/);
assert.match(codePrompt, /Wandkollisionen/);

[
  ['11-6-klassifizieren', 'text'],
  ['11-6-einfach-summe', 'code'],
  ['11-6-einfach-ausgabe', 'code'],
  ['11-6-einfach-anpassung', 'code'],
  ['11-6-schwer-trainieren', 'code']
].forEach(function(entry) {
  const task = vm.runInContext("TASKS['" + entry[0] + "']", context);
  assert.equal(task.responseType || 'text', entry[1]);
  assert.equal(task.maxPoints, task.expectedAspects.length);
  assert.equal(task.statusLabels.correct, 'korrekt');
  assert.equal(task.statusLabels.partial, 'teilweise korrekt');
  assert.equal(task.statusLabels.incorrect, 'noch nicht korrekt');
  for (const [points,expected] of [[0,'noch nicht korrekt'],[1,'teilweise korrekt'],[task.maxPoints,'korrekt']]) {
    assert.equal(context.normalizeEvaluation_({points,strengths:[],missing:[],feedback:''},task).status,expected);
  }
  if (entry[1] === 'code') {
    assert.ok(task.codeAnalysisContext);
    assert.ok(Array.isArray(task.codeAnalysisRules));
    const prompt = context.buildPrompt_(task, 'public void trainieren(Datenpunkt punkt) {}');
    assert.match(prompt, /Datenpunkt/);
    assert.doesNotMatch(prompt, /Robot|Wandkollision|Ziegel|Drehrichtungen/);
  }
});

const otherContextPrompt = context.buildPrompt_({
  grade: 12,
  responseType: 'code',
  maxPoints: 1,
  title: 'Sortieren',
  instruction: 'Prüfe eine Sortiermethode.',
  codeAnalysisContext: 'Python mit Listen und sort()',
  codeAnalysisRules: ['Prüfe die aufsteigende Reihenfolge.'],
  expectedAspects: ['Die Liste ist am Ende aufsteigend sortiert.']
}, 'werte.sort()');
assert.match(otherContextPrompt, /Python mit Listen/);
assert.match(otherContextPrompt, /aufsteigende Reihenfolge/);
assert.doesNotMatch(otherContextPrompt, /Robot|Perzeptron/);

const textPrompt =
  context.buildPrompt_(
    vm.runInContext(
      "TASKS['1a']",
      context
    ),
    'Eine Testantwort'
  );

assert.match(
  textPrompt,
  /Schuelerantwort:/
);

assert.doesNotMatch(
  textPrompt,
  /BEGINN SCHUELERCODE/
);


const interactionEvaluationJson =
  JSON.stringify({
    points:
      6,
    maxPoints:
      6,
    status:
      'gut',
    strengths: [
      'Die Schleife ist korrekt.'
    ],
    missing: [],
    feedback:
      'Sehr gut.'
  });

assert.equal(
  context.extractGeminiText_({
    object:
      'interaction',
    status:
      'completed',
    steps: [
      {
        type:
          'model_output',
        content: [
          {
            type:
              'text',
            text:
              interactionEvaluationJson
          }
        ]
      }
    ]
  }),
  interactionEvaluationJson
);

assert.equal(
  context.extractGeminiText_({
    object:
      'interaction',
    status:
      'completed',
    steps: []
  }),
  ''
);


const textGet =
  context.doGet({
    parameter: {
      callback:
        'textCallback',
      requestId:
        'text-request-123',
      taskId:
        '1a',
      answer:
        'Eine ausreichend lange Testantwort.'
    }
  });

assert.match(
  textGet.text,
  /^textCallback\(/
);

assert.equal(
  evaluatedTypes.at(-1),
  'text'
);

const perceptronTextTask = vm.runInContext("TASKS['11-6-klassifizieren']",context);
const perceptronTextGet = context.doGet({
  parameter: {
    callback: 'perceptronTextCallback',
    requestId: 'perceptron-description-123',
    taskId: '11-6-klassifizieren',
    answer: 'Die Methode multipliziert beide Eingaben mit den Gewichten, addiert die Produkte und vergleicht mit theta.'
  }
});
assert.match(perceptronTextGet.text,/^perceptronTextCallback\(/);
assert.match(perceptronTextGet.text,/GEMINI_EVALUATION_RESULT/);
assert.equal(evaluatedTypes.at(-1),'text');
assert.equal(evaluatedTitles.at(-1),perceptronTextTask.title);


const textPost =
  context.doPost({
    parameter: {
      requestId:
        'text-post-123',
      taskId:
        '1a',
      answer:
        'Eine ausreichend lange Testantwort.',
      parentOrigin:
        'https://example.test'
    }
  });

assert.match(
  textPost.html,
  /GEMINI_EVALUATION_RESULT/
);

assert.equal(
  evaluatedTypes.at(-1),
  'text'
);


[
  'sql-b2-3',
  'sql-b3-1',
  'sql-b3-3',
  'inf10-db-a1-primaerschluessel',
  'inf10-db-a2-aufteilung',
  'inf10-a3-quiz-foto-beschreibung',
  'inf10-a3-quiz-regal-beschreibung',
  'ph11-wdh2-quiz-crashtest-beschreibung',
  'ph11-a3-quiz-karussell-beschreibung',
  'ph11-a3-quiz-ursache-beschreibung',
  'ph11-a3-quiz-schnur-beschreibung',
  'ph11-a4-quiz-hammerwurf-beschreibung',
  'ph11-a4-quiz-radius-beschreibung',
  'ph11-a4-quiz-seil-beschreibung',
  'inf11-a3a-quiz-informationsgewinn-beschreibung',
  'inf11-a3a-quiz-attributwahl-beschreibung',
  'inf11-a3a-quiz-vorgehen-beschreibung'
].forEach(
  function(taskId) {
    const sqlDescriptionGet =
      context.doGet({
        parameter: {
          callback:
            'sqlDescriptionCallback',
          requestId:
            'sql-description-' + taskId.replaceAll('-', ''),
          taskId:
            taskId,
          answer:
            'Eine ausreichend lange fachliche Erklärung der SQL-Anweisung.'
        }
      });

    assert.match(
      sqlDescriptionGet.text,
      /^sqlDescriptionCallback\(/
    );

    assert.match(
      sqlDescriptionGet.text,
      /GEMINI_EVALUATION_RESULT/
    );

    assert.equal(
      evaluatedTypes.at(-1),
      'text'
    );
  }
);


assert.throws(
  function() {
    context.validateRequest_({
      requestId:
        'sql-description-short',
      taskId:
        'sql-b2-3',
      answer:
        'zu kurz'
    });
  },
  /ausfuehrlichere Antwort/
);


const codePost =
  context.doPost({
    parameter: {
      requestType:
        'code',
      requestId:
        'code-request-123',
      taskId:
        '10-2a',
      code:
        [
          'Robot roboter = new Robot(1, 1, 15, 15);',
          'while (!roboter.istWand()) {',
          '  roboter.hinlegen();',
          '  roboter.schritt();',
          '}'
        ].join('\n')
    }
  });

assert.equal(
  JSON.parse(
    codePost.text
  ).accepted,
  true
);

assert.equal(
  evaluatedTypes.at(-1),
  'code'
);


const codeResult =
  context.doGet({
    parameter: {
      callback:
        'codeCallback',
      requestType:
        'code-result',
      requestId:
        'code-request-123'
    }
  });

assert.match(
  codeResult.text,
  /^codeCallback\(/
);

assert.match(
  codeResult.text,
  /"pending":false/
);

assert.match(
  codeResult.text,
  /"feedback":"Testfeedback"/
);

[
  '11-6-einfach-summe',
  '11-6-einfach-ausgabe',
  '11-6-einfach-anpassung',
  '11-6-schwer-trainieren'
].forEach(function(taskId) {
  const task = vm.runInContext("TASKS['" + taskId + "']",context);
  const requestId = 'perceptron-code-' + taskId;
  const post = context.doPost({
    parameter: {
      requestType: 'code',
      requestId,
      taskId,
      code: 'public class Perzeptron { public void trainieren(Datenpunkt punkt) { int delta = punkt.gibLabel(); } }'
    }
  });
  assert.equal(JSON.parse(post.text).accepted,true,taskId + ': POST-Annahme');
  assert.equal(evaluatedTypes.at(-1),'code',taskId + ': Code-Routing');
  assert.equal(evaluatedTitles.at(-1),task.title,taskId + ': falscher Task');
  const result = context.doGet({
    parameter: {
      callback: 'perceptronCodeCallback',
      requestType: 'code-result',
      requestId
    }
  });
  assert.match(result.text,/^perceptronCodeCallback\(/,taskId + ': JSONP');
  assert.match(result.text,/"pending":false/,taskId + ': Ergebnis bereit');
  assert.match(result.text,/"feedback":"Testfeedback"/,taskId + ': Feedback');
});


const pendingResult =
  context.doGet({
    parameter: {
      callback:
        'codeCallback',
      requestType:
        'code-result',
      requestId:
        'code-request-noch-offen'
    }
  });

assert.match(
  pendingResult.text,
  /"pending":true/
);


assert.throws(
  function() {
    context.validateCodeRequest_({
      requestType:
        'code',
      requestId:
        'code-request-invalid-task',
      taskId:
        '1a',
      code:
        'Robot roboter = new Robot(); roboter.hinlegen();'
    });
  },
  /nicht fuer eine Codeauswertung/
);


console.log(
  'Routing-Regressionen für Text- und Codeauswertung sind erfolgreich.'
);
