const VERSION = 1;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTeacherCodeField(element) {
  const id = `${element.id || ""} ${element.name || ""} ${element.getAttribute("autocomplete") || ""}`.toLowerCase();
  return element.name === "solution-code" || /teacher|lehrer|solution.?code/.test(id);
}

function fieldKey(element, index) {
  if (element.id) return `id:${element.id}`;
  const attributes = [...element.attributes]
    .filter((attribute) => attribute.name.startsWith("data-") && attribute.name !== "data-persist-ignore")
    .map((attribute) => `${attribute.name}=${attribute.value}`)
    .sort();
  if (attributes.length) return `${element.tagName.toLowerCase()}:${attributes.join("&")}`;
  // Versionierte Seite + Reihenfolge bildet auch namenlose Quiz-Checkboxen stabil ab.
  return `control:${index}:${element.tagName.toLowerCase()}:${element.type || ""}`;
}

function controlKeys(controls) {
  const occurrences = new Map();
  return controls.map((element, index) => {
    const base = fieldKey(element, index);
    const occurrence = occurrences.get(base) || 0;
    occurrences.set(base, occurrence + 1);
    return `${base}#${occurrence}`;
  });
}

function getPageState() {
  const controls = [...document.querySelectorAll("input, select, textarea")]
    .filter((element) => !isTeacherCodeField(element) && element.type !== "password" && element.type !== "file");
  const fields = {};
  const keys = controlKeys(controls);
  controls.forEach((element, index) => {
    const key = keys[index];
    if (element.type === "checkbox" || element.type === "radio") fields[key] = { checked: element.checked };
    else if (element instanceof HTMLSelectElement && element.multiple) {
      fields[key] = { selected: [...element.options].map((option) => option.selected) };
    } else fields[key] = { value: element.value };
  });

  const tabs = [...document.querySelectorAll("[data-physics-tab]")];
  const activeTab = tabs.find((tab) => tab.getAttribute("aria-selected") === "true")?.dataset.physicsTab || null;
  const details = [...document.querySelectorAll("details")].map((element) => element.open);
  const visibleState = {};
  [...document.querySelectorAll("[id]")]
    .filter((element) => /(?:summary-content|module-summary|other-resolution|reminder|remember)$/i.test(element.id))
    .forEach((element) => { visibleState[element.id] = !element.hidden; });

  return { fields, activeTab, details, visibleState };
}

/**
 * Versioned per-page student progress. Call restore() after the page has built
 * all dynamic controls, and register custom closure state before restoring.
 */
export function createPhysicsTaskProgress(taskId) {
  const storageKey = `physik11-kreisbewegungen-${taskId}-v${VERSION}`;
  const parts = new Map();
  let saved = null;
  let restoring = false;
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey));
    if (isRecord(parsed) && parsed.version === VERSION && isRecord(parsed.fields)) saved = parsed;
  } catch {
    // Storage can be disabled or contain malformed data. The page remains usable.
  }

  function save() {
    if (restoring) return;
    try {
      const state = getPageState();
      state.parts = {};
      parts.forEach(({ read }, id) => {
        try { state.parts[id] = read(); } catch { /* Ignore one broken optional part. */ }
      });
      localStorage.setItem(storageKey, JSON.stringify({ version: VERSION, ...state }));
    } catch {
      // Quota/privacy errors must never block student input.
    }
  }

  document.addEventListener("input", save);
  document.addEventListener("change", save);
  document.addEventListener("click", save);
  document.addEventListener("keydown", (event) => {
    if (event.target.closest?.("[data-physics-tab]") && ["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) {
      queueMicrotask(save);
    }
  });

  return {
    storageKey,
    registerPart(id, read, restore) {
      if (typeof id !== "string" || typeof read !== "function" || typeof restore !== "function") {
        throw new TypeError("Ein gespeicherter Aufgabenteil benötigt ID, read und restore.");
      }
      parts.set(id, { read, restore });
    },
    restore() {
      if (saved) {
        const controls = [...document.querySelectorAll("input, select, textarea")]
          .filter((element) => !isTeacherCodeField(element) && element.type !== "password" && element.type !== "file");
        restoring = true;
        const keys = controlKeys(controls);
        const restoreControl = (element, index) => {
          const value = saved.fields[keys[index]];
          if (!isRecord(value)) return;
          if (element.type === "checkbox" || element.type === "radio") {
            if (typeof value.checked === "boolean") element.checked = value.checked;
          } else if (element instanceof HTMLSelectElement && element.multiple && Array.isArray(value.selected) && value.selected.length === element.options.length) {
            element.options.forEach((option, optionIndex) => { option.selected = Boolean(value.selected[optionIndex]); });
          } else if (typeof value.value === "string" && value.value.length <= Math.min(10000, element.maxLength > 0 ? element.maxLength : 10000)) {
            if (element instanceof HTMLSelectElement && ![...element.options].some((option) => option.value === value.value)) return;
            if (element instanceof HTMLInputElement && element.type === "range") {
              const number = Number(value.value);
              if (!Number.isFinite(number) || number < Number(element.min || -Infinity) || number > Number(element.max || Infinity)) return;
            }
            element.value = value.value;
          }
        };
        controls.forEach((element, index) => {
          if (element.type === "radio") restoreControl(element, index);
        });
        controls.forEach((element) => {
          if (element.type === "radio" && element.checked) {
            element.dispatchEvent(new Event("change", { bubbles: true }));
          }
        });
        controls.forEach((element, index) => {
          if (element.type !== "radio") restoreControl(element, index);
        });
        // Re-run existing lightweight UI updates (counters and calculated readouts)
        // with storage writes suppressed until the complete restore is finished.
        controls.forEach((element) => {
          if (element.type === "radio") return;
          element.dispatchEvent(new Event("input", { bubbles: true }));
          element.dispatchEvent(new Event("change", { bubbles: true }));
        });
        if (Array.isArray(saved.details)) {
          [...document.querySelectorAll("details")].forEach((element, index) => {
            if (typeof saved.details[index] === "boolean") element.open = saved.details[index];
          });
        }
        if (typeof saved.activeTab === "string") {
          const tab = [...document.querySelectorAll("[data-physics-tab]")]
            .find((element) => element.dataset.physicsTab === saved.activeTab);
          if (tab) {
            const tabId = tab.dataset.physicsTab;
            [...document.querySelectorAll("[data-physics-tab]")].forEach((candidate) => {
              const selected = candidate.dataset.physicsTab === tabId;
              candidate.setAttribute("aria-selected", String(selected));
              candidate.tabIndex = selected ? 0 : -1;
            });
            [...document.querySelectorAll("[data-physics-panel]")].forEach((panel) => { panel.hidden = panel.dataset.physicsPanel !== tabId; });
          }
        }
        if (isRecord(saved.visibleState)) Object.entries(saved.visibleState).forEach(([id, visible]) => {
          const element = document.getElementById(id);
          if (element && typeof visible === "boolean") element.hidden = !visible;
        });
        if (isRecord(saved.parts)) parts.forEach(({ restore: restorePart }, id) => {
          try { restorePart(saved.parts[id]); } catch { /* Ignore malformed optional component state. */ }
        });
        restoring = false;
      }
      // Create a normalized record now, so the key is initialized per task.
      save();
    },
    save,
    clear() {
      try { localStorage.removeItem(storageKey); } catch { /* Ignore storage restrictions. */ }
    },
  };
}
