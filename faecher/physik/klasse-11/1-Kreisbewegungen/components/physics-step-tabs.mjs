/**
 * Verbindet bereits angelegte Reiter und zugehörige Aufgabenkarten.
 * Erwartet data-physics-tab und data-physics-panel mit demselben Wert.
 */
export function setupPhysicsStepTabs(root = document) {
  const tabs = [...root.querySelectorAll("[data-physics-tab]")];
  const panels = [...root.querySelectorAll("[data-physics-panel]")];

  if (!tabs.length || !panels.length) {
    return;
  }

  function selectTab(id, moveFocus = false) {
    tabs.forEach((tab) => {
      const selected = tab.dataset.physicsTab === id;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (moveFocus && selected) tab.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.physicsPanel !== id;
    });
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectTab(tab.dataset.physicsTab));
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? tabs.length - 1
          : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      selectTab(tabs[nextIndex].dataset.physicsTab, true);
    });
  });

  const selected = tabs.find((tab) => tab.getAttribute("aria-selected") === "true") || tabs[0];
  selectTab(selected.dataset.physicsTab);
}
