/*
 * Hält Eingaben einer Aufgabenseite im Browser fest, damit sie erhalten
 * bleiben, wenn die Seite verlassen und später wieder geöffnet wird.
 *
 * Aufruf am Ende des Seitenskripts, nachdem alle eigenen Listener hängen:
 *
 *   const saved = persistTaskInputs("informatik9-...-v1", "textarea, input[type=checkbox]");
 *   if (saved.hasFlag("quizPassed")) ...;
 *   saved.setFlag("quizPassed");
 *
 * Textfelder, Kontrollkästchen und Auswahllisten werden unterstützt.
 * Nach dem Wiederherstellen wird für jedes Feld das passende input- bzw.
 * change-Ereignis ausgelöst, damit Zeichenzähler und Anzeigen mitziehen.
 */
(() => {
  "use strict";

  function fieldKey(element) {
    if (element.type === "checkbox" || element.type === "radio") return `${element.name}=${element.value}`;
    return element.id;
  }

  function usesChangeEvent(element) {
    return element.type === "checkbox" || element.type === "radio" || element.tagName === "SELECT";
  }

  window.persistTaskInputs = function persistTaskInputs(storageKey, selector) {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey));
    } catch {
      // Beschädigte lokale Daten sollen die Aufgabe nicht blockieren.
    }
    const fields = saved && typeof saved.fields === "object" && saved.fields ? saved.fields : {};
    const flags = saved && typeof saved.flags === "object" && saved.flags ? saved.flags : {};

    function write() {
      try {
        localStorage.setItem(storageKey, JSON.stringify({ fields, flags }));
      } catch {
        // Ohne Speicherzugriff funktioniert die Aufgabe weiter, nur ohne Sicherung.
      }
    }

    document.querySelectorAll(selector).forEach((element) => {
      const key = fieldKey(element);
      if (!key) return;

      if (Object.prototype.hasOwnProperty.call(fields, key)) {
        const value = fields[key];
        if (element.type === "checkbox" || element.type === "radio") {
          element.checked = value === true;
        } else if (element.tagName === "SELECT") {
          if ([...element.options].some((option) => option.value === value)) element.value = value;
        } else if (typeof value === "string") {
          element.value = value;
        }
        element.dispatchEvent(new Event(usesChangeEvent(element) ? "change" : "input", { bubbles: true }));
      }

      const store = () => {
        fields[key] = element.type === "checkbox" || element.type === "radio" ? element.checked : element.value;
        write();
      };
      element.addEventListener(usesChangeEvent(element) ? "change" : "input", store);
    });

    return {
      hasFlag: (name) => flags[name] === true,
      setFlag: (name) => {
        flags[name] = true;
        write();
      }
    };
  };
})();
