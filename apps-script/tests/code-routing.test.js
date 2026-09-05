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

context.evaluateWithGemini_ =
  function(task) {
    evaluatedTypes.push(
      task.responseType || 'text'
    );

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
  'sql-b3-1'
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
