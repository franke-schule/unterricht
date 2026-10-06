/*
 * Gibt jeder Frage eines Abschlussquiz einen eigenen Prüfen-Button mit eigener
 * Rückmeldung direkt unter der Frage. Bewertung und Rückmeldetexte folgen dem
 * Kurzquiz in Informatik 9, Tabellenkalkulation Aufgabe 5b.
 *
 * Aufruf, nachdem das Quiz im DOM steht:
 *
 *   addQuizQuestionChecks({
 *     questions: [{ fieldset, solution: ["a", "b"], success: "…", hint: "…" }],
 *     buttonClass: "primary-button",
 *     rowClass: "action-row",            // optional, Klasse der Button-Zeile
 *     feedbackClass: "feedback",
 *     levels: { high: "success", medium: "partial", low: "hint" },
 *     onAllCorrect: () => form.requestSubmit(),
 *   });
 *
 * Statt questions genügt bei Quizzen mit Lösungsobjekt auch
 * { form, solutions: { "quiz-1": ["a"] }, hints: { "quiz-1": "…" } }.
 *
 * Optional je Frage:
 *   number       Nummer im Button, sonst Position + 1
 *   insertAfter  Element, hinter dem Button und Rückmeldung stehen sollen
 *                (sonst am Ende des fieldset)
 *   feedback     vorhandenes Rückmeldeelement der Frage; der Button steht
 *                dann direkt davor
 *   hint         Text oder Funktion, die die angekreuzten Werte erhält
 *   check        eigene Bewertung für Fragen ohne Auswahlkästchen (z. B.
 *                Zuordnungen mit Auswahllisten); liefert "empty", "correct",
 *                "missing", "mixed" oder "wrong", wahlweise als
 *                { result, text } mit eigenem Rückmeldetext
 *
 * Sind nach einer Prüfung alle Fragen richtig, ruft die Komponente
 * onAllCorrect auf. So läuft die bestehende Gesamtauswertung samt
 * Freischaltung der Übersicht ohne zusätzlichen Klick.
 */
(() => {
  "use strict";

  const STYLE_ID = "quiz-question-check-style";

  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      ".quiz-question-check { display: flex; flex-wrap: wrap; align-items: center; gap: 0.6rem; margin-top: 0.9rem; }",
      ".quiz-question-check + .quiz-question-feedback { margin-top: 0.7rem; }",
      ".quiz-question-feedback[hidden] { display: none !important; }",
    ].join("\n");
    document.head.append(style);
  }

  function selectedValues(question) {
    return [...question.fieldset.querySelectorAll('input[type="checkbox"], input[type="radio"]')]
      .filter((input) => input.checked)
      .map((input) => input.value);
  }

  function evaluate(question) {
    if (typeof question.check === "function") {
      const outcome = question.check();
      return typeof outcome === "string" ? { result: outcome } : outcome;
    }
    const chosen = selectedValues(question);
    const right = chosen.filter((value) => question.solution.includes(value)).length;
    const wrong = chosen.length - right;
    if (!chosen.length) return { result: "empty" };
    if (!wrong && right === question.solution.length) return { result: "correct" };
    if (right && !wrong) return { result: "missing" };
    if (right) return { result: "mixed" };
    return { result: "wrong" };
  }

  function fieldsetOf(root, name) {
    const input = root.querySelector(`input[name="${name}"]`);
    return input ? input.closest("fieldset") : null;
  }

  // Kurzform für Quizze mit einem Lösungsobjekt { name: [werte] } je Frage.
  function questionsFromSolutions(config) {
    const root = config.form || document;
    const hints = config.hints || {};
    const successes = config.successes || {};
    return Object.keys(config.solutions).map((name) => ({
      fieldset: fieldsetOf(root, name),
      solution: config.solutions[name],
      hint: hints[name],
      success: successes[name],
    }));
  }

  const LEVEL_OF = { empty: "low", correct: "high", missing: "medium", mixed: "medium", wrong: "low" };

  function defaultText(result, number, question) {
    const hint = typeof question.hint === "function" ? question.hint(selectedValues(question)) : question.hint;
    const withHint = (text) => (hint ? `${text} ${hint}` : text);
    if (result === "empty") {
      const onlyRadios = !question.fieldset.querySelector('input[type="checkbox"]') && question.fieldset.querySelector('input[type="radio"]');
      return onlyRadios ? "Wähle eine Antwort aus." : "Kreuze mindestens eine Antwort an.";
    }
    if (result === "correct") return question.success || `Korrekt. Frage ${number} ist vollständig richtig beantwortet.`;
    if (result === "missing") return withHint("Teilweise korrekt. Deine Kreuze stimmen, aber es fehlt noch mindestens eine richtige Antwort.");
    if (result === "mixed") return withHint("Teilweise korrekt. Mindestens ein Kreuz ist nicht richtig.");
    return withHint("Noch nicht korrekt.");
  }

  window.addQuizQuestionChecks = function addQuizQuestionChecks(config) {
    const source = config.questions || (config.solutions ? questionsFromSolutions(config) : []);
    const questions = source.filter((question) => question && question.fieldset);
    if (!questions.length) return null;
    injectStyle();

    const levels = Object.assign({ high: "high", medium: "medium", low: "low" }, config.levels);
    const feedbackClass = config.feedbackClass || "feedback";
    let completed = false;

    questions.forEach((question, index) => {
      const number = question.number || index + 1;
      const container = question.insertAfter ? question.insertAfter.parentElement : question.fieldset;
      // Wird ein Quiz neu aufgebaut, keine doppelten Buttons erzeugen.
      container.querySelectorAll(`:scope > [data-quiz-question-check="${number}"]`).forEach((old) => old.remove());

      const row = document.createElement("div");
      row.className = ["quiz-question-check", config.rowClass].filter(Boolean).join(" ");
      row.dataset.quizQuestionCheck = String(number);
      const button = document.createElement("button");
      button.type = "button";
      button.className = config.buttonClass ?? "primary-button";
      button.textContent = `Frage ${number} prüfen`;
      row.append(button);

      // Eine vorhandene Rückmeldung der Frage wird weiterverwendet.
      const feedback = question.feedback || document.createElement("p");
      if (!question.feedback) {
        feedback.className = `${feedbackClass} quiz-question-feedback`;
        feedback.dataset.quizQuestionCheck = String(number);
        feedback.setAttribute("role", "status");
        feedback.setAttribute("aria-live", "polite");
        feedback.hidden = true;
      }

      if (question.feedback) question.feedback.before(row);
      else if (question.insertAfter) question.insertAfter.after(row, feedback);
      else question.fieldset.append(row, feedback);

      question.fieldset.querySelectorAll("input, select").forEach((control) => {
        control.addEventListener("change", () => {
          feedback.hidden = true;
          feedback.textContent = "";
          completed = false;
        });
      });

      button.addEventListener("click", () => {
        const outcome = evaluate(question);
        feedback.hidden = false;
        feedback.className = `${feedbackClass} quiz-question-feedback ${levels[LEVEL_OF[outcome.result] || "low"]}`;
        feedback.textContent = outcome.text || defaultText(outcome.result, number, question);

        if (outcome.result === "correct" && !completed && questions.every((item) => evaluate(item).result === "correct")) {
          completed = true;
          if (typeof config.onAllCorrect === "function") config.onAllCorrect();
        }
      });
    });

    return { questions };
  };
})();
