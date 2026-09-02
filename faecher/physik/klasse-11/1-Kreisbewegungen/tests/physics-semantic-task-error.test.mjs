import assert from "node:assert/strict";
import { setupPhysicsSemanticTask } from "../components/physics-semantic-task.mjs";

function element(id = "") {
  return {
    id,
    value: "",
    textContent: "",
    className: "",
    hidden: true,
    disabled: false,
    dataset: {},
    children: [],
    listeners: {},
    addEventListener(type, handler) { this.listeners[type] = handler; },
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    focus() {},
  };
}

const elements = {
  answer: element("answer"),
  check: element("check"),
  feedback: element("feedback"),
  count: element("count"),
};

globalThis.document = {
  getElementById(id) { return elements[id]; },
  createElement() { return element(); },
};

let errorContext;
setupPhysicsSemanticTask({
  answerId: "answer",
  buttonId: "check",
  feedbackId: "feedback",
  countId: "count",
  taskId: "test",
  minimumLength: 8,
  fallbackMaxPoints: 5,
  evaluationFunction: async () => { throw new Error("Testserver nicht erreichbar."); },
  feedbackBuilder(result) {
    errorContext = result.context;
    const paragraph = document.createElement("p");
    const strong = document.createElement("strong");
    strong.textContent = "nach innen";
    paragraph.append("Die Kraft zeigt ", strong, ".");
    return paragraph;
  },
});

elements.answer.value = "v tangential, F nach innen";
await elements.check.listeners.click();

assert.equal(elements.answer.value, "v tangential, F nach innen");
assert.equal(elements.answer.disabled, false);
assert.equal(elements.check.disabled, false);
assert.equal(elements.feedback.dataset.status, "nicht geprüft");
assert.equal(elements.feedback.className, "physics-semantic-feedback is-error");
assert.equal(errorContext, "server-error");
assert.equal(elements.feedback.children[0].textContent, "Automatische Prüfung nicht erreichbar");
assert.equal(elements.feedback.children[1].textContent, "Testserver nicht erreichbar.");
assert.equal(elements.feedback.children[2].children[1].textContent, "nach innen");

console.log("Bei einem Skriptserverfehler bleiben Antwort und erneute Prüfung erhalten; die sichere Hervorhebung wird genutzt.");
