function isFastTrack(label) {
  return label === 'Für die Schnellen' || label.startsWith('Für die Schnellen:');
}

export function syncTabSemantics(tablist, activeId) {
  tablist.querySelectorAll('[role="tab"]').forEach((tab) => {
    const selected = tab.dataset.step === String(activeId) || tab.dataset.tab === String(activeId);
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
}

export function enableTabKeyboardNavigation(tablist) {
  if (tablist.dataset.keyboardNavigation === 'true') return;
  tablist.dataset.keyboardNavigation = 'true';
  tablist.addEventListener('keydown', (event) => {
    const current = event.target.closest('[role="tab"]');
    if (!current || !tablist.contains(current)) return;
    const tabs = [...tablist.querySelectorAll('[role="tab"]')].filter((tab) => !tab.hidden && !tab.disabled);
    const currentIndex = tabs.indexOf(current);
    const offsets = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
    let nextIndex;
    if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else if (offsets[event.key]) nextIndex = (currentIndex + offsets[event.key] + tabs.length) % tabs.length;
    else return;
    event.preventDefault();
    const targetId = tabs[nextIndex].id;
    tabs[nextIndex].click();
    requestAnimationFrame(() => document.getElementById(targetId)?.focus());
  });
}

export function focusTabPanelStart(panel) {
  const heading = panel.querySelector('.step-heading h2, h2');
  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.tabIndex = -1;
  requestAnimationFrame(() => heading.focus({ preventScroll: true }));
}

export function renderTabFlowNavigation(container, { items, currentId, onNavigate, isEnabled = () => true }) {
  document.querySelectorAll('.tab-flow-navigation').forEach((navigation) => navigation.remove());
  const index = items.findIndex(({ id }) => String(id) === String(currentId));
  if (index < 0 || index >= items.length - 1) return;

  const immediate = items[index + 1];
  const following = items[index + 2];
  const targets = isFastTrack(immediate.label) && following && !isFastTrack(following.label)
    ? [
        { ...following, text: `Weiter: ${following.label}` },
        { ...immediate, text: 'Zu den Aufgaben für die Schnellen' },
      ]
    : [{ ...immediate, text: isFastTrack(immediate.label) ? 'Zu den Aufgaben für die Schnellen' : `Weiter: ${immediate.label}` }];

  const navigation = document.createElement('nav');
  navigation.className = 'tab-flow-navigation';
  navigation.setAttribute('aria-label', 'Zum nächsten Lernschritt');
  targets.forEach((target) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'primary-button tab-flow-button';
    button.textContent = target.text;
    button.disabled = !isEnabled(target.id);
    if (button.disabled) button.setAttribute('aria-disabled', 'true');
    button.addEventListener('click', () => {
      if (!button.disabled) onNavigate(target.id, { focusContent: true });
    });
    navigation.append(button);
  });
  container.append(navigation);
}

export function appendSolutionDownloadFromTemplate(container) {
  const template = document.getElementById('solution-download-template');
  if (template instanceof HTMLTemplateElement) container.append(template.content.cloneNode(true));
}
