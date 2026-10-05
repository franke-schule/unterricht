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


function createFile(name, text) {
  return {
    getName() {
      return name;
    },

    getText() {
      return text;
    }
  };
}


const body =
  createElement(
    'body'
  );

const buttons = {};
const resultBoxes = {};

['10-5a', '10-5b', '10-5c'].forEach(
  function(key) {
    buttons[key] =
      createElement('button');

    buttons[key].textContent =
      'Prüfen ' + key;

    resultBoxes[key] =
      createElement('div');

    resultBoxes[key].hidden =
      true;
  }
);

const ideFiles = [
  createFile(
    'Anleitung.md',
    [
      '## AUFGABE 5 - VERERBUNG PROGRAMMIEREN: TIERE',
      '',
      'a) Wandle das Klassendiagramm in Java-Code um.'
    ].join('\n')
  ),
  createFile(
    'Tier.java',
    [
      'class Tier {',
      '   int alter;',
      '   String name;',
      '',
      '   void zeigeDaten() {',
      '      println("Das Tier " + name + " ist " + alter + " Jahre alt.");',
      '   }',
      '}'
    ].join('\n')
  ),
  createFile(
    'Hauptprogramm.java',
    [
      'Hund h = new Hund();',
      'h.name = "Bello";',
      'h.zeigeDaten();'
    ].join('\n')
  ),
  createFile(
    'Hund',
    [
      'class Hund extends Tier {',
      '   String rasse;',
      '}'
    ].join('\n')
  ),
  createFile(
    'Leer.java',
    '   \n  '
  ),
  createFile(
    'Katze.java',
    'class Katze extends Tier { boolean freigaenger; }'
  ),
  createFile(
    'Delfin.java',
    'class Delfin extends Tier { int tauchtiefe; }'
  )
];

const ideIframe = {
  contentWindow: {
    online_ide_access: {
      getIDE(id) {
        assert.equal(
          id,
          'Java10Aufgabe5Tiere'
        );

        return {
          getFiles() {
            return ideFiles;
          }
        };
      }
    }
  }
};

const elements = {
  'ide-5':
    ideIframe
};

['10-5a', '10-5b', '10-5c'].forEach(
  function(key) {
    elements['button-' + key] =
      buttons[key];

    elements['result-' + key] =
      resultBoxes[key];
  }
);

const timers =
  new Map();

let nextTimerId =
  1;

const context = {
  console,
  URL,
  Map,
  Date,
  Math,

  window: {
    location: {
      hash:
        ''
    },

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
    },

    querySelectorAll() {
      return [];
    },

    addEventListener() {}
  }
};


vm.createContext(
  context
);

const html =
  fs.readFileSync(
    'faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe5.html',
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
      'aufgabe5-inline.js'
  }
);


function findForm() {
  return body.children.find(
    function(element) {
      return element.tagName === 'FORM';
    }
  );
}

function clearTransport() {
  body.children =
    [];
}


/* ---------- alle Dateien, Hauptprogramm zuerst, Leeres entfällt ---------- */

const allCode =
  context.getAllProgramCode();

assert.ok(
  allCode.startsWith(
    '// ===== Datei: Hauptprogramm.java ====='
  )
);

assert.ok(
  allCode.includes(
    '// ===== Datei: Hund ====='
  )
);

assert.ok(
  allCode.includes(
    'class Hund extends Tier {'
  )
);

assert.ok(
  !allCode.includes(
    'Leer.java'
  )
);

assert.ok(
  !allCode.includes(
    'Anleitung.md'
  )
);

assert.ok(
  allCode.indexOf('Datei: Hauptprogramm.java') <
    allCode.indexOf('Datei: Tier.java')
);

assert.ok(
  allCode.includes(
    '\n\n// ===== Datei: Tier.java ====='
  )
);


/* ---------- Absenden per POST ---------- */

context.submitCode(
  '10-5a'
);

assert.equal(
  buttons['10-5a'].disabled,
  true
);

assert.match(
  buttons['10-5a'].textContent,
  /wird geprüft/
);

assert.equal(
  resultBoxes['10-5a'].textContent,
  'Der aktuelle Stand aller Dateien wird ausgewertet.'
);

const form =
  findForm();

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
  fields.taskId,
  '10-5a'
);

assert.equal(
  fields.requestId,
  'code-request-client'
);

assert.equal(
  fields.code,
  context.getAllProgramCode()
);


/* ---------- Erfolgsergebnis ---------- */

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
      6,
    maxPoints:
      6,
    status:
      'korrekt',
    strengths: [
      'Alle Klassen entsprechen dem Diagramm.'
    ],
    missing: [],
    feedback:
      'Sehr gut.'
  }
});

assert.equal(
  buttons['10-5a'].disabled,
  false
);

assert.equal(
  resultBoxes['10-5a'].className,
  'result high'
);

assert.match(
  resultBoxes['10-5a'].children[0].textContent,
  /6 von 6 Punkten – korrekt/
);

assert.equal(
  findForm(),
  undefined
);


/* ---------- 10-5b: Hauptprogramm ohne new ---------- */

const mainFile =
  ideFiles.find(
    function(file) {
      return file.getName() === 'Hauptprogramm.java';
    }
  );

const originalMainText =
  mainFile.getText();

mainFile.getText =
  function() {
    return '//Hier kommt dein Programm zum Testen hinein, noch ohne Objekte';
  };

context.submitCode(
  '10-5b'
);

assert.equal(
  resultBoxes['10-5b'].textContent,
  'Erzeuge in Hauptprogramm.java zuerst Objekte mit new.'
);

assert.equal(
  findForm(),
  undefined
);

mainFile.getText =
  function() {
    return originalMainText;
  };

context.submitCode(
  '10-5b'
);

assert.ok(
  findForm()
);

assert.equal(
  findForm().children.find(
    function(input) {
      return input.name === 'taskId';
    }
  ).value,
  '10-5b'
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
      0,
    maxPoints:
      5,
    status:
      'noch nicht korrekt',
    strengths: [],
    missing: [
      'Kein polymorpher Aufruf.'
    ],
    feedback:
      'Prüfe die Variable vom Typ Tier.'
  }
});

assert.equal(
  resultBoxes['10-5b'].className,
  'result low'
);

clearTransport();


/* ---------- 10-5c: zu wenige Klassen für den Bonus ---------- */

context.submitCode(
  '10-5c'
);

assert.equal(
  resultBoxes['10-5c'].textContent,
  'Für den Bonus brauchst du zwei weitere Klassen: eine Unterklasse von Tier und eine Unterklasse von Hund.'
);

assert.equal(
  findForm(),
  undefined
);


/* ---------- zu langer Code ---------- */

const hundFile =
  ideFiles.find(
    function(file) {
      return file.getName() === 'Hund';
    }
  );

const originalHundText =
  hundFile.getText();

hundFile.getText =
  function() {
    return 'class Hund extends Tier { /* ' + 'x'.repeat(12100) + ' */ }';
  };

context.submitCode(
  '10-5a'
);

assert.match(
  resultBoxes['10-5a'].textContent,
  /zu lang/
);

assert.equal(
  resultBoxes['10-5a'].className,
  'result error'
);

assert.equal(
  findForm(),
  undefined
);

hundFile.getText =
  function() {
    return originalHundText;
  };


/* ---------- nur Kommentare: keine Klasse ---------- */

const savedTexts =
  ideFiles.map(
    function(file) {
      return file.getText;
    }
  );

ideFiles.forEach(
  function(file) {
    const name =
      file.getName();

    file.getText =
      function() {
        return name === 'Hauptprogramm.java'
          ? '//Hier kommt dein Programm zum Testen hinein'
          : name === 'Tier.java'
            ? '//Hier wird die Klasse Tier definiert, für die anderen Klassen musst du selbst JAVA-Dateien erstellen (mit dem +)'
            : '';
      };
  }
);

context.submitCode(
  '10-5a'
);

assert.match(
  resultBoxes['10-5a'].textContent,
  /^Lege zuerst die Klassen an: Tier steht in Tier\.java/
);

assert.equal(
  resultBoxes['10-5a'].className,
  'result error'
);

assert.equal(
  findForm(),
  undefined
);

ideFiles.forEach(
  function(file, index) {
    file.getText =
      savedTexts[index];
  }
);


/* ---------- Programmcode zu kurz ---------- */

ideFiles.forEach(
  function(file) {
    const name =
      file.getName();

    file.getText =
      function() {
        return name === 'Hauptprogramm.java'
          ? 'int a;'
          : '';
      };
  }
);

context.submitCode(
  '10-5a'
);

assert.equal(
  resultBoxes['10-5a'].textContent,
  'Dein Programmcode ist noch zu kurz für eine Auswertung.'
);


console.log(
  'Mehrdatei-Auslesen, Vorprüfungen, Code-POST und Feedbackanzeige der Aufgabe 5 sind erfolgreich.'
);
