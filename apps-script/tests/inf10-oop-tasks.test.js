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

    evaluatedTitles.push(
      task.title
    );

    return {
      ok:
        true,
      points:
        task.maxPoints,
      maxPoints:
        task.maxPoints,
      status:
        'korrekt',
      strengths: [
        'Test'
      ],
      missing: [],
      feedback:
        'Testfeedback'
    };
  };


const KEYS = [
  '10-3a',
  '10-3b',
  '10-4a',
  '10-4c',
  '10-5a',
  '10-5b',
  '10-5c',
  '10-6b',
  '10-6e'
];

const CODE_KEYS = [
  '10-3a',
  '10-3b',
  '10-5a',
  '10-5b',
  '10-5c'
];

const TEXT_KEYS =
  KEYS.filter(
    function(key) {
      return !CODE_KEYS.includes(key);
    }
  );

function getTask(key) {
  return vm.runInContext(
    "TASKS['" + key + "']",
    context
  );
}


/* ---------- Grunddaten aller neun Aufgaben ---------- */

KEYS.forEach(
  function(key) {
    const task =
      getTask(key);

    assert.ok(
      task,
      key + ': nicht vorhanden'
    );

    assert.equal(
      task.grade,
      10,
      key + ': Jahrgangsstufe'
    );

    assert.equal(
      task.maxPoints,
      task.expectedAspects.length,
      key + ': maxPoints passt nicht zu den erwarteten Aspekten'
    );

    assert.deepEqual(
      JSON.parse(
        JSON.stringify(
          task.statusLabels
        )
      ),
      {
        correct:
          'korrekt',
        partial:
          'teilweise korrekt',
        incorrect:
          'noch nicht korrekt'
      },
      key + ': statusLabels'
    );

    assert.equal(
      task.responseType === 'code',
      CODE_KEYS.includes(key),
      key + ': responseType'
    );

    [
      [0, 'noch nicht korrekt'],
      [1, 'teilweise korrekt'],
      [task.maxPoints, 'korrekt']
    ].forEach(
      function(entry) {
        assert.equal(
          context.normalizeEvaluation_(
            {
              points:
                entry[0],
              strengths: [],
              missing: [],
              feedback:
                ''
            },
            task
          ).status,
          entry[1],
          key + ': Status bei ' + entry[0] + ' Punkten'
        );
      }
    );
  }
);


/* ---------- Robot-Aufgaben (Aufgabe 3) ---------- */

['10-3a', '10-3b'].forEach(
  function(key) {
    const task =
      getTask(key);

    assert.equal(
      task.codeAnalysisContext,
      undefined,
      key + ': kein codeAnalysisContext'
    );

    const prompt =
      context.buildPrompt_(
        task,
        'Robot dudu = new Robot(1, 1, 12, 12);'
      );

    assert.match(prompt, /Robot-Befehle/, key);
    assert.match(prompt, /12 × 12/, key);
    assert.match(prompt, /BEGINN SCHUELERCODE/, key);
  }
);

assert.match(
  getTask('10-3b').instruction,
  /verschachtelte Schleifen/
);

assert.match(
  getTask('10-3b').instruction,
  /jede funktional korrekte Lösung wird aber voll anerkannt/
);


/* ---------- Mehrdatei-Aufgaben (Aufgabe 5) ---------- */

['10-5a', '10-5b', '10-5c'].forEach(
  function(key) {
    const task =
      getTask(key);

    assert.match(
      task.codeAnalysisContext,
      /Datei:/,
      key + ': Dateikommentar im Kontext'
    );

    assert.ok(
      Array.isArray(
        task.codeAnalysisRules
      ),
      key + ': codeAnalysisRules'
    );

    const prompt =
      context.buildPrompt_(
        task,
        '// ===== Datei: Hauptprogramm.java =====\nTier t = new Hund();\n\n// ===== Datei: Tier.java =====\nclass Tier { String name; }'
      );

    assert.doesNotMatch(
      prompt,
      /Robot|Wandkollision|Ziegel/,
      key + ': Robot-Prompt darf nicht erscheinen'
    );

    assert.match(
      prompt,
      /BEGINN SCHUELERCODE/,
      key
    );

    assert.match(
      prompt,
      /Klassendiagramm/,
      key
    );
  }
);

assert.match(
  getTask('10-5c').codeAnalysisContext,
  /Bonusaufgabe/
);


/* ---------- Beschreibe-Aufgaben ---------- */

TEXT_KEYS.forEach(
  function(key) {
    const task =
      getTask(key);

    const prompt =
      context.buildPrompt_(
        task,
        'Eine ausreichend lange Testantwort zu dieser Aufgabe.'
      );

    assert.match(prompt, /Bewertungsrubrik/, key);
    assert.match(prompt, /Hinweise für die Rückmeldung/, key);
    assert.match(prompt, /Schuelerantwort:/, key);

    assert.doesNotMatch(
      prompt,
      /BEGINN SCHUELERCODE/,
      key
    );

    assert.match(
      task.instruction,
      /keine vollständige Musterlösung/,
      key
    );

    assert.ok(
      Array.isArray(task.rubric) && task.rubric.length > 0,
      key + ': Rubrik'
    );

    assert.ok(
      Array.isArray(task.feedbackHints) && task.feedbackHints.length > 0,
      key + ': Hinweise'
    );
  }
);

const rubric4c =
  getTask('10-4c').rubric.join('\n');

assert.match(rubric4c, /mehrere Unterklassen/);
assert.match(rubric4c, /super/);
assert.match(rubric4c, /@Override erzeuge die Vererbung/);

assert.match(
  getTask('10-4a').instruction,
  /Polymorphie, Vererbung und Überschreiben werden in diesem Teil noch nicht verlangt/
);

assert.match(
  getTask('10-4a').context,
  /Der Akku des Laptops SUSA 5000 hält 6h\./
);


/* ---------- Routing: Code ---------- */

const codeRequests = {
  '10-3b': [
    'Robot dudu = new Robot(1, 1, 12, 12);',
    'for (int reihe = 0; reihe < 5; reihe++) {',
    '   dudu.schritt();',
    '   dudu.hinlegen(4);',
    '}'
  ].join('\n'),
  '10-5a': [
    '// ===== Datei: Tier.java =====',
    'class Tier { int alter; String name; void zeigeDaten() { println(name); } }',
    '',
    '// ===== Datei: Hund =====',
    'class Hund extends Tier { String rasse; }'
  ].join('\n')
};

Object.keys(codeRequests).forEach(
  function(taskId) {
    const requestId =
      'inf10-code-' + taskId.replace(/[^0-9a-z]/g, '');

    const post =
      context.doPost({
        parameter: {
          requestType:
            'code',
          requestId,
          taskId,
          code:
            codeRequests[taskId]
        }
      });

    assert.equal(
      JSON.parse(post.text).accepted,
      true,
      taskId + ': POST-Annahme'
    );

    assert.equal(
      evaluatedTypes.at(-1),
      'code',
      taskId + ': Code-Routing'
    );

    assert.equal(
      evaluatedTitles.at(-1),
      getTask(taskId).title,
      taskId + ': falscher Task'
    );

    const result =
      context.doGet({
        parameter: {
          callback:
            'inf10CodeCallback',
          requestType:
            'code-result',
          requestId
        }
      });

    assert.match(result.text, /^inf10CodeCallback\(/, taskId);
    assert.match(result.text, /"pending":false/, taskId);
    assert.match(result.text, /"feedback":"Testfeedback"/, taskId);
  }
);

assert.throws(
  function() {
    context.validateCodeRequest_({
      requestType:
        'code',
      requestId:
        'inf10-text-als-code',
      taskId:
        '10-4a',
      code:
        'Artikel smart1 = new Smartphone("Sumsang G300", 1950, 0.300, true);'
    });
  },
  /nicht fuer eine Codeauswertung/
);


/* ---------- Routing: Beschreibe-Aufgaben ---------- */

['10-4a', '10-6e'].forEach(
  function(taskId) {
    const get =
      context.doGet({
        parameter: {
          callback:
            'inf10TextCallback',
          requestId:
            'inf10-text-' + taskId.replace(/[^0-9a-z]/g, ''),
          taskId,
          answer:
            'Eine ausreichend lange fachliche Beschreibung des Programms.'
        }
      });

    assert.match(
      get.text,
      /^inf10TextCallback\(/,
      taskId
    );

    assert.match(
      get.text,
      /GEMINI_EVALUATION_RESULT/,
      taskId
    );

    assert.equal(
      evaluatedTypes.at(-1),
      'text',
      taskId
    );

    assert.equal(
      evaluatedTitles.at(-1),
      getTask(taskId).title,
      taskId
    );
  }
);


console.log(
  'Aufgaben 10-3a bis 10-6e: Konfiguration, Prompts und Routing sind erfolgreich.'
);
