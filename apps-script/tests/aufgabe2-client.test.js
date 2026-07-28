const assert =
  require('node:assert/strict');

const fs =
  require('node:fs');

const vm =
  require('node:vm');


function createElement(tagName) {
  return {
    tagName:
      tagName.toUpperCase(),
    children: [],
    dataset: {},
    style: {},
    parentNode:
      null,
    textContent:
      '',
    hidden:
      false,
    disabled:
      false,
    className:
      '',
    attributes: {},
    submitted:
      false,

    appendChild(child) {
      child.parentNode =
        this;

      this.children.push(
        child
      );

      return child;
    },

    removeChild(child) {
      this.children =
        this.children.filter(
          function(item) {
            return item !== child;
          }
        );

      child.parentNode =
        null;
    },

    setAttribute(name, value) {
      this.attributes[name] =
        String(value);
    },

    submit() {
      this.submitted =
        true;
    }
  };
}


const body =
  createElement(
    'body'
  );

const button =
  createElement(
    'button'
  );

button.textContent =
  'Meinen Code für a prüfen';

const resultBox =
  createElement(
    'div'
  );

resultBox.hidden =
  true;

let editedCode =
  [
    'Robot roboter = new Robot(1, 1, 15, 15);',
    'while (!roboter.istWand()) {',
    '  roboter.hinlegen();',
    '  roboter.schritt();',
    '}'
  ].join('\n');

const ideIframe = {
  contentWindow: {
    online_ide_access: {
      getIDE(id) {
        assert.equal(
          id,
          'Java10Aufgabe2Roboter'
        );

        return {
          getFiles() {
            return [
              {
                getName() {
                  return 'Hauptprogramm.java';
                },

                getText() {
                  return editedCode;
                }
              }
            ];
          }
        };
      }
    }
  }
};

const elements = {
  'robot-ide':
    ideIframe,
  'button-10-2a':
    button,
  'result-10-2a':
    resultBox
};

let nextTimerId =
  1;

const timers =
  new Map();

const context = {
  console,
  URL,
  Map,
  Date,
  Math,

  window: {
    crypto: {
      randomUUID() {
        return 'code-request-client';
      }
    },

    setTimeout(callback, delay) {
      const id =
        nextTimerId++;

      timers.set(
        id,
        {
          callback,
          delay
        }
      );

      return id;
    },

    clearTimeout(id) {
      timers.delete(
        id
      );
    }
  },

  document: {
    body,

    getElementById(id) {
      return elements[id] || null;
    },

    createElement(tagName) {
      return createElement(
        tagName
      );
    }
  }
};


vm.createContext(
  context
);

const html =
  fs.readFileSync(
    'faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html',
    'utf8'
  );

const script =
  html.slice(
    html.lastIndexOf('<script>') + 8,
    html.lastIndexOf('</script>')
  );

vm.runInContext(
  script,
  context,
  {
    filename:
      'aufgabe2-inline.js'
  }
);


assert.equal(
  context.getCurrentProgramCode(),
  editedCode
);

context.submitCode(
  '10-2a'
);

assert.equal(
  button.disabled,
  true
);

assert.match(
  button.textContent,
  /wird geprüft/
);

const form =
  body.children.find(
    function(element) {
      return element.tagName === 'FORM';
    }
  );

assert.ok(
  form
);

assert.equal(
  form.submitted,
  true
);

const fields =
  Object.fromEntries(
    form.children.map(
      function(input) {
        return [
          input.name,
          input.value
        ];
      }
    )
  );

assert.equal(
  fields.requestType,
  'code'
);

assert.equal(
  fields.requestId,
  'code-request-client'
);

assert.equal(
  fields.taskId,
  '10-2a'
);

assert.equal(
  fields.code,
  editedCode
);


context.window.__handleCodeEvaluationResult({
  type:
    'GEMINI_CODE_EVALUATION_RESULT',
  requestId:
    'code-request-client',
  pending:
    false,
  result: {
    ok:
      true,
    points:
      5,
    maxPoints:
      6,
    status:
      'gut',
    strengths: [
      'Die Schleife endet an der Wand.'
    ],
    missing: [
      'Prüfe die letzte Ziegelposition.'
    ],
    feedback:
      'Gute Lösung.'
  }
});

assert.equal(
  button.disabled,
  false
);

assert.equal(
  resultBox.className,
  'result high'
);

assert.match(
  resultBox.children[0].textContent,
  /5 von 6 Punkten/
);

assert.equal(
  body.children.some(
    function(element) {
      return element.tagName === 'FORM';
    }
  ),
  false
);


context.submitCode(
  '10-2a'
);

context.window.__handleCodeEvaluationResult({
  type:
    'GEMINI_EVALUATION_RESULT',
  requestId:
    'code-request-client',
  result: {
    ok:
      false,
    message:
      'Diese Aufgabe ist auf dem Auswertungsserver nicht bekannt.'
  }
});

assert.equal(
  resultBox.className,
  'result error'
);

assert.match(
  resultBox.textContent,
  /ältere Version ohne Codekorrektur/
);


editedCode =
  [
    'Robot roboter = new Robot(1, 1, 15, 15);',
    'while (istWand()) {',
    '  hinlegen();',
    '  schritt();',
    '}'
  ].join('\n');

context.submitCode(
  '10-2a'
);

assert.equal(
  resultBox.textContent,
  'Benutze die Punktnotation. Rufe die Methoden auf einem Objekt der Klasse Roboter auf.'
);

assert.equal(
  body.children.some(
    function(element) {
      return element.tagName === 'FORM';
    }
  ),
  false
);


console.log(
  'IDE-Auslesen, Code-POST und Feedbackanzeige der Aufgabe 2 sind erfolgreich.'
);
